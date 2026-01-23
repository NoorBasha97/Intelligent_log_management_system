from sqlalchemy import (
    Column,
    BigInteger,
    String,
    TIMESTAMP,
    ForeignKey
)
from sqlalchemy.sql import func

from app.core.database import Base


class AuditTrail(Base):
    __tablename__ = "audit_trail"

    action_id = Column(BigInteger, primary_key=True, index=True)

    user_id = Column(
        BigInteger,
        ForeignKey("users.user_id"),
        nullable=True,
        index=True
    )

    action_type = Column(
        String(50),
        nullable=False
    )

    action_time = Column(
        TIMESTAMP(timezone=True),
        server_default=func.now()
    )
