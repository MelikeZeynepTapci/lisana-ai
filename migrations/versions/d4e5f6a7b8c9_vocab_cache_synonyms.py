"""vocab_cache add synonyms column

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-04-26
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "d4e5f6a7b8c9"
down_revision = "c3d4e5f6a7b8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "vocab_cache",
        sa.Column("synonyms", postgresql.JSONB(), nullable=True, server_default="[]"),
    )


def downgrade() -> None:
    op.drop_column("vocab_cache", "synonyms")
