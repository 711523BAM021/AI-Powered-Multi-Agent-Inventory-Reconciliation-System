from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, check_role
from app.services.audit_service import AuditService
from app.models.user import User

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("/logs")
async def get_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    user_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role(["ADMIN"])),
):
    logs = AuditService.get_audit_logs(db, user_id=user_id, skip=skip, limit=limit)
    return [
        {
            "id": log.id,
            "user_id": log.user_id,
            "username": log.user.username if log.user else "Unknown",
            "action": log.action.value,
            "details": log.details,
            "created_at": log.created_at.isoformat() if log.created_at else None,
        }
        for log in logs
    ]
