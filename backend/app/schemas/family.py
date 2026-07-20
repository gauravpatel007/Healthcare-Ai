"""
LifeOS Backend — Family & Vaccination Schemas
"""

from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field


class FamilyMemberCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    relation: str = Field(..., pattern="^(father|mother|spouse|child|sibling|grandparent|other)$")
    age: int = Field(..., ge=0, le=150)
    blood_type: str = "O+"
    avatar: str = "👤"
    conditions: list[str] = Field(default_factory=list)
    medications: list[str] = Field(default_factory=list)


class FamilyMemberUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    relation: str | None = None
    age: int | None = Field(None, ge=0, le=150)
    blood_type: str | None = None
    avatar: str | None = None
    conditions: list[str] | None = None
    medications: list[str] | None = None


class FamilyMemberResponse(BaseModel):
    id: str
    user_id: str
    name: str
    relation: str
    age: int
    blood_type: str
    avatar: str
    conditions: list[str]
    medications: list[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class VaccinationCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    date: date
    person: str = "Self"
    family_member_id: str | None = None
    next_due: Optional[date] = None
    status: str = Field(default="completed", pattern="^(completed|pending)$")


class VaccinationResponse(BaseModel):
    id: str
    user_id: str
    family_member_id: str | None
    name: str
    date: date
    next_due: Optional[date]
    status: str
    person: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
