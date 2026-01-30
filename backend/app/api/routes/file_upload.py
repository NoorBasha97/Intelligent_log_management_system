from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.raw_file import RawFile
from app.models.file_formats import FileFormat
from app.schemas.raw_file import RawFileResponse
from app.services.file_storage import save_file_locally
from app.services.log_parser.manager import parse_and_store_logs # Updated import
from app.api.deps import get_active_user, get_current_user
from app.models.user import User # Ensure correct path

router = APIRouter(prefix="/files", tags=["File Upload"])

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close() 

@router.post("/upload", response_model=RawFileResponse)
def upload_file(
    team_id: int,
    format_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user : User = Depends(get_active_user) # 'user' is an object, not a Session
):
    # SECURITY CHECK: Non-admins can only upload to their OWN team
    if current_user.user_role != "ADMIN":
        from app.models.user_teams import UserTeam
        membership = db.query(UserTeam).filter(
            UserTeam.user_id == current_user.user_id,
            UserTeam.team_id == team_id
        ).first()
        if not membership:
            raise HTTPException(status_code=403, detail="You do not belong to this team")
        
    db.execute(text(f"SET app.current_user_id = '{current_user.user_id}'"))
        
    if not file.filename:
        raise HTTPException(status_code=400, detail="File name is missing")

    # 1. Identify format name (e.g., 'JSON', 'LOG')
    fmt = db.query(FileFormat).filter(FileFormat.format_id == format_id).first()
    if not fmt:
        raise HTTPException(status_code=400, detail="Invalid format_id")

    # 2. Save file locally
    file_path, file_size = save_file_locally(team_id, file)

    try:
        # 3. Store metadata
        raw_file = RawFile( 
            team_id=team_id,
            uploaded_by=current_user.user_id,
            original_name=file.filename,
            file_size_bytes=file_size,
            format_id=format_id
        )
        db.add(raw_file)
        db.flush() # Get raw_file.file_id without committing transaction yet

        # 4. Read and Parse
        with open(file_path, "r", encoding="utf-8-sig") as f:
            raw_text = f.read()

        parse_and_store_logs(
            db=db,
            file_id=raw_file.file_id,
            raw_text=raw_text,
            format_name=fmt.format_name, # Key fix: Pass format name
            environment_code="DEV"
        )
        
        db.flush()
        db.commit()
        db.refresh(raw_file)
        return raw_file

    except Exception as e:
        db.rollback()
        import traceback
        # This will print the full error in your terminal
        print(traceback.format_exc()) 
        # This will send the error message to the frontend so you can see it in the Alert
        raise HTTPException(status_code=500, detail=f"Crashed at: {str(e)}")