import time
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.session import Session
from app.models.message import Message
from app.schemas.conversation import TurnResponse
from app.services.speech_service import transcribe_audio, synthesize_speech
from app.services.ai_service import generate_tutor_response
from app.services import langfuse_service

router = APIRouter(prefix="/api/conversation", tags=["conversation"])


@router.post("/turn", response_model=TurnResponse)
async def conversation_turn(
    session_id: str = Form(...),
    audio: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    start_time = time.time()

    # Load session with messages
    result = await db.execute(
        select(Session)
        .options(selectinload(Session.messages))
        .where(Session.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Transcribe user audio
    audio_bytes = await audio.read()
    user_text = await transcribe_audio(audio_bytes, audio.filename or "audio.webm")

    if not user_text.strip():
        raise HTTPException(status_code=422, detail="Could not transcribe audio — please try again")

    # Build conversation history for GPT
    history = [
        {"role": m.role, "content": m.text}
        for m in session.messages
    ]

    # Generate AI response
    ai_text, usage = await generate_tutor_response(
        language=session.language,
        scenario=session.scenario,
        level=session.level,
        conversation_history=history,
        user_message=user_text,
    )

    # Synthesize AI speech
    _, audio_url = await synthesize_speech(ai_text)

    latency_ms = int((time.time() - start_time) * 1000)

    # Save both messages to DB
    user_msg = Message(session_id=session_id, role="user", text=user_text)
    ai_msg = Message(session_id=session_id, role="assistant", text=ai_text, audio_url=audio_url)
    db.add(user_msg)
    db.add(ai_msg)
    await db.commit()

    # Log to Langfuse (non-blocking)
    langfuse_service.log_conversation_turn(
        session_id=session_id,
        language=session.language,
        scenario=session.scenario,
        level=session.level,
        user_text=user_text,
        ai_text=ai_text,
        usage=usage,
        latency_ms=latency_ms,
    )

    return TurnResponse(
        user_transcript=user_text,
        ai_text=ai_text,
        audio_url=audio_url,
        latency_ms=latency_ms,
    )
