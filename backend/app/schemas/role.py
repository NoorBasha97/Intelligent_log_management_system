from typing import List
from pydantic import BaseModel, Field


# =========================
# Assign role to user (request)
# =========================
class RoleAssignmentRequest(BaseModel):
    user_id: int = Field(..., gt=0)
    role_name: str = Field(..., min_length=2, max_length=50)


# =========================
# Role assignment response
# =========================
class RoleAssignmentResponse(BaseModel):
    user_id: int
    role_id: int
    is_active: bool

    model_config = {
        "from_attributes": True
    }


# =========================
# User permissions response
# =========================
class UserPermissionsResponse(BaseModel):
    user_id: int
    permissions: List[str]
