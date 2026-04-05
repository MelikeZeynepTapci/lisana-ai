from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.models import User, Session, Message, UserLanguageProfile
from app.schemas.session import SessionCreate, SessionResponse, HistoryResponse, MessageOut

router = APIRouter(prefix="/api/session", tags=["session"])


@router.post("/create", response_model=SessionResponse)
async def create_session(
    body: SessionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Find user's active language profile
    result = await db.execute(
        select(UserLanguageProfile).where(
            UserLanguageProfile.user_id == current_user.id,
            UserLanguageProfile.language == body.language,
            UserLanguageProfile.is_active == True,
        )
    )
    lang_profile = result.scalar_one_or_none()

    if not lang_profile:
        lang_profile = UserLanguageProfile(
            user_id=current_user.id,
            language=body.language,
            current_level="A1",
            is_active=True,
        )
        db.add(lang_profile)
        await db.commit()
        await db.refresh(lang_profile)

    session = Session(
        language_profile_id=lang_profile.id,
        scenario=body.scenario,
        mode=body.mode if hasattr(body, "mode") else "daily",
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    return SessionResponse(
        session_id=str(session.id),
        language=body.language,
        scenario=session.scenario,
        level=lang_profile.current_level,
        created_at=session.created_at,
    )


@router.get("/{session_id}/history", response_model=HistoryResponse)
async def get_history(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Session)
        .options(selectinload(Session.messages))
        .join(Session.language_profile)
        .where(
            Session.id == session_id,
            Session.language_profile.has(user_id=current_user.id),
        )
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return HistoryResponse(
        session_id=str(session.id),
        scenario=session.scenario,
        messages=[
            MessageOut(
                id=str(m.id),
                role=m.role,
                text=m.transcript,
                audio_url=m.audio_url,
                created_at=m.created_at,
            )
            for m in session.messages
        ],
    )
