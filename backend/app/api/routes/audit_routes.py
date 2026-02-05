from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from app.api.deps import get_db, get_active_user, require_permission
from app.models.audit_trail import AuditTrail
from app.models.user import User
from app.schemas.audit import AuditTrailList

router = APIRouter(prefix="/audit", tags=["Audit Trail"])

# @router.get("", response_model=AuditTrailList)
# def get_all_audit_logs(
#     db: Session = Depends(get_db),
#     # Ensure ONLY admins can access this
#     current_user: User = Depends(require_permission("MANAGE_USERS")), 
#     limit: int = 100,
#     offset: int = 0
# ):
#     # Join with User table to get the username
#     query = db.query(
#         AuditTrail.action_id,
#         AuditTrail.user_id,
#         AuditTrail.action_type,
#         AuditTrail.action_time,
#         User.username.label("username")
#     ).outerjoin(User, AuditTrail.user_id == User.user_id)

#     total = query.count()
#     items = query.order_by(desc(AuditTrail.action_time)).offset(offset).limit(limit).all()

#     return {"total": total, "items": items}


@router.get("", response_model=AuditTrailList)
def get_all_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("MANAGE_USERS")), 
    limit: int = 100,
    offset: int = 0
):
    raw_items = db.query(
        AuditTrail.action_id,
        AuditTrail.user_id,
        AuditTrail.action_type,
        AuditTrail.action_time,
        User.username.label("user_name_alias")
    ).outerjoin(User, AuditTrail.user_id == User.user_id)\
     .order_by(desc(AuditTrail.action_time))\
     .offset(offset).limit(limit).all()

    items = []
    for row in raw_items:
        items.append({
            "action_id": row.action_id,
            "user_id": row.user_id,
            "action_type": row.action_type,
            "action_time": row.action_time,
            "username": row.user_name_alias if row.user_name_alias else "System/Deleted"
        })

    total = db.query(func.count(AuditTrail.action_id)).scalar()
    return {"total": total, "items": items}