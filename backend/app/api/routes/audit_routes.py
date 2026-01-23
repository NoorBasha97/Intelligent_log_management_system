from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from app.api.deps import get_db, require_permission
from app.models.user import User
from app.schemas.audit import AuditQueryParams, AuditListResponse
from app.services.audit_service import AuditService


router = APIRouter(
    prefix="/audit",
    tags=["Audit"]
)


# -------------------------
# List audit events (ADMIN)
# -------------------------
@router.get(
    "",
    response_model=AuditListResponse
)
def list_audit_events(
    params: AuditQueryParams = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("VIEW_SECURITY_LOG"))
):
    """
    View audit trail.
    ADMIN ONLY.
    """
    try:
        result = AuditService.list_audit_events(
            db,
            requesting_user_id=current_user.user_id,
            user_id=params.user_id,
            action_type=params.action_type,
            start_time=params.start_time,
            end_time=params.end_time,
            limit=params.limit,
            offset=params.offset
        )
        return result

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        )
