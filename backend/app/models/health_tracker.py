"""
LifeOS Backend — Health Tracker Models
Water intake, sleep, and health metric entries.
"""

from datetime import date, datetime, time

from sqlalchemy import Date, DateTime, Enum as SAEnum, Float, ForeignKey, Integer, String, Time, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, TimestampMixin, generate_uuid


class HealthEntry(Base, TimestampMixin):
    """Generic health metric data point (blood sugar, BP, weight, etc.)."""

    __tablename__ = "health_entries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    category: Mapped[str] = mapped_column(
        SAEnum("blood_sugar", "blood_pressure", "cholesterol", "weight",
               "heart_rate", "steps", "calories",
               name="health_category"),
        nullable=False,
    )
    value: Mapped[float] = mapped_column(Float, nullable=False)
    secondary_value: Mapped[float | None] = mapped_column(Float, nullable=True)  # e.g. diastolic
    label: Mapped[str | None] = mapped_column(String(50), nullable=True)  # e.g. "Jan", "Feb"
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class WaterIntake(Base):
    """Daily water intake tracker."""

    __tablename__ = "water_intake"
    __table_args__ = (
        UniqueConstraint("user_id", "date", name="uq_water_user_date"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    glasses: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class SleepEntry(Base, TimestampMixin):
    """Daily sleep log."""

    __tablename__ = "sleep_entries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    date: Mapped[date] = mapped_column(Date, nullable=False)
    hours: Mapped[float] = mapped_column(Float, nullable=False)
    quality: Mapped[int] = mapped_column(Integer, nullable=False, default=3)  # 1-5
    bedtime: Mapped[time | None] = mapped_column(Time, nullable=True)
    wake_time: Mapped[time | None] = mapped_column(Time, nullable=True)
