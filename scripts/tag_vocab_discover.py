"""
Step 1 — Discovery: ask GPT to assign a free-form topic tag to every word.

Usage:
    python scripts/tag_vocab_discover.py

Outputs:
    docs/private/vocab_tags_raw.json   — {word: tag} for all words
    (also prints tag frequency so you can define your final category list)

Run this once, inspect the output, then define FINAL_CATEGORIES in
tag_vocab_assign.py and run that script.
"""
import asyncio
import json
import sys
from pathlib import Path
from collections import Counter

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.models import VocabWord

OUTPUT = Path("docs/private/vocab_tags_raw.json")
BATCH = 50


async def tag_batch(words: list[str], language: str, client) -> dict[str, str]:
    word_list = "\n".join(f"- {w}" for w in words)
    prompt = (
        f"You are a vocabulary categorization assistant for {language} learners.\n"
        f"Assign a single short topic tag (in English, lowercase, 1-2 words) to each word below.\n"
        f"Examples of good tags: food, drink, travel, work, family, emotion, body, home, nature, "
        f"time, money, transport, education, health, clothing, sport, technology, adjective, adverb, "
        f"grammar, shopping, city, weather.\n\n"
        f"Words:\n{word_list}\n\n"
        f"Return a JSON object mapping each word exactly as given to its tag. "
        f"Use the exact word strings as keys. Return ONLY valid JSON."
    )
    import json as _json
    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=600,
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

    # Load existing results so the script is resumable
    existing: dict[str, str] = {}
    if OUTPUT.exists():
        existing = json.loads(OUTPUT.read_text(encoding="utf-8"))
        print(f"Resuming — {len(existing)} words already tagged.")

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(VocabWord.word, VocabWord.language))
        rows = result.all()

    # Only process words not yet tagged
    todo = [(r.word, r.language) for r in rows if r.word not in existing]
    print(f"Words to tag: {len(todo)}")

    # Group by language for the prompt context
    from itertools import islice

    def batched(iterable, n):
        it = iter(iterable)
        while chunk := list(islice(it, n)):
            yield chunk

    tagged = dict(existing)
    total = len(todo)
    done = 0

    for batch in batched(todo, BATCH):
        words = [w for w, _ in batch]
        language = batch[0][1]  # all same language in our seed data
        result = await tag_batch(words, language, client)
        tagged.update(result)
        done += len(batch)
        print(f"  {done}/{total} tagged...")

        # Save after every batch (resumable)
        OUTPUT.write_text(json.dumps(tagged, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"\nDone. {len(tagged)} words tagged -> {OUTPUT}")

    # Print frequency distribution
    counter = Counter(tagged.values())
    print("\nTag frequency (top 50):")
    for tag, count in counter.most_common(50):
        print(f"  {count:>4}  {tag}")


if __name__ == "__main__":
    asyncio.run(main())
