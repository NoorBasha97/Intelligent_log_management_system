from typing import Optional, List

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models.teams import Team


class TeamRepository:
    """
    Repository layer for Team-related DB operations.
    """


    # Create team
    @staticmethod
    def create_team(
        db: Session,
        team: Team
    ) -> Team:
        try:
            db.add(team)
            db.commit()
            db.refresh(team)
            return team

        except IntegrityError:
            db.rollback()
            raise


    # Get team by ID
    @staticmethod
    def get_by_id(
        db: Session,
        team_id: int
    ) -> Optional[Team]:
        return (
            db.query(Team)
            .filter(Team.team_id == team_id)
            .first()
        )


    # Get team by name
    @staticmethod
    def get_by_name(
        db: Session,
        team_name: str
    ) -> Optional[Team]:
        return (
            db.query(Team)
            .filter(Team.team_name == team_name)
            .first()
        )

    # List teams
    @staticmethod
    def list_teams(
        db: Session,
        *,
        limit: int = 50,
        offset: int = 0
    ) -> List[Team]:
        return (
            db.query(Team)
            .order_by(Team.created_at.desc())
            .limit(limit)
            .offset(offset)
            .all()
        )

    # Update team
    @staticmethod
    def update_team(
        db: Session,
        team: Team
    ) -> Team:
        try:
            db.add(team)
            db.commit()
            db.refresh(team)
            return team

        except IntegrityError:
            db.rollback()
            raise


    # Delete team (hard delete)
    @staticmethod
    def delete_team(
        db: Session,
        team: Team
    ) -> None:
        """
        Hard delete.
        Cascades are handled by DB (user_teams, raw_files references).
        """
        db.delete(team)
        db.commit()
