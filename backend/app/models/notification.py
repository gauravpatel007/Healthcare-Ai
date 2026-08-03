"""
System Notification Model
"""
from sqlalchemy import String, Text, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base, TimestampMixin, generate_uuid
import datetime

class SystemNotification(Base, TimestampMixin):
    __tablename__ = "system_notifications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    type: Mapped[str] = mapped_column(String(50), nullable=False) # Push, Email, SMS, In-App
    target_audience: Mapped[str] = mapped_column(String(100), nullable=False) # Everyone, Premium, Doctors, Selected Users
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    scheduled_for: Mapped[datetime.datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="Pending", nullable=False) # Pending, Sent, Failed
