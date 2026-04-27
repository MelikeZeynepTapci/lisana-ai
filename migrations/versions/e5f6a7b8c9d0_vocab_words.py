"""vocab_words and user_word_progress tables

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-04-27
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "e5f6a7b8c9d0"
down_revision = "d4e5f6a7b8c9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "vocab_words",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("word", sa.Text(), nullable=False),
        sa.Column("part_of_speech", sa.String(), nullable=True),
        sa.Column("language", sa.String(), nullable=False),
        sa.Column("level", sa.String(), nullable=True),   # A1/A2/B1/B2/C1 — nullable if unknown
        sa.Column("translation", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index("ix_vocab_words_language_level", "vocab_words", ["language", "level"])

    op.create_table(
        "user_word_progress",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("word_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("vocab_words.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default="seen"),  # seen | learning | known
        sa.Column("seen_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("known_at", sa.DateTime(), nullable=True),
        sa.UniqueConstraint("user_id", "word_id", name="uq_user_word_progress"),
    )
    op.create_index("ix_user_word_progress_user_id", "user_word_progress", ["user_id"])


def downgrade() -> None:
    op.drop_table("user_word_progress")
    op.drop_index("ix_vocab_words_language_level", "vocab_words")
    op.drop_table("vocab_words")
