"""
LifeOS Backend — File Asset Models
"""

from sqlalchemy import String, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, TimestampMixin, generate_uuid

class FileAsset(Base, TimestampMixin):
    """Tracks uploaded files for the Admin File Manager."""

    __tablename__ = "file_assets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False) # e.g. application/pdf, image/jpeg
    category: Mapped[str] = mapped_column(String(100), nullable=False) # e.g. 'Medical Files', 'Images'
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False) # path or URL to the actual file

