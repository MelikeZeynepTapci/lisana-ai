from typing import AsyncGenerator

from openai import AsyncOpenAI
from app.core.config import settings

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

SYSTEM_PROMPT_TEMPLATE = """You are a friendly, natural {language} language tutor having a real conversation.

Current scenario: {scenario}
User level: {level}

Guidelines:
- Speak naturally and conversationally in {language} — like a native speaker, not a textbook
- Keep responses short: 2-3 sentences max
- If the user makes a grammar or vocabulary mistake, correct it naturally within your reply — weave it in as a native speaker would (e.g. "Oh, and 'hatte' sounds more natural there" or just model the correct form in your response). Never use brackets, labels like [Feedback:], or separate correction sections.
- If the user speaks in English, gently guide them back to {language}
- Be warm, encouraging, and patient
"""


async def generate_tutor_response(
    language: str,
    scenario: str,
    level: str,
    conversation_history: list[dict],
    user_message: str,
) -> tuple[str, dict]:
    """
    Generate AI tutor response using GPT-4o.
    Returns (response_text, usage_info).
    """
    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
        language=language,
        scenario=scenario,
        level=level,
    )

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(conversation_history)
    messages.append({"role": "user", "content": user_message})

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        temperature=0.8,
        max_tokens=300,
    )

    text = response.choices[0].message.content
    usage = {
        "prompt_tokens": response.usage.prompt_tokens,
        "completion_tokens": response.usage.completion_tokens,
        "total_tokens": response.usage.total_tokens,
        # Approximate cost for gpt-4o
        "cost_usd": (response.usage.prompt_tokens * 2.5 + response.usage.completion_tokens * 10) / 1_000_000,
    }

    return text, usage


async def stream_tutor_response(
    language: str,
    scenario: str,
    level: str,
    conversation_history: list[dict],
    user_message: str,
) -> AsyncGenerator[str, None]:
    """Stream GPT response token by token."""
    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
        language=language,
        scenario=scenario,
        level=level,
    )
    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(conversation_history)
    messages.append({"role": "user", "content": user_message})

    stream = await client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        temperature=0.8,
        max_tokens=300,
        stream=True,
    )
    async for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta


async def generate_welcome_message(
    language: str,
    level: str,
    focus: str,
    interests: list[str],
    intro_sentence: str,
) -> str:
    """Generate personalized Maya welcome message for onboarding step 7."""
    focus_map = {
        "local_life": "living like a local — daily life, bureaucracy, real-world situations",
        "relocate":   "preparing to move — settling in, housing, first weeks, culture",
        "work":       "working confidently — meetings, emails, professional communication",
        "travel":     "travelling with ease — ordering, directions, casual interactions",
        "connect":    "connecting with people — friends, dating, natural conversations",
        "culture":    "understanding the language and culture — how people really speak and live",
        "exam":       "preparing for an exam (IELTS/TestDAF/DELE/Goethe)",
    }
    focus_text = focus_map.get(focus, focus) if focus else None
    interests_text = ", ".join(interests[:3]) if interests else "general topics"
    intro_text = f'The user introduced themselves: "{intro_sentence}"' if intro_sentence else ""
    focus_line = f"- Main goal: {focus_text}" if focus_text else ""

    prompt = f"""You are Maya — a warm, natural-sounding language tutor.
A new user just joined. Write a short personalized welcome message in English.

Details:
- Learning: {language}
- Level: {level}
{focus_line}
- Interests: {interests_text}
{intro_text}

Rules:
- 2–3 sentences, max 60 words
- Write in English, naturally referencing their details (especially their main goal if set)
- Do NOT end with a question
- No "AI", "I'm here to help" phrases
- Warm and human"""

    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.9,
        max_tokens=200,
    )
    return response.choices[0].message.content
