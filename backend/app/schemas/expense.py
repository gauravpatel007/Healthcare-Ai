"""
LifeOS Backend — Expense Schemas
"""

from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field


class ExpenseCreate(BaseModel):
    description: str = Field(..., min_length=1, max_length=500)
    category: str = Field(..., pattern="^(medicine|doctor|tests|insurance|other)$")
    amount: float = Field(..., gt=0)
    date: Optional[date] = None


class ExpenseResponse(BaseModel):
    id: str
    user_id: str
    description: str
    category: str
    amount: float
    date: date
    created_at: datetime

    model_config = {"from_attributes": True}


class ExpenseSummary(BaseModel):
    total: float
    by_category: dict[str, float]
    expenses: list[ExpenseResponse]
