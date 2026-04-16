import json
import logging

from openai import AsyncOpenAI

from app.core.config import settings

logger = logging.getLogger(__name__)
_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

_LEVEL_GUIDANCE = {
    "A1": "very short and simple — 2 to 5 words, basic vocabulary only",
    "A2": "short and simple — up to 7 words, everyday vocabulary",
    "B1": "natural and conversational — full short sentences",
    "B2": "natural — varied sentence structures are fine",
    "C1": "fluent and idiomatic — no restrictions",
}


async def generate_chips(
    maya_message: str,
    language: str,
    level: str,
    user_profile: dict,
) -> list[str]:
    """
    Generate 3 contextual suggestion chips the user could say next.
    Returns a list of 3 strings in the target language, or [] on failure.
    """
    level_guide = _LEVEL_GUIDANCE.get(level, _LEVEL_GUIDANCE["B1"])

    interests = user_profile.get("interests", [])
    learning_goal = user_profile.get("learning_goal", "")
    native_language = user_profile.get("native_language", "")
    intro = user_profile.get("intro_sentence", "")

    profile_lines = []
    if interests:
        profile_lines.append(f"Interests: {', '.join(interests)}")
    if learning_goal:
        profile_lines.append(f"Learning goal: {learning_goal}")
    if native_language:
        profile_lines.append(f"Native language: {native_language}")
    if intro:
        profile_lines.append(f"About the user: {intro}")

    profile_block = "\n".join(profile_lines) if profile_lines else "No additional profile info."

    prompt = f"""You are generating suggestion chips for a language learning app.
The learner is practicing {language} at level {level}.

Maya (the AI coach) just said:
"{maya_message}"

Learner profile:
{profile_block}

Generate exactly 2 short, natural responses the learner could say next in {language}.

Rules:
- Each chip must be {level_guide}
- Chips must sound like real human replies, not textbook answers
- One chip should be agreeable or continue the topic, the other should ask something back or add something personal
- Reflect the learner's real context (interests, goal) where natural — do not force it
- Do NOT use quotes around the chips
- Return ONLY a valid JSON array of 2 strings, nothing else

Example format: ["Ja, gerne!", "Wie lange lebst du schon hier?"]"""

    try:
        resp = await _client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.8,
            max_tokens=120,
        )
        raw = resp.choices[0].message.content or ""
        chips = json.loads(raw.strip())
        if isinstance(chips, list) and len(chips) == 2 and all(isinstance(c, str) for c in chips):
            return chips
        return []
    except Exception:
        logger.exception("Chip generation failed")
        return []
