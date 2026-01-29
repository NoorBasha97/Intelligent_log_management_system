from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.api.deps import get_db, get_active_user
from app.models.log_entries import LogEntry, LogSeverity, LogCategory
from app.models.raw_file import RawFile
from datetime import datetime, date, time

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary")
def get_dashboard_summary(db: Session = Depends(get_db), current_user = Depends(get_active_user)):
    today = date.today()

    # Create "Today" range in UTC (or your local timezone)
    today_start = datetime.combine(datetime.now().date(), time.min)
    today_end = datetime.combine(datetime.now().date(), time.max)

    # 1. Count Files Uploaded Today (Targeting raw_files table)
    files_uploaded_today = db.query(func.count(RawFile.file_id))\
        .filter(RawFile.uploaded_at >= today_start)\
        .filter(RawFile.uploaded_at <= today_end)\
        .scalar() or 0
        
    # 2. Security Logs (Count of logs in the 'SECURITY' category)
    security_logs_count = db.query(func.count(LogEntry.log_id))\
        .join(LogCategory)\
        .filter(LogCategory.category_name == 'SECURITY').scalar() or 0

    # 3. Severity Distribution (for the Pie Chart)
    severity_dist = db.query(
        LogSeverity.severity_code.label("name"),
        func.count(LogEntry.log_id).label("value")
    ).join(LogSeverity)\
     .group_by(LogSeverity.severity_code).all()

    # 4. Most Active Systems (for the list)
    active_systems = db.query(
        LogCategory.category_name.label("system"),
        func.count(LogEntry.log_id).label("count")
    ).join(LogCategory)\
     .group_by(LogCategory.category_name)\
     .order_by(desc("count")).limit(5).all()

    # 5. Last 7 Days Trend (for the Line Chart)
    logs_trend = db.query(
        func.date(LogEntry.log_timestamp).label("date"),
        func.count(LogEntry.log_id).label("count")
    ).group_by(func.date(LogEntry.log_timestamp))\
     .order_by(func.date(LogEntry.log_timestamp)).limit(7).all()

    # 6. Last Uploaded File Info
    last_file = db.query(RawFile).order_by(desc(RawFile.uploaded_at)).first()

    return {
       "files_uploaded_today": files_uploaded_today,
        "security_logs_count": security_logs_count,
        "severity_distribution": [{"name": s.name, "value": s.value} for s in severity_dist],
        "active_systems": [{"system": a.system, "count": a.count} for a in active_systems],
        "logs_trend": [{"date": str(t.date), "count": t.count} for t in logs_trend],
        "last_file": {
            "name": last_file.original_name,
            "at": last_file.uploaded_at,
            "size": last_file.file_size_bytes,
            "id": last_file.file_id
        } if last_file else None
    }
    
    
    
    

@router.get("/user-summary")
def get_user_dashboard_summary(
    db: Session = Depends(get_db), 
    current_user = Depends(get_active_user)
):
    # 1. Total Logs uploaded by THIS user (via their files)
    total_logs = db.query(func.count(LogEntry.log_id))\
        .join(RawFile)\
        .filter(RawFile.uploaded_by == current_user.user_id).scalar() or 0

    # 2. Security Logs uploaded by THIS user
    security_logs = db.query(func.count(LogEntry.log_id))\
        .join(RawFile).join(LogCategory)\
        .filter(RawFile.uploaded_by == current_user.user_id)\
        .filter(LogCategory.category_name == 'SECURITY').scalar() or 0

    # 3. Severity Summaries (Errors, Warnings, Info)
    severity_counts = db.query(
        LogSeverity.severity_code,
        func.count(LogEntry.log_id).label("count")
    ).join(LogEntry, LogEntry.severity_id == LogSeverity.severity_id)\
     .join(RawFile, LogEntry.file_id == RawFile.file_id)\
     .filter(RawFile.uploaded_by == current_user.user_id)\
     .group_by(LogSeverity.severity_code).all()

    # Convert to a dictionary for easy frontend access: {"ERROR": 5, "INFO": 10...}
    summaries = {row.severity_code: row.count for row in severity_counts}

    # 4. Recent File info
    last_file = db.query(RawFile)\
        .filter(RawFile.uploaded_by == current_user.user_id)\
        .order_by(desc(RawFile.uploaded_at)).first()

    return {
        "personal_stats": {
            "total_logs": total_logs,
            "security_logs": security_logs,
            "errors": summaries.get("ERROR", 0),
            "warnings": summaries.get("WARN", 0),
            "info": summaries.get("INFO", 0)
        },
        "recent_file": {
            "name": last_file.original_name,
            "timestamp": last_file.uploaded_at,
            "id": last_file.file_id,
            "size_kb": round(last_file.file_size_bytes / 1024, 2)
        } if last_file else None
    }