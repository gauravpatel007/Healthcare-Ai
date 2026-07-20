"""
LifeOS Backend — Medicine Schemas
"""

from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field


class MedicineCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    dosage: str = ""
    type: str = Field(default="tablet", pattern="^(tablet|capsule|syrup|injection|drops|cream)$")
    frequency: str = Field(default="once_daily", pattern="^(once_daily|twice_daily|thrice_daily|once_weekly|as_needed)$")
    times: list[str] = Field(default_factory=list)
    purpose: str = ""
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    total_pills: int = Field(default=30, ge=0)
    remaining: int = Field(default=30, ge=0)


class MedicineUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    dosage: str | None = None
    type: str | None = None
    frequency: str | None = None
    times: list[str] | None = None
    purpose: str | None = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    total_pills: int | None = Field(None, ge=0)
    remaining: int | None = Field(None, ge=0)
    is_active: bool | None = None


class MedicineResponse(BaseModel):
    id: str
    user_id: str
    name: str
    dosage: str
    type: str
    frequency: str
    times: list[str]
    purpose: str
    start_date: Optional[date]
    end_date: Optional[date]
    total_pills: int
    remaining: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class InteractionWarning(BaseModel):
    pair: str
    medicine_1: str
    medicine_2: str
    description: str = "Potential interaction detected. Consult your doctor."


class InteractionCheckResponse(BaseModel):
    has_interactions: bool
    warnings: list[InteractionWarning] = []


class RefillPrediction(BaseModel):
    medicine_id: str
    medicine_name: str
    remaining: int
    total_pills: int
    days_left: int
    percentage: float
