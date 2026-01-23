from sqlalchemy import (
    Column,
    SmallInteger,
    String
)

from app.core.database import Base 


class FileFormat(Base):
    __tablename__ = "file_formats"
 
    format_id = Column(SmallInteger, primary_key=True, index=True)

    format_name = Column(String(20), unique=True, nullable=False, index=True)
