from typing import Optional, List

from sqlalchemy.orm import Session

from app.models.roles import Role
from app.models.permissions import Permission
# from app.models.role_permissions import RolePermission


class RoleRepository:
    """
    Repository for RBAC lookup data:
    - roles
    - permissions
    - role-permission mappings
    """

    # Roles
    @staticmethod
    def get_role_by_id(
        db: Session,
        role_id: int
    ) -> Optional[Role]:
        return (
            db.query(Role)
            .filter(Role.role_id == role_id)
            .first()
        )

    @staticmethod
    def get_role_by_name(
        db: Session,
        role_name: str
    ) -> Optional[Role]:
        return (
            db.query(Role)
            .filter(Role.role_name == role_name)
            .first()
        )

    @staticmethod
    def list_roles(
        db: Session
    ) -> List[Role]:
        return (
            db.query(Role)
            .order_by(Role.role_name.asc())
            .all()
        )


    # Permissions
    @staticmethod
    def get_permission_by_key(
        db: Session,
        permission_key: str
    ) -> Optional[Permission]:
        return (
            db.query(Permission)
            .filter(Permission.permission_key == permission_key)
            .first()
        )

    @staticmethod
    def list_permissions(
        db: Session
    ) -> List[Permission]:
        return (
            db.query(Permission)
            .order_by(Permission.permission_key.asc())
            .all()
        )

