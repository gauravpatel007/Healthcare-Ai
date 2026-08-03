"""
LifeOS Backend — Family Member & Vaccination Models
"""

from sqlalchemy import Date, Enum as SAEnum, ForeignKey, Integer, String, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, TimestampMixin, generate_uuid


class FamilyMember(Base, TimestampMixin):
    """Family member profile."""

    __tablename__ = "family_members"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    relation: Mapped[str] = mapped_column(
        SAEnum("father", "mother", "spouse", "child", "sibling", "grandparent", "other",
               name="family_relation"),
        nullable=False,
    )
    age: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    blood_type: Mapped[str] = mapped_column(String(5), nullable=False, default="O+")
    avatar: Mapped[str] = mapped_column(String(10), nullable=False, default="👤")
    conditions: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    medications: Mapped[list] = mapped_column(JSON, nullable=False, default=list)


class Vaccination(Base, TimestampMixin):
    """Vaccination record for user or family member."""

    __tablename__ = "vaccinations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    family_member_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("family_members.id", ondelete="SET NULL"), nullable=True
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    date: Mapped[str] = mapped_column(Date, nullable=False)
    next_due: Mapped[str | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(
        SAEnum("completed", "pending", name="vaccination_status"),
        default="completed",
        nullable=False,
    )
    person: Mapped[str] = mapped_column(String(255), nullable=False, default="Self")
