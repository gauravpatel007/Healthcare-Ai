"""
User Feedback Model
"""
from sqlalchemy import String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base, TimestampMixin, generate_uuid

class UserFeedback(Base, TimestampMixin):
    __tablename__ = "user_feedback"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    type: Mapped[str] = mapped_column(String(50), nullable=False) # Bug, Suggestion, Rating, Complaint, Review
    message: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="Open", nullable=False) # Open, Assigned, Closed
    admin_reply: Mapped[str | None] = mapped_column(Text, nullable=True)
    assigned_to: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Relationship
    user = relationship("User")
