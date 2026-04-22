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

    Your task:
    Generate exactly 2 short, natural responses the learner could say next.

    STRICT RULES:
    - Each chip MUST directly respond to Maya’s message
    - Do NOT introduce a new unrelated topic
    - Chips must stay on the SAME topic as Maya’s message
    - If a question is asked, it must be a logical follow-up to Maya’s message
    - Avoid generic conversation starters (e.g. hobbies, movies, weather) unless explicitly mentioned by Maya

    STYLE RULES:
    - Each chip must be {level_guide}
    - Sound like a real human, not textbook dialogue
    - One chip: continues or reacts to Maya’s message
    - One chip: asks a relevant follow-up OR adds a personal detail related to the same topic
    - Light personalization from profile is OK only if it fits naturally

    FORMAT RULES:
    - Do NOT use quotes
    - Return ONLY a valid JSON array of 2 strings

    Good example:
    Maya: "Ist das dein erstes Mal bei einem Sprachaustausch?"
    → ["Ja, ich bin ein bisschen nervös.", "Ja, hast du schon oft an solchen Treffen teilgenommen?"]

    Bad example (DO NOT DO):
    → ["Ja, das ist mein erstes Mal!", "Welche Filme magst du?"]

    Output:"""

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
