
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


# =========================
# Audit query parameters
# =========================
class AuditQueryParams(BaseModel):
    user_id: Optional[int] = Field(None, gt=0)
    action_type: Optional[str] = None

    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None

    limit: int = Field(100, ge=1, le=1000)
    offset: int = Field(0, ge=0)


# =========================
# Audit response
# =========================
class AuditResponse(BaseModel):
    action_id: int
    user_id: Optional[int]
    action_type: str
    action_time: datetime

    model_config = {
        "from_attributes": True
    }


# =========================
# Audit list response
# =========================
class AuditListResponse(BaseModel):
    total: int
    items: List[AuditResponse]
