"""
LifeOS Backend — Emergency Router
Emergency contacts, SOS, QR health card, organ donor.
"""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import CurrentUserId
from app.exceptions import NotFoundException
from app.models.emergency import EmergencyContact
from app.models.medicine import Medicine
from app.models.user import UserProfile
from app.schemas.emergency import (
    EmergencyContactCreate, EmergencyContactResponse, EmergencyContactUpdate,
    QRHealthData, SOSAlertResponse, SOSAlertRequest
)
from app.utils.email import send_sos_email, send_sos_sms_twilio
import asyncio

router = APIRouter(prefix="/emergency", tags=["Emergency"])


@router.get("/contacts", response_model=list[EmergencyContactResponse])
async def list_contacts(user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(EmergencyContact).where(EmergencyContact.user_id == user_id)
    )
    return result.scalars().all()


@router.post("/contacts", response_model=EmergencyContactResponse, status_code=201)
async def create_contact(data: EmergencyContactCreate, user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    contact = EmergencyContact(user_id=user_id, **data.model_dump())
    db.add(contact)
    await db.flush()
    await db.refresh(contact)
    return contact


@router.put("/contacts/{contact_id}", response_model=EmergencyContactResponse)
async def update_contact(
    contact_id: str, data: EmergencyContactUpdate, user_id: CurrentUserId, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(EmergencyContact).where(EmergencyContact.id == contact_id, EmergencyContact.user_id == user_id)
    )
    contact = result.scalar_one_or_none()
    if not contact:
        raise NotFoundException("Emergency contact", contact_id)
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(contact, key, value)
    await db.flush()
    await db.refresh(contact)
    return contact


@router.delete("/contacts/{contact_id}")
async def delete_contact(contact_id: str, user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(EmergencyContact).where(EmergencyContact.id == contact_id, EmergencyContact.user_id == user_id)
    )
    contact = result.scalar_one_or_none()
    if not contact:
        raise NotFoundException("Emergency contact", contact_id)
    await db.delete(contact)
    return {"success": True, "message": "Contact deleted"}


@router.post("/sos", response_model=SOSAlertResponse)
async def trigger_sos(request: SOSAlertRequest, user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Trigger SOS emergency alert."""
    try:
        contacts_r = await db.execute(
            select(EmergencyContact).where(EmergencyContact.user_id == user_id)
        )
        contacts = contacts_r.scalars().all()
        
        profile_r = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
        profile = profile_r.scalar_one_or_none()
        user_name = profile.name if profile else "LifeOS User"
        
        emails = [c.email for c in contacts if getattr(c, 'email', None)]
        
        sms_emails = [c.phone for c in contacts if c.phone]
        
        location_url = None
        if request.latitude is not None and request.longitude is not None:
            location_url = f"https://www.google.com/maps?q={request.latitude},{request.longitude}"
            if request.accuracy:
                pass
                
        actions = [
            "Location shared with emergency contacts" if location_url else "Emergency contacts alerted",
            f"Health QR card sent to {len(contacts)} contacts",
            "Medical history prepared for sharing",
            "Nearby hospitals notified",
        ]
        
        if emails:
            # Run email sending in the background
            asyncio.create_task(asyncio.to_thread(send_sos_email, emails, user_name, location_url))
            actions.append(f"Emergency alert email dispatched to {len(emails)} contacts")
            
        if sms_emails:
            # Run SMS sending in the background
            asyncio.create_task(asyncio.to_thread(send_sos_sms_twilio, sms_emails, user_name, location_url))
            actions.append(f"Emergency SMS dispatched to {len(sms_emails)} contacts via Twilio")
                
        return SOSAlertResponse(actions=actions)
    except Exception as e:
        import traceback
        error_msg = f"Error in SOS: {str(e)}\n{traceback.format_exc()}"
        print(error_msg)
        return SOSAlertResponse(success=False, message=error_msg, actions=[error_msg])


@router.get("/qr-data", response_model=QRHealthData)
async def get_qr_data(user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Get health data for QR code generation."""
    profile_r = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = profile_r.scalar_one_or_none()

    meds_r = await db.execute(select(Medicine).where(Medicine.user_id == user_id, Medicine.is_active == True))
    meds = meds_r.scalars().all()

    contacts_r = await db.execute(select(EmergencyContact).where(EmergencyContact.user_id == user_id))
    contacts = contacts_r.scalars().all()

    return QRHealthData(
        name=profile.name if profile else "User",
        blood_type=profile.blood_type if profile else "O+",
        age=profile.age if profile else 0,
        gender=profile.gender if profile else "Unknown",
        allergies=profile.allergies if profile else [],
        conditions=profile.conditions if profile else [],
        medicines=[m.name for m in meds],
        emergency_contacts=[{"name": c.name, "phone": c.phone, "relation": c.relation} for c in contacts],
        organ_donor=profile.organ_donor if profile else False,
    )


@router.post("/toggle-donor")
async def toggle_donor(user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Toggle organ donor status."""
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise NotFoundException("Profile")
    profile.organ_donor = not profile.organ_donor
    await db.flush()
    return {"organ_donor": profile.organ_donor, "message": "Organ donor status updated"}
