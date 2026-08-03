"""
LifeOS Backend — AI Prompt Models
"""

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, generate_uuid


class AIPrompt(Base):
    """Stores the active prompt for each AI module."""
    __tablename__ = "ai_prompts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    module: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    updated_at: Mapped[str] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class AIPromptVersion(Base):
    """Stores the history of prompts for rollback."""
    __tablename__ = "ai_prompt_versions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    prompt_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("ai_prompts.id", ondelete="CASCADE"), nullable=False, index=True
    )
    module: Mapped[str] = mapped_column(String(50), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[str] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
