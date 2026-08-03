from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.feedback import UserFeedback
from app.dependencies import CurrentUserId
from pydantic import BaseModel

router = APIRouter(prefix="/feedback", tags=["user-feedback"])

class FeedbackCreate(BaseModel):
    type: str
    message: str

@router.post("")
async def submit_feedback(data: FeedbackCreate, user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    feedback = UserFeedback(
        user_id=user_id,
        type=data.type,
        message=data.message,
        status="Open"
    )
    db.add(feedback)
    await db.commit()
    return {"status": "success", "message": "Feedback submitted successfully"}

@router.get("")
async def get_my_feedback(user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(UserFeedback)
        .where(UserFeedback.user_id == user_id)
        .order_by(UserFeedback.created_at.desc())
    )
    feedbacks = result.scalars().all()
    return feedbacks
