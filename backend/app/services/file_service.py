"""
LifeOS Backend — File Upload Service
Handles file validation, storage, and retrieval.
"""

import os
import uuid
import logging
from pathlib import Path

from fastapi import UploadFile

from app.config import get_settings
from app.exceptions import FileTooLargeException, UnsupportedFileTypeException

logger = logging.getLogger("lifeos.files")

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf"}
ALLOWED_MIME_TYPES = {
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "application/pdf",
}


async def save_upload_file(file: UploadFile, user_id: str) -> str:
    """
    Validate and save an uploaded file.
    Returns the relative file path.
    """
    settings = get_settings()

    # Validate file type
    if file.content_type and file.content_type not in ALLOWED_MIME_TYPES:
        raise UnsupportedFileTypeException(list(ALLOWED_EXTENSIONS))

    ext = Path(file.filename or "file").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise UnsupportedFileTypeException(list(ALLOWED_EXTENSIONS))

    # Read and validate file size
    content = await file.read()
    if len(content) > settings.max_file_size_bytes:
        raise FileTooLargeException(settings.MAX_FILE_SIZE_MB)

    # Create user-specific upload directory
    upload_dir = Path(settings.UPLOAD_DIR) / user_id
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Generate unique filename
    filename = f"{uuid.uuid4().hex}{ext}"
    file_path = upload_dir / filename

    # Write file
    with open(file_path, "wb") as f:
        f.write(content)

    relative_path = f"{user_id}/{filename}"
    logger.info("File saved: %s (%d bytes)", relative_path, len(content))
    return relative_path


def get_file_path(relative_path: str) -> Path | None:
    """Get the absolute path of an uploaded file."""
    settings = get_settings()
    full_path = Path(settings.UPLOAD_DIR) / relative_path
    if full_path.exists():
        return full_path
    return None


def delete_file(relative_path: str) -> bool:
    """Delete an uploaded file."""
    settings = get_settings()
    full_path = Path(settings.UPLOAD_DIR) / relative_path
    if full_path.exists():
        full_path.unlink()
        logger.info("File deleted: %s", relative_path)
        return True
    return False
