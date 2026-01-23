from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


# =========================
# Login request
# =========================
class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)


# ========================= 
# Token response
# ========================= 
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds
    role : str


# =========================
# Authenticated user context
# =========================
class AuthUser(BaseModel):
    user_id: int
    email: EmailStr
    role: str
    team_id: Optional[int]

    class Config:
        from_attributes = True


# =========================
# Password change request
# =========================
class PasswordChangeRequest(BaseModel):
    old_password: str = Field(..., min_length=6)
    new_password: str = Field(..., min_length=6)


# =========================
# Account lock status (optional)
# =========================
class AccountStatusResponse(BaseModel):
    is_locked: bool
    locked_until: Optional[datetime]
    failed_attempts: int
