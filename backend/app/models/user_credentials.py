from sqlalchemy import (
    Column,
    BigInteger,
    Integer,
    Boolean,
    TIMESTAMP,
    ForeignKey,
    String
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base 


class UserCredential(Base):
    __tablename__ = "user_credentials"

    credential_id = Column(BigInteger, primary_key=True, index=True)

    user_id = Column(
        BigInteger,
        ForeignKey("users.user_id", ondelete="CASCADE"),
        unique=True,
        nullable=False
    )

    password_hash = Column(String(255), nullable=False)  # ✅ ADD THIS

    failed_attempts = Column(Integer, default=0)

    last_failed_at = Column(TIMESTAMP(timezone=True))

    is_locked = Column(Boolean, default=False)

    locked_until = Column(TIMESTAMP(timezone=True))

    password_set_at = Column(
        TIMESTAMP(timezone=True),
        server_default=func.now()
    )

    created_at = Column(
        TIMESTAMP(timezone=True),
        server_default=func.now()
    )
     # This attribute must be named 'user' because User.credentials 
    # uses back_populates="user"
    user = relationship("User", back_populates="credentials")