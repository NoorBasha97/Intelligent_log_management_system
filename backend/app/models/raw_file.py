from sqlalchemy import (
    Column,
    BigInteger,
    SmallInteger,
    Boolean,
    ForeignKey,
    String,
    TIMESTAMP
)
from sqlalchemy.sql import func

from app.core.database import Base
from . import file_formats

class RawFile(Base):
    __tablename__ = "raw_files"

    file_id = Column(BigInteger, primary_key=True, index=True)

    team_id = Column(
        BigInteger,
        ForeignKey("teams.team_id"),
        nullable=True
    )

    uploaded_by = Column(
        BigInteger, 
        ForeignKey("users.user_id"),
        nullable=True
    )

    original_name = Column(String(255), nullable=False)

    file_size_bytes = Column(BigInteger, nullable=False)

    format_id = Column(
        SmallInteger,
        ForeignKey("file_formats.format_id"), 
        nullable=True
    )

    is_archived = Column(Boolean, default=False)

    uploaded_at = Column(
        TIMESTAMP(timezone=True),
        server_default=func.now()
    )
