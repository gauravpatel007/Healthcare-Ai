"""
LifeOS Backend — Appointment Model
"""

from sqlalchemy import Date, Enum as SAEnum, ForeignKey, String, Text, Time
from sqlalchemy.orm import Mapped, mapped_column
import datetime

from app.database import Base, TimestampMixin, generate_uuid


class Appointment(Base, TimestampMixin):
    """Doctor appointment entry."""

    __tablename__ = "appointments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    doctor: Mapped[str] = mapped_column(String(255), nullable=False)
    specialty: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    hospital: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    date: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    time: Mapped[datetime.time] = mapped_column(Time, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        SAEnum("upcoming", "completed", "cancelled", name="appointment_status"),
        default="upcoming",
        nullable=False,
    )
    ai_prep_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
