from sqlalchemy import (
    Column,
    SmallInteger,
    String
)

from app.core.database import Base


class Permission(Base):
    __tablename__ = "permissions"

    permission_id = Column(SmallInteger, primary_key=True, index=True)

    permission_key = Column(String(100), unique=True, nullable=False, index=True)
