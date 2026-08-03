"""
LifeOS Backend — Analytics Router
Timeline, disease progress, risk scores, predictions.
"""

import random

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import CurrentUserId
from app.models.health_tracker import HealthEntry
from app.models.medical_record import MedicalRecord
from app.models.medicine import Medicine
from app.models.user import UserProfile
from app.schemas.analytics import (
    AnalyticsGraphData, HealthRiskResponse, PredictionItem, RiskScore, TimelineEvent,
)
from app.utils.helpers import calculate_bmi, simple_linear_prediction

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/timeline", response_model=list[TimelineEvent])
async def health_timeline(user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Get health timeline events from records and medicines."""
    events = []

    # Records
    records_r = await db.execute(
        select(MedicalRecord).where(MedicalRecord.user_id == user_id)
    )
    for r in records_r.scalars().all():
        events.append(TimelineEvent(
            date=str(r.date or r.created_at),
            title=r.title,
            description=f"{r.category} at {r.hospital}",
            type=r.category,
        ))

    # Medicines
    meds_r = await db.execute(select(Medicine).where(Medicine.user_id == user_id))
    for m in meds_r.scalars().all():
        if m.start_date:
            events.append(TimelineEvent(
                date=str(m.start_date),
                title=f"Started {m.name}",
                description=f"{m.dosage} - {m.purpose}",
                type="Medicine",
            ))

    events.sort(key=lambda e: e.date, reverse=True)
    return events[:15]


@router.get("/graphs")
async def disease_progress_graphs(user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Get chart data for disease progress visualization."""
    result = await db.execute(
        select(HealthEntry).where(HealthEntry.user_id == user_id).order_by(HealthEntry.recorded_at)
    )
    entries = result.scalars().all()

    graphs = {}
    for e in entries:
        cat = e.category
        if cat not in graphs:
            graphs[cat] = {"labels": [], "values": [], "secondary_values": []}
        graphs[cat]["labels"].append(e.label or "")
        graphs[cat]["values"].append(e.value)
        if e.secondary_value is not None:
            graphs[cat]["secondary_values"].append(e.secondary_value)

    return graphs


@router.get("/risk-scores", response_model=HealthRiskResponse)
async def risk_scores(user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Calculate AI health risk scores."""
    profile_r = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = profile_r.scalar_one_or_none()

    weight = profile.weight if profile else 70
    height = profile.height if profile else 170
    age = profile.age if profile else 30
    bmi = calculate_bmi(weight, height)

    # Deterministic modifier to replace randomness
    mod = (weight + age) % 5

    # Calculate risk scores (same logic as frontend)
    risks = [
        RiskScore(
            name="Heart Disease", icon="🫀",
            score=round(max(10, min(85, 15 + (20 if age > 45 else 0) + (15 if bmi > 25 else 0) + mod)), 1),
            level="", factors=["Age", "BMI", "Blood Pressure", "Cholesterol", "Family History"],
        ),
        RiskScore(
            name="Diabetes", icon="🍬",
            score=round(max(10, min(85, 10 + (20 if bmi > 25 else 0) + (10 if age > 40 else 0) + mod)), 1),
            level="", factors=["BMI", "Fasting Blood Sugar", "Family History", "Physical Activity"],
        ),
        RiskScore(
            name="Hypertension", icon="🩺",
            score=round(max(10, min(85, 12 + (15 if age > 40 else 0) + (12 if bmi > 27 else 0) + mod)), 1),
            level="", factors=["Age", "Sodium Intake", "Stress", "Weight", "Family History"],
        ),
        RiskScore(
            name="Kidney Disease", icon="🫘",
            score=round(max(5, min(70, 8 + (15 if age > 50 else 0) + mod)), 1),
            level="", factors=["Diabetes Risk", "Blood Pressure", "Age", "Hydration"],
        ),
    ]

    for r in risks:
        r.level = "High" if r.score > 60 else "Medium" if r.score > 35 else "Low"

    overall = round(100 - sum(r.score for r in risks) / len(risks))

    return HealthRiskResponse(overall_score=max(0, min(100, overall)), risks=risks)


@router.get("/predictions", response_model=list[PredictionItem])
async def health_predictions(user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Predict future health metrics using linear regression on historical data."""
    result = await db.execute(
        select(HealthEntry).where(HealthEntry.user_id == user_id).order_by(HealthEntry.recorded_at)
    )
    entries = result.scalars().all()

    by_category: dict[str, list[float]] = {}
    daily_aggregates: dict[str, dict[str, float]] = {}

    for e in entries:
        if e.category in ["steps", "calories"]:
            date_str = str(e.recorded_at.date()) if e.recorded_at else "today"
            if e.category not in daily_aggregates:
                daily_aggregates[e.category] = {}
            daily_aggregates[e.category][date_str] = daily_aggregates[e.category].get(date_str, 0.0) + e.value
        else:
            by_category.setdefault(e.category, []).append(e.value)
            
    for cat, date_dict in daily_aggregates.items():
        by_category[cat] = [max(0.0, val) for val in date_dict.values()]

    predictions = []
    icon_map = {"weight": "⚖️", "blood_sugar": "🩸", "blood_pressure": "🩺",
                "cholesterol": "🧬", "heart_rate": "❤️"}
    unit_map = {"weight": "kg", "blood_sugar": "mg/dL", "blood_pressure": "mmHg",
                "cholesterol": "mg/dL", "heart_rate": "bpm"}

    for cat, values in by_category.items():
        if len(values) >= 3:
            current = values[-1]
            predicted = simple_linear_prediction(values, steps_ahead=3)
            if predicted > current:
                trend = "📈 Increasing"
            elif predicted < current:
                trend = "📉 Decreasing"
            else:
                trend = "➖ Stable"
            unit = unit_map.get(cat, "")

            predictions.append(PredictionItem(
                name=cat.replace("_", " ").title(),
                icon=icon_map.get(cat, "📊"),
                current=f"{current:.1f} {unit}",
                predicted=f"{predicted:.1f} {unit}",
                trend=trend,
            ))

    return predictions
