"""
LifeOS Backend — Medical Expense Model
"""

from sqlalchemy import Date, Enum as SAEnum, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, TimestampMixin, generate_uuid


class MedicalExpense(Base, TimestampMixin):
    """Medical expense entry."""

    __tablename__ = "medical_expenses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    description: Mapped[str] = mapped_column(String(500), nullable=False)
    category: Mapped[str] = mapped_column(
        SAEnum("medicine", "doctor", "tests", "insurance", "other",
               name="expense_category"),
        nullable=False,
    )
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    date: Mapped[str] = mapped_column(Date, nullable=False)
