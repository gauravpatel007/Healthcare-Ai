"""
Admin API for Fitness Management
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.fitness import Exercise, WorkoutPlan


router = APIRouter(prefix="/admin/fitness", tags=["admin-fitness"])

@router.get("/exercises")
async def get_exercises(
    db: AsyncSession = Depends(get_db)
):
    query = select(Exercise).order_by(Exercise.created_at.desc())
    result = await db.execute(query)
    exercises = result.scalars().all()
    return exercises

@router.post("/exercises", status_code=status.HTTP_201_CREATED)
async def create_exercise(
    data: dict,
    db: AsyncSession = Depends(get_db)
):
    exercise = Exercise(
        title=data.get("title"),
        description=data.get("description"),
        difficulty=data.get("difficulty", "Beginner"),
        duration_seconds=data.get("duration_seconds", 60),
        calories_burn=data.get("calories_burn", 10),
        media=data.get("media", {"images": [], "videos": []}),
        muscle_groups=data.get("muscle_groups", []),
        equipment=data.get("equipment", []),
        categories=data.get("categories", []),
        status=data.get("status", "Draft")
    )
    db.add(exercise)
    await db.commit()
    await db.refresh(exercise)
    return exercise

@router.put("/exercises/{exercise_id}")
async def update_exercise(
    exercise_id: str,
    data: dict,
    db: AsyncSession = Depends(get_db)
):
    query = select(Exercise).where(Exercise.id == exercise_id)
    result = await db.execute(query)
    exercise = result.scalars().first()
    
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
        
    for key, value in data.items():
        if hasattr(exercise, key) and key not in ["id", "created_at", "updated_at"]:
            setattr(exercise, key, value)
            
    await db.commit()
    await db.refresh(exercise)
    return exercise

@router.delete("/exercises/{exercise_id}")
async def delete_exercise(
    exercise_id: str,
    db: AsyncSession = Depends(get_db)
):
    query = select(Exercise).where(Exercise.id == exercise_id)
    result = await db.execute(query)
    exercise = result.scalars().first()
    
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
        
    await db.delete(exercise)
    await db.commit()
    return {"status": "success", "message": "Exercise deleted"}

@router.get("/workout-plans")
async def get_workout_plans(
    db: AsyncSession = Depends(get_db)
):
    query = select(WorkoutPlan).order_by(WorkoutPlan.created_at.desc())
    result = await db.execute(query)
    plans = result.scalars().all()
    return plans

@router.post("/workout-plans", status_code=status.HTTP_201_CREATED)
async def create_workout_plan(
    data: dict,
    db: AsyncSession = Depends(get_db)
):
    plan = WorkoutPlan(
        title=data.get("title"),
        description=data.get("description"),
        difficulty=data.get("difficulty", "Beginner"),
        duration_weeks=data.get("duration_weeks", 4),
        status=data.get("status", "Draft"),
        exercises_data=data.get("exercises_data", [])
    )
    db.add(plan)
    await db.commit()
    await db.refresh(plan)
    return plan

@router.put("/workout-plans/{plan_id}")
async def update_workout_plan(
    plan_id: str,
    data: dict,
    db: AsyncSession = Depends(get_db)
):
    query = select(WorkoutPlan).where(WorkoutPlan.id == plan_id)
    result = await db.execute(query)
    plan = result.scalars().first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Workout plan not found")
        
    for key, value in data.items():
        if hasattr(plan, key) and key not in ["id", "created_at", "updated_at"]:
            setattr(plan, key, value)
            
    await db.commit()
    await db.refresh(plan)
    return plan

@router.delete("/workout-plans/{plan_id}")
async def delete_workout_plan(
    plan_id: str,
    db: AsyncSession = Depends(get_db)
):
    query = select(WorkoutPlan).where(WorkoutPlan.id == plan_id)
    result = await db.execute(query)
    plan = result.scalars().first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Workout plan not found")
        
    await db.delete(plan)
    await db.commit()
    return {"status": "success", "message": "Workout plan deleted"}
