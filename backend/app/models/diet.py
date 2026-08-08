"""
LifeOS Backend — Diet & Meal Plan Models
"""

from sqlalchemy import DateTime, Integer, String, Text, JSON, Boolean, func, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, generate_uuid, TimestampMixin


class Recipe(Base):
    """Individual recipes / food items with full nutritional information."""

    __tablename__ = "recipes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    title: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    meal_type: Mapped[str] = mapped_column(String(50), nullable=False, default="Lunch")
    image_url: Mapped[str] = mapped_column(Text, nullable=True)
    prep_time_minutes: Mapped[int] = mapped_column(Integer, nullable=True, default=30)

    # Nutritional info (per serving)
    calories: Mapped[int] = mapped_column(Integer, nullable=True, default=0)
    protein: Mapped[int] = mapped_column(Integer, nullable=True, default=0)
    fat: Mapped[int] = mapped_column(Integer, nullable=True, default=0)
    carbs: Mapped[int] = mapped_column(Integer, nullable=True, default=0)
    fiber: Mapped[int] = mapped_column(Integer, nullable=True, default=0)
    vitamins: Mapped[list] = mapped_column(JSON, nullable=True, default=list)

    # Recipe details
    ingredients: Mapped[list] = mapped_column(JSON, nullable=True, default=list)
    instructions: Mapped[str] = mapped_column(Text, nullable=True)

    status: Mapped[str] = mapped_column(String(20), nullable=False, default="Published")

    created_at: Mapped[str] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[str] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class MealPlan(Base):
    """A named diet plan containing daily meals from recipes."""

    __tablename__ = "meal_plans"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    title: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    goal: Mapped[str] = mapped_column(String(50), nullable=False, default="Maintenance")
    duration_days: Mapped[int] = mapped_column(Integer, nullable=True, default=7)
    daily_calorie_target: Mapped[int] = mapped_column(Integer, nullable=True, default=2000)
    calories: Mapped[int | None] = mapped_column(Integer, nullable=True)
    protein: Mapped[int | None] = mapped_column(Integer, nullable=True)
    carbs: Mapped[int | None] = mapped_column(Integer, nullable=True)
    fat: Mapped[int | None] = mapped_column(Integer, nullable=True)

    status: Mapped[str] = mapped_column(String(20), nullable=False, default="Draft")

    # Structured meal data: [{day, meal_type, recipe_id, recipe_title, servings}]
    meals_data: Mapped[list] = mapped_column(JSON, nullable=True, default=list)
    # Auto-generated shopping list: ["2 eggs", "500g chicken breast", ...]
    shopping_list: Mapped[list] = mapped_column(JSON, nullable=True, default=list)
    # Assigned user IDs (legacy/admin-assigned)
    assigned_users: Mapped[list] = mapped_column(JSON, nullable=True, default=list)

    # Tracking AI Generation
    source: Mapped[str] = mapped_column(String(50), nullable=False, default="Admin")
    user_id: Mapped[str | None] = mapped_column(String(36), nullable=True)

    created_at: Mapped[str] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[str] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class ScannedMeal(Base, TimestampMixin):
    """Model to store scanned meals."""
    __tablename__ = "scanned_meals"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    calories: Mapped[int] = mapped_column(Integer, default=0)
    protein: Mapped[int] = mapped_column(Integer, default=0)
    carbs: Mapped[int] = mapped_column(Integer, default=0)
    fats: Mapped[int] = mapped_column(Integer, default=0)
    image_url: Mapped[str] = mapped_column(Text, nullable=True)
    meal_type: Mapped[str] = mapped_column(String(50), default="Scanned Snack")
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    recorded_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
