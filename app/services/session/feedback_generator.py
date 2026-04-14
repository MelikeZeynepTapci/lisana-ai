import json
from openai import AsyncOpenAI
from app.core.config import settings

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

_PROMPT = """\
You are generating feedback for a language learning session.
Language: {language}
Level: {level}
Scenario: {scenario_title}
Goal: {communication_goal}

Full transcript:
{transcript}

Generate feedback in this exact JSON structure:
{{
  "what_went_well": ["...", "..."],
  "watch_out_for": [
    {{
      "topic": "Future Tense",
      "said": "I go to school tomorrow",
      "better": "I will go to school tomorrow",
      "note": "Use 'will' or 'going to' for future events."
    }}
  ],
  "useful_phrases": ["...", "...", "..."],
  "one_tip": "...",
  "next_session": "..."
}}

Rules:
- Always start with something positive
- Errors framed as "next time try" not "you said wrong"
- No scores, no grades, no percentages
- Be specific — quote what the user actually said, word for word
- Keep each item to 1-2 sentences max
- what_went_well: 2-3 items
- watch_out_for: 1-2 items max (omit entirely if no notable errors)
  - "topic": the grammar or vocabulary topic name (e.g. "Future Tense", "Dative Case", "Modal Verbs", "Word Order", "Article Gender")
  - "said": the exact incorrect phrase the user said
  - "better": the corrected version
  - "note": one short sentence explaining the rule
- useful_phrases: 3-4 phrases from this session the user used well or should remember
- next_session: recommend a specific grammar topic or scenario to practice next, based on the errors found in watch_out_for. Be concrete — e.g. "Practice the dative case — try a scenario where you describe locations or give directions."
- Return only valid JSON, no other text\
"""


async def generate_feedback(
    language: str,
    level: str,
    scenario: dict,
    transcript: list[dict],  # [{"role": "user"|"assistant", "text": "..."}]
) -> dict:
    transcript_text = "\n".join(
        f"{'User' if m['role'] == 'user' else 'Maya'}: {m['text']}"
        for m in transcript
    )

    prompt = _PROMPT.format(
        language=language,
        level=level,
        scenario_title=scenario["title"],
        communication_goal=scenario["communication_goal"],
        transcript=transcript_text,
    )

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=800,
        response_format={"type": "json_object"},
    )

    return json.loads(response.choices[0].message.content)
