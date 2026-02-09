from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


# Create single log entry
class LogCreate(BaseModel):
    file_id: int = Field(..., gt=0)
    log_timestamp: datetime
    message_line: str = Field(..., min_length=1)

    severity_id: Optional[int] = None
    category_id: Optional[int] = None
    environment_id: Optional[int] = None


# Bulk log entry
class LogBulkItem(BaseModel):
    log_timestamp: datetime
    message_line: str = Field(..., min_length=1)

    severity_id: Optional[int] = None
    category_id: Optional[int] = None
    environment_id: Optional[int] = None


class LogBulkCreate(BaseModel):
    file_id: int = Field(..., gt=0)
    logs: List[LogBulkItem]


# Log query parameters
class LogQueryParams(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

    severity_code: Optional[str] = None
    category_name: Optional[str] = None
    environment_code: Optional[str] = None
    search: Optional[str] = None
    file_id: Optional[int] = None

    limit: int = Field(100, ge=1, le=1000)
    offset: int = Field(0, ge=0)



    
    
class LogResponse(BaseModel):
    log_id: int
    log_timestamp: datetime
    message_line: str
    # Joined fields
    severity_code: Optional[str] = None
    category_name: Optional[str] = None
    environment_code: Optional[str] = None
    file_name: Optional[str] = None
    team_name: Optional[str] = None

    class Config:
        from_attributes = True

class LogListResponse(BaseModel):
    total: int
    items: List[LogResponse]
