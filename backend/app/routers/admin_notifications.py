"""
Admin API for Notifications
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.notification import SystemNotification
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/admin", tags=["admin-notifications"])

class NotificationCreate(BaseModel):
    type: str
    target_audience: str
    title: str
    message: str
    scheduled_for: Optional[datetime] = None

@router.get("/notifications")
async def get_notifications(db: AsyncSession = Depends(get_db)):
    query = select(SystemNotification).order_by(SystemNotification.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/notifications", status_code=status.HTTP_201_CREATED)
async def create_notification(data: NotificationCreate, db: AsyncSession = Depends(get_db)):
    notif = SystemNotification(**data.model_dump())
    if not notif.scheduled_for:
        notif.status = "Sent" # Send immediately
    db.add(notif)
    await db.commit()
    await db.refresh(notif)
    return notif

@router.delete("/notifications/{notif_id}")
async def delete_notification(notif_id: str, db: AsyncSession = Depends(get_db)):
    query = select(SystemNotification).where(SystemNotification.id == notif_id)
    result = await db.execute(query)
    notif = result.scalars().first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    await db.delete(notif)
    await db.commit()
    return {"status": "success", "message": "Notification deleted"}
