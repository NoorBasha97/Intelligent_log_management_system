from sqlalchemy.orm import Session
from app.models.log_entries import LogSeverity, LogCategory, Environment

def get_lookups(db: Session, environment_code: str):
    return {
        "severities": {s.severity_code: s.severity_id for s in db.query(LogSeverity).all()},
        "categories": {c.category_name: c.category_id for c in db.query(LogCategory).all()},
        "env": db.query(Environment).filter(Environment.environment_code == environment_code).first()
    }

def classify_log(message: str) -> str:
    msg = str(message).lower()
    if any(k in msg for k in ["login", "auth", "token", "permission"]): return "SECURITY"
    if any(k in msg for k in ["cpu", "memory", "disk", "server", "node"]): return "INFRASTRUCTURE"
    if any(k in msg for k in ["audit", "compliance", "policy"]): return "AUDIT"
    if any(k in msg for k in ["error", "exception", "failed", "timeout"]): return "APPLICATION"
    return "UNCATEGORIZED"