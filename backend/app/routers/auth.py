"""
LifeOS Backend — Authentication Router
Register, login, token refresh, and logout endpoints.
"""

import logging
import asyncio

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import CurrentUserId
from app.exceptions import ConflictException, UnauthorizedException
from app.models.user import User, UserProfile, PasswordResetToken, EmailVerificationToken
from app.schemas.auth import (
    AuthResponse, LoginRequest, GoogleLoginRequest, ForgotPasswordRequest,
    ResetPasswordRequest, RefreshRequest, RegisterRequest,
    TokenResponse, UserInfoResponse, FaceSetupRequest, FaceLoginRequest,
    TokenResponse, UserInfoResponse, FaceSetupRequest, FaceLoginRequest,
    TwoFactorEnableRequest, TwoFactorLoginRequest,
    VerifyEmailRequest, ResendVerificationRequest
)
import math
import json
from app.utils.security import (
    create_access_token, create_refresh_token, decode_refresh_token,
    hash_password, verify_password,
)
from app.utils.email import send_verification_email
from app.config import get_settings
import secrets
import string
import pyotp
from datetime import datetime, timedelta, timezone
from fastapi import Request

logger = logging.getLogger("lifeos.auth")
router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=AuthResponse, status_code=201)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user account."""
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise ConflictException("An account with this email already exists")

    # Create user
    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        role=data.role,
        is_verified=False,
    )
    db.add(user)
    await db.flush()

    # Create profile
    profile = UserProfile(user_id=user.id, name=data.name)
    db.add(profile)
    await db.commit()

    # Generate email verification code
    code = "".join(secrets.choice(string.digits) for _ in range(6))
    expires = datetime.now(timezone.utc) + timedelta(minutes=15)
    
    token_record = EmailVerificationToken(email=data.email, verification_code=code, expires_at=expires)
    db.add(token_record)
    await db.commit()

    # Send verification email in background
    asyncio.create_task(asyncio.to_thread(send_verification_email, data.email, code))

    logger.info("User registered and pending verification: %s (%s)", data.email, data.role)
    return AuthResponse(
        message="Verification required",
        data={"requires_verification": True, "email": data.email},
    )


from app.models.user import LoginHistory
from app.utils.email import send_login_alert_email

async def log_login(user: User, db: AsyncSession, request: Request):
    """Helper to record a login event and send email alert."""
    ip_address = request.client.host if request.client else "Unknown"
    user_agent = request.headers.get("user-agent", "Unknown")
    
    # Save history
    history = LoginHistory(user_id=user.id, ip_address=ip_address, user_agent=user_agent)
    db.add(history)
    await db.commit()
    
    # Send email if enabled in background
    if user.login_alerts_enabled:
        time_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        asyncio.create_task(
            asyncio.to_thread(send_login_alert_email, user.email, ip_address, user_agent, time_str)
        )

@router.post("/login")
async def login(data: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """Authenticate user with email and password."""
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.hashed_password):
        raise UnauthorizedException("Invalid email or password")

    if not user.is_active:
        raise UnauthorizedException("Account is disabled")
        
    if not user.is_verified:
        return {"success": True, "message": "Verification required", "data": {"requires_verification": True, "email": data.email}}

    # If 2FA is enabled, return a temporary token instead of full access
    if user.two_factor_enabled:
        temp_token = create_access_token(user.id, user.role, expires_delta=timedelta(minutes=5))
        return {"success": True, "message": "2FA required", "data": {"requires_2fa": True, "temp_token": temp_token}}

    # Generate tokens
    access_token = create_access_token(user.id, user.role)
    refresh_token = create_refresh_token(user.id)

    logger.info("User logged in: %s", user.email)
    await log_login(user, db, request)
    
    return AuthResponse(
        message="Login successful",
        data=TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=get_settings().ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        ),
    )


@router.post("/google", response_model=AuthResponse)
async def google_auth(data: GoogleLoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """Authenticate or register user with Google OAuth."""
    
    settings = get_settings()
    if not settings.GOOGLE_CLIENT_ID:
        raise UnauthorizedException("Google Sign-In is not configured on the server.")

    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests
        # Verify Google token
        idinfo = id_token.verify_oauth2_token(
            data.credential, requests.Request(), settings.GOOGLE_CLIENT_ID
        )
        
        email = idinfo.get("email")
        name = idinfo.get("name") or "Google User"
        
        if not email:
            raise UnauthorizedException("No email found in Google token")

        # Check if user exists
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        
        if not user:
            # Register new user
            random_pwd = "".join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))
            user = User(
                email=email,
                hashed_password=hash_password(random_pwd),
                role="patient",
            )
            db.add(user)
            await db.flush()
            
            # Create profile
            profile = UserProfile(user_id=user.id, name=name)
            db.add(profile)
            await db.commit()
            
            logger.info("New user registered via Google: %s", email)
            
        elif not user.is_active:
            raise UnauthorizedException("Account is disabled")
        
        # Check 2FA
        if user.two_factor_enabled:
            temp_token = create_access_token(user.id, user.role, expires_delta=timedelta(minutes=5))
            return {"success": True, "message": "2FA required", "data": {"requires_2fa": True, "temp_token": temp_token}}

        # Generate tokens
        access_token = create_access_token(user.id, user.role)
        refresh_token = create_refresh_token(user.id)
        
        logger.info("User logged in via Google: %s", user.email)
        await log_login(user, db, request)
        
        return AuthResponse(
            message="Google Sign-In successful",
            data=TokenResponse(
                access_token=access_token,
                refresh_token=refresh_token,
                expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            ),
        )

    except ValueError:
        raise UnauthorizedException("Invalid Google token")


@router.post("/forgot-password", response_model=AuthResponse)
async def forgot_password(data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Generate a password reset code and 'send' it (mocked)."""
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    
    if not user:
        # Return success anyway to prevent email enumeration
        return AuthResponse(message="If an account exists, a verification code has been sent.")
        
    # Generate 6-digit code
    code = "".join(secrets.choice(string.digits) for _ in range(6))
    
    # Store token
    expires = datetime.now(timezone.utc) + timedelta(minutes=15)
    
    # Delete any existing tokens for this user first
    await db.execute(
        PasswordResetToken.__table__.delete().where(PasswordResetToken.email == data.email)
    )
    
    token_record = PasswordResetToken(email=data.email, reset_code=code, expires_at=expires)
    db.add(token_record)
    await db.commit()
    
    # Send actual email in background
    asyncio.create_task(asyncio.to_thread(send_verification_email, data.email, code))
    
    return AuthResponse(message="If an account exists, a verification code has been sent.")


@router.post("/reset-password", response_model=AuthResponse)
async def reset_password(data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Reset password using a verification code."""
    # Find token
    result = await db.execute(
        select(PasswordResetToken)
        .where(
            PasswordResetToken.email == data.email,
            PasswordResetToken.reset_code == data.code
        )
    )
    token_record = result.scalar_one_or_none()
    
    if not token_record:
        raise UnauthorizedException("Invalid or missing verification code")
        
    # Check expiration
    if datetime.now(timezone.utc) > token_record.expires_at.replace(tzinfo=timezone.utc):
        raise UnauthorizedException("Verification code has expired")
        
    # Find user
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    
    if not user:
        raise UnauthorizedException("User not found")
        
    # Update password
    user.hashed_password = hash_password(data.new_password)
    
    # Delete token
    await db.execute(
        PasswordResetToken.__table__.delete().where(PasswordResetToken.id == token_record.id)
    )
    
    await db.commit()
    
    logger.info("Password successfully reset for: %s", data.email)
    return AuthResponse(message="Password successfully reset. You can now log in.")


@router.post("/verify-email", response_model=AuthResponse)
async def verify_email(data: VerifyEmailRequest, db: AsyncSession = Depends(get_db)):
    """Verify email using code and log the user in."""
    # Find token
    result = await db.execute(
        select(EmailVerificationToken)
        .where(
            EmailVerificationToken.email == data.email,
            EmailVerificationToken.verification_code == data.code
        )
    )
    token_record = result.scalar_one_or_none()
    
    if not token_record:
        raise UnauthorizedException("Invalid or missing verification code")
        
    # Check expiration
    if datetime.now(timezone.utc) > token_record.expires_at.replace(tzinfo=timezone.utc):
        raise UnauthorizedException("Verification code has expired")
        
    # Find user
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    
    if not user:
        raise UnauthorizedException("User not found")
        
    # Verify user
    user.is_verified = True
    
    # Delete token
    await db.execute(
        EmailVerificationToken.__table__.delete().where(EmailVerificationToken.id == token_record.id)
    )
    await db.commit()
    
    # Generate tokens
    settings = get_settings()
    access_token = create_access_token(user.id, user.role)
    refresh_token = create_refresh_token(user.id)
    
    logger.info("Email verified for: %s", data.email)
    return AuthResponse(
        message="Email successfully verified.",
        data=TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )
    )

@router.post("/resend-verification", response_model=AuthResponse)
async def resend_verification(data: ResendVerificationRequest, db: AsyncSession = Depends(get_db)):
    """Generate a new verification code and send it."""
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    
    if not user or user.is_verified:
        # Return success to prevent enumeration
        return AuthResponse(message="If an unverified account exists, a new code has been sent.")
        
    # Generate new 6-digit code
    code = "".join(secrets.choice(string.digits) for _ in range(6))
    expires = datetime.now(timezone.utc) + timedelta(minutes=15)
    
    # Delete any existing verification tokens for this user
    await db.execute(
        EmailVerificationToken.__table__.delete().where(EmailVerificationToken.email == data.email)
    )
    
    token_record = EmailVerificationToken(email=data.email, verification_code=code, expires_at=expires)
    db.add(token_record)
    await db.commit()
    
    # Send actual email
    send_verification_email(data.email, code)
    
    return AuthResponse(message="If an unverified account exists, a new code has been sent.")


@router.post("/refresh", response_model=AuthResponse)
async def refresh_token(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """Refresh access token using a valid refresh token."""
    payload = decode_refresh_token(data.refresh_token)
    user_id = payload.get("sub")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise UnauthorizedException("User not found or deactivated")

    settings = get_settings()
    access_token = create_access_token(user.id, user.role)
    new_refresh = create_refresh_token(user.id)

    return AuthResponse(
        message="Token refreshed",
        data=TokenResponse(
            access_token=access_token,
            refresh_token=new_refresh,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        ),
    )


@router.post("/logout")
async def logout(user_id: CurrentUserId):
    """Logout (client should discard tokens)."""
    logger.info("User logged out: %s", user_id)
    return {"success": True, "message": "Logged out successfully"}


@router.get("/me", response_model=UserInfoResponse)
async def get_current_user(user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Get current authenticated user info."""
    result = await db.execute(
        select(User, UserProfile)
        .join(UserProfile, User.id == UserProfile.user_id, isouter=True)
        .where(User.id == user_id)
    )
    row = result.one_or_none()
    if not row:
        raise UnauthorizedException("User not found")

    user, profile = row
    return UserInfoResponse(
        id=user.id,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        name=profile.name if profile else None,
        avatar_url=profile.avatar_url if profile else None,
        face_login_enabled=user.face_login_enabled,
        two_factor_enabled=user.two_factor_enabled,
        login_alerts_enabled=user.login_alerts_enabled,
    )


@router.post("/face-setup")
async def face_setup(data: FaceSetupRequest, user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Set up face login for the current user."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise UnauthorizedException("User not found")
        
    user.face_descriptor = json.dumps(data.descriptor)
    user.face_login_enabled = True
    await db.commit()
    return {"success": True, "message": "Face login configured successfully"}


@router.post("/face-disable")
async def face_disable(user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Disable face login for the current user."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise UnauthorizedException("User not found")
        
    user.face_descriptor = None
    user.face_login_enabled = False
    await db.commit()
    return {"success": True, "message": "Face login disabled successfully"}


@router.post("/face-login", response_model=AuthResponse)
async def face_login(data: FaceLoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """Login using facial recognition."""
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    
    if not user or not user.face_login_enabled or not user.face_descriptor:
        raise UnauthorizedException("Face login is not enabled for this account")
        
    try:
        stored_descriptor = json.loads(user.face_descriptor)
    except Exception:
        raise UnauthorizedException("Stored facial data is corrupted")
        
    if len(stored_descriptor) != 128 or len(data.descriptor) != 128:
        raise UnauthorizedException("Invalid face descriptor format")
        
    # Calculate Euclidean distance
    distance = math.sqrt(sum((a - b) ** 2 for a, b in zip(stored_descriptor, data.descriptor)))
    
    # Threshold for matching (lower is stricter, usually 0.4 - 0.6)
    if distance > 0.45:
        logger.warning(f"Face login failed for {data.email}. Distance: {distance}")
        raise UnauthorizedException("Face not recognized")
        
    # Check 2FA
    if user.two_factor_enabled:
        temp_token = create_access_token(user.id, user.role, expires_delta=timedelta(minutes=5))
        return {"success": True, "message": "2FA required", "data": {"requires_2fa": True, "temp_token": temp_token}}

    logger.info("User logged in with Face: %s", user.id)
    await log_login(user, db, request)
    
    settings = get_settings()
    access_token = create_access_token(user.id, user.role)
    refresh_token = create_refresh_token(user.id)
    
    return AuthResponse(
        message="Face Login successful",
        data=TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        ),
    )

@router.post("/login/2fa", response_model=AuthResponse)
async def login_2fa(data: TwoFactorLoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """Complete login using 2FA code and temp token."""
    try:
        from app.utils.security import decode_access_token
        payload = decode_access_token(data.temp_token)
        user_id = payload.get("sub")
    except UnauthorizedException:
        raise UnauthorizedException("Session expired. Please log in again.")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user or not user.two_factor_enabled or not user.two_factor_secret:
        raise UnauthorizedException("Invalid 2FA session")

    totp = pyotp.TOTP(user.two_factor_secret)
    if not totp.verify(data.code):
        raise UnauthorizedException("Invalid authentication code")

    # Generate real tokens
    access_token = create_access_token(user.id, user.role)
    refresh_token = create_refresh_token(user.id)

    logger.info("User logged in with 2FA: %s", user.email)
    await log_login(user, db, request)

    return AuthResponse(
        message="Login successful",
        data=TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=get_settings().ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        ),
    )

@router.get("/2fa/setup")
async def setup_2fa(user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Generate a 2FA secret and QR code URI for setup."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise UnauthorizedException("User not found")
        
    secret = pyotp.random_base32()
    user.two_factor_secret = secret
    await db.flush()
    
    totp = pyotp.TOTP(secret)
    uri = totp.provisioning_uri(name=user.email, issuer_name="LifeOS")
    
    return {"success": True, "data": {"secret": secret, "uri": uri}}

@router.post("/2fa/enable")
async def enable_2fa(data: TwoFactorEnableRequest, user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Verify code and enable 2FA."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user or not user.two_factor_secret:
        raise UnauthorizedException("2FA setup not initialized")
        
    totp = pyotp.TOTP(user.two_factor_secret)
    if not totp.verify(data.code):
        raise UnauthorizedException("Invalid authentication code")
        
    user.two_factor_enabled = True
    await db.flush()
    
    return {"success": True, "message": "Two-Factor Authentication enabled"}

@router.post("/2fa/disable")
async def disable_2fa(user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Disable 2FA."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise UnauthorizedException("User not found")
        
    user.two_factor_enabled = False
    user.two_factor_secret = None
    await db.commit()
    
    return {"success": True, "message": "Two-Factor Authentication disabled"}
