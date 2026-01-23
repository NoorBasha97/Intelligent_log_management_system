from sqlalchemy import Column, BigInteger, SmallInteger, String, Text, ForeignKey, DateTime, Boolean
from sqlalchemy.sql import func
from app.core.database import Base

class LogSeverity(Base):
    __tablename__ = "log_severities"
    severity_id = Column(SmallInteger, primary_key=True)
    severity_code = Column(String(10), unique=True) 
 
class LogCategory(Base):
    __tablename__ = "log_categories"
    category_id = Column(SmallInteger, primary_key=True)
    category_name = Column(String(50), unique=True)

class Environment(Base):
    __tablename__ = "environments"
    environment_id = Column(SmallInteger, primary_key=True)
    environment_code = Column(String(20), unique=True)

class LogEntry(Base):
    __tablename__ = "log_entries"
    log_id = Column(BigInteger, primary_key=True, index=True)
    file_id = Column(BigInteger, ForeignKey("raw_files.file_id", ondelete="CASCADE"))
    log_timestamp = Column(DateTime(timezone=True), nullable=False)
    severity_id = Column(SmallInteger, ForeignKey("log_severities.severity_id"))
    category_id = Column(SmallInteger, ForeignKey("log_categories.category_id"))
    environment_id = Column(SmallInteger, ForeignKey("environments.environment_id"))
    message_line = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())