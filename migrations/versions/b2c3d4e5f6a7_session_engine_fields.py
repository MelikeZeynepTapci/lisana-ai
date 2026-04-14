"""session engine fields

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-04-12
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "b2c3d4e5f6a7"
down_revision = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("sessions", sa.Column("scenario_id", sa.String(), nullable=True))
    op.add_column("sessions", sa.Column("state", sa.String(), nullable=True, server_default="IDLE"))
    op.add_column("sessions", sa.Column("turn_count", sa.Integer(), nullable=True, server_default="0"))
    op.add_column("sessions", sa.Column("started_at", sa.DateTime(), nullable=True))
    op.add_column("sessions", sa.Column("voice_seconds", sa.Float(), nullable=True, server_default="0"))
    op.add_column("sessions", sa.Column("waypoints_state", postgresql.JSONB(), nullable=True, server_default="{}"))
    op.add_column("sessions", sa.Column("twists_fired", sa.Integer(), nullable=True, server_default="0"))
    op.add_column("sessions", sa.Column("wrap_up_turns", sa.Integer(), nullable=True, server_default="0"))
    op.add_column("sessions", sa.Column("session_feedback", postgresql.JSONB(), nullable=True))


def downgrade() -> None:
    op.drop_column("sessions", "session_feedback")
    op.drop_column("sessions", "wrap_up_turns")
    op.drop_column("sessions", "twists_fired")
    op.drop_column("sessions", "waypoints_state")
    op.drop_column("sessions", "voice_seconds")
    op.drop_column("sessions", "started_at")
    op.drop_column("sessions", "turn_count")
    op.drop_column("sessions", "state")
    op.drop_column("sessions", "scenario_id")
