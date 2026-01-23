from typing import List, Optional
from datetime import datetime

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models.log_entries import LogEntry
from app.repositories.log_repository import LogRepository
from app.repositories.file_repository import FileRepository
from app.services.team_service import TeamService
from app.services.role_service import RoleService



class LogService:
    """
    Service layer for log ingestion and querying.
    Handles validation, permissions, and deduplication strategy.
    """

    # -------------------------
    # Add single log entry
    # -------------------------
    @staticmethod
    def add_log_entry(
        db: Session,
        *,
        user_id: int,
        file_id: int,
        log_timestamp: datetime,
        message_line: str,
        severity_id: Optional[int] = None,
        category_id: Optional[int] = None,
        environment_id: Optional[int] = None
    ) -> LogEntry:

        # 1. Permission check
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

        # 3. Validate file ownership
        raw_file = FileRepository.get_by_id(db, file_id)
        if not raw_file:
            raise ValueError("File not found")

        if raw_file.team_id != team.team_id:
            raise ValueError("File does not belong to user's team")

        if raw_file.is_archived:
            raise ValueError("Cannot add logs to archived file")

        # 4. Create log entry
        log = LogEntry(
            file_id=file_id,
            log_timestamp=log_timestamp,
            severity_id=severity_id,
            category_id=category_id,
            environment_id=environment_id,
            message_line=message_line
        )

        try:
            db.add(log)
            db.commit()
            db.refresh(log)
            return log

        except IntegrityError:
            db.rollback()
            raise ValueError("Failed to insert log entry")

    # -------------------------
    # Bulk insert logs
    # -------------------------
    @staticmethod
    def bulk_add_logs(
        db: Session,
        *,
        user_id: int,
        file_id: int,
        logs: List[dict]
    ) -> int:
        """
        Insert logs in bulk.
        `logs` must be a list of dicts with:
        - log_timestamp
        - message_line
        - optional severity_id, category_id, environment_id
        """

        # Permission & ownership checks (same as single insert)
        if not RoleService.user_has_permission(
            db,
            user_id=user_id,
            permission_key="UPLOAD_LOG"
        ):
            raise ValueError("Permission denied")

        team = TeamService.get_active_team_for_user(
            db,
            user_id=user_id
        )

        raw_file = FileRepository.get_by_id(db, file_id)
        if not raw_file or raw_file.team_id != team.team_id:
            raise ValueError("Invalid file or team mismatch")

        if raw_file.is_archived:
            raise ValueError("Cannot add logs to archived file")

        # Prepare ORM objects
        entries: List[LogEntry] = []

        for item in logs:
            entry = LogEntry(
                file_id=file_id,
                log_timestamp=item["log_timestamp"],
                message_line=item["message_line"],
                severity_id=item.get("severity_id"),
                category_id=item.get("category_id"),
                environment_id=item.get("environment_id"),
            )
            entries.append(entry)

        try:
            db.bulk_save_objects(entries)
            db.commit()
            return len(entries)

        except IntegrityError:
            db.rollback()
            raise ValueError("Bulk log insertion failed")

    # -------------------------
    # Query logs
    # -------------------------
    @staticmethod
    def query_logs(
        db: Session,
        user_id: int,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        severity_code: Optional[str] = None,
        category_name: Optional[str] = None,
        environment_code: Optional[str] = None,
        file_id: Optional[int] = None,
        search: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> dict:

        # Permission check
        if not RoleService.user_has_permission(
            db,
            user_id=user_id,
            permission_key="VIEW_LOG"
        ):
            raise ValueError("Permission denied")

        team = TeamService.get_active_team_for_user(
            db,
            user_id=user_id
        )

        logs = LogRepository.list_logs(
            db,
            team_id=team.team_id,
            start_date=start_date,
            end_date=end_date,
            severity_code=severity_code,
            category_name=category_name,
            environment_code=environment_code,
            file_id=file_id,
            search=search,
            limit=limit,
            offset=offset
        )

        total = LogRepository.count_logs(
            db,
            team_id=team.team_id
        )

        return {
            "total": total,
            "items": logs
        }
