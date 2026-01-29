from datetime import datetime, timedelta

from sqlalchemy import insert
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.user_credentials import UserCredential
from app.repositories.user_repository import UserRepository
from app.services.user_service import UserService
from app.models.login_history import UserLoginHistory
from ..core.config import ACCESS_TOKEN_EXPIRE_MINUTES, create_access_token
from app.core.database import SessionLocal 

# Security constants
MAX_FAILED_ATTEMPTS = 5
LOCK_DURATION_MINUTES = 15


class AuthService:
    """
    Authentication & account security logic.
    No HTTP, no tokens here — only business rules.
    """

    @staticmethod
    def login_history_status(user_id: int, status: bool):
        """Creates an independent session to ensure the log persists."""
        db_log = SessionLocal()
        try:
            print(f"DEBUG: Attempting to log history for User: {user_id}, Status: {status}")
            new_history = UserLoginHistory(
                user_id=user_id,
                login_time=datetime.utcnow(),
                status=status
            )
            db_log.add(new_history)
            db_log.commit() 
            print("DEBUG: Log successfully committed to DB.")
        except Exception as e:
            print(f"ERROR logging history: {e}")
            db_log.rollback()
        finally:
            db_log.close()

    @staticmethod
    def authenticate(db: Session, email: str, password: str) -> User:
        user = UserRepository.get_user_by_email(db, email)

        # Case 1: User does not exist (Security: don't log to history as there is no ID)
        if not user:
            raise ValueError("Invalid credentials")

        user_id = user.user_id
        credentials = user.credentials
        
        # Case 2: Account Inactive
        if user.is_deleted or not user.is_active:
            AuthService.login_history_status(user_id, False) 
            raise ValueError("Account inactive")

        # Case 3: Account Locked
        if credentials.is_locked: 
            if credentials.locked_until and credentials.locked_until > datetime.utcnow():
                AuthService.login_history_status(user_id, False) 
                raise ValueError("Account is locked")
            else:
                credentials.is_locked = False
                db.commit()

        # Case 4: Password Incorrect
        if not UserService.verify_password(password, credentials.password_hash):
            # 🔥 IMPORTANT: Log the failure FIRST
            AuthService.login_history_status(user_id, False)
            
            # THEN update the failure counter in main DB
            AuthService._handle_failed_attempt(db, credentials) 
            raise ValueError("Invalid credentials")

        # Case 5: Success
        credentials.failed_attempts = 0
        credentials.last_failed_at = None
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
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "role": user_role
        }

    @staticmethod
    def _handle_failed_attempt(db: Session, credentials: UserCredential) -> None:
        """Updates counter in the main session."""
        credentials.failed_attempts += 1
        credentials.last_failed_at = datetime.utcnow()
        if credentials.failed_attempts >= 5:
            credentials.is_locked = True
            credentials.locked_until = datetime.utcnow() + timedelta(minutes=15)
        db.commit()

    @staticmethod
    def change_password(
        db: Session,
        *,
        user: User,
        old_password: str,
        new_password: str
    ) -> None:
        credentials = user.credentials
        if not credentials:
            raise ValueError("Credentials not found")

        if not UserService.verify_password(old_password, credentials.password_hash):
            raise ValueError("Old password is incorrect")

        credentials.password_hash = UserService.hash_password(new_password)
        credentials.password_set_at = datetime.utcnow()
        db.commit()

    # -------------------------
    # Handle failed login
    # -------------------------
    @staticmethod
    def _handle_failed_attempt(
        db: Session,
        credentials: UserCredential
    ) -> None:
        credentials.failed_attempts += 1
        credentials.last_failed_at = datetime.utcnow()

        AuthService.login_history_status(db, credentials.user_id    , False)
        if credentials.failed_attempts >= MAX_FAILED_ATTEMPTS:
            credentials.is_locked = True
            credentials.locked_until = (
                datetime.utcnow() + timedelta(minutes=LOCK_DURATION_MINUTES)
            )

        db.commit()

    # -------------------------
    # Change password
    # -------------------------
    # @staticmethod
    # def change_password(
    #     db: Session,
    #     *,
    #     user: User,
    #     old_password: str,
    #     new_password: str
    # ) -> None:
    #     credentials = user.credentials

    #     if not credentials:
    #         raise ValueError("Credentials not found")

    #     if not UserService.verify_password(
    #         old_password,
    #         credentials.password_hash
    #     ):
    #         raise ValueError("Old password is incorrect")

    #     credentials.password_hash = UserService.hash_password(new_password)
    #     credentials.password_set_at = datetime.utcnow()

    #     db.commit()
