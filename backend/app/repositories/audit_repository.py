from typing import Optional, List
from datetime import datetime

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.audit_trail import AuditTrail
from app.models.user import User


class AuditRepository:
    """
    Read-only repository for audit trail data.
    Audit records are DB-generated and immutable.
    """

    # List audit events
    @staticmethod
    def list_audit_events(
        db: Session,
        *,
        user_id: Optional[int] = None,
        action_type: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[AuditTrail]:

        query = (
            db.query(AuditTrail)
            .outerjoin(User, User.user_id == AuditTrail.user_id)
        )

        if user_id is not None:
            query = query.filter(AuditTrail.user_id == user_id)

        if action_type is not None:
            query = query.filter(AuditTrail.action_type == action_type)

        if start_time is not None:
            query = query.filter(AuditTrail.action_time >= start_time)

        if end_time is not None:
            query = query.filter(AuditTrail.action_time <= end_time)

        return (
            query
            .order_by(AuditTrail.action_time.desc())
            .limit(limit)
            .offset(offset)
            .all()
        )

    # Count audit events
    @staticmethod
    def count_audit_events(
        db: Session,
        *,
        user_id: Optional[int] = None,
        action_type: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None
    ) -> int:

        query = db.query(func.count(AuditTrail.action_id))

        if user_id is not None:
            query = query.filter(AuditTrail.user_id == user_id)

        if action_type is not None:
            query = query.filter(AuditTrail.action_type == action_type)

        if start_time is not None:
            query = query.filter(AuditTrail.action_time >= start_time)

        if end_time is not None:
            query = query.filter(AuditTrail.action_time <= end_time)

        return query.scalar() or 0
