from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_active_user, require_permission
from app.models.user import User
from app.schemas.file import (
    FileListItem,
    FileUploadResponse,
    FileListResponse,
    FileFilter
)
from app.services.file_service import FileService
from app.repositories.file_repository import FileRepository
from app.services.team_service import TeamService
from typing import Optional
from datetime import datetime
from app.models.archives import Archive # Import your Archive model

from app.models.raw_file import RawFile
from app.models.log_entries import LogEntry

router = APIRouter(
    prefix="/files",
    tags=["Files"]
)


# -------------------------
# Upload file metadata
# -------------------------
@router.post(
    "",
    response_model=FileUploadResponse,
    status_code=status.HTTP_201_CREATED
)
def upload_file(
    filename: str,
    file_size_bytes: int,
    category_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("UPLOAD_LOG"))
):
    """
    Upload file metadata (actual file upload handled elsewhere).
    """
    try:
        file = FileService.upload_file(
            db,
            user_id=current_user.user_id,
            filename=filename,
            file_size_bytes=file_size_bytes,
            category_id=category_id
        )
        return file
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        )


# -------------------------
# List files (team-scoped)
# -------------------------
@router.get("/get-all-files", response_model=FileListResponse)
def get_all_files(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_active_user),
    search: str = Query(None),
    team_id: int = Query(None),
    severity: str = Query(None),
    environment: str = Query(None),
    category: str = Query(None),
    start_date: str = Query(None),
    limit: int = 50,
    offset: int = 0
):
    # Security: If not Admin, they can ONLY see their own team's files
    target_team_id = team_id if current_user.user_role == "ADMIN" else None
    
    if current_user.user_role != "ADMIN":
        from app.services.team_service import TeamService
        try:
            team = TeamService.get_active_team_for_user(db, user_id=current_user.user_id)
            target_team_id = team.team_id
        except:
            return {"total": 0, "items": []}

    items = FileRepository.list_files(
        db, team_id=target_team_id, search=search, severity=severity,
        environment=environment, category=category, start_date=start_date,
        limit=limit, offset=offset
    )
    
    total = FileRepository.count_files(db, team_id=target_team_id)
    return {"total": total, "items": items}

# --- DELETE FILE ROUTE ---

@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_file_permanently(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_active_user)
):
    # 1. Fetch the file
    file = db.query(RawFile).filter(RawFile.file_id == file_id).first()
   
    
    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    # 2. Permission Check: Only ADMIN or the person who uploaded it can delete
    if current_user.user_role != "ADMIN" and file.uploaded_by != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this file")

    try:
        # 3. Permanent delete
        # NOTE: If your log_entries table has a ForeignKey with ON DELETE CASCADE, 
        # deleting this file will automatically delete all its logs.
        # 1. Delete children using synchronize_session=False for speed and reliability
        db.query(LogEntry).filter(LogEntry.file_id == file_id).delete(synchronize_session=False)
        db.query(Archive).filter(Archive.file_id == file_id).delete(synchronize_session=False)
        
        db.flush() 
        db.delete(file)
        db.commit()
        return None
    except Exception as e:
        db.rollback()
        print(f"Error during delete: {e}") # Print the error to your terminal
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
@router.patch("/{file_id}/archive", status_code=status.HTTP_200_OK)
def manual_archive_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("ARCHIVE_LOG"))
):
    # 1. Fetch file
    file = db.query(RawFile).filter(RawFile.file_id == file_id).first()
    
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    if file.is_archived:
        raise HTTPException(status_code=400, detail="File is already archived")

    try:
        # 2. Set archived status
        file.is_archived = True
        
        # 3. Create entry in archives table (Optional, but keeps history consistent)
        # We count existing logs for this file
        from app.models.log_entries import LogEntry
        log_count = db.query(LogEntry).filter(LogEntry.file_id == file_id).count()
        
        new_archive = Archive(
            file_id=file_id,
            total_records=log_count
        )
        db.add(new_archive)
        
        db.commit()
        return {"message": "File manually archived successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    


@router.get("/me", response_model=FileListResponse)
def get_user_files(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_active_user),
    scope: str = Query("me", regex="^(me|team)$"),
    limit: int = 50,
    offset: int = 0
):
    from app.services.team_service import TeamService
    from app.repositories.file_repository import FileRepository

    target_user_id = None
    target_team_id = None

    if scope == "me":
        # Only files I uploaded
        target_user_id = current_user.user_id
    else:
        # Files from my entire team
        try:
            team = TeamService.get_active_team_for_user(db, user_id=current_user.user_id)
            target_team_id = team.team_id
        except ValueError:
            return {"total": 0, "items": []}

    # Reusing the FileRepository.list_files logic
    # Note: Ensure your repository supports passing both team_id and user_id if needed, 
    # or just filter here directly.
    query = db.query(RawFile)
    
    if target_user_id:
        query = query.filter(RawFile.uploaded_by == target_user_id)
    else:
        query = query.filter(RawFile.team_id == target_team_id)

    total = query.count()
    items = query.order_by(RawFile.uploaded_at.desc()).offset(offset).limit(limit).all()

    return {"total": total, "items": items}