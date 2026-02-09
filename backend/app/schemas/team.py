from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# Base schema
class TeamBase(BaseModel):
    team_name: str = Field(..., min_length=2, max_length=150)


# Create request
class TeamCreate(TeamBase):
    pass


# Update request
class TeamUpdate(BaseModel):
    team_name: Optional[str] = Field(None, min_length=2, max_length=150)


# Response schema
class TeamResponse(BaseModel):
    team_id: int
    team_name: str
    created_at: datetime

    class Config:
        from_attributes = True
        
        
# User - Team assignment response
class TeamAssignmentResponse(BaseModel):
    user_id: int
    team_id: int
    is_active: bool

    model_config = {
        "from_attributes": True
    }
