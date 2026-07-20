"""
LifeOS Backend — Chat Message Model
"""

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, generate_uuid


class ChatMessage(Base):
    """AI chat message (for all AI modules)."""

    __tablename__ = "chat_messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    role: Mapped[str] = mapped_column(
        SAEnum("user", "assistant", name="chat_role"),
        nullable=False,
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    module: Mapped[str] = mapped_column(
        SAEnum("assistant", "symptom", "nutrition", "fitness", "mental",
               name="ai_module"),
        nullable=False,
        default="assistant",
    )
    created_at: Mapped[str] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
