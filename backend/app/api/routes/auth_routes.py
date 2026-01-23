from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_active_user
from app.schemas.auth import LoginRequest, Token, PasswordChangeRequest
from app.services.auth_service import AuthService


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# -------------------------
# Login
# -------------------------
@router.post(
    "/login" ,
    response_model=Token  
)
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Authenticate user. 
    """
    try:
         # 1. Verify User
        user = AuthService.authenticate(db, payload.email, payload.password)
        print(user)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
    # 2. Create the Token and Return the dict
        return AuthService.create_token_response(email=user.email, user_role=user.user_role , user_id=user.user_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc)
        )


# -------------------------
# Change password
# -------------------------
@router.post(
    "/change-password",
    status_code=status.HTTP_204_NO_CONTENT
)
def change_password(
    payload: PasswordChangeRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_active_user)
):
    """
    Change password for authenticated user.
    """
    try:
        AuthService.change_password(
            db,
            user=current_user,
            old_password=payload.old_password,
            new_password=payload.new_password
        )
        return None
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        )
