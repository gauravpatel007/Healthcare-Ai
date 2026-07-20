"""
LifeOS Backend — User & Profile Schemas
"""

from pydantic import BaseModel, Field


class UserProfileResponse(BaseModel):
    id: str
    user_id: str
    name: str
    age: int
    gender: str
    blood_type: str
    height: float
    weight: float
    allergies: list[str] = []
    conditions: list[str] = []
    organ_donor: bool = False
    language: str = "en"
    avatar_url: str | None = None
    connected_devices: list[str] = []

    model_config = {"from_attributes": True}


class UserProfileUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    age: int | None = Field(None, ge=0, le=150)
    gender: str | None = None
    blood_type: str | None = None
    height: float | None = Field(None, gt=0)
    weight: float | None = Field(None, gt=0)
    allergies: list[str] | None = None
    conditions: list[str] | None = None
    organ_donor: bool | None = None
    language: str | None = Field(None, pattern="^(en|hi|gu)$")
    avatar_url: str | None = None


class SettingsUpdate(BaseModel):
    language: str | None = Field(None, pattern="^(en|hi|gu)$")
