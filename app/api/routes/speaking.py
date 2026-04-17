import base64
import json
import re
import time
from datetime import datetime

from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.auth import get_current_user
from app.core.database import AsyncSessionLocal
from app.models.models import Message, Session, User, UserLanguageProfile, UserProfile
from app.services.chip_generator import generate_chips
from app.services.maya.maya_service import stream_maya_opening, stream_maya_turn
from app.services.session.feedback_generator import generate_feedback
from app.services.session.session_manager import (
    LEVEL_PARAMS,
    check_end_trigger,
    load_scenario,
)
from app.services.session.twist_engine import select_twist, should_fire_twist
from app.services.session.waypoint_tracker import (
    detect_waypoints,
    get_last_completed_waypoint,
)
from app.services.speech_service import synthesize_sentence_stream, transcribe_audio

router = APIRouter(prefix="/api/speaking", tags=["speaking"])

_SENTENCE_END = re.compile(r"[.!?](?:\s|$)")


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


def _extract_sentence(buffer: str) -> tuple[str, str]:
    m = _SENTENCE_END.search(buffer)
    if m:
        return buffer[: m.end()].strip(), buffer[m.end() :].lstrip()
    return "", buffer


async def _stream_tts(text: str, level: str = "B1"):
    async for pcm_chunk in synthesize_sentence_stream(text, level=level):
        yield _sse("audio", {"rate": 24000, "pcm": base64.b64encode(pcm_chunk).decode()})


async def _flush_text_stream(token_stream, sentence_buffer: str = ""):
    async for token in token_stream:
        sentence_buffer += token
        while True:
            sentence, remainder = _extract_sentence(sentence_buffer)
            if sentence:
                sentence_buffer = remainder
                yield sentence
            elif len(sentence_buffer) >= 100:
                sentence = sentence_buffer.strip()
                sentence_buffer = ""
                if sentence:
                    yield sentence
            else:
                break

    if sentence_buffer.strip():
        yield sentence_buffer.strip()


# ─── Start Session ────────────────────────────────────────────────────────────

class StartSessionBody(BaseModel):
    scenario_id: str
    language: str


@router.post("/session/start")
async def start_session(
    body: StartSessionBody,
    current_user: User = Depends(get_current_user),
):
    async def generate():
        async with AsyncSessionLocal() as db:
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
                await db.flush()

            level = lang_profile.current_level
            params = LEVEL_PARAMS.get(level, LEVEL_PARAMS["A1"])

            try:
                scenario = load_scenario(body.scenario_id)
            except FileNotFoundError:
                yield _sse("error", {"message": f"Scenario '{body.scenario_id}' not found"})
                return

            session = Session(
                language_profile_id=lang_profile.id,
                scenario=scenario["title"],
                scenario_id=body.scenario_id,
                state="ENTRY",
                turn_count=0,
                started_at=datetime.utcnow(),
                voice_seconds=0.0,
                waypoints_state={},
                twists_fired=0,
                wrap_up_turns=0,
            )
            db.add(session)
            await db.commit()
            await db.refresh(session)

            diff_profile = scenario["difficulty_profiles"].get(level, {})

            yield _sse("session_created", {
                "session_id": str(session.id),
                "scenario_title": scenario["title"],
                "description": scenario["description"],
                "communication_goal": scenario["communication_goal"],
                "level": level,
                "soft_cap": params["soft_cap"],
                "turn_estimate": diff_profile.get("expected_turns", params["soft_cap"]),
                "persona_name": scenario["maya_persona"]["name"],
            })

            opening_parts: list[str] = []
            async for sentence in _flush_text_stream(
                stream_maya_opening(scenario, level, body.language)
            ):
                opening_parts.append(sentence)
                yield _sse("ai_chunk", {"text": sentence})
                async for evt in _stream_tts(sentence, level=level):
                    yield evt

            opening_text = " ".join(opening_parts)
            db.add(Message(session_id=session.id, role="assistant", transcript=opening_text))
            session.state = "CORE"
            await db.commit()

            # Fetch user profile for chip context
            profile_result = await db.execute(
                select(UserProfile).where(UserProfile.user_id == current_user.id)
            )
            user_profile_obj = profile_result.scalar_one_or_none()
            user_profile = user_profile_obj.onboarding_data if user_profile_obj else {}

            try:
                chips = await generate_chips(
                    maya_message=opening_text,
                    language=body.language,
                    level=level,
                    user_profile=user_profile,
                )
                if chips:
                    yield _sse("chips", {"chips": chips})
            except Exception:
                pass

            yield _sse("done", {})

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ─── End Session ──────────────────────────────────────────────────────────────

class EndSessionBody(BaseModel):
    session_id: str


@router.post("/session/end")
async def end_session(
    body: EndSessionBody,
    current_user: User = Depends(get_current_user),
):
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Session)
            .options(selectinload(Session.messages), selectinload(Session.language_profile))
            .join(Session.language_profile)
            .where(
                Session.id == body.session_id,
                Session.language_profile.has(user_id=current_user.id),
            )
        )
        session = result.scalar_one_or_none()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        session.state = "ENDED"
        await db.commit()

        language = session.language_profile.language
        level = session.language_profile.current_level

        try:
            scenario = load_scenario(session.scenario_id or "daily_conversation_v1")
        except Exception:
            return {"feedback": None}

        transcript = [{"role": m.role, "text": m.transcript} for m in session.messages]

        try:
            feedback = await generate_feedback(
                language=language,
                level=level,
                scenario=scenario,
                transcript=transcript,
            )
            session.session_feedback = feedback
            await db.commit()
        except Exception:
            feedback = None

        return {"feedback": feedback}


# ─── User Turn ────────────────────────────────────────────────────────────────

@router.post("/turn/stream")
async def speaking_turn(
    session_id: str = Form(...),
    audio: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    audio_bytes = await audio.read()
    filename = audio.filename or "audio.webm"
    turn_start = time.time()

    async def generate():
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(Session)
                .options(
                    selectinload(Session.messages),
                    selectinload(Session.language_profile),
                )
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
            if session.state == "ENDED":
                yield _sse("error", {"message": "Session already ended"})
                return

            level = session.language_profile.current_level
            language = session.language_profile.language
            params = LEVEL_PARAMS.get(level, LEVEL_PARAMS["A1"])

            try:
                scenario = load_scenario(session.scenario_id or "cafe_order_v1")
            except Exception:
                yield _sse("error", {"message": "Could not load scenario"})
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

            turn_duration = time.time() - turn_start
            session.turn_count = (session.turn_count or 0) + 1
            session.voice_seconds = (session.voice_seconds or 0) + turn_duration

            waypoints_state = dict(session.waypoints_state or {})

            trigger = check_end_trigger(
                level=level,
                turn_count=session.turn_count,
                voice_seconds=session.voice_seconds,
                waypoints_state=waypoints_state,
                wrap_up_turns=session.wrap_up_turns or 0,
                state=session.state,
                scenario=scenario,
            )

            wrap_up = False
            immediate_end = False

            if trigger == "hard":
                immediate_end = True
                session.state = "ENDED"
            elif trigger == "soft" and session.state not in ("WRAP_UP_SIGNAL", "WRAP_UP"):
                wrap_up = True
                session.state = "WRAP_UP_SIGNAL"
            elif session.state in ("WRAP_UP_SIGNAL", "WRAP_UP"):
                wrap_up = True
                session.wrap_up_turns = (session.wrap_up_turns or 0) + 1
                session.state = "WRAP_UP"

            active_twist = None
            if not wrap_up and not immediate_end and session.state == "CORE":
                last_wp = get_last_completed_waypoint(scenario, waypoints_state)
                if should_fire_twist(
                    level=level,
                    turn_count=session.turn_count,
                    twists_fired=session.twists_fired or 0,
                    turns_since_last_twist=session.turn_count,
                ):
                    active_twist = select_twist(
                        scenario=scenario,
                        last_completed_waypoint_name=last_wp["name"] if last_wp else None,
                        level=level,
                    )
                    if active_twist:
                        session.twists_fired = (session.twists_fired or 0) + 1

            history = [{"role": m.role, "content": m.transcript} for m in session.messages]

            maya_parts: list[str] = []
            async for sentence in _flush_text_stream(
                stream_maya_turn(
                    scenario=scenario,
                    level=level,
                    language=language,
                    conversation_history=history,
                    user_message=user_text,
                    waypoints_state=waypoints_state,
                    turn_count=session.turn_count,
                    soft_cap=params["soft_cap"],
                    wrap_up=wrap_up,
                    twist=active_twist,
                )
            ):
                maya_parts.append(sentence)
                yield _sse("ai_chunk", {"text": sentence})
                async for evt in _stream_tts(sentence, level=level):
                    yield evt

            maya_text = " ".join(maya_parts)

            if not immediate_end:
                waypoints_state = await detect_waypoints(
                    scenario=scenario,
                    waypoints_state=waypoints_state,
                    last_user_turn=user_text,
                    last_maya_turn=maya_text,
                )
                session.waypoints_state = waypoints_state

            db.add(Message(session_id=session.id, role="user", transcript=user_text))
            db.add(Message(session_id=session.id, role="assistant", transcript=maya_text))

            yield _sse("turn_update", {
                "turn_count": session.turn_count,
                "soft_cap": params["soft_cap"],
                "state": session.state,
            })

            should_end = immediate_end or (
                session.state == "WRAP_UP" and (session.wrap_up_turns or 0) >= 2
            )

            if should_end:
                session.state = "ENDED"
                await db.commit()

                full_transcript = (
                    [{"role": m.role, "text": m.transcript} for m in session.messages]
                    + [
                        {"role": "user", "text": user_text},
                        {"role": "assistant", "text": maya_text},
                    ]
                )

                try:
                    feedback = await generate_feedback(
                        language=language,
                        level=level,
                        scenario=scenario,
                        transcript=full_transcript,
                    )
                    session.session_feedback = feedback
                    await db.commit()
                except Exception:
                    feedback = None

                yield _sse("session_ended", {"feedback": feedback})
            else:
                await db.commit()

                # Generate suggestion chips for the next user turn
                profile_result = await db.execute(
                    select(UserProfile).where(UserProfile.user_id == current_user.id)
                )
                user_profile_obj = profile_result.scalar_one_or_none()
                user_profile = user_profile_obj.onboarding_data if user_profile_obj else {}

                try:
                    chips = await generate_chips(
                        maya_message=maya_text,
                        language=language,
                        level=level,
                        user_profile=user_profile,
                    )
                    if chips:
                        yield _sse("chips", {"chips": chips})
                except Exception:
                    pass

                yield _sse("done", {})

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ─── Text Turn (chip tap) ─────────────────────────────────────────────────────

@router.post("/turn/text/stream")
async def speaking_turn_text(
    session_id: str = Form(...),
    text: str = Form(...),
    current_user: User = Depends(get_current_user),
):
    """Accepts plain text instead of audio — used when user taps a suggestion chip."""
    turn_start = time.time()

    async def generate():
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(Session)
                .options(
                    selectinload(Session.messages),
                    selectinload(Session.language_profile),
                )
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
            if session.state == "ENDED":
                yield _sse("error", {"message": "Session already ended"})
                return

            user_text = text.strip()
            if not user_text:
                yield _sse("error", {"message": "Empty text"})
                return

            level = session.language_profile.current_level
            language = session.language_profile.language
            params = LEVEL_PARAMS.get(level, LEVEL_PARAMS["A1"])

            try:
                scenario = load_scenario(session.scenario_id or "daily_conversation_v1")
            except Exception:
                yield _sse("error", {"message": "Could not load scenario"})
                return

            yield _sse("transcript", {"text": user_text})

            turn_duration = time.time() - turn_start
            session.turn_count = (session.turn_count or 0) + 1
            session.voice_seconds = (session.voice_seconds or 0) + turn_duration
            waypoints_state = dict(session.waypoints_state or {})

            trigger = check_end_trigger(
                level=level,
                turn_count=session.turn_count,
                voice_seconds=session.voice_seconds,
                waypoints_state=waypoints_state,
                wrap_up_turns=session.wrap_up_turns or 0,
                state=session.state,
                scenario=scenario,
            )

            wrap_up = False
            immediate_end = False

            if trigger == "hard":
                immediate_end = True
                session.state = "ENDED"
            elif trigger == "soft" and session.state not in ("WRAP_UP_SIGNAL", "WRAP_UP"):
                wrap_up = True
                session.state = "WRAP_UP_SIGNAL"
            elif session.state in ("WRAP_UP_SIGNAL", "WRAP_UP"):
                wrap_up = True
                session.wrap_up_turns = (session.wrap_up_turns or 0) + 1
                session.state = "WRAP_UP"

            active_twist = None
            if not wrap_up and not immediate_end and session.state == "CORE":
                last_wp = get_last_completed_waypoint(scenario, waypoints_state)
                if should_fire_twist(
                    level=level,
                    turn_count=session.turn_count,
                    twists_fired=session.twists_fired or 0,
                    turns_since_last_twist=session.turn_count,
                ):
                    active_twist = select_twist(
                        scenario=scenario,
                        last_completed_waypoint_name=last_wp["name"] if last_wp else None,
                        level=level,
                    )
                    if active_twist:
                        session.twists_fired = (session.twists_fired or 0) + 1

            history = [{"role": m.role, "content": m.transcript} for m in session.messages]

            maya_parts: list[str] = []
            async for sentence in _flush_text_stream(
                stream_maya_turn(
                    scenario=scenario,
                    level=level,
                    language=language,
                    conversation_history=history,
                    user_message=user_text,
                    waypoints_state=waypoints_state,
                    turn_count=session.turn_count,
                    soft_cap=params["soft_cap"],
                    wrap_up=wrap_up,
                    twist=active_twist,
                )
            ):
                maya_parts.append(sentence)
                yield _sse("ai_chunk", {"text": sentence})
                async for evt in _stream_tts(sentence, level=level):
                    yield evt

            maya_text = " ".join(maya_parts)

            if not immediate_end:
                waypoints_state = await detect_waypoints(
                    scenario=scenario,
                    waypoints_state=waypoints_state,
                    last_user_turn=user_text,
                    last_maya_turn=maya_text,
                )
                session.waypoints_state = waypoints_state

            db.add(Message(session_id=session.id, role="user", transcript=user_text))
            db.add(Message(session_id=session.id, role="assistant", transcript=maya_text))

            yield _sse("turn_update", {
                "turn_count": session.turn_count,
                "soft_cap": params["soft_cap"],
                "state": session.state,
            })

            should_end = immediate_end or (
                session.state == "WRAP_UP" and (session.wrap_up_turns or 0) >= 2
            )

            if should_end:
                session.state = "ENDED"
                await db.commit()

                full_transcript = (
                    [{"role": m.role, "text": m.transcript} for m in session.messages]
                    + [{"role": "user", "text": user_text}, {"role": "assistant", "text": maya_text}]
                )

                try:
                    feedback = await generate_feedback(
                        language=language, level=level, scenario=scenario, transcript=full_transcript,
                    )
                    session.session_feedback = feedback
                    await db.commit()
                except Exception:
                    feedback = None

                yield _sse("session_ended", {"feedback": feedback})
            else:
                await db.commit()

                profile_result = await db.execute(
                    select(UserProfile).where(UserProfile.user_id == current_user.id)
                )
                user_profile_obj = profile_result.scalar_one_or_none()
                user_profile = user_profile_obj.onboarding_data if user_profile_obj else {}

                try:
                    chips = await generate_chips(
                        maya_message=maya_text, language=language, level=level, user_profile=user_profile,
                    )
                    if chips:
                        yield _sse("chips", {"chips": chips})
                except Exception:
                    pass

                yield _sse("done", {})

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
