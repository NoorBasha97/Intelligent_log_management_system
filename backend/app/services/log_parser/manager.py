from sqlalchemy.orm import Session
from app.models.log_entries import LogEntry, LogSeverity, LogCategory, Environment
from .utils import get_lookups, classify_log
from . import parsers

def parse_and_store_logs(db: Session, file_id: int, raw_text: str, format_name: str, environment_code: str = "DEV"):
    print(f"\n--- PARSER START: FileID {file_id} | Format: {format_name} ---")
    
    lookups = get_lookups(db, environment_code)
    
    # 1. Select Parser based on format name
    fmt = format_name.upper().strip()
    entries = []
    
    if fmt in ['LOG', 'TXT']:
        print("Action: Using TEXT Parser")
        entries = parsers.parse_text(raw_text)
    elif fmt == 'JSON':
        print("Action: Using JSON Parser")
        entries = parsers.parse_json(raw_text)
    elif fmt == 'CSV':
        print("Action: Using CSV Parser")
        entries = parsers.parse_csv(raw_text)
    elif fmt == 'XML': 
        entries = parsers.parse_xml(raw_text)
    else:
        print(f"ERROR: Unsupported format '{fmt}'")
        return 0

    print(f"Diagnostic: Parser returned {len(entries)} raw entries")

    # 2. Get Safe Defaults (Prevent NULL crashes)
    def_sev = db.query(LogSeverity.severity_id).filter(LogSeverity.severity_code == 'INFO').scalar()
    def_cat = db.query(LogCategory.category_id).filter(LogCategory.category_name == 'UNCATEGORIZED').scalar()

    log_objects = []
    for i, e in enumerate(entries):
        # Map Severity
        sev_id = lookups['severities'].get(e['severity'].upper()) or def_sev
        
        # Map Category
        cat_name = classify_log(e['message'])
        cat_id = lookups['categories'].get(cat_name) or def_cat

        # Create SQLAlchemy Object
        log_entry = LogEntry(
            file_id=file_id,
            log_timestamp=e['timestamp'],
            severity_id=sev_id,
            category_id=cat_id,
            environment_id=lookups['env'].environment_id if lookups['env'] else None,
            message_line=f"[{e.get('service', 'N/A')}] {e['message']}"
        )
        log_objects.append(log_entry)

    # 3. Save to Database
    if log_objects:
        print(f"Action: Bulk saving {len(log_objects)} objects to log_entries table...")
        db.bulk_save_objects(log_objects)
        db.commit()
        print("--- PARSER SUCCESS: Database Committed ---\n")
    else:
        print("--- PARSER FAILED: No valid log lines found ---\n")
    
    return len(log_objects)