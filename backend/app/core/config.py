from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import jwt

# Settings - In production, move these to your config/env file
SECRET_KEY = "your-very-secret-key-change-me" 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 300

def create_access_token(data: dict) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = data.copy()
    payload.update({"exp": expire})
    encoded_jwt = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt   # ✅ ONLY STRING
