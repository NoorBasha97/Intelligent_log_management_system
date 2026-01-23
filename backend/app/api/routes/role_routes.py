from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_active_user, require_permission
from app.models.user import User
from app.schemas.role import (
    RoleAssignmentRequest,
    RoleAssignmentResponse,
    UserPermissionsResponse
)
from app.services.role_service import RoleService


router = APIRouter(
    prefix="/roles",
    tags=["Roles & Permissions"]
)


# -------------------------
# Assign role to user (ADMIN)
# -------------------------
@router.post(
    "/assign",
    response_model=RoleAssignmentResponse
)
def assign_role_to_user(
    payload: RoleAssignmentRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("MANAGE_USERS"))
):
    """
    Assign a role to a user.
    Automatically revokes existing active role.
    """
    try:
        mapping = RoleService.assign_role_to_user(
            db,
            user_id=payload.user_id,
            role_name=payload.role_name
        )

        return {
            "user_id": mapping.user_id,
            "role_id": mapping.role_id,
            "is_active": mapping.is_active
        }

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        )


# -------------------------
# Get permissions for current user
# -------------------------
@router.get(
    "/me/permissions",
    response_model=UserPermissionsResponse
)
def get_my_permissions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_active_user)
):
    permissions = RoleService.get_permissions_for_user(
        db,
        user_id=current_user.user_id
    )

    return {
        "user_id": current_user.user_id,
        "permissions": permissions
    }
