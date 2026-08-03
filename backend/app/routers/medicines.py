"""
LifeOS Backend — Medicines Router
CRUD + drug interactions + refill predictions.
"""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import CurrentUserId
from app.exceptions import NotFoundException
from app.models.medicine import Medicine, MedicineLibrary, MedicineLog
from app.schemas.medicine import (
    InteractionCheckResponse, InteractionWarning, MedicineCreate,
    MedicineResponse, MedicineUpdate, RefillPrediction,
    MedicineLogCreate, MedicineLogResponse
)
from app.utils.helpers import predict_refill_days
from datetime import date

router = APIRouter(prefix="/medicines", tags=["Medicines"])

# Known drug interactions database
INTERACTIONS = {
    "Aspirin": ["Ibuprofen", "Warfarin", "Naproxen"],
    "Warfarin": ["Aspirin", "Ibuprofen", "Vitamin K"],
    "Metformin": ["Alcohol", "Contrast dye"],
    "Lisinopril": ["Potassium supplements", "Spironolactone"],
    "Amoxicillin": ["Methotrexate", "Warfarin"],
    "Omeprazole": ["Clopidogrel", "Methotrexate"],
    "Cetirizine": ["Alcohol", "Sedatives"],
    "Montelukast": [],
    "Vitamin D3": ["Thiazide diuretics"],
}


@router.get("", response_model=list[MedicineResponse])
async def list_medicines(user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """List all medicines for the user."""
    result = await db.execute(
        select(Medicine).where(Medicine.user_id == user_id).order_by(Medicine.created_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=MedicineResponse, status_code=201)
async def create_medicine(data: MedicineCreate, user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Add a new medicine."""
    med = Medicine(user_id=user_id, **data.model_dump())
    db.add(med)
    
    # Check if this medicine exists in the global library, add if it doesn't
    from sqlalchemy import func
    lib_query = select(MedicineLibrary).where(func.lower(MedicineLibrary.name) == med.name.lower())
    lib_result = await db.execute(lib_query)
    existing_lib_med = lib_result.scalar_one_or_none()
    
    if not existing_lib_med:
        new_lib_med = MedicineLibrary(name=med.name)
        db.add(new_lib_med)
    
    await db.flush()
    await db.refresh(med)
    await db.commit()
    return med


@router.put("/{medicine_id}", response_model=MedicineResponse)
async def update_medicine(
    medicine_id: str, data: MedicineUpdate, user_id: CurrentUserId, db: AsyncSession = Depends(get_db)
):
    """Update a medicine."""
    result = await db.execute(
        select(Medicine).where(Medicine.id == medicine_id, Medicine.user_id == user_id)
    )
    med = result.scalar_one_or_none()
    if not med:
        raise NotFoundException("Medicine", medicine_id)

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(med, key, value)
    await db.flush()
    await db.commit()
    return med


@router.delete("/{medicine_id}")
async def delete_medicine(medicine_id: str, user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Delete a medicine."""
    result = await db.execute(
        select(Medicine).where(Medicine.id == medicine_id, Medicine.user_id == user_id)
    )
    med = result.scalar_one_or_none()
    if not med:
        raise NotFoundException("Medicine", medicine_id)
    await db.delete(med)
    return {"success": True, "message": "Medicine removed"}


@router.get("/today-logs", response_model=list[MedicineLogResponse])
async def get_today_logs(user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Get all medicine logs for today."""
    today = date.today()
    result = await db.execute(
        select(MedicineLog).where(MedicineLog.user_id == user_id, MedicineLog.date == today)
    )
    return result.scalars().all()


@router.post("/log", response_model=MedicineLogResponse)
async def log_medicine(data: MedicineLogCreate, user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Log a medicine dose (create or update)."""
    result = await db.execute(
        select(MedicineLog).where(
            MedicineLog.user_id == user_id,
            MedicineLog.medicine_id == data.medicine_id,
            MedicineLog.date == data.date,
            MedicineLog.scheduled_time == data.scheduled_time
        )
    )
    existing_log = result.scalar_one_or_none()
    
    if existing_log:
        existing_log.status = data.status
        log_entry = existing_log
    else:
        log_entry = MedicineLog(
            user_id=user_id,
            medicine_id=data.medicine_id,
            date=data.date,
            scheduled_time=data.scheduled_time,
            status=data.status
        )
        db.add(log_entry)
        
    await db.commit()
    await db.refresh(log_entry)
    return log_entry


@router.get("/interactions", response_model=InteractionCheckResponse)
async def check_interactions(user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Check for drug interactions among user's active medicines using AI."""
    from app.services.ai_service import generate_ai_response
    
    result = await db.execute(
        select(Medicine).where(Medicine.user_id == user_id, Medicine.is_active == True)
    )
    meds = result.scalars().all()
    warnings = []

    if len(meds) > 1:
        med_names = [m.name for m in meds]
        prompt = (
            f"I am taking the following medications: {', '.join(med_names)}. "
            "Are there any known severe or moderate drug interactions between these? "
            "Please format the response strictly with bullet points starting with '* ' if there are interactions. "
            "If there are NO interactions, say exactly 'NO_INTERACTIONS'."
        )
        ai_response = await generate_ai_response("assistant", prompt, max_tokens=256)
        
        if "NO_INTERACTIONS" not in ai_response.upper():
            warnings.append(InteractionWarning(
                pair="Multiple Medications",
                medicine_1=med_names[0],
                medicine_2="Others",
                description=ai_response.strip()
            ))

    return InteractionCheckResponse(has_interactions=len(warnings) > 0, warnings=warnings)


@router.get("/refill-predictions", response_model=list[RefillPrediction])
async def refill_predictions(user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Predict refill dates for active medicines."""
    result = await db.execute(
        select(Medicine).where(
            Medicine.user_id == user_id, Medicine.is_active == True, Medicine.total_pills > 0
        )
    )
    meds = result.scalars().all()

    return [
        RefillPrediction(
            medicine_id=m.id,
            medicine_name=m.name,
            remaining=m.remaining,
            total_pills=m.total_pills,
            days_left=predict_refill_days(m.remaining, m.frequency),
            percentage=round((m.remaining / m.total_pills) * 100, 1) if m.total_pills > 0 else 100,
        )
        for m in meds
    ]
