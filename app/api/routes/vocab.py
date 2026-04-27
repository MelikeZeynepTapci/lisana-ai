import uuid
import logging
from datetime import datetime, date

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.models import User, UserLanguageProfile, UserWordProgress, VocabWord

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/vocab", tags=["vocab"])


# ─── Schemas ──────────────────────────────────────────────────────────────────

class WordOfDayResponse(BaseModel):
    id: str
    word: str
    part_of_speech: str | None
    language: str
    level: str | None
    phonetic: str | None  # filled by frontend/TTS, not stored here


class ProgressUpdateRequest(BaseModel):
    word_id: str
    status: str  # 'seen' | 'learning' | 'known'


class ProgressUpdateResponse(BaseModel):
    word_id: str
    status: str


# ─── Helpers ──────────────────────────────────────────────────────────────────

async def _get_user_level_and_language(
    user: User, db: AsyncSession
) -> tuple[str | None, str]:
    """Return (level, language) from the user's active language profile."""
    result = await db.execute(
        select(UserLanguageProfile)
        .where(UserLanguageProfile.user_id == user.id)
        .order_by(UserLanguageProfile.created_at.desc())
        .limit(1)
    )
    profile = result.scalars().first()
    if not profile:
        return None, "German"
    return profile.current_level, profile.language


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.get("/word-of-day", response_model=WordOfDayResponse)
async def word_of_day(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return a word the user hasn't seen yet at their current CEFR level.
    Falls back to 'learning' words if all level words are seen.
    Falls back to any unseen word if no level match.
    """
    level, language = await _get_user_level_and_language(current_user, db)

    # Subquery: word_ids the user has already seen
    seen_ids = (
        select(UserWordProgress.word_id)
        .where(UserWordProgress.user_id == current_user.id)
        .scalar_subquery()
    )

    async def pick_unseen(extra_filter=None):
        q = (
            select(VocabWord)
            .where(VocabWord.language == language)
            .where(VocabWord.id.not_in(seen_ids))
            .order_by(func.random())
            .limit(1)
        )
        if extra_filter is not None:
            q = q.where(extra_filter)
        result = await db.execute(q)
        return result.scalars().first()

    # 1. Unseen word at exact level
    word = None
    if level:
        word = await pick_unseen(VocabWord.level == level)

    # 2. Any unseen word in this language
    if not word:
        word = await pick_unseen()

    # 3. All seen — pick a 'learning' word to review
    if not word:
        result = await db.execute(
            select(VocabWord)
            .join(UserWordProgress, UserWordProgress.word_id == VocabWord.id)
            .where(UserWordProgress.user_id == current_user.id)
            .where(UserWordProgress.status == "learning")
            .where(VocabWord.language == language)
            .order_by(func.random())
            .limit(1)
        )
        word = result.scalars().first()

    if not word:
        raise HTTPException(status_code=404, detail="No vocabulary words available.")

    # Mark as seen (upsert)
    result = await db.execute(
        select(UserWordProgress).where(
            UserWordProgress.user_id == current_user.id,
            UserWordProgress.word_id == word.id,
        )
    )
    progress = result.scalars().first()
    if not progress:
        db.add(UserWordProgress(
            id=uuid.uuid4(),
            user_id=current_user.id,
            word_id=word.id,
            status="seen",
        ))
        await db.commit()

    return WordOfDayResponse(
        id=str(word.id),
        word=word.word,
        part_of_speech=word.part_of_speech,
        language=word.language,
        level=word.level,
        phonetic=None,
    )


@router.post("/progress", response_model=ProgressUpdateResponse)
async def update_progress(
    body: ProgressUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update the user's status for a word: 'seen' | 'learning' | 'known'."""
    if body.status not in ("seen", "learning", "known"):
        raise HTTPException(status_code=422, detail="status must be seen, learning, or known")

    try:
        word_uuid = uuid.UUID(body.word_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="invalid word_id")

    result = await db.execute(
        select(UserWordProgress).where(
            UserWordProgress.user_id == current_user.id,
            UserWordProgress.word_id == word_uuid,
        )
    )
    progress = result.scalars().first()

    if progress:
        progress.status = body.status
        if body.status == "known" and not progress.known_at:
            progress.known_at = datetime.utcnow()
    else:
        db.add(UserWordProgress(
            id=uuid.uuid4(),
            user_id=current_user.id,
            word_id=word_uuid,
            status=body.status,
            known_at=datetime.utcnow() if body.status == "known" else None,
        ))

    await db.commit()
    return ProgressUpdateResponse(word_id=body.word_id, status=body.status)
