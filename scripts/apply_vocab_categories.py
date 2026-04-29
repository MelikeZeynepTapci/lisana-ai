"""
Step 3 — Apply: write final category assignments from JSON into the DB.

Usage:
    python scripts/apply_vocab_categories.py

Reads:
    docs/private/vocab_tags_final.json

Updates vocab_words.category for every matched word.
Words not found in the JSON are left as NULL.
"""
import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select, update
from app.core.database import AsyncSessionLocal
from app.models.models import VocabWord

INPUT = Path("docs/private/vocab_tags_final.json")
BATCH = 500


async def main():
    if not INPUT.exists():
        print(f"ERROR: {INPUT} not found. Run tag_vocab_assign.py first.")
        return

    assignments: dict[str, str] = json.loads(INPUT.read_text(encoding="utf-8"))
    print(f"Loaded {len(assignments)} assignments.")

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(VocabWord))
        words = result.scalars().all()
        print(f"Vocab words in DB: {len(words)}")

        updated = 0
        skipped = 0
        for word in words:
            cat = assignments.get(word.word)
            if cat:
                word.category = cat
                updated += 1
            else:
                skipped += 1

        await db.commit()

    print(f"Updated: {updated}  |  Skipped (no assignment): {skipped}")
    print("Done.")


if __name__ == "__main__":
    asyncio.run(main())
