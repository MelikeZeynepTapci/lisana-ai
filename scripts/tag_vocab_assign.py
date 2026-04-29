"""
Step 2 — Assignment: re-assign every word to one of your finalized categories.

Usage:
    1. Edit FINAL_CATEGORIES below to your confirmed list.
    2. python scripts/tag_vocab_assign.py

Reads:
    docs/private/vocab_tags_raw.json   — discovery tags from step 1 (used as a hint)

Outputs:
    docs/private/vocab_tags_final.json — {word: category} for all words

After this, run apply_vocab_categories.py to write results to the DB.
"""
import asyncio
import json
import sys
from itertools import islice
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.models import VocabWord

# ── Edit this list after inspecting tag_vocab_discover.py output ─────────────
FINAL_CATEGORIES = [
    "food",
    "drinks",
    "travel",
    "transport",
    "work",
    "education",
    "family",
    "home",
    "health",
    "body",
    "clothing",
    "shopping",
    "nature",
    "weather",
    "sport",
    "hobbies",
    "technology",
    "money",
    "emotions",
    "communication",
    "law",
    "adjective",
    "verb",
    "adverb",
    "grammar",
    "other",
]
# ─────────────────────────────────────────────────────────────────────────────

RAW_TAGS = Path("docs/private/vocab_tags_raw.json")
OUTPUT = Path("docs/private/vocab_tags_final.json")
BATCH = 50


def batched(iterable, n):
    it = iter(iterable)
    while chunk := list(islice(it, n)):
        yield chunk


async def assign_batch(
    words: list[str], hints: dict[str, str], language: str, categories: list[str], client
) -> dict[str, str]:
    import json as _json

    categories_str = ", ".join(f'"{c}"' for c in categories)
    entries = "\n".join(
        f'- "{w}" (hint: {hints.get(w, "?")})'
        for w in words
    )
    prompt = (
        f"You are a vocabulary categorization assistant for {language} learners.\n"
        f"Assign each word to exactly one category from this list:\n"
        f"[{categories_str}]\n\n"
        f"A hint tag from a previous pass is provided for each word — use it as guidance "
        f"but you can override it if a better category fits.\n\n"
        f"Words:\n{entries}\n\n"
        f'Return a JSON object mapping each word (exactly as given, without quotes in the key) '
        f"to its category string. Use only categories from the list above. "
        f'Use "other" only as a last resort. Return ONLY valid JSON.'
    )
    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
        max_tokens=700,
        response_format={"type": "json_object"},
    )
    try:
        return _json.loads(response.choices[0].message.content or "{}")
    except Exception:
        return {}


async def main():
    from openai import AsyncOpenAI
    from app.core.config import settings

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    raw_hints: dict[str, str] = {}
    if RAW_TAGS.exists():
        raw_hints = json.loads(RAW_TAGS.read_text(encoding="utf-8"))
        print(f"Loaded {len(raw_hints)} hints from discovery pass.")
    else:
        print("WARNING: vocab_tags_raw.json not found — running without hints.")

    # Load existing results (resumable)
    existing: dict[str, str] = {}
    if OUTPUT.exists():
        existing = json.loads(OUTPUT.read_text(encoding="utf-8"))
        print(f"Resuming — {len(existing)} words already assigned.")

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(VocabWord.word, VocabWord.language))
        rows = result.all()

    todo = [(r.word, r.language) for r in rows if r.word not in existing]
    print(f"Words to assign: {len(todo)}")

    assigned = dict(existing)
    total = len(todo)
    done = 0

    for batch in batched(todo, BATCH):
        words = [w for w, _ in batch]
        language = batch[0][1]
        result = await assign_batch(words, raw_hints, language, FINAL_CATEGORIES, client)
        # Validate — only accept known categories
        for word, cat in result.items():
            assigned[word] = cat if cat in FINAL_CATEGORIES else "other"
        done += len(batch)
        print(f"  {done}/{total} assigned...")
        OUTPUT.write_text(json.dumps(assigned, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"\nDone. {len(assigned)} words assigned -> {OUTPUT}")

    from collections import Counter
    counter = Counter(assigned.values())
    print("\nCategory distribution:")
    for cat, count in counter.most_common():
        print(f"  {count:>4}  {cat}")


if __name__ == "__main__":
    asyncio.run(main())
