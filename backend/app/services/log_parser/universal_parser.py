import re
import json
import csv
import io
import xml.etree.ElementTree as ET
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.log_entries import LogEntry, LogSeverity, LogCategory, Environment

# Reuse your existing LOG regex
LOG_PATTERN = re.compile(
    r"(?P<timestamp>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\s+"
    r"(?P<severity>DEBUG|INFO|WARN|ERROR|FATAL)\s+"
    r"(?P<service>\S+)\s+"
    r"(?P<message>.+)"
)

def classify_log(message: str) -> str:
    msg = str(message).lower()
    if any(k in msg for k in ["login", "auth", "token", "permission"]): return "SECURITY"
    if any(k in msg for k in ["cpu", "memory", "disk", "server"]): return "INFRASTRUCTURE"
    if any(k in msg for k in ["audit", "compliance", "policy"]): return "AUDIT"
    if any(k in msg for k in ["error", "exception", "failed"]): return "APPLICATION"
    return "UNCATEGORIZED"

def get_lookups(db: Session):
    return {
        "severities": {s.severity_code: s.severity_id for s in db.query(LogSeverity).all()},
        "categories": {c.category_name: c.category_id for c in db.query(LogCategory).all()}
    }

def parse_and_store_logs(db: Session, file_id: int, raw_text: str, format_name: str, environment_code: str = "DEV"):
    lookups = get_lookups(db)
    env = db.query(Environment).filter(Environment.environment_code == environment_code).first()
    
    entries = []
    format_name = format_name.upper()

    try:
        if format_name in ['LOG', 'TXT']:
            entries = parse_text_log(raw_text, lookups)
        elif format_name == 'JSON':
            entries = parse_json_log(raw_text, lookups)
        elif format_name == 'CSV':
            entries = parse_csv_log(raw_text, lookups)
        elif format_name == 'XML':
            entries = parse_xml_log(raw_text, lookups)
        
        # Batch save for performance
        log_objects = []
        for e in entries:
            log_objects.append(LogEntry(
                file_id=file_id,
                log_timestamp=e['timestamp'],
                severity_id=lookups['severities'].get(e['severity']),
                category_id=lookups['categories'].get(classify_log(e['message'])),
                environment_id=env.environment_id if env else None,
                message_line=f"[{e.get('service', 'N/A')}] {e['message']}"
            ))
        
        if log_objects:
            db.bulk_save_objects(log_objects)
            db.commit()
        return len(log_objects)

    except Exception as e:
        db.rollback()
        raise Exception(f"Parsing error in {format_name}: {str(e)}")

# --- FORMAT SPECIFIC PARSERS ---

def parse_text_log(text, lookups):
    results = []
    for line in text.splitlines():
        match = LOG_PATTERN.match(line.strip())
        if match:
            data = match.groupdict()
            results.append({
                "timestamp": datetime.strptime(data["timestamp"], "%Y-%m-%d %H:%M:%S"),
                "severity": data["severity"],
                "service": data["service"],
                "message": data["message"]
            })
    return results

def parse_json_log(text, lookups):
    results = []
    data = json.loads(text)
    # Supports both a single object or a list of objects
    items = data if isinstance(data, list) else [data]
    for item in items:
        results.append({
            "timestamp": datetime.fromisoformat(item["timestamp"].replace("Z", "+00:00")),
            "severity": item["severity"].upper(),
            "service": item.get("service", "JSON-SVC"),
            "message": item["message"]
        })
    return results

def parse_csv_log(text, lookups):
    results = []
    f = io.StringIO(text)
    reader = csv.DictReader(f) # Assumes header: timestamp,severity,service,message
    for row in reader:
        results.append({
            "timestamp": datetime.strptime(row["timestamp"], "%Y-%m-%d %H:%M:%S"),
            "severity": row["severity"].upper(),
            "service": row.get("service", "CSV-SVC"),
            "message": row["message"]
        })
    return results

def parse_xml_log(text, lookups):
    results = []
    root = ET.fromstring(text)
    # Assumes structure: <logs><log><timestamp>...</timestamp>...</log></logs>
    for log in root.findall('log'):
        results.append({
            "timestamp": datetime.strptime(log.find('timestamp').text, "%Y-%m-%d %H:%M:%S"),
            "severity": log.find('severity').text.upper(),
            "service": log.find('service').text if log.find('service') is not None else "XML-SVC",
            "message": log.find('message').text
        })
    return results