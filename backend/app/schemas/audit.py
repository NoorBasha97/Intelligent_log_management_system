from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class AuditTrailResponse(BaseModel):
    action_id: int
    user_id: Optional[int]
    username: Optional[str]
    action_type: str
    action_time: datetime

    class Config:
        from_attributes = True

class AuditTrailList(BaseModel):
    total: int
    items: List[AuditTrailResponse]