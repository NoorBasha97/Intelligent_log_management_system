from typing import Optional, List

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import and_, func

from app.models.raw_file import RawFile
from sqlalchemy import or_
from sqlalchemy.orm import joinedload
from app.models.raw_file import RawFile
from app.models.user import User
from app.models.teams import Team
from app.models.file_formats import FileFormat
from app.models.log_entries import LogEntry, LogSeverity, LogCategory, Environment


class FileRepository:
    # Create raw file record
    @staticmethod
    def create_file(
        db: Session,
        file: RawFile
    ) -> RawFile:
        try:
            db.add(file)
            db.commit()
            db.refresh(file)
            return file

        except IntegrityError:
            db.rollback()
            raise

    # Get file by ID
    @staticmethod
    def get_by_id(
        db: Session,
        file_id: int
    ) -> Optional[RawFile]:
        return (
            db.query(RawFile)
            .filter(RawFile.file_id == file_id)
            .first()
        )

    @staticmethod
    def list_files(db: Session, *, team_id=None, search=None, severity=None, 
                   environment=None, category=None, start_date=None, 
                   limit=50, offset=0):
        
        # Base query with Joins to get names for the UI
        query = db.query(
            RawFile,
            User.username.label("uploader_name"),
            Team.team_name.label("team_name"),
            FileFormat.format_name.label("format_name")
        ).join(User, RawFile.uploaded_by == User.user_id, isouter=True) \
         .join(Team, RawFile.team_id == Team.team_id, isouter=True) \
         .join(FileFormat, RawFile.format_id == FileFormat.format_id, isouter=True)

        # Filter by Team (If provided by Admin or forced for User)
        if team_id:
            query = query.filter(RawFile.team_id == team_id)

        # Search by Filename
        if search:
            query = query.filter(RawFile.original_name.ilike(f"%{search}%"))

        # Filter by Date
        if start_date:
            query = query.filter(func.date(RawFile.uploaded_at) == start_date)

        # Joins for Log Content (Only if these filters are active)
        if severity or environment or category:
            query = query.join(LogEntry, LogEntry.file_id == RawFile.file_id)
            if severity:
                query = query.join(LogSeverity).filter(LogSeverity.severity_code == severity)
            if environment:
                query = query.join(Environment).filter(Environment.environment_code == environment)
            if category:
                query = query.join(LogCategory).filter(LogCategory.category_name == category)

        # Group by File ID to avoid duplicates from log joins
        query = query.group_by(RawFile.file_id, User.username, Team.team_name, FileFormat.format_name)

        results = query.order_by(RawFile.uploaded_at.desc()).limit(limit).offset(offset).all()
        
        items = []
        for row in results:
            f = row[0]
            f.uploader_name = row.uploader_name
            f.team_name = row.team_name
            f.format_name = row.format_name
            items.append(f)
            
        return items
    
    # Count files (for pagination)
    @staticmethod
    def count_files(
        db: Session,
        *,
        team_id: Optional[int] = None, 
        category_id: Optional[int] = None,
        format_id: Optional[int] = None,
        is_archived: Optional[bool] = None,
        uploaded_after=None,
        uploaded_before=None
    ) -> int:

        query = db.query(RawFile)

        if team_id is not None:
            query = query.filter(RawFile.team_id == team_id)
            
        if category_id is not None:
            query = query.filter(RawFile.category_id == category_id)

        if format_id is not None:
            query = query.filter(RawFile.format_id == format_id)

        if is_archived is not None:
            query = query.filter(RawFile.is_archived == is_archived)

        if uploaded_after is not None:
            query = query.filter(RawFile.uploaded_at >= uploaded_after)

        if uploaded_before is not None:
            query = query.filter(RawFile.uploaded_at <= uploaded_before)

        return query.count()
