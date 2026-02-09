import os
import shutil
from fastapi import UploadFile
import os
from pathlib import Path

# Get the absolute path of the project root
BASE_DIR = Path(__file__).resolve().parent.parent 
BASE_UPLOAD_DIR = os.path.join(BASE_DIR, "uploads", "teams")


def save_file_locally(
    team_id: int,
    upload_file: UploadFile
) -> tuple[str, int]:

    team_dir = os.path.join(BASE_UPLOAD_DIR, f"team_{team_id}")
    os.makedirs(team_dir, exist_ok=True)

    file_path = os.path.join(team_dir, upload_file.filename)
    
    
    # Add this line to ensure we start from the beginning
    upload_file.file.seek(0)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)
 
    file_size = os.path.getsize(file_path)

    return file_path, file_size
