from sqlalchemy import (
    Column,
    SmallInteger,
    String,
    Text
)

from app.core.database import Base


class Role(Base):
    __tablename__ = "roles"

    role_id = Column(SmallInteger, primary_key=True, index=True)

    role_name = Column(String(50), unique=True, nullable=False, index=True)

    description = Column(Text)
