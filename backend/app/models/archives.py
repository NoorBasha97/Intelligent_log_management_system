from sqlalchemy import (
    Column,
    BigInteger,
    Integer,
    TIMESTAMP,
    ForeignKey
)
from sqlalchemy.sql import func

from app.core.database import Base


class Archive(Base):
    __tablename__ = "archives"

    archive_id = Column(BigInteger, primary_key=True, index=True)

    file_id = Column(
        BigInteger,
        ForeignKey("raw_files.file_id"),
        nullable=False,
        index=True
    )

    archived_on = Column(
        TIMESTAMP(timezone=True),
        server_default=func.now()
    )

    total_records = Column(
        Integer
    )
