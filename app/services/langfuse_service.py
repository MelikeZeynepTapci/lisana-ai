from typing import Optional
from app.core.config import settings

_langfuse = None


def get_langfuse():
    global _langfuse
    if _langfuse is None and settings.LANGFUSE_PUBLIC_KEY and settings.LANGFUSE_SECRET_KEY:
        from langfuse import Langfuse
        _langfuse = Langfuse(
            public_key=settings.LANGFUSE_PUBLIC_KEY,
            secret_key=settings.LANGFUSE_SECRET_KEY,
            host=settings.LANGFUSE_HOST,
        )
    return _langfuse


def log_conversation_turn(
    session_id: str,
    language: str,
    scenario: str,
    level: str,
    user_text: str,
    ai_text: str,
    usage: dict,
    latency_ms: int,
):
    langfuse = get_langfuse()
    if not langfuse:
        return

    trace = langfuse.trace(
        name="conversation_turn",
        session_id=session_id,
        metadata={
            "language": language,
            "scenario": scenario,
            "level": level,
            "latency_ms": latency_ms,
        },
    )

    trace.generation(
        name="gpt4o_tutor",
        model="gpt-4o",
        input=[{"role": "user", "content": user_text}],
        output=ai_text,
        usage={
            "input": usage.get("prompt_tokens", 0),
            "output": usage.get("completion_tokens", 0),
            "total": usage.get("total_tokens", 0),
            "unit": "TOKENS",
        },
        metadata={"cost_usd": usage.get("cost_usd", 0)},
    )

    langfuse.flush()
