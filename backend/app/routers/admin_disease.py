"""
Admin API for Disease & Symptom Database Management
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.disease import DiseaseLibrary, SymptomLibrary, SymptomCheckHistory
from app.models.user import User
from sqlalchemy.orm import selectinload

router = APIRouter(prefix="/admin", tags=["admin-diseases"])

# --- DISEASES ---

@router.get("/diseases")
async def get_diseases(db: AsyncSession = Depends(get_db)):
    query = select(DiseaseLibrary).order_by(DiseaseLibrary.name.asc())
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/diseases", status_code=status.HTTP_201_CREATED)
async def create_disease(data: dict, db: AsyncSession = Depends(get_db)):
    disease = DiseaseLibrary(
        name=data.get("name"),
        symptoms=data.get("symptoms", []),
        causes=data.get("causes", []),
        treatment=data.get("treatment"),
        severity=data.get("severity"),
        emergency_level=data.get("emergency_level"),
        risk_factors=data.get("risk_factors", []),
        home_remedies=data.get("home_remedies", []),
        doctor_recommendation=data.get("doctor_recommendation"),
        related_diseases=data.get("related_diseases", [])
    )
    db.add(disease)
    await db.commit()
    await db.refresh(disease)
    return disease

@router.put("/diseases/{disease_id}")
async def update_disease(disease_id: str, data: dict, db: AsyncSession = Depends(get_db)):
    query = select(DiseaseLibrary).where(DiseaseLibrary.id == disease_id)
    result = await db.execute(query)
    disease = result.scalars().first()
    
    if not disease:
        raise HTTPException(status_code=404, detail="Disease not found")
        
    for key, value in data.items():
        if hasattr(disease, key) and key not in ["id", "created_at", "updated_at"]:
            setattr(disease, key, value)
            
    await db.commit()
    await db.refresh(disease)
    return disease

@router.delete("/diseases/{disease_id}")
async def delete_disease(disease_id: str, db: AsyncSession = Depends(get_db)):
    query = select(DiseaseLibrary).where(DiseaseLibrary.id == disease_id)
    result = await db.execute(query)
    disease = result.scalars().first()
    
    if not disease:
        raise HTTPException(status_code=404, detail="Disease not found")
        
    await db.delete(disease)
    await db.commit()
    return {"status": "success", "message": "Disease deleted"}


# --- SYMPTOMS ---

@router.get("/symptoms")
async def get_symptoms(db: AsyncSession = Depends(get_db)):
    query = select(SymptomLibrary).order_by(SymptomLibrary.name.asc())
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/symptoms", status_code=status.HTTP_201_CREATED)
async def create_symptom(data: dict, db: AsyncSession = Depends(get_db)):
    symptom = SymptomLibrary(
        name=data.get("name"),
        categories=data.get("categories", []),
        severity_levels=data.get("severity_levels"),
        body_parts=data.get("body_parts", []),
        emergency_flags=data.get("emergency_flags", False),
        medical_suggestions=data.get("medical_suggestions")
    )
    db.add(symptom)
    await db.commit()
    await db.refresh(symptom)
    return symptom

@router.put("/symptoms/{symptom_id}")
async def update_symptom(symptom_id: str, data: dict, db: AsyncSession = Depends(get_db)):
    query = select(SymptomLibrary).where(SymptomLibrary.id == symptom_id)
    result = await db.execute(query)
    symptom = result.scalars().first()
    
    if not symptom:
        raise HTTPException(status_code=404, detail="Symptom not found")
        
    for key, value in data.items():
        if hasattr(symptom, key) and key not in ["id", "created_at", "updated_at"]:
            setattr(symptom, key, value)
            
    await db.commit()
    await db.refresh(symptom)
    return symptom

@router.delete("/symptoms/{symptom_id}")
async def delete_symptom(symptom_id: str, db: AsyncSession = Depends(get_db)):
    query = select(SymptomLibrary).where(SymptomLibrary.id == symptom_id)
    result = await db.execute(query)
    symptom = result.scalars().first()
    
    if not symptom:
        raise HTTPException(status_code=404, detail="Symptom not found")
        
    await db.delete(symptom)
    await db.commit()
    return {"status": "success", "message": "Symptom deleted"}

# --- SYMPTOM CHECK HISTORY ---

@router.get("/symptoms/history")
async def get_symptom_history(db: AsyncSession = Depends(get_db)):
    query = select(SymptomCheckHistory).options(
        selectinload(SymptomCheckHistory.user).selectinload(User.profile)
    ).order_by(SymptomCheckHistory.created_at.desc())
    result = await db.execute(query)
    records = result.scalars().all()
    
    # Format with user info
    history = []
    for r in records:
        history.append({
            "id": r.id,
            "created_at": r.created_at,
            "user_name": r.user.profile.name if (r.user and r.user.profile) else "Unknown",
            "user_email": r.user.email if r.user else "Unknown",
            "symptoms": r.symptoms,
            "duration": r.duration,
            "severity": r.severity,
            "age_group": r.age_group,
            "predicted_conditions": r.predicted_conditions,
            "urgency": r.urgency
        })
    return history
