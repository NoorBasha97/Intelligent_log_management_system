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

    # -------------------------
    # Assign role to user
    # -------------------------
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

    # -------------------------
    # Get active role for user
    # -------------------------
    @staticmethod
    def get_active_role_for_user(
        db: Session,
        *,
        user_id: int
    ) -> Role:

        mapping = UserRoleRepository.get_active_role(db, user_id)
        if not mapping:
            raise ValueError("User has no active role")

        role = RoleRepository.get_role_by_id(db, mapping.role_id)
        if not role:
            raise ValueError("Active role not found")

        return role

    # -------------------------
    # Get permissions for user
    # -------------------------
    @staticmethod
    def get_permissions_for_user(
        db: Session,
        *,
        user_id: int
    ) -> List[str]:

        mapping = UserRoleRepository.get_active_role(db, user_id)
        if not mapping:
            return []

        permissions = RoleRepository.list_permissions_for_role(
            db,
            mapping.role_id
        )

        return [perm.permission_key for perm in permissions]

    # -------------------------
    # Check permission
    # -------------------------
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

        # 2. ENUM CHECK: If user is ADMIN, they get all permissions
        if user.user_role == "ADMIN":
            return True

        # 3. (Optional) Legacy/User check: 
        # If they are a 'USER', you can either return False 
        # or keep the table-based lookup for specific limited actions
        return False
