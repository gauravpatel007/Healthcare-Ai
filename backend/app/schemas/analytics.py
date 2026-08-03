"""
LifeOS Backend — Analytics Schemas
"""

from pydantic import BaseModel


class TimelineEvent(BaseModel):
    date: str
    title: str
    description: str
    type: str


class RiskScore(BaseModel):
    name: str
    icon: str
    score: float
    level: str  # Low, Medium, High
    factors: list[str]


class HealthRiskResponse(BaseModel):
    overall_score: int
    risks: list[RiskScore]


class PredictionItem(BaseModel):
    name: str
    icon: str
    current: str
    predicted: str
    trend: str


class AnalyticsGraphData(BaseModel):
    labels: list[str]
    values: list[float]
    secondary_values: list[float] | None = None
