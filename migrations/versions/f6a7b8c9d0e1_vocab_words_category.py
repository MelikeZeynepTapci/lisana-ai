"""vocab_words category column

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-04-28
"""
from alembic import op
import sqlalchemy as sa

revision = "f6a7b8c9d0e1"
down_revision = "e5f6a7b8c9d0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("vocab_words", sa.Column("category", sa.String(), nullable=True))
    op.create_index("ix_vocab_words_category", "vocab_words", ["category"])


def downgrade() -> None:
    op.drop_index("ix_vocab_words_category", table_name="vocab_words")
    op.drop_column("vocab_words", "category")
