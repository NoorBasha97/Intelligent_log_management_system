from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_active_user, require_permission
from app.models.user import User
from app.schemas.user import (
    UserCreate,
    UserUpdate,
    UserResponse
)
from app.services.user_service import UserService
from app.models.user_teams import UserTeam
from app.models.log_entries import LogEntry
from app.models.login_history import UserLoginHistory
from app.models.raw_file import RawFile
from app.models.user_credentials import UserCredential


router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


# -------------------------
# Create user (public)
# -------------------------
@router.post(
    "/register", 
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db)
):
   
    try:
        user = UserService.create_user(db, payload) 
        return user
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        )


# -------------------------
# Get current user
# -------------------------
@router.get(
    "/me",
    response_model=UserResponse
)
def get_me(
    current_user: User = Depends(get_active_user)
):
    return current_user


# -------------------------
# List users (ADMIN)
# -------------------------
@router.get(
    "/all",
    response_model=List[UserResponse]
)
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("MANAGE_USERS")),
    limit: int = 50,
    offset: int = 0
): 
    users = UserService.list_users(
        db,
        limit=limit,
        offset=offset
    )
    return users


# -------------------------
# Update user (self)
# -------------------------
@router.put("/me", response_model=UserResponse)
def update_my_profile(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_active_user)
):
    try:
        # We pass the current_user (from token) to the service
        updated = UserService.update_user(
            db,
            current_user,
            payload
        )
        return updated
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        )

# --- UPDATE USER (ADMIN) -------

@router.put(
    "/update/{user_id}",
    response_model=UserResponse
)
def update_user_by_admin(
    user_id : int,
    payload: UserUpdate,
    db: Session = Depends(get_db)
):
    try:
        current_user=db.query(User).filter(User.user_id==user_id).first()
        updated = UserService.update_user(
            db,
            current_user,
            payload
        )
        
        update_team = UserTeam(user_id=current_user.user_id,team_id=payload.team_id)
        db.add(update_team)
        db.commit()
        return updated
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        )

# -------------------------
# Delete user (ADMIN)
# -------------------------
@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("MANAGE_USERS"))
):
    # 1. Fetch the user
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        # 2. MANUAL CASCADE (Backup logic if DB constraints fail)
        # Find all files uploaded by this user
        user_files = db.query(RawFile).filter(RawFile.uploaded_by == user_id).all()
        file_ids = [f.file_id for f in user_files]

        # Delete logs belonging to those files
        if file_ids:
            db.query(LogEntry).filter(LogEntry.file_id.in_(file_ids)).delete(synchronize_session=False)
        
        # Delete the files themselves
        db.query(RawFile).filter(RawFile.uploaded_by == user_id).delete(synchronize_session=False)

        # Delete login history, team assignments, and credentials
        db.query(UserLoginHistory).filter(UserLoginHistory.user_id == user_id).delete(synchronize_session=False)
        db.query(UserTeam).filter(UserTeam.user_id == user_id).delete(synchronize_session=False)
        db.query(UserCredential).filter(UserCredential.user_id == user_id).delete(synchronize_session=False)

        # 3. Final step: Delete the user
        db.delete(user)
        db.commit()
        
        return None
    except Exception as e:
        db.rollback()
        print(f"Error deleting user: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")