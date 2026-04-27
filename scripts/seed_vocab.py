"""
Seed vocab_words table from parsed JSON word lists.

Usage:
    python scripts/seed_vocab.py

Reads:
    docs/private/dtz_words_clean.json   (German, A1-B1)
    docs/private/c1_words.json          (German, B2-C1)

Skips words already in the table (idempotent).
"""
import asyncio
import json
import sys
import uuid
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select, func
from app.core.database import AsyncSessionLocal
from app.models.models import VocabWord

SOURCES = [
    Path("docs/private/dtz_words_clean.json"),
    Path("docs/private/c1_words.json"),
]


async def seed():
    async with AsyncSessionLocal() as db:
        # Count existing rows
        result = await db.execute(select(func.count()).select_from(VocabWord))
        existing = result.scalar()
        print(f"Existing vocab_words rows: {existing}")

        # Load all words from JSON files
        all_words = []
        for path in SOURCES:
            if not path.exists():
                print(f"WARNING: {path} not found, skipping.")
                continue
            with open(path, encoding="utf-8") as f:
                words = json.load(f)
            print(f"Loaded {len(words)} words from {path.name}")
            all_words.extend(words)

        if not all_words:
            print("No words to seed.")
            return

        # Fetch existing (word, language) pairs to avoid duplicates
        result = await db.execute(select(VocabWord.word, VocabWord.language))
        existing_pairs = {(row.word, row.language) for row in result}
        print(f"Already seeded pairs: {len(existing_pairs)}")

        to_insert = [
            w for w in all_words
            if (w["word"], w["language"]) not in existing_pairs
        ]
        print(f"New words to insert: {len(to_insert)}")

        if not to_insert:
            print("Nothing to insert — already up to date.")
            return

        # Bulk insert in batches of 500
        BATCH = 500
        inserted = 0
        for i in range(0, len(to_insert), BATCH):
            batch = to_insert[i:i + BATCH]
            db.add_all([
                VocabWord(
                    id=uuid.uuid4(),
                    word=w["word"],
                    part_of_speech=w.get("part_of_speech"),
                    language=w["language"],
                    level=w.get("level"),
                    translation=w.get("translation"),
                )
                for w in batch
            ])
            await db.commit()
            inserted += len(batch)
            print(f"  Inserted {inserted}/{len(to_insert)}...")

        print(f"\nDone. Seeded {inserted} words.")


if __name__ == "__main__":
    asyncio.run(seed())
