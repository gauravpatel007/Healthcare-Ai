"""
LifeOS Backend — Challenge & Badge Schemas
"""

from pydantic import BaseModel, Field


class ChallengeDefinition(BaseModel):
    id: str
    name: str
    icon: str
    target: int
    unit: str
    reward: str
    category: str


class ChallengeProgressUpdate(BaseModel):
    amount: int = Field(default=1, ge=1)


class ChallengeProgressResponse(BaseModel):
    challenge_id: str
    name: str
    icon: str
    target: int
    unit: str
    progress: int
    percentage: float
    completed: bool
    reward: str
    category: str


class BadgeResponse(BaseModel):
    name: str
    icon: str
    description: str
    locked: bool
    earned_at: str | None = None


class ChallengeOverview(BaseModel):
    streak: int
    badges_earned: int
    challenges_completed: int
    today_challenges: list[ChallengeProgressResponse]
    badges: list[BadgeResponse]
