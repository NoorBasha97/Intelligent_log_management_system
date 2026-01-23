from sqlalchemy import (
    Column,
    BigInteger,
    SmallInteger,
    Boolean,
    TIMESTAMP,
    ForeignKey
)
from sqlalchemy.sql import func

from app.core.database import Base


class UserRole(Base):
    __tablename__ = "user_roles"

    user_id = Column(
        BigInteger,
        ForeignKey("users.user_id", ondelete="CASCADE"),
        primary_key=True
    )

    role_id = Column(
        SmallInteger,
        ForeignKey("roles.role_id", ondelete="CASCADE"),
        primary_key=True
    )

    assigned_at = Column(
        TIMESTAMP(timezone=True),
        server_default=func.now()
    )
