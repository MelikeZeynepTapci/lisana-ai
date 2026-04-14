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
      "topic": "Perfekt Tense",
      "said": "Ich viele gegessen heute.",
      "better": "Ich habe heute viel gegessen.",
      "note": "Perfekt needs a helper verb — haben or sein — in position 2. The past participle goes to the end.",
      "examples": [
        {{"correct": true,  "text": "Ich habe Kaffee getrunken."}},
        {{"correct": true,  "text": "Sie sind nach Hause gegangen."}},
        {{"correct": false, "text": "Ich Kaffee getrunken heute."}}
      ]
    }}
  ],
  "alternatives": [
    {{
      "instead": "Das ist gut.",
      "try": ["Das klingt super!", "Das freut mich!"]
    }}
  ],
  "quiz": {{
    "topic": "Perfekt Tense",
    "question": "Which sentence is correct?",
    "options": [
      {{"id": 1, "text": "Ich gegessen viel heute.", "correct": false}},
      {{"id": 2, "text": "Ich habe heute viel gegessen.", "correct": true}},
      {{"id": 3, "text": "Ich viel habe gegessen heute.", "correct": false}}
    ],
    "explanation": "Correct! Haben/sein goes to position 2, past participle to the end — that's the Perfekt pattern."
  }},
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
  - "topic": the grammar/vocabulary topic name (e.g. "Perfekt Tense", "Word Order", "Dative Case")
  - "said": exact incorrect phrase the user said
  - "better": corrected version
  - "note": one sentence explaining the rule
  - "examples": 2-3 short example sentences — mix of correct:true and correct:false, short and clear
- alternatives: 1-2 items where user used a very basic phrase and a richer native-speaker version exists.
  Omit entirely if nothing notable. Each item:
  - "instead": the simple phrase user actually said
  - "try": 2-3 natural alternatives a native speaker would use
- quiz: one quick question based on the FIRST item in watch_out_for.
  Omit entirely if watch_out_for is empty.
  - Use the actual "said" text as one wrong option and "better" as the correct option
  - Add one more plausible-but-wrong option
  - "explanation": one sentence saying why the correct answer is right
- useful_phrases: 3-4 phrases from this session the user used well or should remember
- next_session: recommend a specific grammar topic or scenario to practice next. Be concrete.
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
        max_tokens=1200,
        response_format={"type": "json_object"},
    )

    return json.loads(response.choices[0].message.content)
