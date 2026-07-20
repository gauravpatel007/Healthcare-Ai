"""
LifeOS Backend — Secure Sharing Models
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey

from app.database import Base


class SharedLink(Base):
    __tablename__ = "shared_links"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token = Column(String, unique=True, index=True, nullable=False, default=lambda: str(uuid.uuid4()))
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
