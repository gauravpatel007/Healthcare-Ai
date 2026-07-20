"""
LifeOS Backend — Expenses Router
"""

from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import CurrentUserId
from app.exceptions import NotFoundException
from app.models.expense import MedicalExpense
from app.schemas.expense import ExpenseCreate, ExpenseResponse, ExpenseSummary

router = APIRouter(prefix="/expenses", tags=["Expenses"])


@router.get("", response_model=list[ExpenseResponse])
async def list_expenses(user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(MedicalExpense).where(MedicalExpense.user_id == user_id).order_by(MedicalExpense.date.desc())
    )
    return result.scalars().all()


@router.post("", response_model=ExpenseResponse, status_code=201)
async def create_expense(data: ExpenseCreate, user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    expense = MedicalExpense(
        user_id=user_id,
        description=data.description,
        category=data.category,
        amount=data.amount,
        date=data.date or date.today(),
    )
    db.add(expense)
    await db.flush()
    return expense


@router.delete("/{expense_id}")
async def delete_expense(expense_id: str, user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(MedicalExpense).where(MedicalExpense.id == expense_id, MedicalExpense.user_id == user_id)
    )
    expense = result.scalar_one_or_none()
    if not expense:
        raise NotFoundException("Expense", expense_id)
    await db.delete(expense)
    return {"success": True, "message": "Expense deleted"}


@router.get("/summary", response_model=ExpenseSummary)
async def expense_summary(user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Get expense summary with category breakdown."""
    result = await db.execute(
        select(MedicalExpense).where(MedicalExpense.user_id == user_id).order_by(MedicalExpense.date.desc())
    )
    expenses = result.scalars().all()

    by_category: dict[str, float] = {}
    for e in expenses:
        by_category[e.category] = by_category.get(e.category, 0) + e.amount

    total = sum(by_category.values())

    return ExpenseSummary(total=total, by_category=by_category, expenses=expenses)
