import io
import logging
import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse
from openai import AsyncOpenAI
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.models.models import SavedItem, User, UserLanguageProfile, VocabCache

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/collection", tags=["collection"])
openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


# ─── Schemas ──────────────────────────────────────────────────────────────────

class SaveItemRequest(BaseModel):
    text: str
    source_type: str       # 'news' | 'conversation'
    source_id: str | None = None
    language: str          # e.g. 'German'


class SavedItemResponse(BaseModel):
    id: str
    text: str
    source_type: str
    source_id: str | None
    language: str
    enrichment_status: str
    definition: str | None
    example: str | None
    part_of_speech: str | None
    created_at: str


class TTSRequest(BaseModel):
    text: str
    language: str


class LookupRequest(BaseModel):
    text: str
    language: str


class LookupResponse(BaseModel):
    definition: str
    example: str | None
    part_of_speech: str | None
    synonyms: list[str]


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _item_to_response(item: SavedItem) -> SavedItemResponse:
    return SavedItemResponse(
        id=str(item.id),
        text=item.text,
        source_type=item.source_type,
        source_id=item.source_id,
        language=item.language,
        enrichment_status=item.enrichment_status,
        definition=item.definition,
        example=item.example,
        part_of_speech=item.part_of_speech,
        created_at=item.created_at.isoformat(),
    )


async def _enrich_item(item_id: str, text: str, language: str) -> None:
    """Background task: call GPT to get definition/example/part_of_speech.
    Checks global vocab_cache first; writes back on miss."""
    from app.core.database import AsyncSessionLocal
    import json

    async with AsyncSessionLocal() as db:
        try:
            # Check global cache
            result = await db.execute(
                select(VocabCache).where(
                    VocabCache.text == text,
                    VocabCache.language == language,
                )
            )
            cached = result.scalars().first()

            if cached:
                definition = cached.definition
                example = cached.example
                part_of_speech = cached.part_of_speech
            else:
                prompt = (
                    f'You are a language learning assistant. Analyze the following {language} text: "{text}"\n\n'
                    f"Return JSON with:\n"
                    f'- "definition": a clear, concise English definition or translation\n'
                    f'- "example": one natural example sentence in {language} using the text in context\n'
                    f'- "part_of_speech": grammatical category (noun, verb, adjective, phrase, sentence, etc.)\n\n'
                    f"Return ONLY valid JSON."
                )
                response = await openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.3,
                    max_tokens=300,
                    response_format={"type": "json_object"},
                )
                data = json.loads(response.choices[0].message.content or "{}")
                definition = data.get("definition", "")
                example = data.get("example")
                part_of_speech = data.get("part_of_speech")

                # Write to global cache
                cache_entry = VocabCache(
                    id=uuid.uuid4(),
                    text=text,
                    language=language,
                    definition=definition,
                    example=example,
                    part_of_speech=part_of_speech,
                )
                db.add(cache_entry)

            # Update the saved item
            result = await db.execute(
                select(SavedItem).where(SavedItem.id == uuid.UUID(item_id))
            )
            item = result.scalars().first()
            if item:
                item.definition = definition
                item.example = example
                item.part_of_speech = part_of_speech
                item.enrichment_status = "done"

            await db.commit()
        except Exception:
            logger.exception("Enrichment failed for item %s", item_id)
            try:
                result = await db.execute(
                    select(SavedItem).where(SavedItem.id == uuid.UUID(item_id))
                )
                item = result.scalars().first()
                if item:
                    item.enrichment_status = "failed"
                await db.commit()
            except Exception:
                await db.rollback()


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.post("", response_model=SavedItemResponse, status_code=201)
async def save_item(
    body: SaveItemRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Save a text selection and kick off background enrichment."""
    text = body.text.strip()
    if not text:
        raise HTTPException(status_code=422, detail="text must not be empty")
    if len(text) > 500:
        raise HTTPException(status_code=422, detail="text too long (max 500 chars)")

    item_id = uuid.uuid4()
    item = SavedItem(
        id=item_id,
        user_id=current_user.id,
        source_type=body.source_type,
        source_id=body.source_id,
        text=text,
        language=body.language,
        enrichment_status="pending",
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)

    background_tasks.add_task(_enrich_item, str(item_id), text, body.language)

    return _item_to_response(item)


@router.get("", response_model=list[SavedItemResponse])
async def list_items(
    source_type: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all saved items for the current user, optionally filtered by source_type."""
    query = select(SavedItem).where(SavedItem.user_id == current_user.id)
    if source_type:
        query = query.where(SavedItem.source_type == source_type)
    query = query.order_by(SavedItem.created_at.desc())
    result = await db.execute(query)
    items = result.scalars().all()
    return [_item_to_response(i) for i in items]


@router.delete("/{item_id}", status_code=204)
async def delete_item(
    item_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a saved item (must belong to current user)."""
    try:
        parsed_id = uuid.UUID(item_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Not found")

    result = await db.execute(
        select(SavedItem).where(
            SavedItem.id == parsed_id,
            SavedItem.user_id == current_user.id,
        )
    )
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")

    await db.delete(item)
    await db.commit()
    return Response(status_code=204)


@router.get("/{item_id}", response_model=SavedItemResponse)
async def get_item(
    item_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch a single saved item (used to poll enrichment status)."""
    try:
        parsed_id = uuid.UUID(item_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Not found")

    result = await db.execute(
        select(SavedItem).where(
            SavedItem.id == parsed_id,
            SavedItem.user_id == current_user.id,
        )
    )
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")

    return _item_to_response(item)


@router.post("/lookup", response_model=LookupResponse)
async def lookup_text(
    body: LookupRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Look up definition, example, part of speech, and synonyms for a text selection.
    Uses global vocab_cache; calls GPT only on a cache miss."""
    import json

    text = body.text.strip()
    if not text:
        raise HTTPException(status_code=422, detail="text must not be empty")

    # Check cache first
    result = await db.execute(
        select(VocabCache).where(
            VocabCache.text == text,
            VocabCache.language == body.language,
        )
    )
    cached = result.scalars().first()
    if cached:
        return LookupResponse(
            definition=cached.definition,
            example=cached.example,
            part_of_speech=cached.part_of_speech,
            synonyms=cached.synonyms or [],
        )

    # GPT enrichment
    prompt = (
        f'You are a language learning assistant. Analyze this {body.language} text: "{text}"\n\n'
        f"Return JSON with:\n"
        f'- "definition": concise English definition or translation\n'
        f'- "example": one natural example sentence in {body.language}\n'
        f'- "part_of_speech": grammatical category (noun, verb, adjective, phrase, sentence, etc.)\n'
        f'- "synonyms": array of up to 4 {body.language} synonyms or near-synonyms (empty array if none)\n\n'
        f"Return ONLY valid JSON."
    )
    response = await openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=300,
        response_format={"type": "json_object"},
    )
    data = json.loads(response.choices[0].message.content or "{}")
    definition = data.get("definition", "")
    example = data.get("example")
    part_of_speech = data.get("part_of_speech")
    synonyms = data.get("synonyms", [])
    if not isinstance(synonyms, list):
        synonyms = []

    # Write to cache
    try:
        entry = VocabCache(
            id=uuid.uuid4(),
            text=text,
            language=body.language,
            definition=definition,
            example=example,
            part_of_speech=part_of_speech,
            synonyms=synonyms,
        )
        db.add(entry)
        await db.commit()
    except Exception:
        await db.rollback()

    return LookupResponse(
        definition=definition,
        example=example,
        part_of_speech=part_of_speech,
        synonyms=synonyms,
    )


@router.post("/tts/speak")
async def speak(
    body: TTSRequest,
    current_user: User = Depends(get_current_user),
):
    """Generate on-demand TTS audio via OpenAI. Returns audio/mpeg stream."""
    text = body.text.strip()
    if not text:
        raise HTTPException(status_code=422, detail="text must not be empty")
    if len(text) > 300:
        raise HTTPException(status_code=422, detail="text too long for TTS (max 300 chars)")

    # Map language to OpenAI TTS voice
    _VOICE_MAP = {
        "German": "nova",
        "Spanish": "nova",
        "French": "nova",
        "Italian": "nova",
        "English": "alloy",
    }
    voice = _VOICE_MAP.get(body.language, "nova")

    response = await openai_client.audio.speech.create(
        model="tts-1",
        voice=voice,
        input=text,
    )
    audio_bytes = response.content

    return StreamingResponse(
        io.BytesIO(audio_bytes),
        media_type="audio/mpeg",
        headers={"Cache-Control": "no-store"},
    )
