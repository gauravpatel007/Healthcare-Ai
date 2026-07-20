"""
LifeOS Backend — AI Symptom Checker Router
"""

import json
import logging

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import CurrentUserId
from app.models.user import UserProfile
from app.schemas.chat import ConditionResult, SymptomAnalysisRequest, SymptomAnalysisResponse
from app.services.ai_service import generate_ai_response

logger = logging.getLogger("lifeos.ai.symptom")
router = APIRouter(prefix="/ai/symptoms", tags=["AI Symptom Checker"])

# Symptom-condition mapping (fallback database matching frontend)
SYMPTOM_CONDITIONS = {
    "headache": [
        {"condition": "Tension Headache", "probability": 60, "specialists": ["Neurologist"]},
        {"condition": "Migraine", "probability": 30, "specialists": ["Neurologist"]},
        {"condition": "Sinusitis", "probability": 20, "specialists": ["ENT Specialist"]},
    ],
    "fever": [
        {"condition": "Viral Infection", "probability": 70, "specialists": ["General Physician"]},
        {"condition": "Bacterial Infection", "probability": 30, "specialists": ["General Physician"]},
        {"condition": "Dengue Fever", "probability": 15, "specialists": ["Infectious Disease"]},
    ],
    "cough": [
        {"condition": "Common Cold", "probability": 60, "specialists": ["General Physician"]},
        {"condition": "Bronchitis", "probability": 25, "specialists": ["Pulmonologist"]},
        {"condition": "Allergic Rhinitis", "probability": 20, "specialists": ["Allergist"]},
    ],
    "chest pain": [
        {"condition": "Acid Reflux (GERD)", "probability": 40, "specialists": ["Gastroenterologist"]},
        {"condition": "Muscle Strain", "probability": 30, "specialists": ["General Physician"]},
        {"condition": "Cardiac Issue", "probability": 15, "specialists": ["Cardiologist"]},
    ],
    "stomach pain": [
        {"condition": "Gastritis", "probability": 50, "specialists": ["Gastroenterologist"]},
        {"condition": "Food Poisoning", "probability": 30, "specialists": ["General Physician"]},
        {"condition": "Appendicitis", "probability": 10, "specialists": ["Surgeon"]},
    ],
    "fatigue": [
        {"condition": "Iron Deficiency", "probability": 40, "specialists": ["Hematologist"]},
        {"condition": "Thyroid Disorder", "probability": 25, "specialists": ["Endocrinologist"]},
        {"condition": "Vitamin D Deficiency", "probability": 35, "specialists": ["General Physician"]},
    ],
    "back pain": [
        {"condition": "Muscle Strain", "probability": 55, "specialists": ["Orthopedist"]},
        {"condition": "Herniated Disc", "probability": 20, "specialists": ["Orthopedist", "Neurologist"]},
        {"condition": "Poor Posture", "probability": 40, "specialists": ["Physiotherapist"]},
    ],
    "dizziness": [
        {"condition": "Low Blood Pressure", "probability": 35, "specialists": ["Cardiologist"]},
        {"condition": "Inner Ear Issue", "probability": 25, "specialists": ["ENT Specialist"]},
        {"condition": "Dehydration", "probability": 45, "specialists": ["General Physician"]},
    ],
}


@router.post("/analyze", response_model=SymptomAnalysisResponse)
async def analyze_symptoms(
    data: SymptomAnalysisRequest, user_id: CurrentUserId, db: AsyncSession = Depends(get_db)
):
    """Analyze symptoms and suggest possible conditions."""
    # Get profile context
    profile_r = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = profile_r.scalar_one_or_none()
    context = ""
    if profile:
        context = f"Patient: Age {profile.age}, Gender: {profile.gender}, Conditions: {', '.join(profile.conditions) if profile.conditions else 'None'}, Allergies: {', '.join(profile.allergies) if profile.allergies else 'None'}"

    # Try Groq AI first
    prompt = (
        f"Analyze these symptoms: {', '.join(data.symptoms)}\n"
        f"Duration: {data.duration}\n"
        f"Severity: {data.severity}\n"
        f"Age Group: {data.age_group}\n\n"
        "Respond with a JSON object containing:\n"
        '- urgency: "Low", "Medium", or "High"\n'
        "- conditions: list of {condition, probability (int 0-100)}\n"
        "- specialists: list of specialist types\n"
        "- recommendations: list of actionable advice\n"
        "Only return valid JSON, no markdown."
    )

    ai_response = await generate_ai_response("symptom", prompt, context=context)

    # Try to parse AI response as JSON
    try:
        parsed = json.loads(ai_response)
        conditions = [ConditionResult(
            condition=c.get("condition", "Unknown"),
            probability=c.get("probability", 0),
            matched_symptoms=len(data.symptoms),
        ) for c in parsed.get("conditions", [])]

        return SymptomAnalysisResponse(
            urgency=parsed.get("urgency", "Medium"),
            symptoms_analyzed=data.symptoms,
            conditions=conditions,
            specialists=parsed.get("specialists", ["General Physician"]),
            recommendations=parsed.get("recommendations", ["Consult a doctor"]),
        )
    except (json.JSONDecodeError, TypeError, AttributeError):
        logger.info("AI response not JSON, using fallback symptom analysis")

    # Fallback: local symptom-condition matching
    conditions = []
    specialists = set()
    urgency = "Low"

    for symptom in data.symptoms:
        s_lower = symptom.lower()
        for key, conds in SYMPTOM_CONDITIONS.items():
            if key in s_lower or s_lower in key:
                for c in conds:
                    conditions.append(ConditionResult(
                        condition=c["condition"],
                        probability=c["probability"],
                        matched_symptoms=1,
                    ))
                    specialists.update(c["specialists"])

    if not conditions:
        conditions.append(ConditionResult(
            condition="General assessment needed", probability=0, matched_symptoms=len(data.symptoms),
        ))
        specialists.add("General Physician")

    # Deduplicate and sort conditions
    seen = set()
    unique_conditions = []
    for c in sorted(conditions, key=lambda x: x.probability, reverse=True):
        if c.condition not in seen:
            seen.add(c.condition)
            unique_conditions.append(c)

    # Determine urgency
    if data.severity in ["Severe", "Very Severe"] or "chest pain" in " ".join(data.symptoms).lower():
        urgency = "High"
    elif data.severity == "Moderate" or len(data.symptoms) >= 3:
        urgency = "Medium"

    recommendations = [
        "Stay hydrated and get adequate rest",
        "Monitor your symptoms for any changes",
        "Keep a symptom diary for your doctor visit",
    ]
    if urgency == "High":
        recommendations.insert(0, "⚠️ Seek immediate medical attention")

    return SymptomAnalysisResponse(
        urgency=urgency,
        symptoms_analyzed=data.symptoms,
        conditions=unique_conditions[:5],
        specialists=list(specialists),
        recommendations=recommendations,
    )
