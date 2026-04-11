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
    reason: str,
    interests: list[str],
    intro_sentence: str,
) -> str:
    """Generate personalized Maya welcome message for onboarding step 7."""
    reason_map = {
        "living_abroad": "yaşadığı ülkede günlük hayat için",
        "work": "iş hayatında kullanmak için",
        "travel": "seyahat için",
        "exam": "sınav (IELTS/TestDAF/DELE) için",
        "personal": "kişisel ilgi nedeniyle",
    }
    reason_text = reason_map.get(reason, reason)
    interests_text = ", ".join(interests[:3]) if interests else "genel konular"
    intro_text = f'Kullanıcı kendini şöyle tanıttı: "{intro_sentence}"' if intro_sentence else ""

    prompt = f"""Sen Maya'sın — sıcak, doğal konuşan bir dil öğretmenisin.
Kullanıcı şimdi sana katıldı. Kişiselleştirilmiş bir karşılama mesajı yaz.

Bilgiler:
- Öğrenilen dil: {language}
- Seviye: {level}
- Neden öğreniyor: {reason_text}
- İlgi alanları: {interests_text}
{intro_text}

Kurallar:
- 2-3 cümle, max 60 kelime
- Türkçe yaz ama gerçek veriyi doğal şekilde referans al
- Son cümle {language} dilinde bir soru olsun, hemen altında parantez içinde Türkçe çevirisiyle
- "Yapay zeka", "yardımcı olmak için buradayım" gibi ifadeler kullanma
- İnsan gibi, sıcak konuş"""

    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.9,
        max_tokens=200,
    )
    return response.choices[0].message.content
