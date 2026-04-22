import json
import logging
from openai import AsyncOpenAI
from app.core.config import settings

logger = logging.getLogger(__name__)
client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


async def analyze_corrections(text: str, language: str, level: str) -> list[dict]:
    """
    Analyze user's spoken text for language errors.
    Returns a list of {wrong, correct, note} dicts.
    'wrong' is the exact substring from `text` that is incorrect.
    """
    if not text.strip():
        return []

    prompt = f"""You are a {language} language tutor. The learner (level {level}) said the following.
Identify ALL language errors except pronunciation. This includes: grammar, verb conjugation, word order, case endings, article gender, tense usage, wrong vocabulary, missing words, and any other non-pronunciation mistake.

Learner said: "{text}"

Return a JSON array of errors. Each error has:
- "wrong": the exact substring from the learner's text that is wrong (copy it verbatim)
- "correct": the corrected version of that substring
- "note": one short explanation (max 8 words)

If there are no errors, return [].
Return ONLY the JSON array, no other text."""

    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            max_tokens=300,
            response_format={"type": "json_object"},
        )
        raw = response.choices[0].message.content or "{}"
        parsed = json.loads(raw)
        # Handle both {"errors": [...]} and bare [...]
        if isinstance(parsed, list):
            return parsed
        for key in ("errors", "corrections", "mistakes"):
            if key in parsed and isinstance(parsed[key], list):
                return parsed[key]
        return []
    except Exception:
        logger.exception("corrections_analyzer failed")
        return []
