from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.models import (
    Evaluation,
    Message,
    Session,
    Streak,
    User,
    UserLanguageProfile,
    UserProfile,
    XPEvent,
)

router = APIRouter(prefix="/api/user", tags=["user"])


class MeResponse(BaseModel):
    id: str
    email: str
    username: str | None
    full_name: str | None
    active_language: str | None
    active_level: str | None


class ProgressResponse(BaseModel):
    current_level: str
    current_streak: int
    sessions_this_week: int
    last_session_score: int | None
    total_xp: int
    watch_out_topic: str | None


@router.get("/me", response_model=MeResponse)
async def get_me(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(UserLanguageProfile).where(
            UserLanguageProfile.user_id == current_user.id,
            UserLanguageProfile.is_active == True,
        )
    )
    lang_profile = result.scalars().first()

    return MeResponse(
        id=str(current_user.id),
        email=current_user.email,
        username=current_user.username,
        full_name=current_user.full_name,
        active_language=lang_profile.language if lang_profile else None,
        active_level=lang_profile.current_level if lang_profile else None,
    )


@router.get("/progress", response_model=ProgressResponse)
async def get_progress(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Active language profile
    result = await db.execute(
        select(UserLanguageProfile).where(
            UserLanguageProfile.user_id == current_user.id,
            UserLanguageProfile.is_active == True,
        )
    )
    lang_profile = result.scalars().first()
    if not lang_profile:
        return ProgressResponse(
            current_level="A1",
            current_streak=0,
            sessions_this_week=0,
            last_session_score=None,
            total_xp=0,
            watch_out_topic=None,
        )

    # Streak
    result = await db.execute(
        select(Streak).where(Streak.language_profile_id == lang_profile.id)
    )
    streak = result.scalars().first()
    current_streak = streak.current_streak if streak else 0

    # Sessions this week (Monday → today)
    today = date.today()
    monday_dt = datetime.combine(today - timedelta(days=today.weekday()), datetime.min.time())
    result = await db.execute(
        select(func.count(Session.id)).where(
            Session.language_profile_id == lang_profile.id,
            Session.created_at >= monday_dt,
        )
    )
    sessions_this_week = result.scalar() or 0

    # Most recent session → score + watch_out_topic
    result = await db.execute(
        select(Session)
        .where(Session.language_profile_id == lang_profile.id)
        .order_by(Session.created_at.desc())
        .limit(1)
    )
    last_session = result.scalars().first()
    last_session_score: int | None = None
    watch_out_topic: str | None = None

    if last_session:
        if last_session.session_feedback:
            watch_out_for = last_session.session_feedback.get("watch_out_for", [])
            if watch_out_for:
                watch_out_topic = watch_out_for[0].get("topic")

        result = await db.execute(
            select(Evaluation)
            .join(Message, Evaluation.message_id == Message.id)
            .where(Message.session_id == last_session.id, Message.role == "user")
        )
        evals = result.scalars().all()
        if evals:
            scores = []
            for e in evals:
                vals = [v for v in [e.fluency, e.grammar, e.vocabulary] if v is not None]
                if vals:
                    scores.append(sum(vals) / len(vals))
            if scores:
                last_session_score = round(sum(scores) / len(scores) * 10)

    # Total XP
    result = await db.execute(
        select(func.sum(XPEvent.amount)).where(
            XPEvent.language_profile_id == lang_profile.id
        )
    )
    total_xp = result.scalar() or 0

    return ProgressResponse(
        current_level=lang_profile.current_level,
        current_streak=current_streak,
        sessions_this_week=sessions_this_week,
        last_session_score=last_session_score,
        total_xp=total_xp,
        watch_out_topic=watch_out_topic,
    )
