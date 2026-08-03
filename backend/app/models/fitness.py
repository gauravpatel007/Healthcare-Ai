"""
LifeOS Backend — Fitness Models
"""

from sqlalchemy import Boolean, DateTime, Integer, String, Text, func, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, generate_uuid


class Exercise(Base):
    """Stores individual exercises for the fitness library."""
    __tablename__ = "exercises"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    title: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    difficulty: Mapped[str] = mapped_column(String(20), nullable=False, default="Beginner")
    duration_seconds: Mapped[int] = mapped_column(Integer, nullable=True, default=60)
    calories_burn: Mapped[int] = mapped_column(Integer, nullable=True, default=10)
    media: Mapped[dict] = mapped_column(JSON, nullable=True, default={})
    muscle_groups: Mapped[list] = mapped_column(JSON, nullable=True, default=[])
    equipment: Mapped[list] = mapped_column(JSON, nullable=True, default=[])
    categories: Mapped[list] = mapped_column(JSON, nullable=True, default=[])
    image: Mapped[str | None] = mapped_column(String(500), nullable=True)
    video: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="Published")
    
    created_at: Mapped[str] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[str] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class WorkoutPlan(Base):
    """Stores workout plans consisting of multiple exercises."""
    __tablename__ = "workout_plans"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    title: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    difficulty: Mapped[str] = mapped_column(String(20), nullable=False, default="Beginner")
    duration_weeks: Mapped[int] = mapped_column(Integer, nullable=True, default=4)
    calories: Mapped[int | None] = mapped_column(Integer, nullable=True)
    image: Mapped[str | None] = mapped_column(String(500), nullable=True)
    video: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="Published")
    exercises_data: Mapped[list] = mapped_column(JSON, nullable=True, default=[])
    
    created_at: Mapped[str] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[str] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
