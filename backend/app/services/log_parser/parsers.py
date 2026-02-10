import re
import json
import csv
import io
import xml.etree.ElementTree as ET
from datetime import datetime

# Regex for Text/Log files
LOG_PATTERN = re.compile(
    r"(?P<timestamp>\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2})" # Matches Date
    r".*?"                                                 # Skip whitespace/brackets
    r"(?P<severity>DEBUG|INFO|WARN|ERROR|FATAL|crit|warn|error|info)" # Matches Level
    r".*?"                                                 # Skip whitespace/brackets
    r"(?:(?P<service>[\w\d\-_]+)[:\s]+)?"                 # Matches Service (Optional)
    r"(?P<message>.*)",                                    # Matches the rest as Message
    re.IGNORECASE
)

# --- HELPER LOGIC FOR DEDUPLICATION 
def is_duplicate(log_entry, seen_set):
    """
    Creates a unique fingerprint for a log line.
    Returns True if log is already in the set, otherwise adds it and returns False.
    """
    # We create a tuple of the data. Tuples are hashable and can be stored in a set.
    fingerprint = (
        str(log_entry['timestamp']),
        log_entry['severity'],
        log_entry['service'],
        log_entry['message'].strip()
    )
    
    if fingerprint in seen_set:
        return True
    seen_set.add(fingerprint)
    return False

def parse_text(text: str):
    results = []
    seen_logs = set()
    
    for line in text.splitlines():
        line = line.strip()
        if not line:  # Skip empty lines
            continue
        
        match = LOG_PATTERN.search(line) 
        if match:
            data = match.groupdict()
            try:
                entry = {
                    "timestamp": datetime.strptime(data["timestamp"], "%Y-%m-%d %H:%M:%S"),
                    "severity": data["severity"].upper(),
                    "service": data.get("service") if data.get("service") else "SYSTEM",
                    "message": data["message"].strip()
                }
                
                # Check for empty message or duplicate
                if entry["message"] and not is_duplicate(entry, seen_logs):
                    results.append(entry)
                    
            except Exception as e:
                print(f"Row match found but parsing failed: {e}")
                
    return results


def parse_json(text: str):
    try:
        data = json.loads(text)
        items = data if isinstance(data, list) else [data]
        results = []
        seen_logs = set()

        for i in items:
            # Check if required keys exist and are not empty
            if not i.get("timestamp") or not i.get("message"):
                continue
                
            try:
                entry = {
                    "timestamp": datetime.strptime(i["timestamp"], "%Y-%m-%d %H:%M:%S"),
                    "severity": i.get("severity", "INFO").upper(),
                    "service": i.get("service", "JSON-SVC"),
                    "message": i["message"].strip()
                }
                
                if not is_duplicate(entry, seen_logs):
                    results.append(entry)
            except:
                continue
        return results
    except:
        return []

def parse_csv(text: str):
    results = []
    seen_logs = set()
    f = io.StringIO(text.strip())
    # skipinitialspace=True handles spaces after commas automatically
    reader = csv.DictReader(f, skipinitialspace=True) 
    
    for row in reader:
        # Standardize keys to lowercase to handle 'Timestamp' vs 'timestamp'
        clean_row = {k.lower(): v for k, v in row.items()}
        
        ts = clean_row.get("timestamp")
        msg = clean_row.get("message")
        
        if not ts or not msg: # Skip if empty columns
            continue

        try:
            entry = {
                "timestamp": datetime.strptime(ts.strip(), "%Y-%m-%d %H:%M:%S"),
                "severity": clean_row.get("severity", "INFO").strip().upper(),
                "service": clean_row.get("service", "CSV-SVC").strip(),
                "message": msg.strip()
            }
            
            if not is_duplicate(entry, seen_logs):
                results.append(entry)
        except:
            continue
            
    return results

def parse_xml(text: str):
    results = []
    seen_logs = set()
    try:
        root = ET.fromstring(text.strip())
        for log in root.findall('log'):
            ts_node = log.find('timestamp')
            msg_node = log.find('message')
            
            if ts_node is None or msg_node is None: # Skip if tags are missing
                continue
                
            ts = ts_node.text
            msg = msg_node.text
            
            if not ts or not msg: # Skip if tags are empty
                continue

            try:
                sev_node = log.find('severity')
                svc_node = log.find('service')
                
                entry = {
                    "timestamp": datetime.strptime(ts.strip(), "%Y-%m-%d %H:%M:%S"),
                    "severity": sev_node.text.strip().upper() if sev_node is not None else "INFO",
                    "service": svc_node.text.strip() if svc_node is not None else "XML-SVC",
                    "message": msg.strip()
                }
                
                if not is_duplicate(entry, seen_logs):
                    results.append(entry)
            except:
                continue
    except:
        pass
        
    return results