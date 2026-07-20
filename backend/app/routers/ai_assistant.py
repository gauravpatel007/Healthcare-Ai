"""
LifeOS Backend — AI Chat Doctor Router
"""

from fastapi import APIRouter, Depends
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import CurrentUserId
from app.models.chat import ChatMessage
from app.models.user import UserProfile
from app.schemas.chat import ChatMessageCreate, ChatMessageResponse, ChatResponse
from app.services.ai_service import generate_ai_response

router = APIRouter(prefix="/ai/chat", tags=["AI Assistant"])

HEALTH_TIPS = [
    {"icon": "💧", "tip": "Drink at least 8 glasses of water daily to stay hydrated."},
    {"icon": "🏃", "tip": "Aim for 30 minutes of moderate exercise at least 5 days a week."},
    {"icon": "😴", "tip": "Adults need 7-9 hours of quality sleep each night."},
    {"icon": "🥗", "tip": "Fill half your plate with fruits and vegetables at every meal."},
    {"icon": "🧘", "tip": "Practice 10 minutes of mindfulness daily to reduce stress."},
    {"icon": "🦷", "tip": "Brush twice daily and floss once. Visit dentist every 6 months."},
    {"icon": "👁️", "tip": "Follow the 20-20-20 rule: every 20 min, look 20 feet away for 20 sec."},
    {"icon": "🩺", "tip": "Get an annual health checkup even if you feel perfectly fine."},
]


from datetime import datetime, timezone

@router.post("", response_model=ChatResponse)
async def chat(data: ChatMessageCreate, user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Send a message to the AI health assistant."""
    # Save user message with explicit timestamp
    user_msg = ChatMessage(
        user_id=user_id, role="user", content=data.message, 
        module="assistant", created_at=datetime.now(timezone.utc)
    )
    db.add(user_msg)
    await db.flush()

    # Get user context
    profile_r = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = profile_r.scalar_one_or_none()
    context = ""
    if profile:
        context = f"Patient: {profile.name}, Age: {profile.age}, Gender: {profile.gender}, Blood Type: {profile.blood_type}, Conditions: {', '.join(profile.conditions) if profile.conditions else 'None'}, Allergies: {', '.join(profile.allergies) if profile.allergies else 'None'}"

    # Generate AI response
    response = await generate_ai_response("assistant", data.message, context=context)

    # Save assistant message with explicit timestamp
    assistant_msg = ChatMessage(
        user_id=user_id, role="assistant", content=response, 
        module="assistant", created_at=datetime.now(timezone.utc)
    )
    db.add(assistant_msg)
    await db.flush()
    # The session will auto-commit via get_db()


    return ChatResponse(response=response)

@router.post("/public")
async def public_chat(data: ChatMessageCreate):
    """Public endpoint for landing page demo chat."""
    context = "This is a prospective user on the LifeOS landing page. Be highly welcoming, explain features briefly, and encourage them to sign up. Do not provide specific medical advice without a disclaimer."
    
    # Generate AI response
    response = await generate_ai_response("assistant", data.message, context=context)
    
    return {"response": response}


@router.get("/history", response_model=list[ChatMessageResponse])
async def chat_history(user_id: CurrentUserId, limit: int = 50, db: AsyncSession = Depends(get_db)):
    """Get chat history."""
    result = await db.execute(
        select(ChatMessage).where(
            ChatMessage.user_id == user_id, ChatMessage.module == "assistant"
        ).order_by(ChatMessage.created_at.desc()).limit(limit)
    )
    messages = result.scalars().all()
    return list(reversed(messages))


@router.delete("/history")
async def clear_history(user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Clear chat history."""
    result = await db.execute(
        select(ChatMessage).where(
            ChatMessage.user_id == user_id, ChatMessage.module == "assistant"
        )
    )
    messages = result.scalars().all()
    for msg in messages:
        await db.delete(msg)
    # The session will auto-commit via get_db()
    return {"success": True, "message": "Chat history cleared", "deleted_count": len(messages)}


@router.get("/tips")
async def health_tips():
    """Get daily health tips."""
    return {"tips": HEALTH_TIPS}
