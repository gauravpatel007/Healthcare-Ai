"""
LifeOS Backend — AI Mental Health Router
Mood tracking, journal analysis, stress, screening, meditations.
"""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import CurrentUserId
from app.models.mood import JournalEntry, MoodEntry
from app.schemas.chat import MeditationResponse
from app.schemas.mood import (
    JournalCreate, JournalResponse, MoodAnalysis, MoodCreate, MoodResponse,
    ScreeningRequest, ScreeningResponse,
)
from app.services.ai_service import generate_ai_response

router = APIRouter(prefix="/ai/mental", tags=["AI Mental Health"])

MEDITATIONS = [
    MeditationResponse(name="Deep Breathing", duration="5 min", icon="🌬️", description="Inhale 4s, hold 7s, exhale 8s"),
    MeditationResponse(name="Body Scan", duration="10 min", icon="🧘", description="Progressive muscle relaxation"),
    MeditationResponse(name="Mindful Walking", duration="15 min", icon="🚶", description="Focus on each step and breath"),
    MeditationResponse(name="Gratitude Meditation", duration="5 min", icon="🙏", description="Reflect on 3 things you're grateful for"),
    MeditationResponse(name="Loving Kindness", duration="10 min", icon="💗", description="Send love to yourself and others"),
    MeditationResponse(name="Sleep Meditation", duration="15 min", icon="🌙", description="Guided relaxation for sleep"),
]

MOOD_SCORES = {"😄": 5, "🙂": 4, "😐": 3, "😔": 2, "😢": 1, "😡": 1, "😰": 2}
STRESS_SCORES = {"😄": 10, "🙂": 25, "😐": 40, "😔": 65, "😢": 80, "😡": 85, "😰": 90}


@router.post("/mood", response_model=MoodResponse, status_code=201)
async def log_mood(data: MoodCreate, user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Log a mood entry."""
    entry = MoodEntry(user_id=user_id, mood=data.mood, note=data.note)
    db.add(entry)
    await db.flush()
    return entry


@router.get("/mood/history", response_model=list[MoodResponse])
async def mood_history(user_id: CurrentUserId, days: int = 7, db: AsyncSession = Depends(get_db)):
    """Get recent mood entries."""
    result = await db.execute(
        select(MoodEntry).where(MoodEntry.user_id == user_id)
        .order_by(MoodEntry.created_at.desc()).limit(days)
    )
    entries = result.scalars().all()
    return list(reversed(entries))


@router.get("/mood/analysis", response_model=MoodAnalysis)
async def mood_analysis(user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Get AI mood analysis based on recent mood entries."""
    result = await db.execute(
        select(MoodEntry).where(MoodEntry.user_id == user_id)
        .order_by(MoodEntry.created_at.desc()).limit(7)
    )
    moods = result.scalars().all()

    if not moods:
        return MoodAnalysis(
            average_score=0, trend="neutral",
            analysis="Start tracking your mood daily to get personalized insights!",
            stress_level=30,
        )

    scores = [MOOD_SCORES.get(m.mood, 3) for m in moods]
    stress_vals = [STRESS_SCORES.get(m.mood, 40) for m in moods]
    avg = sum(scores) / len(scores)
    stress = round(sum(stress_vals) / len(stress_vals))

    if avg >= 4:
        analysis = "Your mood has been consistently positive! Keep maintaining your healthy habits and social connections. 🌟"
        trend = "positive"
    elif avg >= 3:
        analysis = "Your mood has been average this week. Try incorporating more activities you enjoy, exercise, and social interaction. 💪"
        trend = "neutral"
    elif avg >= 2:
        analysis = "Your mood seems low lately. Consider talking to someone you trust, getting more sunlight and exercise. Professional support can help. 💙"
        trend = "declining"
    else:
        analysis = "You've been feeling down consistently. Please consider reaching out to a mental health professional. You're not alone. ❤️ Helpline: 9152987821 (iCall)"
        trend = "concerning"

    return MoodAnalysis(
        average_score=round(avg, 1), trend=trend, analysis=analysis, stress_level=stress,
    )


@router.post("/journal", response_model=JournalResponse, status_code=201)
async def save_journal(data: JournalCreate, user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Save and analyze a journal entry."""
    # Simple sentiment analysis (matching frontend)
    positive = ["happy", "good", "great", "love", "amazing", "wonderful", "grateful", "excited", "peaceful", "relaxed", "hopeful"]
    negative = ["sad", "angry", "stressed", "worried", "anxious", "tired", "frustrated", "lonely", "depressed", "overwhelmed", "scared"]

    words = data.content.lower().split()
    pos_count = sum(1 for w in words if any(p in w for p in positive))
    neg_count = sum(1 for w in words if any(n in w for n in negative))

    if pos_count > neg_count:
        sentiment = "Positive"
    elif neg_count > pos_count:
        sentiment = "Needs Attention"
    else:
        sentiment = "Neutral"

    # Try Groq for deeper analysis
    ai_analysis = await generate_ai_response(
        "mental",
        f"Analyze this journal entry for emotional patterns and provide supportive feedback:\n\n{data.content}",
    )

    entry = JournalEntry(
        user_id=user_id, content=data.content, sentiment=sentiment, ai_analysis=ai_analysis,
    )
    db.add(entry)

    # Also log as mood entry
    mood_entry = MoodEntry(user_id=user_id, mood="📝", note=data.content[:200])
    db.add(mood_entry)

    await db.flush()
    return entry


@router.get("/stress")
async def stress_assessment(user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Get current stress level assessment."""
    result = await db.execute(
        select(MoodEntry).where(MoodEntry.user_id == user_id)
        .order_by(MoodEntry.created_at.desc()).limit(7)
    )
    moods = result.scalars().all()

    if not moods:
        return {"stress_level": 30, "label": "Low", "advice": "Start tracking your mood for better insights."}

    stress_vals = [STRESS_SCORES.get(m.mood, 40) for m in moods]
    stress = round(sum(stress_vals) / len(stress_vals))

    if stress > 70:
        label, advice = "High", "⚠️ High stress detected. Consider relaxation techniques."
    elif stress > 40:
        label, advice = "Moderate", "😐 Moderate stress. Take breaks regularly."
    else:
        label, advice = "Low", "✅ Low stress. Keep it up!"

    return {"stress_level": stress, "label": label, "advice": advice}


@router.post("/screening", response_model=ScreeningResponse)
async def mental_screening(data: ScreeningRequest, user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Evaluate mental health screening questionnaire and save results."""
    total = sum(data.answers)
    max_score = len(data.answers) * 3
    pct = round((total / max_score) * 100)

    if pct <= 25:
        result, advice = "Low Risk", "Your mental health appears stable. Continue maintaining healthy habits!"
    elif pct <= 50:
        result, advice = "Mild Concern", "You may be experiencing mild stress. Try regular exercise, meditation, and adequate sleep."
    elif pct <= 75:
        result, advice = "Moderate Concern", "Consider speaking with a counselor or therapist. Your mental health matters."
    else:
        result, advice = "Seek Support", "Please reach out to a mental health professional. You deserve support. Helpline: 9152987821 (iCall)."

    # Save the screening result as a special MoodEntry so it appears in mental health history
    screening_entry = MoodEntry(
        user_id=user_id, 
        mood="🧠", 
        note=f"Mental Health Screening: {result} ({pct}%). {advice}"
    )
    db.add(screening_entry)
    await db.flush()

    return ScreeningResponse(
        score=total, max_score=max_score, percentage=pct, result=result, advice=advice,
    )


@router.get("/meditations", response_model=list[MeditationResponse])
async def meditations():
    """Get meditation suggestions."""
    return MEDITATIONS
