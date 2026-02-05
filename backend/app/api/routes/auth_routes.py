from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_active_user, require_permission
from app.schemas.auth import LoginHistoryList, LoginRequest, Token
from app.services.auth_service import AuthService
from app.models.login_history import UserLoginHistory
from app.models.user import User
from sqlalchemy.orm import joinedload

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


# backend/app/api/routes/auth_routes.py

@router.get("/login-history/all", response_model=LoginHistoryList)
def get_all_login_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("MANAGE_USERS")),
    limit: int = 100,
    offset: int = 0
):
    # Fetch History and Join User automatically
    query = db.query(UserLoginHistory).options(joinedload(UserLoginHistory.user))
    
    total = query.count()
    
    # Get the items
    db_items = query.order_by(UserLoginHistory.login_time.desc()).offset(offset).limit(limit).all()

    # Manually build the response list to ensure username is mapped correctly
    items = []
    for item in db_items:
        items.append({
            "login_id": item.login_id,
            "login_time": item.login_time,
            "status": item.status,
            "username": item.user.username if item.user else "Deleted User"
        })

    return {"total": total, "items": items}