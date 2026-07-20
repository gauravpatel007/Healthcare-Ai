"""
LifeOS Backend — AI Fitness Coach Router
"""

from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import CurrentUserId
from app.models.health_tracker import HealthEntry
from app.models.user import UserProfile
from app.schemas.chat import FitnessStatsResponse
from app.services.ai_service import generate_ai_response

router = APIRouter(prefix="/ai/fitness", tags=["AI Fitness"])

# Workout database (matching frontend)
WORKOUTS = {
    "cardio": [
        {"name": "Brisk Walking", "duration": "30 min", "calories": 150, "icon": "🚶", "sets": "-", "reps": "-", "difficulty": "Easy"},
        {"name": "Jogging", "duration": "20 min", "calories": 200, "icon": "🏃", "sets": "-", "reps": "-", "difficulty": "Medium"},
        {"name": "Jumping Jacks", "duration": "15 min", "calories": 130, "icon": "⭐", "sets": "3", "reps": "30", "difficulty": "Easy"},
        {"name": "Cycling", "duration": "30 min", "calories": 250, "icon": "🚴", "sets": "-", "reps": "-", "difficulty": "Medium"},
        {"name": "Swimming", "duration": "30 min", "calories": 300, "icon": "🏊", "sets": "-", "reps": "-", "difficulty": "Medium"},
    ],
    "strength": [
        {"name": "Push-ups", "duration": "10 min", "calories": 70, "icon": "💪", "sets": "3", "reps": "15", "difficulty": "Medium"},
        {"name": "Squats", "duration": "10 min", "calories": 80, "icon": "🦵", "sets": "3", "reps": "20", "difficulty": "Medium"},
        {"name": "Planks", "duration": "5 min", "calories": 30, "icon": "🧘", "sets": "3", "reps": "60 sec", "difficulty": "Medium"},
        {"name": "Lunges", "duration": "10 min", "calories": 75, "icon": "🏋️", "sets": "3", "reps": "12 each", "difficulty": "Medium"},
        {"name": "Dumbbell Rows", "duration": "10 min", "calories": 65, "icon": "🏋️", "sets": "3", "reps": "12", "difficulty": "Hard"},
    ],
    "yoga": [
        {"name": "Sun Salutation", "duration": "15 min", "calories": 60, "icon": "🧘", "sets": "5", "reps": "cycles", "difficulty": "Easy"},
        {"name": "Warrior Pose", "duration": "10 min", "calories": 40, "icon": "🧘", "sets": "-", "reps": "Hold 30s", "difficulty": "Easy"},
        {"name": "Tree Pose", "duration": "5 min", "calories": 20, "icon": "🌳", "sets": "-", "reps": "Hold 30s", "difficulty": "Easy"},
        {"name": "Downward Dog", "duration": "5 min", "calories": 25, "icon": "🐕", "sets": "-", "reps": "Hold 60s", "difficulty": "Easy"},
    ],
    "hiit": [
        {"name": "Burpees", "duration": "10 min", "calories": 120, "icon": "🔥", "sets": "4", "reps": "10", "difficulty": "Hard"},
        {"name": "Mountain Climbers", "duration": "10 min", "calories": 100, "icon": "⛰️", "sets": "4", "reps": "20", "difficulty": "Hard"},
        {"name": "High Knees", "duration": "5 min", "calories": 60, "icon": "🦵", "sets": "3", "reps": "30", "difficulty": "Medium"},
        {"name": "Box Jumps", "duration": "10 min", "calories": 110, "icon": "📦", "sets": "4", "reps": "12", "difficulty": "Hard"},
    ],
}

WEEKLY_PLAN = [
    {"day": "Monday", "workout": "Upper Body + Cardio", "duration": "45 min", "icon": "💪", "rest": False},
    {"day": "Tuesday", "workout": "Lower Body", "duration": "45 min", "icon": "🦵", "rest": False},
    {"day": "Wednesday", "workout": "Yoga & Flexibility", "duration": "30 min", "icon": "🧘", "rest": False},
    {"day": "Thursday", "workout": "HIIT", "duration": "25 min", "icon": "🔥", "rest": False},
    {"day": "Friday", "workout": "Full Body Strength", "duration": "50 min", "icon": "🏋️", "rest": False},
    {"day": "Saturday", "workout": "Cardio", "duration": "40 min", "icon": "🏃", "rest": False},
    {"day": "Sunday", "workout": "Rest & Light Stretch", "duration": "20 min", "icon": "🛌", "rest": True},
]


@router.get("/workout")
async def get_workouts(category: str = "cardio"):
    """Get workout exercises by category."""
    workouts = WORKOUTS.get(category, WORKOUTS["cardio"])
    return {"category": category, "exercises": workouts}


@router.get("/weekly-plan")
async def weekly_plan():
    """Get weekly workout schedule."""
    return {"plan": WEEKLY_PLAN}


@router.post("/steps")
async def add_steps(
    steps: int, user_id: CurrentUserId, db: AsyncSession = Depends(get_db)
):
    """Log steps for today."""
    from datetime import datetime, timezone
    entry = HealthEntry(
        user_id=user_id, category="steps", value=float(steps),
        label=date.today().strftime("%a"), recorded_at=datetime.now(timezone.utc),
    )
    db.add(entry)
    await db.flush()
    return {"success": True, "steps": steps}


@router.get("/stats", response_model=FitnessStatsResponse)
async def fitness_stats(user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Get today's activity stats."""
    from datetime import datetime, timezone

    today_start = datetime.combine(date.today(), datetime.min.time()).replace(tzinfo=timezone.utc)

    # Steps
    steps_r = await db.execute(
        select(HealthEntry).where(
            HealthEntry.user_id == user_id,
            HealthEntry.category == "steps",
            HealthEntry.recorded_at >= today_start,
        )
    )
    steps = sum(int(e.value) for e in steps_r.scalars().all())

    # Calories burned
    cals_r = await db.execute(
        select(HealthEntry).where(
            HealthEntry.user_id == user_id,
            HealthEntry.category == "calories",
            HealthEntry.recorded_at >= today_start,
        )
    )
    calories = sum(int(e.value) for e in cals_r.scalars().all())

    step_goal = 10000
    return FitnessStatsResponse(
        steps=steps,
        calories_burned=calories,
        active_minutes=round(steps / 100),
        distance_km=round(steps * 0.000762, 2),
        step_goal=step_goal,
        step_percentage=round((steps / step_goal) * 100, 1),
    )


@router.post("/log")
async def log_exercise(
    exercise_name: str, duration_minutes: int, calories: int,
    user_id: CurrentUserId, db: AsyncSession = Depends(get_db),
):
    """Log a completed exercise."""
    from datetime import datetime, timezone
    entry = HealthEntry(
        user_id=user_id, category="calories", value=float(calories),
        label=exercise_name, recorded_at=datetime.now(timezone.utc),
    )
    db.add(entry)
    await db.flush()
    return {"success": True, "exercise": exercise_name, "duration": duration_minutes, "calories": calories}

@router.post("/steps")
async def add_steps(
    steps: int,
    user_id: CurrentUserId, db: AsyncSession = Depends(get_db),
):
    """Add steps."""
    from datetime import datetime, timezone
    entry = HealthEntry(
        user_id=user_id, category="steps", value=float(steps),
        label="Voice Added Steps", recorded_at=datetime.now(timezone.utc),
    )
    db.add(entry)
    await db.commit()
    return {"success": True, "steps": steps}
