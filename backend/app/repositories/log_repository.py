from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.log_entries import LogEntry, LogSeverity, LogCategory, Environment
from app.models.raw_file import RawFile
from app.models.teams import Team

class LogRepository:
    @staticmethod
    def list_logs(db: Session, *, team_id=None, user_id=None, start_date=None, end_date=None, 
                  severity_code=None, category_name=None, environment_code=None, 
                  file_id=None, search=None, limit=100, offset=0):
        
        query = db.query(
            LogEntry,
            LogSeverity.severity_code,
            LogCategory.category_name,
            Environment.environment_code,
            RawFile.original_name.label("file_name"),
            Team.team_name.label("team_name") # Added this to prevent errors in UI
        ).join(RawFile, LogEntry.file_id == RawFile.file_id) \
         .outerjoin(LogSeverity, LogEntry.severity_id == LogSeverity.severity_id) \
         .outerjoin(LogCategory, LogEntry.category_id == LogCategory.category_id) \
         .outerjoin(Environment, LogEntry.environment_id == Environment.environment_id) \
         .outerjoin(Team, RawFile.team_id == Team.team_id)

        # 🔥 FIX: Using explicit keyword arguments to prevent "swapped" values
        query = LogRepository._apply_filters(
            query=query,
            team_id=team_id,
            user_id=user_id,
            start_date=start_date,
            end_date=end_date,
            severity_code=severity_code,
            category_name=category_name,
            environment_code=environment_code,
            file_id=file_id,
            search=search
        )

        results = query.order_by(LogEntry.log_timestamp.desc()).limit(limit).offset(offset).all()
        
        items = []
        for row in results:
            log_obj = row[0]
            log_obj.severity_code = row.severity_code
            log_obj.category_name = row.category_name
            log_obj.environment_code = row.environment_code
            log_obj.file_name = row.file_name
            log_obj.team_name = row.team_name # Map team name
            items.append(log_obj)
        return items
    
    @staticmethod
    def count_logs(db: Session, *, team_id=None, user_id=None, start_date=None, end_date=None, 
                   severity_code=None, category_name=None, environment_code=None, 
                   file_id=None, search=None):
        
        query = db.query(func.count(LogEntry.log_id)) \
            .join(RawFile, LogEntry.file_id == RawFile.file_id) \
            .outerjoin(LogSeverity, LogEntry.severity_id == LogSeverity.severity_id) \
            .outerjoin(LogCategory, LogEntry.category_id == LogCategory.category_id) \
            .outerjoin(Environment, LogEntry.environment_id == Environment.environment_id)

        # 🔥 FIX: Using explicit keyword arguments
        query = LogRepository._apply_filters(
            query=query,
            team_id=team_id,
            user_id=user_id,
            start_date=start_date,
            end_date=end_date,
            severity_code=severity_code,
            category_name=category_name,
            environment_code=environment_code,
            file_id=file_id,
            search=search
        )
        
        return query.scalar() or 0

    @staticmethod
    def _apply_filters(query, team_id, user_id, start_date, end_date, 
                       severity_code, category_name, environment_code, 
                       file_id, search):
        
        # 🟢 DEBUG PRINT: Check your terminal while searching!
        if search:
            print(f"DEBUG: SQL Query Filter - Search Term: '{search}'")

        # 1. Keyword Search Logic (message_line)
        if search and str(search).strip():
            search_term = f"%{str(search).strip()}%"
            query = query.filter(LogEntry.message_line.ilike(search_term))
        
        # 2. Scoping & ID Filters
        if user_id: 
            query = query.filter(RawFile.uploaded_by == user_id)
        if team_id: 
            query = query.filter(RawFile.team_id == team_id)
        if file_id: 
            query = query.filter(LogEntry.file_id == file_id)
            
        # 3. Metadata Filters
        if severity_code: 
            query = query.filter(LogSeverity.severity_code == severity_code)
        if environment_code: 
            query = query.filter(Environment.environment_code == environment_code)
        if category_name: 
            query = query.filter(LogCategory.category_name == category_name)
        
        # 4. Date Range
        if start_date: 
            query = query.filter(func.date(LogEntry.log_timestamp) >= start_date)
        if end_date: 
            query = query.filter(func.date(LogEntry.log_timestamp) <= end_date)
            
        return query