"""
Admin API for User Medicine Management
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.medicine import Medicine, MedicineLibrary
from app.models.user import User, UserProfile

router = APIRouter(prefix="/admin/medicines", tags=["admin-medicines"])


@router.get("")
async def get_medicines(
    db: AsyncSession = Depends(get_db)
):
    """Get all user active medications across the platform."""
    query = (
        select(Medicine, User, UserProfile)
        .join(User, Medicine.user_id == User.id)
        .outerjoin(UserProfile, User.id == UserProfile.user_id)
        .order_by(Medicine.created_at.desc())
    )
    result = await db.execute(query)
    
    records = []
    for med, u, p in result.all():
        d = {col.key: getattr(med, col.key) for col in med.__table__.columns}
        d['start_date'] = str(d['start_date']) if d['start_date'] else None
        d['end_date'] = str(d['end_date']) if d['end_date'] else None
        d['created_at'] = str(d['created_at'])
        d['user_name'] = p.name if p and p.name else (u.name if hasattr(u, 'name') and u.name else u.email.split('@')[0])
        d['user_email'] = u.email
        records.append(d)
    return records


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_medicine(
    data: dict,
    db: AsyncSession = Depends(get_db)
):
    """Add a new medication for a user."""
    user_id = data.get("user_id")
    if not user_id:
        user_res = await db.execute(select(User).order_by(User.created_at.asc()))
        first_user = user_res.scalars().first()
        if not first_user:
            raise HTTPException(status_code=400, detail="No user found to associate medicine with")
        user_id = first_user.id
        
    med = Medicine(
        user_id=user_id,
        name=data.get("name", ""),
        dosage=data.get("dosage", ""),
        type=data.get("type", "tablet"),
        frequency=data.get("frequency", "once_daily"),
        purpose=data.get("purpose", ""),
        total_pills=int(data.get("total_pills", 30)),
        remaining=int(data.get("remaining", 30)),
        is_active=bool(data.get("is_active", True))
    )
    db.add(med)
    
    # Sync with MedicineLibrary if not present
    from sqlalchemy import func
    lib_query = select(MedicineLibrary).where(func.lower(MedicineLibrary.name) == med.name.lower())
    lib_result = await db.execute(lib_query)
    if not lib_result.scalar_one_or_none():
        db.add(MedicineLibrary(name=med.name))
        
    await db.commit()
    await db.refresh(med)
    
    # Fetch user details
    u_res = await db.execute(
        select(User, UserProfile)
        .outerjoin(UserProfile, User.id == UserProfile.user_id)
        .where(User.id == user_id)
    )
    u_row = u_res.first()
    u = u_row[0] if u_row else None
    p = u_row[1] if u_row else None
    
    d = {col.key: getattr(med, col.key) for col in med.__table__.columns}
    d['start_date'] = str(d['start_date']) if d['start_date'] else None
    d['end_date'] = str(d['end_date']) if d['end_date'] else None
    d['created_at'] = str(d['created_at'])
    d['user_name'] = p.name if p and p.name else (u.name if u and hasattr(u, 'name') and u.name else (u.email.split('@')[0] if u else "User"))
    d['user_email'] = u.email if u else ""
    return d


@router.put("/{medicine_id}")
async def update_medicine(
    medicine_id: str,
    data: dict,
    db: AsyncSession = Depends(get_db)
):
    """Update a medication record."""
    query = select(Medicine).where(Medicine.id == medicine_id)
    result = await db.execute(query)
    med = result.scalars().first()
    
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found")
        
    for key in ["name", "dosage", "type", "frequency", "purpose", "total_pills", "remaining", "is_active"]:
        if key in data:
            val = data[key]
            if key in ["total_pills", "remaining"]:
                val = int(val)
            elif key == "is_active":
                val = bool(val)
            setattr(med, key, val)
            
    await db.commit()
    await db.refresh(med)
    
    # Fetch user details
    u_res = await db.execute(
        select(User, UserProfile)
        .outerjoin(UserProfile, User.id == UserProfile.user_id)
        .where(User.id == med.user_id)
    )
    u_row = u_res.first()
    u = u_row[0] if u_row else None
    p = u_row[1] if u_row else None
    
    d = {col.key: getattr(med, col.key) for col in med.__table__.columns}
    d['start_date'] = str(d['start_date']) if d['start_date'] else None
    d['end_date'] = str(d['end_date']) if d['end_date'] else None
    d['created_at'] = str(d['created_at'])
    d['user_name'] = p.name if p and p.name else (u.name if u and hasattr(u, 'name') and u.name else (u.email.split('@')[0] if u else "User"))
    d['user_email'] = u.email if u else ""
    return d


@router.delete("/{medicine_id}")
async def delete_medicine(
    medicine_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Delete a medication record directly from DB."""
    query = select(Medicine).where(Medicine.id == medicine_id)
    result = await db.execute(query)
    med = result.scalars().first()
    
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found")
        
    await db.delete(med)
    await db.commit()
    return {"status": "success", "message": "Medicine deleted"}
