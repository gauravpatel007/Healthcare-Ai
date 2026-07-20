"""
LifeOS Backend — User Profile Router
"""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import CurrentUserId
from app.exceptions import NotFoundException
from app.models.user import UserProfile
from app.schemas.user import UserProfileResponse, UserProfileUpdate

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/profile", response_model=UserProfileResponse)
async def get_profile(user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Get current user's profile."""
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise NotFoundException("Profile")
    return profile


@router.put("/profile", response_model=UserProfileResponse)
async def update_profile(
    data: UserProfileUpdate, user_id: CurrentUserId, db: AsyncSession = Depends(get_db)
):
    """Update current user's profile."""
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise NotFoundException("Profile")

    update_data = data.model_dump(exclude_unset=True)
    old_weight = profile.weight
    
    for key, value in update_data.items():
        setattr(profile, key, value)

    new_weight = update_data.get("weight")
    if new_weight is not None and new_weight != old_weight:
        from app.models.health_tracker import HealthEntry
        from datetime import datetime, timezone
        
        # Add a new health entry for the updated weight
        label = datetime.now(timezone.utc).strftime("%b")
        entry = HealthEntry(
            user_id=user_id,
            category="weight",
            value=new_weight,
            label=label,
            recorded_at=datetime.now(timezone.utc)
        )
        db.add(entry)

    await db.flush()
    await db.commit()
    return profile


@router.get("/export")
async def export_data(user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Export all user data as JSON."""
    try:
        from fastapi.encoders import jsonable_encoder
        from app.models.medical_record import MedicalRecord
        from app.models.medicine import Medicine
        from app.models.appointment import Appointment
        from app.models.emergency import EmergencyContact
        from app.models.family import FamilyMember, Vaccination
        from app.models.expense import MedicalExpense

        profile_r = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
        profile = profile_r.scalar_one_or_none()

        records_r = await db.execute(select(MedicalRecord).where(MedicalRecord.user_id == user_id))
        meds_r = await db.execute(select(Medicine).where(Medicine.user_id == user_id))
        apts_r = await db.execute(select(Appointment).where(Appointment.user_id == user_id))
        contacts_r = await db.execute(select(EmergencyContact).where(EmergencyContact.user_id == user_id))
        family_r = await db.execute(select(FamilyMember).where(FamilyMember.user_id == user_id))
        vax_r = await db.execute(select(Vaccination).where(Vaccination.user_id == user_id))
        expenses_r = await db.execute(select(MedicalExpense).where(MedicalExpense.user_id == user_id))

        raw_data = {
            "profile": {col.key: getattr(profile, col.key) for col in UserProfile.__table__.columns} if profile else {},
            "records": [{col.key: getattr(r, col.key) for col in MedicalRecord.__table__.columns} for r in records_r.scalars().all()],
            "medicines": [{col.key: getattr(m, col.key) for col in Medicine.__table__.columns} for m in meds_r.scalars().all()],
            "appointments": [{col.key: getattr(a, col.key) for col in Appointment.__table__.columns} for a in apts_r.scalars().all()],
            "contacts": [{col.key: getattr(c, col.key) for col in EmergencyContact.__table__.columns} for c in contacts_r.scalars().all()],
            "family": [{col.key: getattr(f, col.key) for col in FamilyMember.__table__.columns} for f in family_r.scalars().all()],
            "vaccinations": [{col.key: getattr(v, col.key) for col in Vaccination.__table__.columns} for v in vax_r.scalars().all()],
            "expenses": [{col.key: getattr(e, col.key) for col in MedicalExpense.__table__.columns} for e in expenses_r.scalars().all()],
            "message": "Full data export.",
        }
        
        # Explicitly encode to catch serialization errors here rather than in Starlette middleware
        encoded = jsonable_encoder(raw_data)
        return encoded
        
    except Exception as e:
        import traceback
        import logging
        logger = logging.getLogger("lifeos.users")
        logger.error(f"Export Error: {str(e)}\n{traceback.format_exc()}")
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=f"Export Error: {str(e)}")


@router.get("/security/login-history")
async def get_login_history(user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Get the 5 most recent login events."""
    from app.models.user import LoginHistory
    result = await db.execute(
        select(LoginHistory)
        .where(LoginHistory.user_id == user_id)
        .order_by(LoginHistory.created_at.desc())
        .limit(5)
    )
    history = result.scalars().all()
    return {
        "success": True,
        "data": [
            {
                "id": h.id,
                "ip_address": h.ip_address,
                "user_agent": h.user_agent,
                "created_at": h.created_at.isoformat()
            }
            for h in history
        ]
    }


@router.put("/security/alerts-toggle")
async def toggle_login_alerts(user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Toggle the login alerts enabled setting for the user."""
    from app.models.user import User
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        from app.exceptions import UnauthorizedException
        raise UnauthorizedException("User not found")
        
    user.login_alerts_enabled = not user.login_alerts_enabled
    await db.flush()
    await db.commit()
    
    return {
        "success": True, 
        "message": "Login alerts updated successfully",
        "data": {"login_alerts_enabled": user.login_alerts_enabled}
    }


@router.post("/avatar", response_model=UserProfileResponse)
async def upload_avatar(
    user_id: CurrentUserId,
    db: AsyncSession = Depends(get_db),
    file: __import__("fastapi").UploadFile = __import__("fastapi").File(...)
):
    """Upload and set the user's avatar image."""
    import shutil
    import os
    import time
    from pathlib import Path
    from app.config import get_settings
    
    settings = get_settings()
    
    # Verify profile exists
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = result.scalar_one_or_none()
    if not profile:
        from app.exceptions import NotFoundException
        raise NotFoundException("Profile")
        
    # Validate extension
    ext = file.filename.split('.')[-1].lower() if '.' in file.filename else ''
    if ext not in ['jpg', 'jpeg', 'png', 'gif', 'webp']:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Invalid image format. Allowed: jpg, png, gif, webp")
        
    # Create directory
    avatar_dir = Path(settings.UPLOAD_DIR) / "avatars"
    avatar_dir.mkdir(parents=True, exist_ok=True)
    
    # Save file
    filename = f"avatar_{user_id}_{int(time.time())}.{ext}"
    file_path = avatar_dir / filename
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Remove old avatar if it exists and is not a default/external URL
    if profile.avatar_url and profile.avatar_url.startswith("/uploads/avatars/"):
        old_filename = profile.avatar_url.split("/")[-1]
        old_path = avatar_dir / old_filename
        if old_path.exists():
            try:
                os.remove(old_path)
            except Exception:
                pass
                
    # Update profile
    profile.avatar_url = f"/uploads/avatars/{filename}"
    await db.flush()
    await db.commit()
    
    return profile
