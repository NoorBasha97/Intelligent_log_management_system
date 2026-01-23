from sqlalchemy import (
    Column,
    BigInteger,
    String,
    TIMESTAMP
)
from sqlalchemy.sql import func

from app.core.database import Base


class Team(Base):
    __tablename__ = "teams"

    team_id = Column(BigInteger, primary_key=True, index=True)

    team_name = Column(String(150), unique=True, nullable=False, index=True)

    created_at = Column(
        TIMESTAMP(timezone=True),
        server_default=func.now()
    )
