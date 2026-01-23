from sqlalchemy import (
    Column,
    BigInteger,
    Boolean,
    TIMESTAMP,
    ForeignKey
)
from sqlalchemy.sql import func

from app.core.database import Base


class UserTeam(Base):
    __tablename__ = "user_teams"

    user_id = Column(
        BigInteger,
        ForeignKey("users.user_id", ondelete="CASCADE"),
        primary_key=True
    )

    team_id = Column(
        BigInteger,
        ForeignKey("teams.team_id", ondelete="CASCADE"),
        primary_key=True
    )

    joined_at = Column(
        TIMESTAMP(timezone=True),
        server_default=func.now()
    )

    # is_active = Column(
    #     Boolean,
    #     default=True,
    #     nullable=False
    # )
 
    # left_at = Column(
    #     TIMESTAMP(timezone=True)
    # )
