from typing import List

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models.user_roles import UserRole
from app.models.roles import Role
from app.repositories.user_role_repository import UserRoleRepository
from app.repositories.role_repository import RoleRepository
from app.repositories.user_repository import UserRepository


class RoleService:
    """
    Service layer for RBAC logic.
    Enforces one active role per user.
    """

    # Assign role to user
    @staticmethod
    def assign_role_to_user(
        db: Session,
        *,
        user_id: int,
        role_name: str
    ) -> UserRole:

        # 1. Validate user
        user = UserRepository.get_by_id(db, user_id)
        if not user or user.is_deleted or not user.is_active:
            raise ValueError("Invalid user")

        # 2. Validate role
        role = RoleRepository.get_role_by_name(db, role_name)
        if not role:
            raise ValueError("Role not found")

        # 3. Revoke existing active role (if any)
        active_role = UserRoleRepository.get_active_role(db, user_id)
        if active_role:
            UserRoleRepository.revoke_active_role(
                db,
                active_role
            )

        # 4. Assign new role
        user_role = UserRole(
            user_id=user_id,
            role_id=role.role_id,
            is_active=True
        )

        try:
            return UserRoleRepository.assign_role_to_user(
                db,
                user_role
            )
        except IntegrityError:
            raise ValueError("Role assignment failed")


    # Check permission
    @staticmethod
    def user_has_permission(
        db: Session,
        *,
        user_id: int,
        permission_key: str
    ) -> bool:
        user = UserRepository.get_by_id(db, user_id)
        
        if not user:
            return False

        if user.user_role == "ADMIN":
            return True


        return False
