from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


# =========================
# Base schema (shared fields)
# =========================
class UserBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    phone_no: str = Field(..., min_length=8, max_length=20)
    email: EmailStr
    username: Optional[str] = Field(None, min_length=3, max_length=100)
    gender: Optional[str] = Field(
        None,
        description="Allowed values: male, female, other"
    )
    user_role : Optional[str] = None


# =========================
# Request schema (CREATE)
# =========================
class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Plain password")


# =========================
# Request schema (UPDATE) 
# =========================
class UserUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    phone_no: Optional[str] = Field(None, min_length=8, max_length=20)
    username: Optional[str] = Field(None, min_length=3, max_length=100)
    gender: Optional[str] = Field(None)
    user_role : Optional[str] = Field(None)
    team_id : Optional[int] = Field(None)

    is_active: Optional[bool] = None
    is_deleted: Optional[bool] = None


# =========================
# Response schema (PUBLIC)
# =========================
class UserResponse(BaseModel):
    user_id: int
    first_name: str
    last_name: Optional[str]
    phone_no: str
    email: EmailStr
    username: Optional[str]
    gender: Optional[str]
    user_role : Optional[str] = None
    team_id : Optional[int] = None

    is_active: bool
    is_deleted: bool

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
