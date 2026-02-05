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


class UserLoginHistory(Base):
    __tablename__ = "user_login_history"

    login_id = Column(BigInteger, primary_key=True, index=True)

    user_id = Column(
        BigInteger,
        ForeignKey("users.user_id", ondelete="CASCADE"),
        unique=False, # 🔥 CHANGE THIS TO False (or remove it)
        nullable=False
    )

    login_time = Column(
        TIMESTAMP(timezone=True),
        server_default=func.now()
    )
  
    status = Column(
        Boolean
    )
    user = relationship("User")