"""
LifeOS Backend — Medical Record Model
"""

from sqlalchemy import Date, Enum as SAEnum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, TimestampMixin, generate_uuid


class MedicalRecord(Base, TimestampMixin):
    """Medical record / report entry."""

    __tablename__ = "medical_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    family_member_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("family_members.id", ondelete="SET NULL"), nullable=True, index=True
    )

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    doctor: Mapped[str] = mapped_column(String(255), nullable=True, default="")
    hospital: Mapped[str] = mapped_column(String(255), nullable=True, default="")
    date: Mapped[str] = mapped_column(Date, nullable=True)
    findings: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    file_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
