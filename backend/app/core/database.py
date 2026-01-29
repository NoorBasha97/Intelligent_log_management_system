import os
from dotenv import load_dotenv

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from sqlalchemy import event, text
from sqlalchemy.orm import Session
import urllib
from .config import settings
# Load environment variables from .env
# load_dotenv()

password = urllib.parse.quote_plus(settings.DB_PASSWORD)

DATABASE_URL = (
    f"postgresql+psycopg2://{settings.DB_USER}:{password}@"
    f"{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}?sslmode=require"
)

# Read DATABASE_URL
# DATABASE_URL = os.getenv("DATABASE_URL")


if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set in .env file")

# Create SQLAlchemy engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"sslmode": "require"},
    pool_pre_ping=True
)

# Create session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base class for all ORM models
Base = declarative_base()


# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        

