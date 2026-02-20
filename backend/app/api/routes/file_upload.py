from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.raw_file import RawFile
from app.models.file_formats import FileFormat
from app.schemas.raw_file import RawFileResponse
from app.services.file_storage import save_file_locally
from app.services.log_parser.manager import parse_and_store_logs
from app.api.deps import get_active_user
from app.models.user import User
from app.models.log_entries import Environment
from typing import List
import traceback

router = APIRouter(prefix="/files", tags=["File Upload"])

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close() 

@router.post("/upload", response_model=List[RawFileResponse])
def upload_files(
    team_id: int,
    environment_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_active_user)
):
    # 1. Security Check
    if current_user.user_role != "ADMIN":
        from app.models.user_teams import UserTeam
        membership = db.query(UserTeam).filter(
            UserTeam.user_id == current_user.user_id,
            UserTeam.team_id == team_id,
            UserTeam.is_active == True
        ).first()
        if not membership:
            raise HTTPException(status_code=403, detail="You do not belong to this team")
        
    db.execute(text(f"SET app.current_user_id = '{current_user.user_id}'"))

    # 2. PRE-VALIDATION: Get available formats from DB (Case-Insensitive)
    # This creates a dictionary: {'LOG': 1, 'JSON': 3, 'CSV': 4, 'XML': 5}
    db_formats = {f.format_name.upper(): f.format_id for f in db.query(FileFormat).all()}
    
    env = db.query(Environment).filter(Environment.environment_id == environment_id).first()
    if not env:
        raise HTTPException(status_code=400, detail="Invalid environment_id")

    files_to_process = []
    
    for file in files:
        if not file.filename:
            continue
            
        ext = file.filename.split('.')[-1].lower() if '.' in file.filename else ''
        
        # EXTENSION MAPPING LOGIC
        # Map file extensions to the actual names present in your 'file_formats' table
        if ext in ['log', 'txt']:
            target_fmt_name = 'LOG'
        elif ext == 'json':
            target_fmt_name = 'JSON'
        elif ext == 'csv':
            target_fmt_name = 'CSV'
        elif ext == 'xml':
            target_fmt_name = 'XML'
        else:
            target_fmt_name = ext.upper()

        # Check if the mapped name exists in our database dictionary
        if target_fmt_name not in db_formats:
            raise HTTPException(
                status_code=400, 
                detail=f"Format '{target_fmt_name}' (from .{ext} file) is not supported in the database. Supported: {list(db_formats.keys())}"
            )
        
        files_to_process.append({
            "file_obj": file,
            "format_id": db_formats[target_fmt_name],
            "format_name": target_fmt_name
        })

    # 3. PROCESSING
    processed_files = []
    try:
        for item in files_to_process:
            file = item["file_obj"]
            
            # Save file locally
            file_path, file_size = save_file_locally(team_id, file)

            # Store metadata
            new_raw_file = RawFile( 
                team_id=team_id,
                uploaded_by=current_user.user_id,
                original_name=file.filename,
                file_size_bytes=file_size,
                format_id=item["format_id"]
            )
            db.add(new_raw_file)
            db.flush() 

            # Read and Parse
            with open(file_path, "r", encoding="utf-8-sig") as f:
                raw_text = f.read()

            parse_and_store_logs(
                db=db,
                file_id=new_raw_file.file_id,
                raw_text=raw_text,
                format_name=item["format_name"],
                environment_code=env.environment_code
            )
            processed_files.append(new_raw_file)
        
        db.commit()
        for f in processed_files: db.refresh(f)
        return processed_files

    except Exception as e:
        db.rollback()
        print("--- MULTI-UPLOAD ERROR ---")
        print(traceback.format_exc()) 
        raise HTTPException(status_code=500, detail=f"Batch processing failed: {str(e)}")