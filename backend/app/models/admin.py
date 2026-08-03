"""
LifeOS Backend — Admin Models
"""

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text, DateTime, JSON, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

from app.database import Base, TimestampMixin, generate_uuid


class SystemSetting(Base, TimestampMixin):
    """Flexible key-value store for system configurations."""

    __tablename__ = "system_settings"

    key: Mapped[str] = mapped_column(String(100), primary_key=True)
    value: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(50), default="general", nullable=False)
    is_secret: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)


class AdminAuditLog(Base, TimestampMixin):
    """Tracks sensitive actions taken by administrators."""

    __tablename__ = "admin_audit_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    admin_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    target_entity_type: Mapped[str | None] = mapped_column(String(50), nullable=True) # e.g. 'user', 'setting'
    target_entity_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    device: Mapped[str | None] = mapped_column(String(500), nullable=True)
    details: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    previous_value: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    new_value: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class AIUsageLog(Base, TimestampMixin):
    """Logs AI interactions for monitoring performance and safety."""

    __tablename__ = "ai_usage_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    feature: Mapped[str] = mapped_column(String(50), nullable=False) # e.g. 'Nutrition', 'MentalHealth'
    model_used: Mapped[str] = mapped_column(String(50), nullable=False) # e.g. 'llama3'
    prompt_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)
    completion_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)
    response_time_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    user_feedback: Mapped[bool | None] = mapped_column(Boolean, nullable=True) # True = Thumbs up, False = down
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)


class Role(Base, TimestampMixin):
    __tablename__ = "roles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)


class Permission(Base, TimestampMixin):
    __tablename__ = "permissions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    permission_name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)


class RolePermission(Base):
    __tablename__ = "role_permissions"

    role_id: Mapped[str] = mapped_column(String(36), ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)
    permission_id: Mapped[str] = mapped_column(String(36), ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True)


class AdminUser(Base, TimestampMixin):
    __tablename__ = "admins"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    role_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("roles.id", ondelete="SET NULL"), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)


class AdminLog(Base, TimestampMixin):
    __tablename__ = "admin_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    admin_id: Mapped[str] = mapped_column(String(36), ForeignKey("admins.id", ondelete="CASCADE"), nullable=False)
    action: Mapped[str] = mapped_column(String(255), nullable=False)
    ip: Mapped[str | None] = mapped_column(String(45), nullable=True)
    device: Mapped[str | None] = mapped_column(String(500), nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class AuditLog(Base, TimestampMixin):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    admin_id: Mapped[str] = mapped_column(String(36), ForeignKey("admins.id", ondelete="CASCADE"), nullable=False)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    entity: Mapped[str | None] = mapped_column(String(100), nullable=True)
    entity_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    old_value: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    new_value: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class ApiLog(Base, TimestampMixin):
    __tablename__ = "api_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    endpoint: Mapped[str] = mapped_column(String(255), nullable=False)
    response_time: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str | None] = mapped_column(String(20), nullable=True)
