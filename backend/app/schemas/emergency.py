"""
LifeOS Backend — Emergency Schemas
"""

from datetime import datetime
from pydantic import BaseModel, Field


class EmergencyContactCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    phone: str = Field(..., min_length=1, max_length=20)
    email: str | None = None
    carrier: str | None = None
    relation: str = ""
    is_primary: bool = False


class EmergencyContactUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    phone: str | None = None
    email: str | None = None
    carrier: str | None = None
    relation: str | None = None
    is_primary: bool | None = None


class EmergencyContactResponse(BaseModel):
    id: str
    user_id: str
    name: str
    phone: str
    email: str | None
    carrier: str | None
    relation: str
    is_primary: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SOSAlertRequest(BaseModel):
    latitude: float | None = None
    longitude: float | None = None
    accuracy: float | None = None


class SOSAlertResponse(BaseModel):
    success: bool = True
    message: str = "SOS Emergency Alert Activated"
    actions: list[str] = [
        "Location shared with emergency contacts",
        "Health QR card sent to contacts",
        "Medical history prepared for sharing",
        "Nearby hospitals notified",
    ]
    emergency_number: str = "112"


class QRHealthData(BaseModel):
    name: str
    blood_type: str
    age: int
    gender: str
    allergies: list[str]
    conditions: list[str]
    medicines: list[str]
    emergency_contacts: list[dict]
    organ_donor: bool = False
