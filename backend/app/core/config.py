from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import jwt

# Settings - In production, move these to your config/env file
# SECRET_KEY = "your-very-secret-key-change-me" 
# ALGORITHM = "HS256"
# ACCESS_TOKEN_EXPIRE_MINUTES = 300

def create_access_token(data: dict) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = data.copy()
    payload.update({"exp": expire})
    encoded_jwt = jwt.encode(payload,settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt   #  ONLY STRING


from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # Database Settings
    DB_USER: str
    DB_PASSWORD: str
    DB_HOST: str
    DB_PORT: int
    DB_NAME: str
    # DATABASE_URL: str
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 300
 
    # Add this field so the property below works
    CORS_ORIGINS: str = "http://localhost:5173,https://intelligent-log-system.vercel.app,http://localhost:8000,https://intelligent-log-management-system.onrender.com,http://192.168.0.193:5173,http://127.0.0.1:8000"
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

settings = Settings()




