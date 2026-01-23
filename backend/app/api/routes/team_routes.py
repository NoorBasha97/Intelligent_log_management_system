from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_active_user, require_permission
from app.models.user import User
from app.schemas.team import (
    TeamCreate,
    TeamResponse,
    TeamAssignmentResponse
)
from app.services.team_service import TeamService


router = APIRouter(
    prefix="/teams",
    tags=["Teams"]
)


# -------------------------
# Create team (ADMIN)
# -------------------------
@router.post(
    "",
    response_model=TeamResponse,
    status_code=status.HTTP_201_CREATED
)
def create_team(
    payload: TeamCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("MANAGE_USERS"))
):
    try:
        team = TeamService.create_team(
            db,
            team_name=payload.team_name
        )
        return team
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        )


# -------------------------
# List teams (ADMIN)
# -------------------------
@router.get(
    "",
    response_model=list[TeamResponse]
)
def list_teams(
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("MANAGE_USERS")),
    limit: int = 50,
    offset: int = 0
):
    return TeamService.list_teams(
        db,
        limit=limit,
        offset=offset
    )


# -------------------------
# Assign user to team (ADMIN)
# -------------------------
@router.post(
    "/assign",
    response_model=TeamAssignmentResponse
)
def assign_user_to_team(
    user_id: int,
    team_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("MANAGE_USERS"))
):
    """
    Assigns user to a team.
    Automatically deactivates previous team.
    """
    try:
        membership = TeamService.assign_user_to_team(
            db,
            user_id=user_id, 
            team_id=team_id
        )

        return {
            "user_id": membership.user_id,
            "team_id": membership.team_id,
            "is_active": membership.is_active
        }

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        )


# -------------------------
# Get current user's active team
# -------------------------
@router.get(
    "/me",
    response_model=TeamResponse
)
def get_my_team(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_active_user)
):
    try:
        team = TeamService.get_active_team_for_user(
            db,
            user_id=current_user.user_id
        )
        return team
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc)
        )
