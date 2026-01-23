from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models.user import User
from app.models.user_credentials import UserCredential
from app.repositories.user_repository import UserRepository
from app.services.user_service import UserService
from ..core.config import ACCESS_TOKEN_EXPIRE_MINUTES, create_access_token


# Security constants
MAX_FAILED_ATTEMPTS = 5
LOCK_DURATION_MINUTES = 15


class AuthService:
    """
    Authentication & account security logic.
    No HTTP, no tokens here — only business rules.
    """

    # -------------------------
    # Authenticate user
    # -------------------------
    @staticmethod
    def authenticate(
        db: Session,
        email: str,
        password: str
    ) -> User:
        # 1. Fetch user
        user = UserRepository.get_user_by_email(db, email)

        if not user or user.is_deleted or not user.is_active:
            raise ValueError("Invalid credentials")
 
        credentials = user.credentials  # relationship

        if not credentials:
            raise ValueError("Credentials not found")

        # 2. Check account lock
        if credentials.is_locked:
            if credentials.locked_until and credentials.locked_until > datetime.utcnow():
                raise ValueError("Account is locked. Try later.")
            else:
                # Auto-unlock after lock duration
                credentials.is_locked = False
                credentials.failed_attempts = 0
                credentials.locked_until = None
                db.commit()

        # 3. Verify password
        if not UserService.verify_password(password, credentials.password_hash):
            AuthService._handle_failed_attempt(db, credentials)
            raise ValueError("Invalid credentials")

        # 4. Successful login → reset counters
        credentials.failed_attempts = 0
        credentials.last_failed_at = None
        db.commit()

        return user
    
    @staticmethod
    def create_token_response(email, user_role,user_id):
       
       
        # Create JWT (STRING ONLY)
        access_token = create_access_token(
            data={"sub": email , "role":user_role , "user_id":user_id}
        )

        print(access_token)
        return {
            "access_token": access_token,             # ✅ string
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "role" : user_role
        }

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

        if credentials.failed_attempts >= MAX_FAILED_ATTEMPTS:
            credentials.is_locked = True
            credentials.locked_until = (
                datetime.utcnow() + timedelta(minutes=LOCK_DURATION_MINUTES)
            )

        db.commit()

    # -------------------------
    # Change password
    # -------------------------
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

        if not UserService.verify_password(
            old_password,
            credentials.password_hash
        ):
            raise ValueError("Old password is incorrect")

        credentials.password_hash = UserService.hash_password(new_password)
        credentials.password_set_at = datetime.utcnow()

        db.commit()
