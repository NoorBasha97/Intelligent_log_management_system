from typing import Generator

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import text
from sqlalchemy.orm import Session
from jose import jwt, JWTError

from app.core.database import SessionLocal, get_db
from ..models.user import User
from app.repositories.user_repository import UserRepository
from app.services.role_service import RoleService
from app.core.config import ALGORITHM, SECRET_KEY




# -------------------------
# JWT Security scheme
# -------------------------
security = HTTPBearer()


# -------------------------
# Get current user (JWT-based)
# -------------------------
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    token = credentials.credentials

    try:
        payload = jwt.decode( 
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
        email: str | None = payload.get("sub")
        role : str | None = payload.get("role")
        user_id : int | None = payload.get("user_id")
        db.execute(
    text("SET LOCAL app.current_user_id = :v_user_id"),
    {"v_user_id": str(user_id)}
)

        
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

    user = UserRepository.get_by_email(db, email=email , user_role=role)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    user.db=db
    return user


# -------------------------
# Active & authenticated user
# -------------------------
def get_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.is_deleted or not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user

def get_db_with_user(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # 🔥 THIS LINE FIXES THE NULL USER ID
    # It tells Postgres: "For this connection, the user is X"
    db.execute(text(f"SET app.current_user_id = '{current_user.user_id}'"))
    return db
# -------------------------
# Permission guard
# -------------------------
def require_permission(permission_key: str):

    def _permission_guard(
        current_user: User = Depends(get_active_user),
    ) -> User:

        has_permission = RoleService.user_has_permission(
            current_user.db,
            user_id=current_user.user_id,
            permission_key=permission_key
        )

        if not has_permission:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission denied"
            )

        return current_user

    return _permission_guard
