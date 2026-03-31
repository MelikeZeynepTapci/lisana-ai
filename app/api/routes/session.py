from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.session import Session
from app.models.message import Message
from app.schemas.session import SessionCreate, SessionResponse, HistoryResponse, MessageOut

router = APIRouter(prefix="/api/session", tags=["session"])


@router.post("/create", response_model=SessionResponse)
async def create_session(body: SessionCreate, db: AsyncSession = Depends(get_db)):
    session = Session(
        language=body.language,
        scenario=body.scenario,
        level=body.level,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    return SessionResponse(
        session_id=session.id,
        language=session.language,
        scenario=session.scenario,
        level=session.level,
        created_at=session.created_at,
    )


@router.get("/{session_id}/history", response_model=HistoryResponse)
async def get_history(session_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Session)
        .options(selectinload(Session.messages))
        .where(Session.id == session_id)
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return HistoryResponse(
        session_id=session.id,
        language=session.language,
        scenario=session.scenario,
        messages=[
            MessageOut(
                id=m.id,
                role=m.role,
                text=m.text,
                audio_url=m.audio_url,
                created_at=m.created_at,
            )
            for m in session.messages
        ],
    )
