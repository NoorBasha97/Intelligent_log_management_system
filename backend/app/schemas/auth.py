from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import List

# Login request
class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)


# Token response
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds
    role : str


# Authenticated user context
class AuthUser(BaseModel):
    user_id: int
    email: EmailStr
    role: str
    team_id: Optional[int]

    class Config:
        from_attributes = True


# Account lock status (optional)
class AccountStatusResponse(BaseModel):
    is_locked: bool
    locked_until: Optional[datetime]
    failed_attempts: int



class LoginHistoryResponse(BaseModel):
    login_id: int
    login_time: datetime
    status: bool
    username: Optional[str] = "Unknown"

    # This logic pulls the username from the User relationship
    @field_validator("username", mode="before")
    @classmethod
    def get_username(cls, v, info):
        # If 'user' object exists in the database row, get its username
        if hasattr(info.data, 'user') and info.data.user:
            return info.data.user.username
        # If manual dictionary mapping was used
        if isinstance(v, str):
            return v
        return "Deleted User"

    class Config:
        from_attributes = True

class LoginHistoryList(BaseModel):
    total: int
    items: List[LoginHistoryResponse]