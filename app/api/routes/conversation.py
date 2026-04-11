import base64
import json
import re
import time
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.models import User, Session, Message
from app.schemas.conversation import TurnResponse
from app.services.speech_service import transcribe_audio, synthesize_speech, synthesize_sentence_stream
from app.services.ai_service import generate_tutor_response, stream_tutor_response
from app.services import langfuse_service

router = APIRouter(prefix="/api/conversation", tags=["conversation"])

_SENTENCE_END = re.compile(r'[.!?](?:\s|$)')


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


def _extract_sentence(buffer: str) -> tuple[str, str]:
    """Extract first complete sentence. Returns (sentence, remaining_buffer)."""
    m = _SENTENCE_END.search(buffer)
    if m:
        return buffer[: m.end()].strip(), buffer[m.end() :].lstrip()
    return "", buffer


@router.post("/turn", response_model=TurnResponse)
async def conversation_turn(
    session_id: str = Form(...),
    audio: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    start_time = time.time()

    result = await db.execute(
        select(Session)
        .options(selectinload(Session.messages), selectinload(Session.language_profile))
        .join(Session.language_profile)
        .where(
            Session.id == session_id,
            Session.language_profile.has(user_id=current_user.id),
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    audio_bytes = await audio.read()
    user_text = await transcribe_audio(audio_bytes, audio.filename or "audio.webm")

    if not user_text.strip():
        raise HTTPException(status_code=422, detail="Could not transcribe audio — please try again")

    history = [{"role": m.role, "content": m.transcript} for m in session.messages]

    ai_text, usage = await generate_tutor_response(
        language=session.language_profile.language,
        scenario=session.scenario,
        level=session.language_profile.current_level,
        conversation_history=history,
        user_message=user_text,
    )

    _, audio_url = await synthesize_speech(ai_text)
    latency_ms = int((time.time() - start_time) * 1000)

    user_msg = Message(session_id=session.id, role="user", transcript=user_text)
    ai_msg = Message(session_id=session.id, role="assistant", transcript=ai_text, audio_url=audio_url)
    db.add(user_msg)
    db.add(ai_msg)
    await db.commit()

    langfuse_service.log_conversation_turn(
        session_id=str(session.id),
        language=session.language_profile.language,
        scenario=session.scenario,
        level=session.language_profile.current_level,
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


@router.post("/turn/stream")
async def conversation_turn_stream(
    session_id: str = Form(...),
    audio: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    audio_bytes = await audio.read()
    filename = audio.filename or "audio.webm"
    start_time = time.time()

    async def generate():
        from app.core.database import AsyncSessionLocal
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(Session)
                .options(selectinload(Session.messages), selectinload(Session.language_profile))
                .join(Session.language_profile)
                .where(
                    Session.id == session_id,
                    Session.language_profile.has(user_id=current_user.id),
                )
            )
            session = result.scalar_one_or_none()
            if not session:
                yield _sse("error", {"message": "Session not found"})
                return

            try:
                user_text = await transcribe_audio(audio_bytes, filename)
            except Exception:
                yield _sse("error", {"message": "Transcription failed"})
                return

            if not user_text.strip():
                yield _sse("error", {"message": "Could not transcribe audio — please try again"})
                return

            yield _sse("transcript", {"text": user_text})

            history = [{"role": m.role, "content": m.transcript} for m in session.messages]

            sentence_buffer = ""
            ai_parts: list[str] = []

            async for token in stream_tutor_response(
                language=session.language_profile.language,
                scenario=session.scenario,
                level=session.language_profile.current_level,
                conversation_history=history,
                user_message=user_text,
            ):
                sentence_buffer += token
                ai_parts.append(token)

                while True:
                    sentence, remainder = _extract_sentence(sentence_buffer)
                    if sentence:
                        sentence_buffer = remainder
                        yield _sse("ai_chunk", {"text": sentence})
                        async for pcm_chunk in synthesize_sentence_stream(sentence):
                            yield _sse("audio", {"rate": 24000, "pcm": base64.b64encode(pcm_chunk).decode()})
                    elif len(sentence_buffer) >= 100:
                        sentence = sentence_buffer.strip()
                        sentence_buffer = ""
                        if sentence:
                            yield _sse("ai_chunk", {"text": sentence})
                            async for pcm_chunk in synthesize_sentence_stream(sentence):
                                yield _sse("audio", {"rate": 24000, "pcm": base64.b64encode(pcm_chunk).decode()})
                    else:
                        break

            if sentence_buffer.strip():
                sentence = sentence_buffer.strip()
                yield _sse("ai_chunk", {"text": sentence})
                async for pcm_chunk in synthesize_sentence_stream(sentence):
                    yield _sse("audio", {"rate": 24000, "pcm": base64.b64encode(pcm_chunk).decode()})

            ai_text = "".join(ai_parts)
            latency_ms = int((time.time() - start_time) * 1000)

            user_msg = Message(session_id=session.id, role="user", transcript=user_text)
            ai_msg = Message(session_id=session.id, role="assistant", transcript=ai_text)
            db.add(user_msg)
            db.add(ai_msg)
            await db.commit()

            langfuse_service.log_conversation_turn(
                session_id=str(session.id),
                language=session.language_profile.language,
                scenario=session.scenario,
                level=session.language_profile.current_level,
                user_text=user_text,
                ai_text=ai_text,
                usage={"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0, "cost_usd": 0},
                latency_ms=latency_ms,
            )

            yield _sse("done", {})

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
