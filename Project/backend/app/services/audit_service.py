from sqlalchemy.orm import Session
from app.models.audit import AuditLog, AuditActionType
from app.models.user import User

class AuditService:
    @staticmethod
    def log_action(db: Session, user: User, action: AuditActionType, details=None):
        log = AuditLog(user_id=user.id, action=action, details=details)
        db.add(log)
        db.commit()
        db.refresh(log)
        return log

    @staticmethod
    def get_audit_logs(db: Session, user_id=None, skip=0, limit=100):
        query = db.query(AuditLog)
        if user_id:
            query = query.filter(AuditLog.user_id == user_id)
        return query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
