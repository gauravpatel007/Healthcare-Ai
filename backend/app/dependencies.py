"""
LifeOS Backend — Shared Dependencies
FastAPI dependencies for database sessions, auth, and role checking.
"""

import logging
from typing import Annotated

from fastapi import Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.exceptions import UnauthorizedException, ForbiddenException
from app.utils.security import decode_access_token

logger = logging.getLogger("lifeos")

# Type alias for DB session dependency
DbSession = Annotated[AsyncSession, Depends(get_db)]


async def get_current_user_id(
    authorization: str = Header(..., description="Bearer <access_token>"),
) -> str:
    """Extract and validate user ID from the Authorization header."""
    if not authorization.startswith("Bearer "):
        raise UnauthorizedException("Invalid authorization header format. Use: Bearer <token>")

    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        raise UnauthorizedException("Token is missing")

    payload = decode_access_token(token)
    user_id: str | None = payload.get("sub")
    if not user_id:
        raise UnauthorizedException("Invalid token: missing subject")

    return user_id


# Type alias for current user dependency
CurrentUserId = Annotated[str, Depends(get_current_user_id)]


def require_role(*allowed_roles: str):
    """Dependency factory that checks if the user has one of the allowed roles."""

    async def role_checker(
        authorization: str = Header(...),
    ) -> str:
        if not authorization.startswith("Bearer "):
            raise UnauthorizedException("Invalid authorization header")

        token = authorization.removeprefix("Bearer ").strip()
        payload = decode_access_token(token)

        user_id: str | None = payload.get("sub")
        role: str | None = payload.get("role")

        if not user_id:
            raise UnauthorizedException("Invalid token")
        if role not in allowed_roles:
            raise ForbiddenException(
                f"Access denied. Required role(s): {', '.join(allowed_roles)}"
            )
        return user_id

    return role_checker
