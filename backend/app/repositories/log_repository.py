from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.log_entries import LogEntry, LogSeverity, LogCategory, Environment
from app.models.raw_file import RawFile
from app.models.teams import Team

class LogRepository:
    @staticmethod
    def list_logs(db: Session,team_id=None,start_date=None, end_date=None, severity_code=None,category_name=None, 
                  environment_code=None,file_id=None,search=None, 
                  limit=100, offset=0):
        
        query = db.query(
            LogEntry,
            LogSeverity.severity_code,
            LogCategory.category_name,
            Environment.environment_code,
            RawFile.original_name.label("file_name"),
            Team.team_name.label("team_name")
        ).join(LogSeverity, LogEntry.severity_id == LogSeverity.severity_id, isouter=True) \
         .join(LogCategory, LogEntry.category_id == LogCategory.category_id, isouter=True) \
         .join(Environment, LogEntry.environment_id == Environment.environment_id, isouter=True) \
         .join(RawFile, LogEntry.file_id == RawFile.file_id) \
         .join(Team, RawFile.team_id == Team.team_id, isouter=True)

        # Filters
        if team_id:
            query = query.filter(RawFile.team_id == team_id)
        if severity_code:
            query = query.filter(LogSeverity.severity_code == severity_code)
        if environment_code:
            query = query.filter(Environment.environment_code == environment_code)
        if category_name:
            query = query.filter(LogCategory.category_name == category_name)
        if search:
            query = query.filter(LogEntry.message_line.ilike(f"%{search}%"))
        if start_date:
            query = query.filter(func.date(LogEntry.log_timestamp) == start_date)

        results = query.order_by(LogEntry.log_timestamp.desc()).limit(limit).offset(offset).all()
        
        items = []
        for row in results:
            log_obj = row[0]
            log_obj.severity_code = row.severity_code
            log_obj.category_name = row.category_name
            log_obj.environment_code = row.environment_code
            log_obj.file_name = row.file_name
            log_obj.team_name = row.team_name
            items.append(log_obj)
            
        return items

    @staticmethod
    def count_logs(db: Session, team_id=None):
        query = db.query(func.count(LogEntry.log_id)).join(RawFile)
        if team_id:
            query = query.filter(RawFile.team_id == team_id)
        return query.scalar()