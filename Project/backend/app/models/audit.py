from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base
import enum

class AuditActionType(str, enum.Enum):
    LOGIN = "LOGIN"
    UPLOAD_INVENTORY = "UPLOAD_INVENTORY"
    UPLOAD_LIVE_INVENTORY = "UPLOAD_LIVE_INVENTORY"
    RUN_RECONCILIATION = "RUN_RECONCILIATION"
    GENERATE_REPORT = "GENERATE_REPORT"
    CHATBOT_QUERY = "CHATBOT_QUERY"
    CREATE_USER = "CREATE_USER"
    DELETE_USER = "DELETE_USER"

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(Enum(AuditActionType), nullable=False)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="audit_logs")
