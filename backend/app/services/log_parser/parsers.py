import re
import json
import csv
import io
import xml.etree.ElementTree as ET
from datetime import datetime

# Regex for Text/Log files
LOG_PATTERN = re.compile(
    r"(?P<timestamp>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\s+"
    r"(?P<severity>DEBUG|INFO|WARN|ERROR|FATAL)\s+"
    r"(?P<service>\S+)\s+"
    r"(?P<message>.+)"
)

def parse_text(text: str):
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