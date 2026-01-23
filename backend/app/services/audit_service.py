from typing import Optional, Dict
from datetime import datetime

from sqlalchemy.orm import Session

from app.repositories.audit_repository import AuditRepository
from app.services.role_service import RoleService


class AuditService:
    """
    Service layer for audit trail access.
    Enforces admin-only visibility.
    Audit data is READ-ONLY.
    """

    # -------------------------
    # List audit events
    # -------------------------
    @staticmethod
    def list_audit_events(
        db: Session,
        *,
        requesting_user_id: int,
        user_id: Optional[int] = None,
        action_type: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        limit: int = 100,
        offset: int = 0
    ) -> Dict:

        # 1. Permission check (ADMIN-only)
        if not RoleService.user_has_permission(
            db,
            user_id=requesting_user_id,
            permission_key="VIEW_SECURITY_LOG"
        ):
            raise ValueError("Permission denied")

        # 2. Fetch audit events
        events = AuditRepository.list_audit_events(
            db,
            user_id=user_id,
            action_type=action_type,
            start_time=start_time,
            end_time=end_time,
            limit=limit,
            offset=offset
        )

        total = AuditRepository.count_audit_events(
            db,
            user_id=user_id,
            action_type=action_type,
            start_time=start_time,
            end_time=end_time
        )

        return {
            "total": total,
            "items": events
        }
