from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
import json

from app.database import get_db
from app.dependencies import require_role
from app.models.user import LoginHistory, BlockedIP, User
from app.models.admin import SystemSetting
from app.utils.security import create_audit_log

router = APIRouter(prefix="/admin/security", tags=["Admin Security"])

@router.get("/logins")
async def get_login_history(
    skip: int = 0,
    limit: int = 50,
    admin_id: str = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get global login history."""
    query = select(LoginHistory, User.email).outerjoin(User, LoginHistory.user_id == User.id).order_by(desc(LoginHistory.created_at)).offset(skip).limit(limit)
    result = await db.execute(query)
    logins = []
    for history, email in result:
        logins.append({
            "id": history.id,
            "user_id": history.user_id,
            "email": email or "Unknown",
            "ip_address": history.ip_address,
            "user_agent": history.user_agent,
            "status": history.status,
            "created_at": history.created_at
        })
    return {"success": True, "data": logins}

@router.get("/blocked-ips")
async def get_blocked_ips(
    admin_id: str = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get all blocked IPs."""
    query = select(BlockedIP).order_by(desc(BlockedIP.created_at))
    result = await db.execute(query)
    ips = result.scalars().all()
    return {"success": True, "data": ips}

@router.post("/blocked-ips")
async def block_ip(
    data: dict,
    request: Request,
    admin_id: str = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Block an IP address."""
    ip_address = data.get("ip_address")
    reason = data.get("reason", "")
    if not ip_address:
        raise HTTPException(status_code=400, detail="IP address required")
        
    blocked = BlockedIP(ip_address=ip_address, reason=reason, blocked_by=admin_id)
    db.add(blocked)
    
    await create_audit_log(
        db=db, admin_id=admin_id, action="Blocked IP", target_type="ip", 
        target_id=ip_address, details={"reason": reason}, request=request
    )
    await db.commit()
    return {"success": True, "message": "IP Blocked"}

@router.delete("/blocked-ips/{ip_id}")
async def unblock_ip(
    ip_id: str,
    request: Request,
    admin_id: str = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Unblock an IP address."""
    result = await db.execute(select(BlockedIP).where(BlockedIP.id == ip_id))
    blocked = result.scalar_one_or_none()
    if not blocked:
        raise HTTPException(status_code=404, detail="Blocked IP not found")
        
    await db.delete(blocked)
    await create_audit_log(
        db=db, admin_id=admin_id, action="Unblocked IP", target_type="ip", 
        target_id=blocked.ip_address, request=request
    )
    await db.commit()
    return {"success": True, "message": "IP Unblocked"}

@router.post("/force-logout/{user_id}")
async def force_logout(
    user_id: str,
    request: Request,
    admin_id: str = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Force logout a user by incrementing their token_version."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.token_version += 1
    await create_audit_log(
        db=db, admin_id=admin_id, action="Force Logout User", target_type="user", 
        target_id=user_id, details={"email": user.email}, request=request
    )
    await db.commit()
    return {"success": True, "message": "User session invalidated"}

@router.get("/policy")
async def get_password_policy(
    admin_id: str = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get the password policy settings."""
    result = await db.execute(select(SystemSetting).where(SystemSetting.key == "password_policy"))
    setting = result.scalar_one_or_none()
    
    default_policy = {
        "min_length": 8,
        "require_uppercase": True,
        "require_numbers": True,
        "require_symbols": True,
    }
    
    if setting and setting.value:
        try:
            return {"success": True, "data": json.loads(setting.value)}
        except json.JSONDecodeError:
            pass
            
    return {"success": True, "data": default_policy}

@router.put("/policy")
async def update_password_policy(
    data: dict,
    request: Request,
    admin_id: str = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update the password policy settings."""
    result = await db.execute(select(SystemSetting).where(SystemSetting.key == "password_policy"))
    setting = result.scalar_one_or_none()
    
    policy = {
        "min_length": data.get("min_length", 8),
        "require_uppercase": data.get("require_uppercase", True),
        "require_numbers": data.get("require_numbers", True),
        "require_symbols": data.get("require_symbols", True),
    }
    
    previous_value = None
    if setting:
        if setting.value:
            try:
                previous_value = json.loads(setting.value)
            except:
                pass
        setting.value = json.dumps(policy)
    else:
        setting = SystemSetting(
            key="password_policy",
            value=json.dumps(policy),
            category="security",
            description="Global password security policy"
        )
        db.add(setting)
        
    await create_audit_log(
        db=db, admin_id=admin_id, action="Update Password Policy", target_type="setting", 
        target_id="password_policy", previous_value=previous_value, new_value=policy, request=request
    )
    
    await db.commit()
    return {"success": True, "message": "Password policy updated"}
