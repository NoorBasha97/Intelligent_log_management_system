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

def parse_text(text: str):
    results = []
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        
        match = LOG_PATTERN.search(line) 
        if match:
            data = match.groupdict()
            try:
                results.append({
                    "timestamp": datetime.strptime(data["timestamp"], "%Y-%m-%d %H:%M:%S"),
                    "severity": data["severity"].upper(),
                    # 🔥 FIX: Use .get() to avoid KeyError if service isn't found
                    "service": data.get("service") if data.get("service") else "SYSTEM",
                    "message": data["message"].strip()
                })
            except Exception as e:
                print(f"Row match found but parsing failed: {e}")
                
    return results


def parse_json(text: str):
    data = json.loads(text)
    items = data if isinstance(data, list) else [data]
    return [{
        "timestamp": datetime.strptime(i["timestamp"], "%Y-%m-%d %H:%M:%S"),
        "severity": i["severity"].upper(),
        "service": i.get("service", "JSON-SVC"),
        "message": i["message"]
    } for i in items]

def parse_csv(text: str):
    f = io.StringIO(text)
    reader = csv.DictReader(f)
    return [{
        "timestamp": datetime.strptime(row["timestamp"], "%Y-%m-%d %H:%M:%S"),
        "severity": row["severity"].upper(),
        "service": row.get("service", "CSV-SVC"),
        "message": row["message"]
    } for row in reader]

def parse_xml(text: str):
    root = ET.fromstring(text)
    results = []
    for log in root.findall('log'):
        results.append({
            "timestamp": datetime.strptime(log.find('timestamp').text, "%Y-%m-%d %H:%M:%S"),
            "severity": log.find('severity').text.upper(),
            "service": log.find('service').text if log.find('service') is not None else "XML-SVC",
            "message": log.find('message').text
        })
    return results