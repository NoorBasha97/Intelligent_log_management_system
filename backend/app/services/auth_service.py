from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.user_credentials import UserCredential
from app.repositories.user_repository import UserRepository
from app.services.user_service import UserService
from app.models.login_history import UserLoginHistory
from ..core.config import settings, create_access_token
from app.core.database import SessionLocal 

# Security constants
MAX_FAILED_ATTEMPTS = 5
LOCK_DURATION_MINUTES = 15

class AuthService:

    @staticmethod
    def login_history_status(user_id: int, status: bool):
        """Creates an independent session to ensure the log persists even on login failure."""
        db_log = SessionLocal()
        try:
            new_history = UserLoginHistory(
                user_id=user_id,
                login_time=datetime.now(timezone.utc),
                status=status
            )
            db_log.add(new_history)
            db_log.commit() 
        except Exception as e:
            db_log.rollback()
        finally:
            db_log.close()

    @staticmethod
    def authenticate(db: Session, email: str, password: str) -> User:
        user = UserRepository.get_user_by_email(db, email)

        if not user:
            raise ValueError("Invalid credentials")

        user_id = user.user_id
        credentials = user.credentials
        
        if user.is_deleted or not user.is_active:
            AuthService.login_history_status(user_id, False) 
            raise ValueError("Account inactive")

        # Check account lock
        if credentials.is_locked: 
            if credentials.locked_until and credentials.locked_until > datetime.now(timezone.utc):
                AuthService.login_history_status(user_id, False) 
                raise ValueError("Account is locked")
            else:
                # Auto-unlock if time has passed
                credentials.is_locked = False
                credentials.failed_attempts = 0
                db.commit()

        # Verify password
        if not UserService.verify_password(password, credentials.password_hash):
            # 1. Log failure to history table first
            AuthService.login_history_status(user_id, False)
            
            # 2. Update failure counter in credentials table
            AuthService._handle_failed_attempt(db, credentials) 
            raise ValueError("Invalid credentials")

        # Successful login -> Reset counters
        credentials.failed_attempts = 0
        credentials.last_failed_at = None # reset to null
        credentials.locked_until=None # this also reset to null
        db.commit() 
        
        AuthService.login_history_status(user_id, True)
        return user
    
    @staticmethod
    def create_token_response(email, user_role, user_id):
        access_token = create_access_token(
            data={"sub": email, "role": user_role, "user_id": user_id}
        )
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "role": user_role
        }

    @staticmethod
    def _handle_failed_attempt(db: Session, credentials: UserCredential) -> None:
        """Updates failure counter and locks account if threshold reached."""
        credentials.failed_attempts += 1
        credentials.last_failed_at = datetime.now(timezone.utc)

        if credentials.failed_attempts >= MAX_FAILED_ATTEMPTS:
            credentials.is_locked = True
            credentials.locked_until = datetime.now(timezone.utc) + timedelta(minutes=LOCK_DURATION_MINUTES)
        
        # Save the counter update
        db.commit()

    # @staticmethod
    # def change_password(db: Session, *, user: User, old_password: str, new_password: str) -> None:
    #     credentials = user.credentials
    #     if not credentials:
    #         raise ValueError("Credentials not found")

    #     if not UserService.verify_password(old_password, credentials.password_hash):
    #         raise ValueError("Old password is incorrect")

    #     credentials.password_hash = UserService.hash_password(new_password)
    #     credentials.password_set_at = datetime.utcnow()
    #     db.commit()