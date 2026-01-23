import re
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.log_entries import LogEntry, LogSeverity, LogCategory, Environment

# Regex Pattern: 2026-01-13 10:22:31 ERROR auth-service Failed login
LOG_PATTERN = re.compile(
    r"(?P<timestamp>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\s+"
    r"(?P<severity>DEBUG|INFO|WARN|ERROR|FATAL)\s+"
    r"(?P<service>\S+)\s+"
    r"(?P<message>.+)"
)

def clean_log_lines(raw_text: str) -> list[str]:
    cleaned = []
    seen = set()
    for line in raw_text.splitlines():
        line = line.strip()
        if not line or line in seen:
            continue
        seen.add(line)
        cleaned.append(line)
    return cleaned

def classify_log(message: str) -> str:
    msg = message.lower()
    if any(k in msg for k in ["login", "auth", "token", "permission", "access denied"]):
        return "SECURITY"
    if any(k in msg for k in ["cpu", "memory", "disk", "server", "network"]):
        return "INFRASTRUCTURE"
    if any(k in msg for k in ["audit", "compliance", "policy"]):
        return "AUDIT"
    if any(k in msg for k in ["error", "exception", "failed", "timeout"]):
        return "APPLICATION"
    return "UNCATEGORIZED"

def parse_and_store_logs(db: Session, file_id: int, raw_text: str, env_code: str = "DEV"):
    # 1. Pre-fetch Lookups (Optimization: Prevents thousands of DB queries)
    severities = {s.severity_code: s.severity_id for s in db.query(LogSeverity).all()}
    categories = {c.category_name: c.category_id for c in db.query(LogCategory).all()}
    env = db.query(Environment).filter(Environment.environment_code == env_code).first()
    
    if not env:
        raise ValueError(f"Environment {env_code} not found in database.")

    cleaned_lines = clean_log_lines(raw_text)
    log_entries_to_save = []

    # 2. Parse Lines
    for line in cleaned_lines:
        match = LOG_PATTERN.match(line)
        if not match:
            continue
        
        data = match.groupdict()
        
        # Determine IDs from our cached dictionaries
        sev_id = severities.get(data["severity"])
        cat_name = classify_log(data["message"])
        cat_id = categories.get(cat_name)

        log_entry = LogEntry(
            file_id=file_id,
            log_timestamp=datetime.strptime(data["timestamp"], "%Y-%m-%d %H:%M:%S"),
            severity_id=sev_id,
            category_id=cat_id,
            environment_id=env.environment_id,
            message_line=f"[{data['service']}] {data['message']}"
        )
        log_entries_to_save.append(log_entry)

    # 3. Bulk Insert (Much faster than individual db.add)
    if log_entries_to_save:
        db.bulk_save_objects(log_entries_to_save)
        db.commit()
    
    return len(log_entries_to_save)