from datetime import datetime, timezone
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
    
    # Create team
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

    
    # List teams
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

    
    # Assign user to team
    @staticmethod
    def assign_user_to_team(db: Session, *, user_id: int, team_id: int) -> UserTeam:
        # 1. Validate User and Team existence
        user = UserRepository.get_by_id(db, user_id)
        if not user: raise ValueError("User not found")
        team = TeamRepository.get_by_id(db, team_id)
        if not team: raise ValueError("Team not found")

        # 2. Find the CURRENT active team membership
        current_active = db.query(UserTeam).filter(
            UserTeam.user_id == user_id, 
            UserTeam.is_active == True
        ).first()

        # 3. If they are already in the target team and active, just return it
        if current_active and current_active.team_id == team_id:
            return current_active

        # 4. Deactivate the old team (if any)
        if current_active:
            current_active.is_active = False
            current_active.left_at = datetime.now(timezone.utc)
            db.flush() # Sync change to DB without committing yet

        # 5. Check if a historical record for the NEW team already exists
        existing_record = db.query(UserTeam).filter(
            UserTeam.user_id == user_id,
            UserTeam.team_id == team_id
        ).first()

        if existing_record:
            # Reactivate historical record
            existing_record.is_active = True
            existing_record.left_at = None
            existing_record.joined_at = datetime.now(timezone.utc)
            result = existing_record
        else:
            # Create brand new record
            new_membership = UserTeam(
                user_id=user_id,
                team_id=team_id,
                is_active=True
            )
            db.add(new_membership)
            result = new_membership

        try:
            db.commit()
            db.refresh(result)
            return result
        except Exception as e:
            db.rollback()
            raise ValueError(f"Assignment failed: {str(e)}")
    
    # Get active team for user
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
