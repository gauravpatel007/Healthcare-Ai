"""
Health Article Model
"""
from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base, TimestampMixin, generate_uuid

class HealthArticle(Base, TimestampMixin):
    __tablename__ = "health_articles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    image: Mapped[str | None] = mapped_column(String(255), nullable=True)
    author: Mapped[str | None] = mapped_column(String(255), nullable=True)
    featured_image_url: Mapped[str] = mapped_column(String(255), nullable=True)
    seo_title: Mapped[str] = mapped_column(String(255), nullable=True)
    seo_description: Mapped[str] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="Draft", nullable=False)
