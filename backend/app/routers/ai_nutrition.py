"""
LifeOS Backend — AI Nutrition Planner Router
"""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import CurrentUserId
from app.models.user import UserProfile
from app.schemas.chat import NutritionPlanResponse
from app.services.ai_service import generate_ai_response
from app.utils.helpers import calculate_bmi, calculate_bmr, calculate_tdee, get_bmi_category

router = APIRouter(prefix="/ai/nutrition", tags=["AI Nutrition"])

# Default meal plans (matching frontend)
DEFAULT_MEALS = {
    "breakfast": [
        {"name": "Oatmeal with Fruits", "calories": 350, "protein": 12, "icon": "🥣", "time": "7:30 AM"},
        {"name": "Egg White Omelette", "calories": 280, "protein": 22, "icon": "🍳", "time": "7:30 AM"},
        {"name": "Greek Yogurt Bowl", "calories": 300, "protein": 18, "icon": "🥛", "time": "7:30 AM"},
        {"name": "Poha with Vegetables", "calories": 250, "protein": 8, "icon": "🍚", "time": "7:30 AM"},
    ],
    "lunch": [
        {"name": "Grilled Chicken Salad", "calories": 450, "protein": 35, "icon": "🥗", "time": "12:30 PM"},
        {"name": "Dal Rice with Veggies", "calories": 500, "protein": 18, "icon": "🍛", "time": "12:30 PM"},
        {"name": "Quinoa Buddha Bowl", "calories": 420, "protein": 16, "icon": "🥙", "time": "12:30 PM"},
    ],
    "snack": [
        {"name": "Handful of Almonds", "calories": 160, "protein": 6, "icon": "🥜", "time": "4:00 PM"},
        {"name": "Banana Protein Shake", "calories": 220, "protein": 15, "icon": "🍌", "time": "4:00 PM"},
    ],
    "dinner": [
        {"name": "Grilled Fish & Veggies", "calories": 380, "protein": 32, "icon": "🐟", "time": "7:30 PM"},
        {"name": "Paneer Tikka with Roti", "calories": 450, "protein": 22, "icon": "🫓", "time": "7:30 PM"},
        {"name": "Soup & Multigrain Toast", "calories": 300, "protein": 12, "icon": "🍲", "time": "7:30 PM"},
    ],
}


@router.get("/plan", response_model=NutritionPlanResponse)
async def get_nutrition_plan(user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Get personalized nutrition plan based on user profile."""
    profile_r = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = profile_r.scalar_one_or_none()

    weight = profile.weight if profile else 70
    height = profile.height if profile else 170
    age = profile.age if profile else 30
    gender = profile.gender if profile else "Male"

    bmi = calculate_bmi(weight, height)
    bmr = calculate_bmr(weight, height, age, gender)
    tdee = calculate_tdee(bmr, "moderate")
    water_goal = round(weight * 0.033, 1)
    protein_goal = round(weight * 1.2)

    # Build meal plan
    import random
    meals = []
    for meal_type, options in DEFAULT_MEALS.items():
        chosen = random.choice(options)
        meals.append({**chosen, "meal_type": meal_type})

    macro_breakdown = {
        "protein": {"grams": protein_goal, "percentage": 25, "color": "#FF6B6B"},
        "carbs": {"grams": round(tdee * 0.50 / 4), "percentage": 50, "color": "#FDCB6E"},
        "fats": {"grams": round(tdee * 0.25 / 9), "percentage": 25, "color": "#00D2D3"},
    }

    return NutritionPlanResponse(
        tdee=tdee,
        water_goal_liters=water_goal,
        protein_goal_grams=protein_goal,
        bmi=bmi,
        bmi_category=get_bmi_category(bmi),
        meals=meals,
        macro_breakdown=macro_breakdown,
        recommendations=[
            {"icon": "💧", "text": f"Drink {water_goal}L of water daily (based on your {weight}kg weight)"},
            {"icon": "🥩", "text": f"Aim for {protein_goal}g of protein daily for muscle maintenance"},
            {"icon": "🥗", "text": "Eat 5 servings of fruits and vegetables daily"},
            {"icon": "🕐", "text": "Eat meals at regular intervals. Don't skip breakfast."},
        ],
    )


@router.post("/regenerate", response_model=NutritionPlanResponse)
async def regenerate_plan(user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Regenerate meal plan with different options."""
    return await get_nutrition_plan(user_id=user_id, db=db)


@router.get("/stats")
async def nutrition_stats(user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Get nutrition stats (TDEE, macros, water goal)."""
    profile_r = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = profile_r.scalar_one_or_none()

    weight = profile.weight if profile else 70
    height = profile.height if profile else 170
    age = profile.age if profile else 30
    gender = profile.gender if profile else "Male"

    bmr = calculate_bmr(weight, height, age, gender)
    return {
        "bmr": bmr,
        "tdee_sedentary": calculate_tdee(bmr, "sedentary"),
        "tdee_light": calculate_tdee(bmr, "light"),
        "tdee_moderate": calculate_tdee(bmr, "moderate"),
        "tdee_active": calculate_tdee(bmr, "very_active"),
        "water_goal_liters": round(weight * 0.033, 1),
        "protein_goal_grams": round(weight * 1.2),
    }


@router.post("/recommendations")
async def ai_diet_recommendations(user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Get AI-powered diet recommendations."""
    profile_r = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = profile_r.scalar_one_or_none()

    context = ""
    if profile:
        bmi = calculate_bmi(profile.weight, profile.height)
        context = f"Patient: {profile.name}, Age: {profile.age}, Gender: {profile.gender}, BMI: {bmi}, Conditions: {', '.join(profile.conditions) if profile.conditions else 'None'}, Allergies: {', '.join(profile.allergies) if profile.allergies else 'None'}"

    response = await generate_ai_response(
        "nutrition",
        "Provide personalized diet recommendations based on my profile. Include Indian food options.",
        context=context,
    )
    return {"recommendations": response}
