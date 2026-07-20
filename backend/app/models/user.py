"""
LifeOS Backend — User & Profile Models
"""

from sqlalchemy import Boolean, Enum as SAEnum, ForeignKey, Integer, String, Text, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

from app.database import Base, TimestampMixin, generate_uuid


class User(Base, TimestampMixin):
    """Core user account."""

    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(
        SAEnum("patient", "doctor", "admin", name="user_role"),
        default="patient",
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    face_login_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    face_descriptor: Mapped[str | None] = mapped_column(Text, nullable=True)
    two_factor_secret: Mapped[str | None] = mapped_column(String(32), nullable=True)
    two_factor_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    login_alerts_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    profile: Mapped["UserProfile"] = relationship(
        "UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )


class UserProfile(Base, TimestampMixin):
    """Extended user profile with health data."""

    __tablename__ = "user_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )

    name: Mapped[str] = mapped_column(String(100), nullable=False, default="User")
    age: Mapped[int] = mapped_column(Integer, nullable=False, default=30)
    gender: Mapped[str] = mapped_column(String(20), nullable=False, default="Male")
    blood_type: Mapped[str] = mapped_column(String(5), nullable=False, default="O+")
    height: Mapped[float] = mapped_column(nullable=False, default=170.0)
    weight: Mapped[float] = mapped_column(nullable=False, default=70.0)
    allergies: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    conditions: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    organ_donor: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    language: Mapped[str] = mapped_column(String(5), default="en", nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    connected_devices: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    fitbit_access_token: Mapped[str | None] = mapped_column(Text, nullable=True)
    fitbit_refresh_token: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="profile")


class PasswordResetToken(Base, TimestampMixin):
    """Temporary tokens for password resets."""

    __tablename__ = "password_reset_tokens"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    email: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    reset_code: Mapped[str] = mapped_column(String(10), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class EmailVerificationToken(Base, TimestampMixin):
    """Temporary tokens for email verification during signup."""

    __tablename__ = "email_verification_tokens"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    email: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    verification_code: Mapped[str] = mapped_column(String(10), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class LoginHistory(Base, TimestampMixin):
    """Tracks user logins for security alerts."""

    __tablename__ = "login_history"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    ip_address: Mapped[str] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str] = mapped_column(String(500), nullable=True)
