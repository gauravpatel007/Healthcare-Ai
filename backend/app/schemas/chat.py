"""
LifeOS Backend — Chat Schemas
"""

from datetime import datetime
from pydantic import BaseModel, Field


class ChatMessageCreate(BaseModel):
    message: str = Field(..., min_length=1)
    language: str = "en"


class ChatMessageResponse(BaseModel):
    id: str
    role: str
    content: str
    module: str
    created_at: datetime
    model_config = {"from_attributes": True}


class ChatResponse(BaseModel):
    response: str
    disclaimer: str = "This is AI-generated health information. Always consult a doctor for medical advice."


class SymptomAnalysisRequest(BaseModel):
    symptoms: list[str] = Field(..., min_length=1)
    duration: str = "Less than 24 hours"
    severity: str = "Mild"
    age_group: str = "Adult (18-60)"


class ConditionResult(BaseModel):
    condition: str
    probability: int
    matched_symptoms: int


class SymptomAnalysisResponse(BaseModel):
    urgency: str  # Low, Medium, High
    symptoms_analyzed: list[str]
    conditions: list[ConditionResult]
    specialists: list[str]
    recommendations: list[str]
    disclaimer: str = "This is NOT a medical diagnosis. Always consult a healthcare professional."


class NutritionPlanResponse(BaseModel):
    tdee: int
    water_goal_liters: float
    protein_goal_grams: int
    bmi: float
    bmi_category: str
    meals: list[dict]
    macro_breakdown: dict
    recommendations: list[dict]


class FitnessStatsResponse(BaseModel):
    steps: int
    calories_burned: int
    active_minutes: int
    distance_km: float
    step_goal: int = 10000
    step_percentage: float


class MeditationResponse(BaseModel):
    name: str
    duration: str
    icon: str
    description: str
