from sqlalchemy.orm import Session
from app.models.log_entries import LogEntry
from .utils import get_lookups, classify_log
from . import parsers

def parse_and_store_logs(db: Session, file_id: int, raw_text: str, format_name: str, environment_code: str = "DEV"):
    lookups = get_lookups(db, environment_code)
    if not lookups["env"]:
        raise ValueError(f"Environment {environment_code} not found.")

    # 1. Select Parser
    fmt = format_name.upper()
    if fmt in ['LOG', 'TXT']: entries = parsers.parse_text(raw_text)
    elif fmt == 'JSON': entries = parsers.parse_json(raw_text)
    elif fmt == 'CSV':  entries = parsers.parse_csv(raw_text)
    elif fmt == 'XML':  entries = parsers.parse_xml(raw_text)
    else: raise ValueError(f"Unsupported format: {format_name}")

    # 2. Prepare LogEntry objects
    log_objects = []
    for e in entries:
        cat_name = classify_log(e['message'])
        log_objects.append(LogEntry(
            file_id=file_id,
            log_timestamp=e['timestamp'],
            severity_id=lookups['severities'].get(e['severity']),
            category_id=lookups['categories'].get(cat_name),
            environment_id=lookups['env'].environment_id,
            message_line=f"[{e['service']}] {e['message']}"
        ))

    # 3. Bulk Insert
    if log_objects:
        db.bulk_save_objects(log_objects)
        db.commit()
    
    return len(log_objects)