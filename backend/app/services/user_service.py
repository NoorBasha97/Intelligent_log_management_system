from typing import Optional, List

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from passlib.context import CryptContext

from app.models.user import User
from app.models.user_credentials import UserCredential
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate, UserUpdate

 
# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class UserService:
    """
    Service layer for user-related business logic.
    Handles validation, transactions, and orchestration.
    """

    # -------------------------
    # Password helpers
    # -------------------------
    @staticmethod
    def hash_password(password: str) -> str:
        return pwd_context.hash(password)

    @staticmethod
    def verify_password(
        plain_password: str,
        hashed_password: str
    ) -> bool:
        return pwd_context.verify(plain_password, hashed_password)

    # -------------------------
    # Create user (SIGNUP)
    # -------------------------
    @staticmethod
    def create_user(
        db: Session,
        user_data: UserCreate
    ) -> User:
        """
        Creates a user and corresponding credentials.
        This method is ATOMIC:
        - User is created first
        - Credentials are created only if user insert succeeds
        """

        # 1. Uniqueness checks
        if UserRepository.get_user_by_email(db, user_data.email):
            raise ValueError("Email already registered")

        if user_data.username:
            if UserRepository.get_by_username(db, user_data.username):
                raise ValueError("Username already taken")
      
        # 2. Create User object (NO password here)
        user = User(
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            phone_no=user_data.phone_no,
            email=user_data.email,
            username=user_data.username,
            gender=user_data.gender,  # must match DB constraint
            user_role = user_data.user_role
        )

        # 3. Insert USER first (this is where gender constraint is checked)
        try:
            db.add(user)
            db.flush()  # user_id generated ONLY if insert succeeds
        except IntegrityError as exc:
            db.rollback()
            raise ValueError(f"User creation failed: {exc}")

        # 4. ONLY AFTER user insert succeeds → create credentials
        password_hash = UserService.hash_password(user_data.password)

        credentials = UserCredential(
            user_id=user.user_id,
            password_hash=password_hash
        )

        try:
            db.add(credentials)
            db.commit()
            db.refresh(user)
            return user
        except IntegrityError as exc:
            db.rollback()
            raise ValueError(f"Credential creation failed: {exc}")

    # -------------------------
    # Get user by ID
    # -------------------------
    @staticmethod
    def get_user_by_id(
        db: Session,
        user_id: int
    ) -> Optional[User]:
        return UserRepository.get_by_id(db, user_id)

    # -------------------------
    # List users (ADMIN)
    # -------------------------
    @staticmethod
    def list_users(
        db: Session,
        *,
        limit: int = 50,
        offset: int = 0
    ) -> List[User]:
        return UserRepository.list_users(
            db,
            limit=limit,
            offset=offset
        )

    # -------------------------
    # Update user (SELF)
    # -------------------------
    @staticmethod
    def update_user(
        db: Session,
        user: User,
        update_data: UserUpdate
    ) -> User:
        update_dict = update_data.model_dump(exclude_unset=True)
        
        for field, value in update_dict.items():
            setattr(user, field, value)
        

        try:
            db.commit()
            db.refresh(user)
            return user
        except IntegrityError:
            db.rollback()
            raise ValueError("User update failed")

    # -------------------------
    # permanent delete user (ADMIN)
    # -------------------------
    @staticmethod
    def delete_user(
        db: Session,
        user: User
    ) -> None:
        UserRepository.permanent_delete_user(db, user)
