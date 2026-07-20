"""
LifeOS Backend — Emergency Contact Model
"""

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, TimestampMixin, generate_uuid


class EmergencyContact(Base, TimestampMixin):
    """Emergency contact for a user."""

    __tablename__ = "emergency_contacts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    carrier: Mapped[str | None] = mapped_column(String(50), nullable=True)
    relation: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
