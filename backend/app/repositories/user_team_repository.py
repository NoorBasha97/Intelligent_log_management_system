from typing import Optional

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models.user_teams import UserTeam


class UserTeamRepository:
    """
    Repository for user <-> team mapping.
    Handles DB-level operations only.
    """

    # -------------------------
    # Get active team for user
    # -------------------------
    @staticmethod
    def get_active_team(
        db: Session,
        user_id: int
    ) -> Optional[UserTeam]:
        return (
            db.query(UserTeam)
            .filter(
                UserTeam.user_id == user_id,
                # UserTeam.is_active == True
            )
            .first()
        )

    # -------------------------
    # Assign user to a team
    # -------------------------
    @staticmethod
    def assign_user_to_team(
        db: Session, 
        user_team: UserTeam
    ) -> UserTeam:
        """
        Assumes old active team is already deactivated
        at service layer.
        """
        try:
            db.add(user_team)
            db.commit()
            db.refresh(user_team)
            return user_team

        except IntegrityError:
            db.rollback()
            raise

    # -------------------------
    # Deactivate active team
    # -------------------------
    @staticmethod
    def deactivate_active_team(
        db: Session,
        user_team: UserTeam
    ) -> None:
        user_team.is_active = False
        user_team.left_at = None

        db.add(user_team)
        db.commit()

    # -------------------------
    # Get membership by user & team
    # -------------------------
    @staticmethod
    def get_by_user_and_team(
        db: Session,
        user_id: int,
        team_id: int
    ) -> Optional[UserTeam]:
        return (
            db.query(UserTeam)
            .filter(
                UserTeam.user_id == user_id,
                UserTeam.team_id == team_id
            )
            .first()
        )
