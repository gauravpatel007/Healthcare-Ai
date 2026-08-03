"""
LifeOS Backend — Family & Vaccination Router
"""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import CurrentUserId
from app.exceptions import NotFoundException
from app.models.family import FamilyMember, Vaccination
from app.schemas.family import (
    FamilyMemberCreate, FamilyMemberResponse, FamilyMemberUpdate,
    VaccinationCreate, VaccinationResponse,
)

router = APIRouter(prefix="/family", tags=["Family"])


# ─── Family Members ─────────────────────────────────────────────────

@router.get("/members", response_model=list[FamilyMemberResponse])
async def list_members(user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(FamilyMember).where(FamilyMember.user_id == user_id)
    )
    return result.scalars().all()


@router.post("/members", response_model=FamilyMemberResponse, status_code=201)
async def create_member(data: FamilyMemberCreate, user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    member = FamilyMember(user_id=user_id, **data.model_dump())
    db.add(member)
    await db.flush()
    return member


@router.get("/members/{member_id}", response_model=FamilyMemberResponse)
async def get_member(member_id: str, user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(FamilyMember).where(FamilyMember.id == member_id, FamilyMember.user_id == user_id)
    )
    member = result.scalar_one_or_none()
    if not member:
        raise NotFoundException("Family member", member_id)
    return member


@router.put("/members/{member_id}", response_model=FamilyMemberResponse)
async def update_member(
    member_id: str, data: FamilyMemberUpdate, user_id: CurrentUserId, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(FamilyMember).where(FamilyMember.id == member_id, FamilyMember.user_id == user_id)
    )
    member = result.scalar_one_or_none()
    if not member:
        raise NotFoundException("Family member", member_id)
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(member, key, value)
    await db.flush()
    return member


@router.delete("/members/{member_id}")
async def delete_member(member_id: str, user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(FamilyMember).where(FamilyMember.id == member_id, FamilyMember.user_id == user_id)
    )
    member = result.scalar_one_or_none()
    if not member:
        raise NotFoundException("Family member", member_id)
    await db.delete(member)
    return {"success": True, "message": "Family member removed"}


# ─── Vaccinations ───────────────────────────────────────────────────

@router.get("/vaccinations", response_model=list[VaccinationResponse])
async def list_vaccinations(user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Vaccination).where(Vaccination.user_id == user_id).order_by(Vaccination.date.desc())
    )
    return result.scalars().all()


@router.post("/vaccinations", response_model=VaccinationResponse, status_code=201)
async def add_vaccination(data: VaccinationCreate, user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    vax = Vaccination(user_id=user_id, **data.model_dump())
    db.add(vax)
    await db.flush()
    return vax
