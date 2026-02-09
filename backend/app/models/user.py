from sqlalchemy import (
    Column,
    BigInteger,
    Enum,
    Text,
    String,
    Boolean,
    TIMESTAMP,
    CheckConstraint,
)
from sqlalchemy.sql import func

from app.core.database import Base
from sqlalchemy.orm import relationship
import enum

class UserTypes(str , enum.Enum):
    ADMIN="ADMIN"
    USER="USER"


class User(Base): 
    __tablename__ = "users"

    user_id = Column(BigInteger, primary_key=True, index=True)

    first_name = Column(Text, nullable=False)
    last_name = Column(Text)

    phone_no = Column(Text, nullable=False)

    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, index=True)

    # password_hash = Column(Text, nullable=False)
    user_role =Column(Enum(UserTypes,name="roles_of_users",create_type=False,native_enum=True),default=UserTypes.USER)
    gender = Column(
        Text,
        CheckConstraint(
            "gender IN ('male','female','other')",
            name="ck_users_gender"
        )
    )

    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)

    created_at = Column(
        TIMESTAMP(timezone=True),
        server_default=func.now()
    )
    updated_at = Column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    credentials = relationship( 
        "UserCredential",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )