"""
LifeOS Backend — Medicine Model
"""

from sqlalchemy import Boolean, Date, Enum as SAEnum, ForeignKey, Integer, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, TimestampMixin, generate_uuid


class Medicine(Base, TimestampMixin):
    """Active medication entry."""

    __tablename__ = "medicines"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    dosage: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    type: Mapped[str] = mapped_column(
        SAEnum("tablet", "capsule", "syrup", "injection", "drops", "cream",
               name="medicine_type"),
        nullable=False,
        default="tablet",
    )
    frequency: Mapped[str] = mapped_column(
        SAEnum("once_daily", "twice_daily", "thrice_daily", "once_weekly", "as_needed",
               name="medicine_frequency"),
        nullable=False,
        default="once_daily",
    )
    times: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    purpose: Mapped[str] = mapped_column(String(500), nullable=True, default="")
    start_date: Mapped[str | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[str | None] = mapped_column(Date, nullable=True)
    total_pills: Mapped[int] = mapped_column(Integer, nullable=False, default=30)
    remaining: Mapped[int] = mapped_column(Integer, nullable=False, default=30)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class MedicineLibrary(Base, TimestampMixin):
    """Global database of medicines and their information."""

    __tablename__ = "medicine_library"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    generic_name: Mapped[str] = mapped_column(String(255), nullable=True)
    brand: Mapped[str] = mapped_column(String(255), nullable=True)
    usage: Mapped[str] = mapped_column(Text, nullable=True)
    dosage_info: Mapped[str] = mapped_column(Text, nullable=True)
    side_effects: Mapped[list] = mapped_column(JSON, nullable=True, default=list)
    precautions: Mapped[list] = mapped_column(JSON, nullable=True, default=list)
    interactions: Mapped[list] = mapped_column(JSON, nullable=True, default=list)
    pregnancy_safety: Mapped[str] = mapped_column(String(100), nullable=True)
    storage: Mapped[str] = mapped_column(String(255), nullable=True)


class MedicineLog(Base, TimestampMixin):
    """Log entry for when a medication is taken or missed."""

    __tablename__ = "medicine_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    medicine_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("medicines.id", ondelete="CASCADE"), nullable=False, index=True
    )
    
    date: Mapped[str] = mapped_column(Date, nullable=False)
    scheduled_time: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(
        SAEnum("taken", "missed", "skipped", name="medicine_log_status"),
        nullable=False,
        default="taken",
    )
