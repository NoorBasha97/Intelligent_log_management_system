from sqlalchemy import (
    Column,
    SmallInteger,
    ForeignKey
)

from app.core.database import Base


class RolePermission(Base):
    __tablename__ = "role_permissions"

    role_id = Column(
        SmallInteger,
        ForeignKey("roles.role_id", ondelete="CASCADE"),
        primary_key=True
    )

    permission_id = Column(
        SmallInteger,
        ForeignKey("permissions.permission_id", ondelete="CASCADE"),
        primary_key=True
    )
