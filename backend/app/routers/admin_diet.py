"""
Admin API for Diet Management — Recipes & Meal Plans
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.diet import Recipe, MealPlan
from app.models.user import User, UserProfile


router = APIRouter(prefix="/admin/diet", tags=["admin-diet"])

# ── RECIPES ─────────────────────────────────────────────────────────

@router.get("/recipes")
async def get_recipes(db: AsyncSession = Depends(get_db)):
    query = select(Recipe).order_by(Recipe.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/recipes", status_code=status.HTTP_201_CREATED)
async def create_recipe(data: dict, db: AsyncSession = Depends(get_db)):
    recipe = Recipe(
        title=data.get("title"),
        description=data.get("description"),
        meal_type=data.get("meal_type", "Lunch"),
        image_url=data.get("image_url"),
        prep_time_minutes=data.get("prep_time_minutes", 30),
        calories=data.get("calories", 0),
        protein=data.get("protein", 0),
        fat=data.get("fat", 0),
        carbs=data.get("carbs", 0),
        fiber=data.get("fiber", 0),
        vitamins=data.get("vitamins", []),
        ingredients=data.get("ingredients", []),
        instructions=data.get("instructions"),
        status=data.get("status", "Published"),
    )
    db.add(recipe)
    await db.commit()
    await db.refresh(recipe)
    return recipe


@router.put("/recipes/{recipe_id}")
async def update_recipe(recipe_id: str, data: dict, db: AsyncSession = Depends(get_db)):
    query = select(Recipe).where(Recipe.id == recipe_id)
    result = await db.execute(query)
    recipe = result.scalars().first()

    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    for key, value in data.items():
        if hasattr(recipe, key) and key not in ["id", "created_at", "updated_at"]:
            setattr(recipe, key, value)

    await db.commit()
    await db.refresh(recipe)
    return recipe


@router.delete("/recipes/{recipe_id}")
async def delete_recipe(recipe_id: str, db: AsyncSession = Depends(get_db)):
    query = select(Recipe).where(Recipe.id == recipe_id)
    result = await db.execute(query)
    recipe = result.scalars().first()

    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    await db.delete(recipe)
    await db.commit()
    return {"status": "success", "message": "Recipe deleted"}


# ── MEAL PLANS ──────────────────────────────────────────────────────

@router.get("/meal-plans")
async def get_meal_plans(db: AsyncSession = Depends(get_db)):
    query = select(MealPlan, UserProfile.name, User.email).outerjoin(
        User, MealPlan.user_id == User.id
    ).outerjoin(
        UserProfile, User.id == UserProfile.user_id
    ).order_by(MealPlan.created_at.desc())
    
    result = await db.execute(query)
    
    plans = []
    for plan, user_name, user_email in result.all():
        plan_dict = {
            "id": plan.id,
            "title": plan.title,
            "description": plan.description,
            "goal": plan.goal,
            "duration_days": plan.duration_days,
            "daily_calorie_target": plan.daily_calorie_target,
            "status": plan.status,
            "meals_data": plan.meals_data,
            "shopping_list": plan.shopping_list,
            "assigned_users": plan.assigned_users,
            "source": getattr(plan, "source", "Admin"),
            "user_id": getattr(plan, "user_id", None),
            "created_at": plan.created_at,
            "updated_at": plan.updated_at,
        }
        if plan_dict["user_id"]:
            plan_dict["user"] = {
                "name": user_name or "Unknown User",
                "email": user_email or "Unknown Email"
            }
        plans.append(plan_dict)
        
    return plans


@router.post("/meal-plans", status_code=status.HTTP_201_CREATED)
async def create_meal_plan(data: dict, db: AsyncSession = Depends(get_db)):
    plan = MealPlan(
        title=data.get("title"),
        description=data.get("description"),
        goal=data.get("goal", "Maintenance"),
        duration_days=data.get("duration_days", 7),
        daily_calorie_target=data.get("daily_calorie_target", 2000),
        status=data.get("status", "Draft"),
        meals_data=data.get("meals_data", []),
        shopping_list=data.get("shopping_list", []),
        assigned_users=data.get("assigned_users", []),
    )
    db.add(plan)
    await db.commit()
    await db.refresh(plan)
    return plan


@router.put("/meal-plans/{plan_id}")
async def update_meal_plan(plan_id: str, data: dict, db: AsyncSession = Depends(get_db)):
    query = select(MealPlan).where(MealPlan.id == plan_id)
    result = await db.execute(query)
    plan = result.scalars().first()

    if not plan:
        raise HTTPException(status_code=404, detail="Meal plan not found")

    for key, value in data.items():
        if hasattr(plan, key) and key not in ["id", "created_at", "updated_at"]:
            setattr(plan, key, value)

    await db.commit()
    await db.refresh(plan)
    return plan


@router.delete("/meal-plans/{plan_id}")
async def delete_meal_plan(plan_id: str, db: AsyncSession = Depends(get_db)):
    query = select(MealPlan).where(MealPlan.id == plan_id)
    result = await db.execute(query)
    plan = result.scalars().first()

    if not plan:
        raise HTTPException(status_code=404, detail="Meal plan not found")

    await db.delete(plan)
    await db.commit()
    return {"status": "success", "message": "Meal plan deleted"}


@router.post("/meal-plans/{plan_id}/assign")
async def assign_meal_plan(plan_id: str, data: dict, db: AsyncSession = Depends(get_db)):
    """Assign a meal plan to one or more users."""
    query = select(MealPlan).where(MealPlan.id == plan_id)
    result = await db.execute(query)
    plan = result.scalars().first()

    if not plan:
        raise HTTPException(status_code=404, detail="Meal plan not found")

    user_ids = data.get("user_ids", [])
    existing = plan.assigned_users or []
    # Merge without duplicates
    merged = list(set(existing + user_ids))
    plan.assigned_users = merged

    await db.commit()
    await db.refresh(plan)
    return plan

# ── SCANNED MEALS ───────────────────────────────────────────────────

@router.get("/scanned-meals")
async def get_scanned_meals(db: AsyncSession = Depends(get_db)):
    from app.models.diet import ScannedMeal
    from datetime import datetime
    from sqlalchemy import cast, Date as SADate
    
    query = select(ScannedMeal, UserProfile.name, User.email).outerjoin(
        User, ScannedMeal.user_id == User.id
    ).outerjoin(
        UserProfile, User.id == UserProfile.user_id
    ).order_by(ScannedMeal.recorded_at.desc())
    
    result = await db.execute(query)
    
    meals = []
    for meal, user_name, user_email in result.all():
        meal_dict = {
            "id": meal.id,
            "user_id": meal.user_id,
            "user_name": user_name or "Unknown User",
            "user_email": user_email or "N/A",
            "name": meal.name,
            "calories": meal.calories,
            "protein": meal.protein,
            "carbs": meal.carbs,
            "fats": meal.fats,
            "image_url": meal.image_url,
            "meal_type": meal.meal_type,
            "recorded_at": meal.recorded_at,
        }
        meals.append(meal_dict)
    
    return meals
