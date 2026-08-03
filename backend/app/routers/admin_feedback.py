"""
Admin API for User Feedback
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.feedback import UserFeedback
from app.models.user import User

router = APIRouter(prefix="/admin", tags=["admin-feedback"])

@router.get("/feedback")
async def get_feedback(db: AsyncSession = Depends(get_db)):
    query = select(UserFeedback).options(
        selectinload(UserFeedback.user).selectinload(User.profile)
    ).order_by(UserFeedback.created_at.desc())
    result = await db.execute(query)
    records = result.scalars().all()
    
    formatted = []
    for r in records:
        formatted.append({
            "id": r.id,
            "created_at": r.created_at,
            "type": r.type,
            "message": r.message,
            "status": r.status,
            "admin_reply": r.admin_reply,
            "assigned_to": r.assigned_to,
            "user_name": r.user.profile.name if (r.user and r.user.profile) else "Anonymous",
            "user_email": r.user.email if r.user else "Anonymous"
        })
    return formatted

@router.put("/feedback/{feedback_id}")
async def update_feedback(feedback_id: str, data: dict, db: AsyncSession = Depends(get_db)):
    query = select(UserFeedback).where(UserFeedback.id == feedback_id)
    result = await db.execute(query)
    feedback = result.scalars().first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
        
    for key, value in data.items():
        if hasattr(feedback, key) and key not in ["id", "created_at", "updated_at", "user_id"]:
            setattr(feedback, key, value)
            
    await db.commit()
    await db.refresh(feedback)
    return {"status": "success", "message": "Feedback updated"}

@router.delete("/feedback/{feedback_id}")
async def delete_feedback(feedback_id: str, db: AsyncSession = Depends(get_db)):
    query = select(UserFeedback).where(UserFeedback.id == feedback_id)
    result = await db.execute(query)
    feedback = result.scalars().first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
        
    await db.delete(feedback)
    await db.commit()
    return {"status": "success", "message": "Feedback deleted"}
