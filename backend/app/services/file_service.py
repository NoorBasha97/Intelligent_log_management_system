from typing import Optional
from pathlib import Path

from sqlalchemy.orm import Session

from app.models.raw_file import RawFile
from app.repositories.file_repository import FileRepository
from app.repositories.team_repository import TeamRepository
from app.services.team_service import TeamService
from app.services.role_service import RoleService


class FileService:
    """
    Service layer for file ingestion metadata.
    Handles team ownership, validation, and metadata creation.
    """

    # -------------------------
    # Detect file format
    # -------------------------
    @staticmethod
    def detect_format(filename: str) -> Optional[str]:
        ext = Path(filename).suffix.lower()

        if ext in {".log", ".txt"}:
            return "TEXT"
        if ext in {".json"}:
            return "JSON"
        if ext in {".csv"}:
            return "CSV"

        return None

    # -------------------------
    # Upload file (metadata only)
    # -------------------------
    @staticmethod
    def upload_file(
        db: Session,
        *,
        user_id: int,
        filename: str,
        file_size_bytes: int,
        category_id: Optional[int] = None
    ) -> RawFile:

        # 1. Check permission
        if not RoleService.user_has_permission(
            db,
            user_id=user_id,
            permission_key="UPLOAD_LOG"
        ):
            raise ValueError("Permission denied")

        # 2. Get user's active team
        team = TeamService.get_active_team_for_user(
            db,
            user_id=user_id
        )

        # 3. Detect format
        format_name = FileService.detect_format(filename)

        # NOTE:
        # Mapping format_name → format_id
        # will be done later via lookup service
        format_id = None

        # 4. Create raw file record
        raw_file = RawFile(
            team_id=team.team_id,
            uploaded_by=user_id,
            original_name=filename,
            file_size_bytes=file_size_bytes,
            format_id=format_id,
            category_id=category_id
        )

        return FileRepository.create_file(db, raw_file)
