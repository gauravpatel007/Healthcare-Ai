"""
Admin API for Content Management (Health Articles)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.article import HealthArticle
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/admin", tags=["admin-content"])

class ArticleCreate(BaseModel):
    title: str
    content: str
    category: str
    featured_image_url: Optional[str] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    status: str = "Draft"

@router.get("/articles")
async def get_articles(db: AsyncSession = Depends(get_db)):
    query = select(HealthArticle).order_by(HealthArticle.created_at.desc())
    result = await db.execute(query)
    articles = result.scalars().all()
    return [
        {
            "id": a.id,
            "title": a.title,
            "category": a.category,
            "content": a.content,
            "status": a.status,
            "featured_image_url": a.featured_image_url,
            "seo_title": a.seo_title,
            "seo_description": a.seo_description,
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "updated_at": a.updated_at.isoformat() if a.updated_at else None
        } for a in articles
    ]

@router.post("/articles", status_code=status.HTTP_201_CREATED)
async def create_article(data: ArticleCreate, db: AsyncSession = Depends(get_db)):
    article = HealthArticle(**data.model_dump())
    db.add(article)
    await db.commit()
    await db.refresh(article)
    
    return {
        "id": article.id,
        "title": article.title,
        "category": article.category,
        "content": article.content,
        "status": article.status,
        "featured_image_url": article.featured_image_url,
        "seo_title": article.seo_title,
        "seo_description": article.seo_description,
        "created_at": article.created_at.isoformat() if article.created_at else None,
        "updated_at": article.updated_at.isoformat() if article.updated_at else None
    }

@router.put("/articles/{article_id}")
async def update_article(article_id: str, data: ArticleCreate, db: AsyncSession = Depends(get_db)):
    query = select(HealthArticle).where(HealthArticle.id == article_id)
    result = await db.execute(query)
    article = result.scalars().first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
        
    for key, value in data.model_dump(exclude_unset=True).items():
        if hasattr(article, key):
            setattr(article, key, value)
            
    await db.commit()
    await db.refresh(article)
    return {
        "id": article.id,
        "title": article.title,
        "category": article.category,
        "status": article.status
    }

@router.delete("/articles/{article_id}")
async def delete_article(article_id: str, db: AsyncSession = Depends(get_db)):
    query = select(HealthArticle).where(HealthArticle.id == article_id)
    result = await db.execute(query)
    article = result.scalars().first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
        
    await db.delete(article)
    await db.commit()
    return {"status": "success", "message": "Article deleted"}
