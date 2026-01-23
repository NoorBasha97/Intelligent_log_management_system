from typing import List

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models.teams import Team
from app.models.user_teams import UserTeam
from app.repositories.team_repository import TeamRepository
from app.repositories.user_team_repository import UserTeamRepository
from app.repositories.user_repository import UserRepository


class TeamService:
    """
    Service layer for team and membership logic.
    Enforces multi-tenancy rules.
    """

    # -------------------------
    # Create team
    # -------------------------
    @staticmethod
    def create_team(
        db: Session,
        *,
        team_name: str
    ) -> Team:

        # Prevent duplicate team names
        existing = TeamRepository.get_by_name(db, team_name)
        if existing:
            raise ValueError("Team name already exists")

        team = Team(team_name=team_name)

        try:
            return TeamRepository.create_team(db, team)
        except IntegrityError:
            raise ValueError("Team creation failed")

    # -------------------------
    # List teams
    # -------------------------
    @staticmethod
    def list_teams(
        db: Session,
        *,
        limit: int = 50,
        offset: int = 0
    ) -> List[Team]:
        return TeamRepository.list_teams(
            db,
            limit=limit,
            offset=offset
        )

    # -------------------------
    # Assign user to team
    # -------------------------
    @staticmethod
    def assign_user_to_team(
        db: Session,
        *,
        user_id: int,
        team_id: int
    ) -> UserTeam:

        # 1. Validate user
        user = UserRepository.get_by_id(db, user_id)
        if not user or user.is_deleted or not user.is_active:
            raise ValueError("Invalid user")

        # 2. Validate team
        team = TeamRepository.get_by_id(db, team_id)
        if not team:
            raise ValueError("Team not found")

        # 3. Deactivate existing active team (if any)
        active_membership = UserTeamRepository.get_active_team(db, user_id)
        if active_membership:
            UserTeamRepository.deactivate_active_team(
                db,
                active_membership
            )

        # 4. Assign new team
        membership = UserTeam(
            user_id=user_id,
            team_id=team_id,
            is_active=True
        )

        try:
            return UserTeamRepository.assign_user_to_team(
                db,
                membership
            )
        except IntegrityError:
            raise ValueError("User already assigned to this team")

    # -------------------------
    # Get active team for user
    # -------------------------
    @staticmethod
    def get_active_team_for_user(
        db: Session,
        *,
        user_id: int
    ) -> Team:

        membership = UserTeamRepository.get_active_team(db, user_id)

        if not membership:
            raise ValueError("User has no active team")

        team = TeamRepository.get_by_id(db, membership.team_id)
        if not team:
            raise ValueError("Active team not found")

        return team
