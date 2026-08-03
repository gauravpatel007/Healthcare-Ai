from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.notification import SystemNotification
from app.dependencies import CurrentUserId

router = APIRouter(prefix="/notifications", tags=["user-notifications"])

@router.get("")
async def get_my_notifications(user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    # Very simple logic: Show 'Everyone' notifications and specific user ones if added later.
    # We will just filter by 'Everyone' for now to keep it simple, or based on user role.
    query = select(SystemNotification).where(
        SystemNotification.status == "Sent",
        SystemNotification.target_audience.in_(["Everyone", "Premium", "Selected Users", user_id]) 
    ).order_by(SystemNotification.created_at.desc())
    
    result = await db.execute(query)
    notifications = result.scalars().all()
    
    return notifications
