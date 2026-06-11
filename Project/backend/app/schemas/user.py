from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    username: str
    email: str
    full_name: str
    password: str
    role: str = "READ_ONLY"


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: Optional[str] = None

    model_config = {"from_attributes": True}

    @classmethod
    def model_validate(cls, obj, **kwargs):
        if hasattr(obj, "created_at") and isinstance(obj.created_at, datetime):
            data = {
                "id": obj.id,
                "username": obj.username,
                "email": obj.email,
                "full_name": obj.full_name,
                "role": obj.role.value if hasattr(obj.role, "value") else str(obj.role),
                "is_active": obj.is_active,
                "created_at": obj.created_at.isoformat() if obj.created_at else None,
            }
            return cls(**data)
        return super().model_validate(obj, **kwargs)


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
