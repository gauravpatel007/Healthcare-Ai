"""
LifeOS Backend — Challenges & Badges Router
"""

from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import CurrentUserId
from app.models.challenge import ChallengeProgress, UserBadge
from app.schemas.challenge import (
    BadgeResponse, ChallengeOverview, ChallengeProgressResponse, ChallengeProgressUpdate,
)

router = APIRouter(prefix="/challenges", tags=["Challenges"])

# Challenge definitions (matching frontend)
CHALLENGES = [
    {"id": "steps10k", "name": "Walk 10,000 Steps", "icon": "🚶", "target": 10000, "unit": "steps", "reward": "🏅 Step Master", "category": "Fitness"},
    {"id": "water8", "name": "Drink 8 Glasses Water", "icon": "💧", "target": 8, "unit": "glasses", "reward": "💎 Hydration Hero", "category": "Hydration"},
    {"id": "sleep8", "name": "Sleep 8 Hours", "icon": "😴", "target": 8, "unit": "hours", "reward": "🌙 Sleep Champion", "category": "Sleep"},
    {"id": "meditate", "name": "Meditate 10 Minutes", "icon": "🧘", "target": 10, "unit": "minutes", "reward": "🧘 Zen Master", "category": "Mental"},
    {"id": "fruits5", "name": "Eat 5 Servings Fruits/Veg", "icon": "🍎", "target": 5, "unit": "servings", "reward": "🥬 Nutrition Pro", "category": "Diet"},
    {"id": "nosugar", "name": "No Sugar Day", "icon": "🚫", "target": 1, "unit": "day", "reward": "💪 Sugar Free", "category": "Diet"},
    {"id": "stretch", "name": "Stretch for 15 Minutes", "icon": "🤸", "target": 15, "unit": "minutes", "reward": "🎯 Flexibility Star", "category": "Fitness"},
    {"id": "journal", "name": "Write in Journal", "icon": "📝", "target": 1, "unit": "entry", "reward": "✍️ Reflective Mind", "category": "Mental"},
]

BADGE_DEFS = [
    {"name": "7-Day Streak", "icon": "🔥", "description": "Complete any challenge for 7 days"},
    {"name": "30-Day Streak", "icon": "⭐", "description": "Complete any challenge for 30 days"},
    {"name": "Water Champion", "icon": "💎", "description": "Drink 8 glasses for 7 days"},
    {"name": "Step Master", "icon": "🏅", "description": "Walk 10,000 steps in a day"},
    {"name": "Sleep Expert", "icon": "🌙", "description": "Sleep 8+ hours for 7 days"},
    {"name": "Health Hero", "icon": "🦸", "description": "Complete all challenges in a day"},
    {"name": "Early Bird", "icon": "🐤", "description": "Wake up before 6 AM 7 times"},
    {"name": "Zen Master", "icon": "🧘", "description": "Meditate for 7 consecutive days"},
    {"name": "Nutrition Pro", "icon": "🥬", "description": "Log meals for 14 days"},
    {"name": "First Steps", "icon": "👶", "description": "Complete your first challenge"},
]


@router.get("", response_model=list[ChallengeProgressResponse])
async def list_challenges(user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """List all challenges with today's progress."""
    today = date.today()
    result = await db.execute(
        select(ChallengeProgress).where(
            ChallengeProgress.user_id == user_id, ChallengeProgress.date == today
        )
    )
    progress_map = {p.challenge_id: p for p in result.scalars().all()}

    challenges = []
    for c in CHALLENGES:
        p = progress_map.get(c["id"])
        progress = p.progress if p else 0
        pct = min(100, (progress / c["target"]) * 100)
        challenges.append(ChallengeProgressResponse(
            challenge_id=c["id"], name=c["name"], icon=c["icon"],
            target=c["target"], unit=c["unit"], progress=progress,
            percentage=round(pct, 1), completed=pct >= 100,
            reward=c["reward"], category=c["category"],
        ))
    return challenges


@router.post("/{challenge_id}/progress", response_model=ChallengeProgressResponse)
async def add_progress(
    challenge_id: str, data: ChallengeProgressUpdate,
    user_id: CurrentUserId, db: AsyncSession = Depends(get_db),
):
    """Add progress to a challenge."""
    cdef = next((c for c in CHALLENGES if c["id"] == challenge_id), None)
    if not cdef:
        from app.exceptions import NotFoundException
        raise NotFoundException("Challenge", challenge_id)

    today = date.today()
    result = await db.execute(
        select(ChallengeProgress).where(
            ChallengeProgress.user_id == user_id,
            ChallengeProgress.challenge_id == challenge_id,
            ChallengeProgress.date == today,
        )
    )
    entry = result.scalar_one_or_none()

    if entry:
        entry.progress = min(entry.progress + data.amount, cdef["target"] * 2)
        entry.completed = entry.progress >= cdef["target"]
    else:
        entry = ChallengeProgress(
            user_id=user_id, challenge_id=challenge_id, date=today,
            progress=data.amount, target=cdef["target"],
            completed=data.amount >= cdef["target"],
        )
        db.add(entry)

    # Award "First Steps" badge
    if entry.completed:
        badge_r = await db.execute(
            select(UserBadge).where(
                UserBadge.user_id == user_id, UserBadge.badge_name == "First Steps"
            )
        )
        if not badge_r.scalar_one_or_none():
            db.add(UserBadge(user_id=user_id, badge_name="First Steps"))

    await db.flush()

    pct = min(100, (entry.progress / cdef["target"]) * 100)
    return ChallengeProgressResponse(
        challenge_id=challenge_id, name=cdef["name"], icon=cdef["icon"],
        target=cdef["target"], unit=cdef["unit"], progress=entry.progress,
        percentage=round(pct, 1), completed=entry.completed,
        reward=cdef["reward"], category=cdef["category"],
    )


@router.post("/{challenge_id}/complete", response_model=ChallengeProgressResponse)
async def complete_challenge(challenge_id: str, user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Mark a challenge as complete."""
    cdef = next((c for c in CHALLENGES if c["id"] == challenge_id), None)
    if not cdef:
        from app.exceptions import NotFoundException
        raise NotFoundException("Challenge", challenge_id)

    today = date.today()
    result = await db.execute(
        select(ChallengeProgress).where(
            ChallengeProgress.user_id == user_id,
            ChallengeProgress.challenge_id == challenge_id,
            ChallengeProgress.date == today,
        )
    )
    entry = result.scalar_one_or_none()
    if entry:
        entry.progress = cdef["target"]
        entry.completed = True
    else:
        entry = ChallengeProgress(
            user_id=user_id, challenge_id=challenge_id, date=today,
            progress=cdef["target"], target=cdef["target"], completed=True,
        )
        db.add(entry)

    await db.flush()
    return ChallengeProgressResponse(
        challenge_id=challenge_id, name=cdef["name"], icon=cdef["icon"],
        target=cdef["target"], unit=cdef["unit"], progress=cdef["target"],
        percentage=100.0, completed=True, reward=cdef["reward"], category=cdef["category"],
    )


@router.get("/streak")
async def get_streak(user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Calculate current challenge streak."""
    streak = 0
    for i in range(365):
        d = date.today() - timedelta(days=i)
        result = await db.execute(
            select(ChallengeProgress).where(
                ChallengeProgress.user_id == user_id,
                ChallengeProgress.date == d,
                ChallengeProgress.completed == True,
            )
        )
        if result.scalars().first() or i == 0:
            streak += 1
        else:
            break
    return {"streak": streak}


@router.get("/badges", response_model=list[BadgeResponse])
async def get_badges(user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Get all badges with earned status."""
    result = await db.execute(select(UserBadge).where(UserBadge.user_id == user_id))
    earned = {b.badge_name: str(b.earned_at) for b in result.scalars().all()}

    return [
        BadgeResponse(
            name=b["name"], icon=b["icon"], description=b["description"],
            locked=b["name"] not in earned,
            earned_at=earned.get(b["name"]),
        )
        for b in BADGE_DEFS
    ]
