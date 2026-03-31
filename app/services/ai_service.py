from openai import AsyncOpenAI
from app.core.config import settings

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

SYSTEM_PROMPT_TEMPLATE = """You are a friendly, natural {language} language tutor.

Current scenario: {scenario}
User level: {level}

Guidelines:
- Speak naturally and conversationally in {language}
- Correct mistakes naturally within the conversation, never harshly
- Never sound robotic or textbook-like
- Keep responses conversational — maximum 3 sentences
- After each response, add brief feedback in brackets like: [Feedback: Good use of past tense! Try "hatte" instead of "hat" here.]
- If the user speaks in English, gently guide them back to {language}
- Be encouraging and patient
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
