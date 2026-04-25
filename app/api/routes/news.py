import json
import logging
import asyncio
from datetime import date

import feedparser
import httpx
from fastapi import APIRouter, Depends
from openai import AsyncOpenAI
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.models.models import DailyNews, User, UserLanguageProfile, UserProfile

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/news", tags=["news"])
openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

_BANNED_TOPICS = (
    "war, violence, crime, terrorism, murder, abuse, sexual content, "
    "graphic accidents, mental health crises, or highly polarizing political controversies"
)


class QuizQuestion(BaseModel):
    question: str
    options: list[str]
    correct: str
    reasoning: list[str]


class DailyNewsResponse(BaseModel):
    title: str
    body: str
    language: str
    level: str
    quiz_questions: list[QuizQuestion]
    for_date: str

# RSS feeds per language (general)
_LANGUAGE_FEEDS: dict[str, list[str]] = {
    "German": [
        "https://www.tagesschau.de/xml/rss2",
        "https://www.spiegel.de/schlagzeilen/index.rss",
        "https://www.derstandard.at/rss",
    ],
    "Spanish": [
        "https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada",
        "https://www.elmundo.es/rss/portada.xml",
        "https://www.rtve.es/api/noticias.rss",
    ],
    "French": [
        "https://www.lemonde.fr/rss/une.xml",
        "https://www.france24.com/fr/rss",
        "https://www.lefigaro.fr/rss/figaro_actualites.xml",
    ],
    "Italian": [
        "https://www.ansa.it/sito/notizie/mondo/mondo_rss.xml",
        "https://www.corriere.it/rss/homepage.xml",
        "https://www.repubblica.it/rss/homepage/rss2.0.xml",
    ],
    "English": [
        "https://feeds.bbci.co.uk/news/rss.xml",
        "https://rss.cnn.com/rss/edition.rss",
        "https://www.theguardian.com/world/rss",
    ],
}

# RSS feeds per city (more local)
_CITY_FEEDS: dict[str, list[str]] = {
    "Vienna": [
        "https://www.derstandard.at/rss",
        "https://kurier.at/xml/rss",
    ],
    "Berlin": [
        "https://www.berliner-zeitung.de/feed.rss",
        "https://www.tagesspiegel.de/contentexport/feed/home",
    ],
    "Hamburg": [
        "https://www.abendblatt.de/rss",
        "https://www.tagesschau.de/xml/rss2",
    ],
    "Amsterdam": [
        "https://feeds.nos.nl/nosnieuwsalgemeen",
        "https://www.parool.nl/rss",
    ],
    "Barcelona": [
        "https://www.lavanguardia.com/rss/home.xml",
        "https://www.elnacional.cat/feed/",
    ],
    "Paris": [
        "https://www.lemonde.fr/rss/une.xml",
        "https://www.lefigaro.fr/rss/figaro_actualites.xml",
    ],
    "Zurich": [
        "https://www.nzz.ch/recent.rss",
        "https://www.tagesanzeiger.ch/rss.html",
    ],
    "London": [
        "https://feeds.bbci.co.uk/news/london/rss.xml",
        "https://www.theguardian.com/uk/rss",
    ],
}


async def _fetch_feed(client: httpx.AsyncClient, url: str) -> list[dict]:
    """Fetch and parse a single RSS feed, returning normalised article dicts."""
    try:
        res = await client.get(url, follow_redirects=True)
        res.raise_for_status()
        loop = asyncio.get_event_loop()
        feed = await loop.run_in_executor(None, feedparser.parse, res.text)
        articles = []
        for entry in feed.entries[:8]:
            title = entry.get("title", "").strip()
            description = (entry.get("summary") or entry.get("description") or "").strip()
            if title and description:
                articles.append({
                    "title": title,
                    "description": description,
                    "source": {"name": feed.feed.get("title", url)},
                })
        return articles
    except Exception:
        return []


async def _fetch_candidates(language: str, city: str = "") -> list[dict]:
    """Fetch RSS headlines. City feeds are tried first, then language feeds as fallback."""
    feeds = _CITY_FEEDS.get(city, []) + _LANGUAGE_FEEDS.get(language, []) if city else _LANGUAGE_FEEDS.get(language, [])
    if not feeds:
        return []
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            results = await asyncio.gather(*[_fetch_feed(client, url) for url in feeds])
        articles: list[dict] = []
        seen: set[str] = set()
        for batch in results:
            for a in batch:
                key = a["title"][:60]
                if key not in seen:
                    seen.add(key)
                    articles.append(a)
        print(f"[NEWS] RSS returned {len(articles)} articles (city={city!r}, language={language})", flush=True)
        return articles[:12]
    except Exception:
        logger.exception("RSS fetch failed")
        return []


async def _generate(candidates: list[dict], language: str, level: str, city: str = "") -> tuple[str, str, list[dict]]:
    if candidates:
        headlines = "\n".join(
            f"{i+1}. [{a.get('source', {}).get('name', '')}] {a.get('title', '')} — {a.get('description', '')}"
            for i, a in enumerate(candidates)
        )
        city_pref = (
            f" Strongly prefer articles directly relevant to {city} — local events, city services, "
            f"transport, housing, culture, food, or anything a resident of {city} would care about."
            if city else
            " Prefer topics about daily life, technology, cities, habits, food, culture, work, transport, entertainment, travel, or interesting social trends."
        )
        source_instruction = (
            f"Choose the single most engaging, concrete, everyday-interest article for a language learner from this list:\n{headlines}\n"
            f"{city_pref}\n"
            f"Avoid repetitive selection of environment-focused stories unless unusually surprising.\n"
            f"Do NOT choose anything related to: {_BANNED_TOPICS}.\n"
            f"Use that article as the factual basis. You may simplify or expand it."
        )
    else:
        if city:
            source_instruction = (
                f"Create a realistic, educational news article about something happening in or relevant to {city}. "
                f"Topics could include: local transport, city events, neighbourhood trends, café culture, housing, "
                f"seasonal events, public services, or anything a resident of {city} would find interesting. "
                f"Avoid: {_BANNED_TOPICS}."
            )
        else:
            source_instruction = (
                f"Create a realistic, educational news article on a topic from: science, technology, culture, environment, or travel. "
                f"Avoid: {_BANNED_TOPICS}."
            )

    level_guidance = {
        "A1": "Use only the most basic vocabulary (top 500 words). Very short, simple sentences. Present tense only. Max 1 clause per sentence.",
        "A2": "Use simple, everyday vocabulary. Short sentences with basic connectors (and, but, because). Present and simple past tense. Avoid idioms or complex grammar.",
        "B1": "Use common vocabulary and some topic-specific words. Mix simple and compound sentences. Present, past, and future tenses. Light use of passive voice.",
        "B2": "Use varied vocabulary including some formal register. Complex sentences with subordinate clauses. Full range of tenses. Some idiomatic expressions are fine.",
        "C1": "Use sophisticated vocabulary and nuanced expressions. Complex grammar structures. Formal register. Assume strong grammatical knowledge.",
        "C2": "Use native-level vocabulary and grammar. Rich, varied sentence structures. Formal or literary register. No simplification needed.",
    }.get(level.upper(), "Use vocabulary and grammar appropriate for an intermediate learner.")

    prompt = f"""You are a language learning content creator.

{source_instruction}

Write the article in {language} strictly at CEFR level {level}. This is critical — the text MUST be readable by a {level} learner.
Level guidance: {level_guidance}

- Title: one clear, engaging sentence. Prepend exactly 3 relevant emojis to the title (e.g. "🌱🔬🌍 Title here").
- Body: 5–7 sentences, approximately 400-550 characters. Follow the level guidance strictly.

Then generate exactly 3 multiple-choice comprehension questions in {language}.
Each question has 3 options (A, B, C). Mark the correct one.

Return ONLY valid JSON in this exact schema:
{{
  "title": "...",
  "body": "...",
  "quiz": [
    {{
      "question": "...",
      "options": ["A) ...", "B) ...", "C) ..."],
      "correct": "A",
      "reasoning": ["Why A is correct.", "Why B is wrong.", "Why C is wrong."]
    }},
    {{
      "question": "...",
      "options": ["A) ...", "B) ...", "C) ..."],
      "correct": "B",
      "reasoning": ["Why A is wrong.", "Why B is correct.", "Why C is wrong."]
    }},
    {{
      "question": "...",
      "options": ["A) ...", "B) ...", "C) ..."],
      "correct": "C",
      "reasoning": ["Why A is wrong.", "Why B is wrong.", "Why C is correct."]
    }}
  ]
}}"""

    response = await openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        max_tokens=1000,
        response_format={"type": "json_object"},
    )
    data = json.loads(response.choices[0].message.content or "{}")
    return data.get("title", ""), data.get("body", ""), data.get("quiz", [])


@router.get("/daily", response_model=DailyNewsResponse)
async def get_daily_news(
    force: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(UserLanguageProfile).where(
            UserLanguageProfile.user_id == current_user.id,
            UserLanguageProfile.is_active == True,
        )
    )
    lang_profile = result.scalars().first()
    language = lang_profile.language if lang_profile else "German"
    level = lang_profile.current_level if lang_profile else "B1"

    # Load city from user's onboarding profile
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    user_profile = result.scalars().first()
    city = ""
    if user_profile and user_profile.onboarding_data:
        city = user_profile.onboarding_data.get("city", "")

    today = date.today()

    result = await db.execute(
        select(DailyNews).where(
            DailyNews.language == language,
            DailyNews.level == level,
            DailyNews.city == city,
            DailyNews.for_date == today,
        )
    )
    cached = result.scalars().first()
    if cached and not (force and settings.ENVIRONMENT == "development"):
        try:
            content_data = json.loads(cached.content)
        except (json.JSONDecodeError, TypeError):
            content_data = {"title": "", "body": cached.content}
        return DailyNewsResponse(
            title=content_data.get("title", ""),
            body=content_data.get("body", cached.content),
            language=language,
            level=level,
            quiz_questions=[QuizQuestion(**q) for q in (cached.quiz_questions or [])],
            for_date=str(today),
        )

    candidates = await _fetch_candidates(language, city)
    print(f"[NEWS] Generating: language={language} level={level} city={city!r} candidates={len(candidates)}", flush=True)
    title, body, quiz = await _generate(candidates, language, level, city)

    news_record = DailyNews(
        language=language,
        level=level,
        city=city,
        content=json.dumps({"title": title, "body": body}),
        quiz_questions=quiz,
        for_date=today,
    )
    db.add(news_record)
    try:
        await db.commit()
    except Exception:
        await db.rollback()

    return DailyNewsResponse(
        title=title,
        body=body,
        language=language,
        level=level,
        quiz_questions=[QuizQuestion(**q) for q in quiz],
        for_date=str(today),
    )
