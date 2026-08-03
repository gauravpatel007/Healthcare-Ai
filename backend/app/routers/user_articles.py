from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.article import HealthArticle
from app.dependencies import CurrentUserId

router = APIRouter(prefix="/articles", tags=["user-articles"])

@router.get("")
async def get_published_articles(user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    query = select(HealthArticle).where(HealthArticle.status == "Published").order_by(HealthArticle.created_at.desc())
    result = await db.execute(query)
    articles = result.scalars().all()
    return articles
