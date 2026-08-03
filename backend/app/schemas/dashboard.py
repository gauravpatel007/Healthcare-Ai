"""
LifeOS Backend — Dashboard Schemas
"""

from pydantic import BaseModel


class DashboardSummary(BaseModel):
    health_score: int
    active_medicines: int
    upcoming_appointments: int
    water_intake: int
    medical_records: int
    bmi: float
    bmi_category: str
    blood_type: str
    user_name: str
    reminders: list[dict]
    upcoming: list[dict]
    family_summary: list[dict]
