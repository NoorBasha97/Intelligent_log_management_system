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

def parse_csv_log(text):
    results = []
    f = io.StringIO(text.strip())
    reader = csv.DictReader(f, skipinitialspace=True)
    
    for row in reader:
        # 1. Standardize keys to lowercase and remove spaces
        # This handles "Timestamp", "timestamp ", " TIMESTAMP" all at once
        d = {str(k).lower().strip(): v for k, v in row.items()}
        
        try:
            # 2. Extract values using various possible header names
            ts_str = d.get('timestamp') or d.get('time') or d.get('date')
            sev_str = d.get('severity') or d.get('level') or 'INFO'
            msg_str = d.get('message') or d.get('msg') or d.get('text')
            svc_str = d.get('service') or d.get('app') or 'CSV-SVC'

            if not ts_str or not msg_str:
                continue

            results.append({
                "timestamp": datetime.strptime(ts_str.strip(), "%Y-%m-%d %H:%M:%S"),
                "severity": sev_str.strip().upper(),
                "service": svc_str.strip(),
                "message": msg_str.strip()
            })
        except Exception as e:
            print(f"CSV Parse Row Error: {e}")
            continue
            
    return results


def parse_xml_log(text): # Renamed to parse_xml to match your manager.py
    results = []
    try:
        # 1. Parse the string into an XML tree
        # Use strip() to remove any hidden whitespace at start of file
        root = ET.fromstring(text.strip())
        
        # 2. Look for <log> tags
        # We use './/log' to find log entries even if they are nested
        for log in root.findall('.//log'):
            try:
                # Find nodes safely
                ts_node = log.find('timestamp')
                sev_node = log.find('severity')
                msg_node = log.find('message')
                svc_node = log.find('service')

                # Skip this entry if critical data is missing
                if ts_node is None or msg_node is None:
                    print(f"DEBUG: XML Log entry missing timestamp or message. Skipping.")
                    continue

                results.append({
                    "timestamp": datetime.strptime(ts_node.text.strip(), "%Y-%m-%d %H:%M:%S"),
                    "severity": sev_node.text.strip().upper() if sev_node is not None else "INFO",
                    "service": svc_node.text.strip() if svc_node is not None else "XML-SVC",
                    "message": msg_node.text.strip()
                })
            except Exception as row_err:
                print(f"DEBUG: Error parsing single XML row: {row_err}")
                continue

    except Exception as e:
        print(f"CRITICAL: XML structure is invalid: {e}")
        
    return results