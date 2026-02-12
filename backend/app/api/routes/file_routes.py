from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import text, desc, func
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
from typing import Optional, List
from datetime import datetime

# Models
from app.models.archives import Archive 
from app.models.raw_file import RawFile
from app.models.log_entries import LogEntry
from app.models.teams import Team
from app.models.file_formats import FileFormat

router = APIRouter(
    prefix="/files",
    tags=["Files"]
)

# 1. Upload file metadata
@router.post("", response_model=FileUploadResponse, status_code=status.HTTP_201_CREATED)
def upload_file(
    filename: str,
    file_size_bytes: int,
    category_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("UPLOAD_LOG"))
):
    # Set audit session user
    db.execute(text(f"SET app.current_user_id = '{current_user.user_id}'"))
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
        raise HTTPException(status_code=400, detail=str(exc))

# 2. List all files (Admin View)
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
    if current_user.user_role != "ADMIN":
        # Force regular users to their own team if they try to access this admin route
        try:
            team = TeamService.get_active_team_for_user(db, user_id=current_user.user_id)
            team_id = team.team_id
        except:
            return {"total": 0, "items": []}

    # Use repository which handles the complex joins (User, Team, Format)
    items = FileRepository.list_files(
        db, team_id=team_id, search=search, severity=severity,
        environment=environment, category=category, start_date=start_date,
        limit=limit, offset=offset
    )
    
    total = FileRepository.count_files(db, team_id=team_id)
    return {"total": total, "items": items}

# 3. Secure Delete Route
@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_file_permanently(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_active_user)
):
    file = db.query(RawFile).filter(RawFile.file_id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    # 🔥 OWNERSHIP CHECK: Admin can delete all, User only their own
    if current_user.user_role != "ADMIN" and file.uploaded_by != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this file")

    try:
        db.execute(text(f"SET app.current_user_id = '{current_user.user_id}'"))
        
        # Cleanup children to avoid ForeignKey errors
        db.query(LogEntry).filter(LogEntry.file_id == file_id).delete(synchronize_session=False)
        db.query(Archive).filter(Archive.file_id == file_id).delete(synchronize_session=False)
        db.flush() 

        db.delete(file)
        db.commit()
        return None
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# 4. Manual Archive
@router.patch("/{file_id}/archive", status_code=status.HTTP_200_OK)
def manual_archive_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("ARCHIVE_LOG"))
):
    file = db.query(RawFile).filter(RawFile.file_id == file_id).first()
    if not file or file.is_archived:
        raise HTTPException(status_code=400, detail="File not found or already archived")

    try:
        db.execute(text(f"SET app.current_user_id = '{current_user.user_id}'"))
        file.is_archived = True
        log_count = db.query(LogEntry).filter(LogEntry.file_id == file_id).count()
        db.add(Archive(file_id=file_id, total_records=log_count))
        db.commit()
        return {"message": "File manually archived"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# 5. List My Files (User Dashboard View)
@router.get("/me", response_model=FileListResponse)
def get_user_files(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_active_user),
    scope: str = Query("me", pattern="^(me|team)$"),
    limit: int = 50,
    offset: int = 0
):
    from app.services.team_service import TeamService

    # 1. Identify the user's team
    try:
        team = TeamService.get_active_team_for_user(db, user_id=current_user.user_id)
        target_team_id = team.team_id
    except ValueError:
        return {"total": 0, "items": []}

    # 2. Build the query with joins to get names
    query = db.query(
        RawFile,
        User.username.label("uploader_name")
    ).outerjoin(User, RawFile.uploaded_by == User.user_id)

    # 3. APPLY THE EXCLUSION LOGIC
    if scope == "me":
        # ONLY my files
        query = query.filter(RawFile.uploaded_by == current_user.user_id)
    else:
        # Team files AND EXCLUDE the current user (my files)
        query = query.filter(RawFile.team_id == target_team_id)
        query = query.filter(RawFile.uploaded_by != current_user.user_id) #  Exclude self

    # 4. Pagination and Execution
    total = query.count()
    raw_results = query.order_by(RawFile.uploaded_at.desc()).offset(offset).limit(limit).all()

    items = []
    for row in raw_results:
        f = row[0]
        f.uploader_name = row.uploader_name
        items.append(f)

    return {"total": total, "items": items}