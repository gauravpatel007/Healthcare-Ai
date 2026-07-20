"""
LifeOS Backend — Centralized Exception Handling
Custom exceptions and global error handlers for consistent API responses.
"""

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import IntegrityError


# ─── Custom Exceptions ───────────────────────────────────────────────

class LifeOSException(Exception):
    """Base exception for all LifeOS errors."""

    def __init__(self, detail: str, status_code: int = 500):
        self.detail = detail
        self.status_code = status_code
        super().__init__(detail)


class NotFoundException(LifeOSException):
    def __init__(self, resource: str = "Resource", resource_id: str = ""):
        detail = f"{resource} not found" + (f": {resource_id}" if resource_id else "")
        super().__init__(detail=detail, status_code=status.HTTP_404_NOT_FOUND)


class UnauthorizedException(LifeOSException):
    def __init__(self, detail: str = "Not authenticated"):
        super().__init__(detail=detail, status_code=status.HTTP_401_UNAUTHORIZED)


class ForbiddenException(LifeOSException):
    def __init__(self, detail: str = "Insufficient permissions"):
        super().__init__(detail=detail, status_code=status.HTTP_403_FORBIDDEN)


class ConflictException(LifeOSException):
    def __init__(self, detail: str = "Resource already exists"):
        super().__init__(detail=detail, status_code=status.HTTP_409_CONFLICT)


class BadRequestException(LifeOSException):
    def __init__(self, detail: str = "Bad request"):
        super().__init__(detail=detail, status_code=status.HTTP_400_BAD_REQUEST)


class FileTooLargeException(LifeOSException):
    def __init__(self, max_size_mb: int = 10):
        super().__init__(
            detail=f"File size exceeds maximum allowed size of {max_size_mb}MB",
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
        )


class UnsupportedFileTypeException(LifeOSException):
    def __init__(self, allowed_types: list[str] | None = None):
        types_str = ", ".join(allowed_types) if allowed_types else "images and PDFs"
        super().__init__(
            detail=f"Unsupported file type. Allowed: {types_str}",
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
        )


# ─── Error Response Schema ───────────────────────────────────────────

def _error_response(status_code: int, detail: str, errors: list | None = None) -> JSONResponse:
    body = {
        "success": False,
        "error": {
            "code": status_code,
            "message": detail,
        },
    }
    if errors:
        body["error"]["details"] = errors
    return JSONResponse(status_code=status_code, content=body)


# ─── Register Handlers ──────────────────────────────────────────────

def register_exception_handlers(app: FastAPI) -> None:
    """Attach all exception handlers to the FastAPI app."""

    @app.exception_handler(LifeOSException)
    async def lifeos_exception_handler(_request: Request, exc: LifeOSException):
        return _error_response(exc.status_code, exc.detail)

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(_request: Request, exc: RequestValidationError):
        errors = []
        for error in exc.errors():
            field = " → ".join(str(loc) for loc in error["loc"])
            errors.append({"field": field, "message": error["msg"]})
        return _error_response(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "Validation error",
            errors=errors,
        )

    @app.exception_handler(IntegrityError)
    async def integrity_exception_handler(_request: Request, _exc: IntegrityError):
        return _error_response(
            status.HTTP_409_CONFLICT,
            "A database integrity constraint was violated. The resource may already exist.",
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(_request: Request, exc: Exception):
        import logging
        logging.getLogger("lifeos").exception("Unhandled exception: %s", exc)
        return _error_response(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "An internal server error occurred. Please try again later.",
        )
