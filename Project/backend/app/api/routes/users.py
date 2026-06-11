from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, check_role
from app.schemas.user import UserCreate, UserResponse
from app.services.user_service import UserService
from app.services.audit_service import AuditService
from app.models.audit import AuditActionType
from app.models.user import User

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role(["ADMIN"])),
):
    user = UserService.create_user(db, user_data)
    AuditService.log_action(
        db, current_user, AuditActionType.CREATE_USER, f"Created: {user.username}"
    )
    return UserResponse.model_validate(user)


@router.get("/")
async def list_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role(["ADMIN"])),
):
    users = db.query(User).offset(skip).limit(limit).all()
    return [UserResponse.model_validate(u) for u in users]


@router.delete("/{user_id}", status_code=status.HTTP_200_OK)
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role(["ADMIN"])),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    username = user.username
    db.delete(user)
    db.commit()
    AuditService.log_action(
        db, current_user, AuditActionType.DELETE_USER, f"Deleted: {username}"
    )
    return {"message": f"User '{username}' deleted"}
