"""
LifeOS Backend — Dashboard Router
Aggregated health dashboard data.
"""

from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import CurrentUserId
from app.models.appointment import Appointment
from app.models.family import FamilyMember
from app.models.health_tracker import WaterIntake
from app.models.medical_record import MedicalRecord
from app.models.medicine import Medicine
from app.models.user import UserProfile
from app.schemas.dashboard import DashboardSummary
from app.utils.helpers import calculate_bmi, calculate_health_score, get_bmi_category

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummary)
async def get_dashboard_summary(user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Get aggregated dashboard data."""
    # Profile
    profile_r = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = profile_r.scalar_one_or_none()
    name = profile.name if profile else "User"
    bmi = calculate_bmi(profile.weight, profile.height) if profile else 0
    blood_type = profile.blood_type if profile else "O+"

    # Medicines
    meds_r = await db.execute(
        select(Medicine).where(Medicine.user_id == user_id, Medicine.is_active == True)
    )
    meds = meds_r.scalars().all()

    # Appointments
    apts_r = await db.execute(
        select(Appointment).where(
            Appointment.user_id == user_id,
            Appointment.status == "upcoming",
            Appointment.date >= date.today(),
        ).order_by(Appointment.date)
    )
    apts = apts_r.scalars().all()

    # Water
    water_r = await db.execute(
        select(WaterIntake).where(
            WaterIntake.user_id == user_id, WaterIntake.date == date.today()
        )
    )
    water_entry = water_r.scalar_one_or_none()
    water = water_entry.glasses if water_entry else 0

    # Records count
    records_r = await db.execute(
        select(func.count(MedicalRecord.id)).where(MedicalRecord.user_id == user_id)
    )
    records_count = records_r.scalar() or 0

    # Family
    family_r = await db.execute(select(FamilyMember).where(FamilyMember.user_id == user_id))
    family = family_r.scalars().all()

    # Health score
    health_score = calculate_health_score(bmi, water, len(meds), len(apts))

    # Build reminders from medicines
    reminders = [
        {"name": m.name, "dosage": m.dosage, "frequency": m.frequency, "time": m.times[0] if m.times else "Flexible"}
        for m in meds[:4]
    ]

    # Build upcoming
    upcoming = [
        {"doctor": a.doctor, "specialty": a.specialty, "hospital": a.hospital,
         "date": str(a.date), "time": str(a.time)}
        for a in apts[:3]
    ]

    # Family summary
    family_summary = [
        {"name": f.name, "avatar": f.avatar, "conditions": f.conditions or []}
        for f in family[:3]
    ]

    return DashboardSummary(
        health_score=health_score,
        active_medicines=len(meds),
        upcoming_appointments=len(apts),
        water_intake=water,
        medical_records=records_count,
        bmi=bmi,
        bmi_category=get_bmi_category(bmi),
        blood_type=blood_type,
        user_name=name,
        reminders=reminders,
        upcoming=upcoming,
        family_summary=family_summary,
    )
