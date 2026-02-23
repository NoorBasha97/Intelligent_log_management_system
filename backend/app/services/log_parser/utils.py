from sqlalchemy.orm import Session
from app.models.log_entries import LogSeverity, LogCategory, Environment
import re

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


def detect_actual_format(raw_text: str, extension_format: str) -> str:
    # Clean and get a sample of the first 1000 characters
    content = raw_text.strip()
    if not content:
        return extension_format

    #Skip leading empty lines to find the first real data line
    lines = [l.strip() for l in content.split('\n') if l.strip()]
    if not lines:
        return extension_format
    
    first_line = lines[0]

    #Check for JSON (Starts with [ or { )
    if first_line.startswith(('[', '{')):
        return "JSON"

    #Check for XML (Starts with < )
    if first_line.startswith('<'):
        return "XML"

    #Check for "Standard Log" pattern (Starts with a Date 0000-00-00)
    # If it starts with a date, it's definitely a LOG, even if it has commas
    if re.match(r"^[\[]?\d{4}-\d{2}-\d{2}", first_line):
        return "TXT"

    #Check for CSV (Has commas, but DOES NOT start with a date)
    if ',' in first_line and len(first_line.split(',')) >= 3:
        return "CSV"

    #Default to extension
    return extension_format