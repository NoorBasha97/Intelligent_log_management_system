from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field


# =========================
# File upload metadata (response)
# =========================
class FileUploadResponse(BaseModel):
    file_id: int
    original_name: str
    file_size_bytes: int

    format: Optional[str]
    category: Optional[str]

    uploaded_at: datetime
    is_archived: bool

    class Config:
        from_attributes = True


# =========================
# File list item
# =========================
class FileListItem(BaseModel):
    file_id: int
    original_name: str
    file_size_bytes: int
    is_archived: bool
    uploaded_at: datetime
    # Joined fields
    uploader_name: Optional[str] = None
    team_name: Optional[str] = None
    format_name: Optional[str] = None

    class Config:
        from_attributes = True

class FileListResponse(BaseModel):
    total: int
    items: List[FileListItem]

# =========================
# File filter (query params)
# =========================
class FileFilter(BaseModel):
    category: Optional[str] = Field(
        None,
        description="Filter by log category"
    )

    format: Optional[str] = Field(
        None,
        description="Filter by file format"
    )

    is_archived: Optional[bool] = Field(
        None,
        description="Filter archived / active files"
    )

    uploaded_after: Optional[datetime] = Field(
        None,
        description="Files uploaded after this time"
    )

    uploaded_before: Optional[datetime] = Field(
        None,
        description="Files uploaded before this time"
    )

    limit: int = Field(
        50,
        ge=1,
        le=500,
        description="Maximum number of files to return"
    )

    offset: int = Field(
        0,
        ge=0,
        description="Pagination offset"
    )
