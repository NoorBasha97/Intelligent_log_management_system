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

# 1. GET ALL LOGS (Admin & General Query)
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
    """
    Main endpoint for Log Explorer. 
    Admin: Sees all logs by default, can filter by team_id.
    User: Strictly restricted to their own team's logs.
    """
    target_user_id = None
    target_team_id = team_id

    # SECURITY ENFORCEMENT
    if current_user.user_role != "ADMIN":
        # Regular users can NEVER see logs from other teams
        from app.services.team_service import TeamService
        try:
            team = TeamService.get_active_team_for_user(db, user_id=current_user.user_id)
            target_team_id = team.team_id
        except ValueError:
            # User is not in a team, return nothing
            return {"total": 0, "items": []}
    
    # If target_team_id is None and user is ADMIN, Repository will fetch everything automatically.
    
    items = LogRepository.list_logs(
        db, 
        team_id=target_team_id, 
        user_id=target_user_id, 
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
        team_id=target_team_id, 
        user_id=target_user_id,
        search=search,
        severity_code=severity_code,
        environment_code=environment_code,
        category_name=category_name,
        start_date=start_date,
        end_date=end_date
    )
    
    return {"total": total, "items": items}


# 2. GET MY LOGS (User Scoped Toggle: Me vs Team)
@router.get("/me", response_model=LogListResponse)
def get_user_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_active_user),
    scope: str = Query("me", pattern="^(me|team)$"),
    search: str = Query(None),
    severity_code: str = Query(None),
    environment_code: str = Query(None),
    category_name: str = Query(None),
    start_date: str = Query(None),
    end_date: str = Query(None),
    limit: int = 100,
    offset: int = 0
):
    target_user_id = None
    target_team_id = None

    if scope == "me":
        target_user_id = current_user.user_id
    else:
        from app.models.user_teams import UserTeam
        membership = db.query(UserTeam).filter(
            UserTeam.user_id == current_user.user_id, 
            UserTeam.is_active == True
        ).first()
        if not membership:
            return {"total": 0, "items": []}
        target_team_id = membership.team_id

    items = LogRepository.list_logs(
        db, user_id=target_user_id, team_id=target_team_id, search=search,
        severity_code=severity_code, category_name=category_name, 
        environment_code=environment_code, start_date=start_date, 
        end_date=end_date, limit=limit, offset=offset
    )
    
    total = LogRepository.count_logs(
        db, user_id=target_user_id, team_id=target_team_id, search=search,
        severity_code=severity_code, category_name=category_name, 
        environment_code=environment_code, start_date=start_date, end_date=end_date
    )

    return {"total": total, "items": items}

# 3. LOG MANAGEMENT (Upload/Delete)
@router.post("", status_code=status.HTTP_201_CREATED)
def add_log(
    payload: LogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("UPLOAD_LOG"))
):
    try:
        log = LogService.add_log_entry(db, user_id=current_user.user_id, **payload.dict())
        return {"log_id": log.log_id}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

@router.delete("/{log_id}", status_code=204)
def delete_log(log_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_permission("DELETE_LOG"))):
    log = db.query(LogEntry).filter(LogEntry.log_id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    db.delete(log)
    db.commit()
    return None


# 4. LOOKUPS
class EnvironmentResponse(BaseModel):
    environment_id: int
    environment_code: str
    description: str | None
    class Config: from_attributes = True

@router.get("/environments", response_model=list[EnvironmentResponse])
def get_environments(db: Session = Depends(get_db)):
    from app.models.log_entries import Environment
    return db.query(Environment).all()