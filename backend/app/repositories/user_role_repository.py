from typing import Optional

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models.user_roles import UserRole


class UserRoleRepository:
    """
    Repository for user <-> role mapping (RBAC).
    Handles DB-level operations only.
    """

    # -------------------------
    # Get active role for user
    # -------------------------
    @staticmethod
    def get_active_role(
        db: Session,
        user_id: int
    ) -> Optional[UserRole]:
        return (
            db.query(UserRole)
            .filter(
                UserRole.user_id == user_id
            )
            .first()
        )

    # -------------------------
    # Assign role to user
    # -------------------------
    @staticmethod
    def assign_role_to_user(
        db: Session,
        user_role: UserRole
    ) -> UserRole:
        """
        Assumes existing active role (if any)
        is already revoked at service layer.
        """
        try:
            db.add(user_role)
            db.commit()
            db.refresh(user_role)
            return user_role

        except IntegrityError:
            db.rollback()
            raise

    # -------------------------
    # Revoke active role
    # -------------------------
    @staticmethod
    def revoke_active_role(
        db: Session,
        user_role: UserRole
    ) -> None:
        user_role.is_active = False
        user_role.revoked_at = None

        db.add(user_role)
        db.commit()

    # -------------------------
    # Get role mapping by user & role
    # -------------------------
    @staticmethod
    def get_by_user_and_role(
        db: Session,
        user_id: int,
        role_id: int
    ) -> Optional[UserRole]:
        return (
            db.query(UserRole)
            .filter(
                UserRole.user_id == user_id,
                UserRole.role_id == role_id
            )
            .first()
        )
