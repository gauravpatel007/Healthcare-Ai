from typing import Any, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone

from app.database import get_db
from app.dependencies import require_role
from app.models.admin import AdminAuditLog
from app.models.user import User

router = APIRouter(prefix="/admin/audit", tags=["Admin Audit Logs"])

from pydantic import BaseModel
from app.utils.security import create_audit_log

class AuditLogCreate(BaseModel):
    action: str
    target_entity_type: str = "System"
    target_entity_id: Optional[str] = None
    details: Optional[str] = None

@router.post("/logs")
async def create_custom_audit_log(
    log_data: AuditLogCreate,
    current_admin_id: str = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db)
):
    await create_audit_log(
        db=db,
        admin_id=current_admin_id,
        action=log_data.action,
        target_type=log_data.target_entity_type,
        target_id=log_data.target_entity_id,
        details={"info": log_data.details} if log_data.details else None
    )
    return {"success": True}

@router.get("/logs")
async def get_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    admin_id: Optional[str] = None,
    action: Optional[str] = None,
    target_type: Optional[str] = None,
    current_admin_id: str = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Fetch paginated audit logs with optional filtering."""
    query = select(AdminAuditLog, User.email).outerjoin(User, AdminAuditLog.admin_id == User.id)
    
    if admin_id:
        query = query.where(AdminAuditLog.admin_id == admin_id)
    if action:
        query = query.where(AdminAuditLog.action.ilike(f"%{action}%"))
    if target_type:
        query = query.where(AdminAuditLog.target_entity_type == target_type)
        
    query = query.order_by(desc(AdminAuditLog.created_at)).offset(skip).limit(limit)
    result = await db.execute(query)
    
    logs = []
    for log, email in result:
        logs.append({
            "id": log.id,
            "admin_id": log.admin_id,
            "admin_email": email or "Unknown/System",
            "action": log.action,
            "target_entity_type": log.target_entity_type,
            "target_entity_id": log.target_entity_id,
            "ip_address": log.ip_address,
            "device": log.device,
            "details": log.details,
            "previous_value": log.previous_value,
            "new_value": log.new_value,
            "created_at": log.created_at
        })
        
    return {"success": True, "data": logs}
