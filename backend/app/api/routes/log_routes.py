from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional

from app.api.deps import get_db, get_active_user, require_permission
from app.models.user import User
from app.schemas.log import (
    LogCreate,
    LogBulkCreate,
    LogQueryParams,
    LogListResponse
)
from app.services.log_service import LogService
from app.models.log_entries import LogEntry
from app.repositories.log_repository import LogRepository
from app.models.raw_file import RawFile
from pydantic import BaseModel

router = APIRouter(
    prefix="/logs",
    tags=["Logs"]
)


# -------------------------
# Add single log entry
# -------------------------
@router.post(
    "",
    status_code=status.HTTP_201_CREATED
)
def add_log(
    payload: LogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("UPLOAD_LOG"))
):
    try:
        log = LogService.add_log_entry(
            db,
            user_id=current_user.user_id,
            file_id=payload.file_id,
            log_timestamp=payload.log_timestamp,
            message_line=payload.message_line,
            severity_id=payload.severity_id,
            category_id=payload.category_id,
            environment_id=payload.environment_id
        )
        return {"log_id": log.log_id}
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        )


# -------------------------
# Bulk add log entries
# -------------------------
@router.post(
    "/bulk",
    status_code=status.HTTP_201_CREATED
)
def bulk_add_logs(
    payload: LogBulkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("UPLOAD_LOG"))
):
    try:
        count = LogService.bulk_add_logs(
            db,
            user_id=current_user.user_id,
            file_id=payload.file_id,
            logs=payload.logs
        )
        return {
            "inserted": count
        }
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        )


# -------------------------
# Query logs
# -------------------------
@router.get(
    "",
    response_model=LogListResponse
)
def query_logs(
    params: LogQueryParams = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("VIEW_LOG"))
):
    try:
        result = LogService.query_logs(
            db,
            user_id=current_user.user_id,
            start_date=params.start_date,
            end_date=params.end_date,
            severity_code=params.severity_code,
            category_name=params.category_name,
            environment_code=params.environment_code,
            file_id=params.file_id,
            search=params.search,
            limit=params.limit,
            offset=params.offset
        )
        return result
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        )


@router.get("", response_model=LogListResponse)
def get_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_active_user),
    search: str = Query(None),
    severity_code: Optional[str] = Query(None),
    environment_code: Optional[str] = Query(None),
    category_name: Optional[str] = Query(None),
    team_id: Optional[int] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    limit: int = 100,
    offset: int = 0
):
    # Determine the target team context
    target_team_id = team_id if current_user.user_role == "ADMIN" else None
    
    if current_user.user_role != "ADMIN":
        from app.services.team_service import TeamService
        try:
            team = TeamService.get_active_team_for_user(db, user_id=current_user.user_id)
            target_team_id = team.team_id
        except:
            return {"total": 0, "items": []}

    # Fetch logs from repository
    items = LogRepository.list_logs(
        db, team_id=target_team_id, search=search, 
        severity_code=severity_code, environment_code=environment_code, 
        category_name=category_name, start_date=start_date, end_date=end_date,
        limit=limit, offset=offset
    )
    
    total = LogRepository.count_logs(
        db, team_id=target_team_id, search=search,
        severity_code=severity_code, environment_code=environment_code,
        category_name=category_name, start_date=start_date, end_date=end_date
    )
    
    return {"total": total, "items": items}


@router.delete("/{log_id}", status_code=204)
def delete_log(log_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_active_user)):
    log = db.query(LogEntry).filter(LogEntry.log_id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    db.delete(log)
    db.commit()
    return None


@router.get("/me", response_model=LogListResponse)
def get_my_team_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_active_user),
    search: str = Query(None),
    severity: str = Query(None),
    environment: str = Query(None),
    category: str = Query(None),
    start_date: str = Query(None),
    end_date: str = Query(None),
    limit: int = 100,
    offset: int = 0
):
    # Determine the user's team
    from app.services.team_service import TeamService
    try:
        team = TeamService.get_active_team_for_user(db, user_id=current_user.user_id)
        target_team_id = team.team_id
    except ValueError:
        # If user has no team, they see nothing
        return {"total": 0, "items": []}

    items = LogRepository.list_logs(
        db, 
        team_id=target_team_id, # Strict enforcement
        user_id=None,           # Set this to current_user.user_id for strictly personal uploads
        search=search, 
        severity=severity,
        environment=environment, 
        category=category, 
        start_date=start_date, 
        end_date=end_date,
        limit=limit, 
        offset=offset
    )
    
    return {"total": len(items), "items": items}



# backend/app/api/routes/log_routes.py
# backend/app/api/routes/log_routes.py

@router.get("/me", response_model=LogListResponse)
def get_user_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_active_user),
    scope: str = Query("me", regex="^(me|team)$"), # Only allow 'me' or 'team'
    limit: int = 100,
    offset: int = 0
):
    from app.services.team_service import TeamService
    
    target_user_id = None
    target_team_id = None

    if scope == "me":
        # Scope: Just my personal uploads
        target_user_id = current_user.user_id
    else:
        # Scope: My whole team
        try:
            team = TeamService.get_active_team_for_user(db, user_id=current_user.user_id)
            target_team_id = team.team_id
        except ValueError:
            return {"total": 0, "items": []}

    items = LogRepository.list_logs(
        db, 
        user_id=target_user_id, 
        team_id=target_team_id,
        limit=limit, 
        offset=offset
    )
    
    # Simple count query
    query = db.query(func.count(LogEntry.log_id)).join(RawFile)
    if target_user_id:
        query = query.filter(RawFile.uploaded_by == target_user_id)
    else:
        query = query.filter(RawFile.team_id == target_team_id)
    
    total = query.scalar() or 0

    return {"total": total, "items": items}


@router.get("/me/entries", response_model=LogListResponse)
def get_user_log_entries(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_active_user),
    search: str = Query(None),
    severity_code: str = Query(None),
    environment_code: str = Query(None),
    category_name: str = Query(None),
    start_date: str = Query(None),
    end_date: str = Query(None),
    limit: int = 100,
    offset: int = 0
):
    # This route is locked to the current_user's ID
    items = LogRepository.list_logs(
        db, 
        user_id=current_user.user_id, # Mandatory filter
        search=search,
        severity_code=severity_code,
        environment_code=environment_code,
        category_name=category_name,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        offset=offset
    )
    
    total = LogRepository.count_logs(
        db, 
        user_id=current_user.user_id,
        search=search,
        severity_code=severity_code,
        environment_code=environment_code,
        category_name=category_name,
        start_date=start_date,
        end_date=end_date
    )
    
    return {"total": total, "items": items}


# Define a simple schema for the response
class EnvironmentResponse(BaseModel):
    environment_id: int
    environment_code: str
    description: str | None

    class Config:
        from_attributes = True

# Add this route
@router.get("/environments", response_model=list[EnvironmentResponse])
def get_environments(db: Session = Depends(get_db)):
    from app.models.log_entries import Environment # Import your Environment model
    return db.query(Environment).all()