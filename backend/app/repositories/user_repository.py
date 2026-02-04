from typing import Optional, List

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models.user import User
from app.models.user_credentials import UserCredential
from ..models.roles import Role
from ..models.user_roles import UserRole


class UserRepository:
    """
    Repository layer for User-related DB operations.
    This layer MUST NOT contain business logic.
    """

    # -------------------------
    # Create user
    # -------------------------
    @staticmethod
    def create_user(
        db: Session,
        user: User,
        credentials: UserCredential
    ) -> User:
        try:
            db.add(user)
            db.flush()  # get user_id from DB

            credentials.user_id = user.user_id
            db.add(credentials)

            db.commit()
            db.refresh(user)
            return user

        except IntegrityError:
            db.rollback()
            raise

    # -------------------------
    # Get user by ID
    # -------------------------
    @staticmethod
    def get_by_id(
        db: Session,
        user_id: int
    ) -> Optional[User]:
        return (
            db.query(User)
            .filter(User.user_id == user_id)
            .first() 
        )

    # -------------------------
    # Get user by email
    # -------------------------
    @staticmethod
    def get_by_email(
        db: Session,
        email: str,
        user_role : str 
    ) -> Optional[User]:
        return (
            db.query(User)
            .filter(User.email == email)
            .filter(User.user_role == user_role)
            .first()
        )

    @staticmethod
    def get_user_by_email(
        db: Session,
        email: str
    ) -> Optional[User]:
        return (
            db.query(User)
            .filter(User.email == email)
            .first()
        )

    # -------------------------
    # Get user by username
    # -------------------------
    @staticmethod
    def get_by_username(
        db: Session,
        username: str
    ) -> Optional[User]:
        return (
            db.query(User)
            .filter(User.username == username)
            .first()
        )

    # -------------------------
    # List users
    # -------------------------
    # @staticmethod
    # def list_users(
    #     db: Session,
    #     *,
    #     limit: int = 50,
    #     offset: int = 0
    # ) -> List[User]:
    #     return (
    #         db.query(User)
    #         .order_by(User.created_at.desc())
    #         .limit(limit)
    #         .offset(offset)
    #         .all()
    #     )
    
    @staticmethod
    def list_users(db: Session, limit: int = 50, offset: int = 0):
        return (
            db.query(User)
            .filter(User.is_deleted == False) # Only show active/inactive, not deleted
            .order_by(User.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
    )

    # -------------------------
    # Update user
    # -------------------------
    @staticmethod
    def update_user(
        db: Session,
        user: User
    ) -> User:
        try:
            db.add(user)
            db.commit()
            db.refresh(user)
            return user

        except IntegrityError:
            db.rollback()
            raise


# -------------------------
    # Permanent delete user
    # -------------------------
    @staticmethod
    def permanent_delete_user(
        db: Session,
        user: User
    ) -> None:
        deleted_user=db.query(User).filter(User.user_id==user.user_id).first()


        db.delete(deleted_user)
        db.commit()
