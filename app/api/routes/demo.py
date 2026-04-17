import base64
import json
import re
import time
import uuid
from collections import defaultdict

from fastapi import APIRouter, Form, HTTPException, Request, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.services.chip_generator import generate_chips
from app.services.maya.maya_service import stream_maya_opening, stream_maya_turn
from app.services.session.feedback_generator import generate_feedback
from app.services.session.session_manager import LEVEL_PARAMS, load_scenario
from app.services.speech_service import synthesize_sentence_stream, transcribe_audio

router = APIRouter(prefix="/api/demo", tags=["demo"])

_SENTENCE_END = re.compile(r"[.!?](?:\s|$)")

# ── In-memory rate limit & session store ──────────────────────────────────
# ip → list of session-start timestamps within last 24 h
_ip_usage: dict[str, list[float]] = defaultdict(list)
# session_id → { turn_count, history, created_at }
_demo_sessions: dict[str, dict] = {}

DEMO_SESSIONS_PER_DAY = 3  # per IP
DEMO_MAX_TURNS = 3
DEMO_SCENARIO_ID = "daily_conversation_v1"
DEMO_LANGUAGE = "German"

VALID_LEVELS = {"A1", "A2", "B1", "B2", "C1"}


class DemoStartBody(BaseModel):
    name: str = ""
    level: str = "A1"


def _get_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _check_ip_rate_limit(ip: str) -> bool:
    if ip in ("127.0.0.1", "::1", "localhost"):
        return True  # no limit in local dev
    now = time.time()
    cutoff = now - 86400  # 24 h
    _ip_usage[ip] = [t for t in _ip_usage[ip] if t > cutoff]
    return len(_ip_usage[ip]) < DEMO_SESSIONS_PER_DAY


def _cleanup_old_sessions() -> None:
    cutoff = time.time() - 3600  # expire sessions older than 1 h
    expired = [sid for sid, s in _demo_sessions.items() if s["created_at"] < cutoff]
    for sid in expired:
        del _demo_sessions[sid]


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


def _extract_sentence(buffer: str) -> tuple[str, str]:
    m = _SENTENCE_END.search(buffer)
    if m:
        return buffer[: m.end()].strip(), buffer[m.end():].lstrip()
    return "", buffer


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


async def _stream_tts(text: str):
    async for pcm_chunk in synthesize_sentence_stream(text):
        yield _sse("audio", {"rate": 24000, "pcm": base64.b64encode(pcm_chunk).decode()})


# ── Start Demo Session ─────────────────────────────────────────────────────

@router.post("/session/start")
async def demo_start(request: Request, body: DemoStartBody):
    ip = _get_ip(request)

    if not _check_ip_rate_limit(ip):
        raise HTTPException(
            status_code=429,
            detail="You've reached the demo limit for today. Sign up for unlimited access.",
        )

    _cleanup_old_sessions()

    level = body.level if body.level in VALID_LEVELS else "A1"
    user_name = body.name.strip()[:40] or None  # sanitize, cap length

    try:
        scenario = load_scenario(DEMO_SCENARIO_ID)
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Demo scenario not available")

    session_id = str(uuid.uuid4())
    _ip_usage[ip].append(time.time())
    _demo_sessions[session_id] = {
        "turn_count": 0,
        "history": [],
        "created_at": time.time(),
        "level": level,
        "user_name": user_name,
    }

    async def generate():
        yield _sse("session_created", {
            "session_id": session_id,
            "scenario_title": scenario["title"],
            "description": scenario["description"],
            "communication_goal": scenario["communication_goal"],
            "level": level,
            "max_turns": DEMO_MAX_TURNS,
            "persona_name": scenario["maya_persona"]["name"],
        })

        opening_parts: list[str] = []
        async for sentence in _flush_text_stream(
            stream_maya_opening(scenario, level, DEMO_LANGUAGE, user_name=user_name)
        ):
            opening_parts.append(sentence)
            yield _sse("ai_chunk", {"text": sentence})
            async for evt in _stream_tts(sentence):
                yield evt

        opening_text = " ".join(opening_parts)
        _demo_sessions[session_id]["history"].append(
            {"role": "assistant", "content": opening_text}
        )

        chips = await generate_chips(
            maya_message=opening_text,
            language=DEMO_LANGUAGE,
            level=level,
            user_profile={"native_language": "", "interests": [], "learning_goal": "", "intro_sentence": ""},
        )
        if chips:
            yield _sse("chips", {"chips": chips})

        yield _sse("done", {})

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ── Demo Turn ──────────────────────────────────────────────────────────────

@router.post("/turn/stream")
async def demo_turn(
    request: Request,
    session_id: str = Form(...),
    audio: UploadFile = File(...),
):
    session = _demo_sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Demo session not found or expired")
    if session["turn_count"] >= DEMO_MAX_TURNS:
        raise HTTPException(status_code=403, detail="Demo turn limit reached")

    audio_bytes = await audio.read()
    filename = audio.filename or "audio.webm"

    try:
        scenario = load_scenario(DEMO_SCENARIO_ID)
    except Exception:
        raise HTTPException(status_code=500, detail="Could not load scenario")

    async def generate():
        try:
            user_text = await transcribe_audio(audio_bytes, filename)
        except Exception:
            yield _sse("error", {"message": "Transcription failed"})
            return

        if not user_text.strip():
            yield _sse("error", {"message": "Could not transcribe audio — please try again"})
            return

        yield _sse("transcript", {"text": user_text})

        session["turn_count"] += 1
        session["history"].append({"role": "user", "content": user_text})

        is_last = session["turn_count"] >= DEMO_MAX_TURNS
        level = session.get("level", "A1")
        params = LEVEL_PARAMS.get(level, LEVEL_PARAMS["A1"])

        maya_parts: list[str] = []
        async for sentence in _flush_text_stream(
            stream_maya_turn(
                scenario=scenario,
                level=level,
                language=DEMO_LANGUAGE,
                conversation_history=session["history"],
                user_message=user_text,
                waypoints_state={},
                turn_count=session["turn_count"],
                soft_cap=params["soft_cap"],
                wrap_up=is_last,
                twist=None,
            )
        ):
            maya_parts.append(sentence)
            yield _sse("ai_chunk", {"text": sentence})
            async for evt in _stream_tts(sentence):
                yield evt

        maya_text = " ".join(maya_parts)
        session["history"].append({"role": "assistant", "content": maya_text})

        yield _sse("turn_update", {
            "turn_count": session["turn_count"],
            "max_turns": DEMO_MAX_TURNS,
        })

        if not is_last:
            chips = await generate_chips(
                maya_message=maya_text,
                language=DEMO_LANGUAGE,
                level=level,
                user_profile={"native_language": "", "interests": [], "learning_goal": "", "intro_sentence": ""},
            )
            if chips:
                yield _sse("chips", {"chips": chips})

        if is_last:
            transcript = [
                {"role": m["role"], "text": m["content"]}
                for m in session["history"]
            ]
            try:
                feedback = await generate_feedback(
                    language=DEMO_LANGUAGE,
                    level=level,
                    scenario=scenario,
                    transcript=transcript,
                )
            except Exception:
                feedback = None
            yield _sse("demo_ended", {"feedback": feedback})
        else:
            yield _sse("done", {})

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
