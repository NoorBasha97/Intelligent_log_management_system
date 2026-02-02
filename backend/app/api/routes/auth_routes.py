from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_active_user
from app.schemas.auth import LoginHistoryList, LoginRequest, Token
from app.services.auth_service import AuthService
from app.models.login_history import UserLoginHistory
from app.models.user import User


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



@router.get("/login-history/me", response_model=LoginHistoryList)
def get_my_login_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_active_user)
):
    query = db.query(UserLoginHistory).filter(UserLoginHistory.user_id == current_user.user_id)
    
    # Get total count
    total = query.count()
    
    # Get items ordered by most recent
    items = query.order_by(desc(UserLoginHistory.login_time)).all()
    
    return {"total": total, "items": items}

