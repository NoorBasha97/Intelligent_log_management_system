from fastapi import APIRouter, Depends, HTTPException, Query, status
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
    severity: str = Query(None),
    environment: str = Query(None),
    category: str = Query(None),
    team_id: int = Query(None),
    start_date: str = Query(None),
    limit: int = 100,
    offset: int = 0
):
    target_team_id = team_id if current_user.user_role == "ADMIN" else None
    
    if current_user.user_role != "ADMIN":
        from app.services.team_service import TeamService
        try:
            team = TeamService.get_active_team_for_user(db, user_id=current_user.user_id)
            target_team_id = team.team_id
        except:
            return {"total": 0, "items": []}

    items = LogRepository.list_logs(
        db, team_id=target_team_id, search=search, severity=severity,
        environment=environment, category=category, start_date=start_date,
        limit=limit, offset=offset
    )
    total = LogRepository.count_logs(db, team_id=target_team_id)
    return {"total": total, "items": items}

@router.delete("/{log_id}", status_code=204)
def delete_log(log_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_active_user)):
    log = db.query(LogEntry).filter(LogEntry.log_id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    db.delete(log)
    db.commit()
    return None