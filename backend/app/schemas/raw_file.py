from pydantic import BaseModel
from datetime import datetime


class RawFileResponse(BaseModel):
    file_id: int
    team_id: int | None
    uploaded_by: int | None
    original_name: str
    file_size_bytes: int
    format_id: int | None
    is_archived: bool
    uploaded_at: datetime

    class Config:
        from_attributes = True
