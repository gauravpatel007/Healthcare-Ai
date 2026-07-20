"""
LifeOS Backend — Health Tracker Schemas
"""

from datetime import date, datetime, time
from typing import Optional
from pydantic import BaseModel, Field


class VoiceLogRequest(BaseModel):
    text: str = Field(..., min_length=1, description="The transcribed voice command text")

class HealthEntryCreate(BaseModel):
    category: str = Field(..., pattern="^(blood_sugar|blood_pressure|cholesterol|weight|heart_rate|steps|calories)$")
    value: float
    secondary_value: float | None = None  # e.g. diastolic BP
    label: str | None = None
    recorded_at: Optional[datetime] = None


class HealthEntryResponse(BaseModel):
    id: str
    category: str
    value: float
    secondary_value: float | None
    label: str | None
    recorded_at: datetime
    model_config = {"from_attributes": True}


class WaterIntakeUpdate(BaseModel):
    glasses: int = Field(..., ge=0, le=20)
    date: Optional[date] = None


class WaterIntakeResponse(BaseModel):
    date: date
    glasses: int
    model_config = {"from_attributes": True}


class SleepEntryCreate(BaseModel):
    hours: float = Field(..., gt=0, le=24)
    quality: int = Field(default=3, ge=1, le=5)
    bedtime: Optional[time] = None
    wake_time: Optional[time] = None
    date: Optional[date] = None


class SleepEntryResponse(BaseModel):
    id: str
    date: date
    hours: float
    quality: int
    bedtime: Optional[time]
    wake_time: Optional[time]
    model_config = {"from_attributes": True}


class BMIResponse(BaseModel):
    bmi: float
    category: str
    bmr: int
    tdee_by_activity: dict[str, int]
    weight: float
    height: float


class WearableConnectRequest(BaseModel):
    device_name: str = Field(..., min_length=1, max_length=50)


class WearableSyncResponse(BaseModel):
    heart_rate: float
    sleep_hours: float
    steps: int
    calories_burned: float

class FitbitCallbackRequest(BaseModel):
    code: str
