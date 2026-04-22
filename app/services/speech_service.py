import io
import logging
import uuid
from pathlib import Path
from typing import AsyncGenerator, Literal

import httpx
import sentry_sdk
from openai import AsyncOpenAI

from app.core.config import settings

logger = logging.getLogger(__name__)

openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

audio_dir = Path(settings.AUDIO_DIR)
audio_dir.mkdir(parents=True, exist_ok=True)

TTSProvider = Literal["elevenlabs", "openai"]

_LEVEL_SPEED: dict[str, float] = {
    "A1": 0.80, "A2": 0.80,
    "B1": 0.85, "B2": 0.85,
    "C1": 0.90, "C2": 0.90,
}

def _speed_for_level(level: str) -> float:
    return _LEVEL_SPEED.get(level.upper(), 0.85)


def _get_preferred_tts_provider() -> TTSProvider:
    """
    Decide which provider should be attempted first.
    Defaults to ElevenLabs when configured, otherwise OpenAI.
    """
    if getattr(settings, "ELEVENLABS_API_KEY", None) and getattr(settings, "ELEVENLABS_VOICE_ID", None):
        return "elevenlabs"
    return "openai"


async def transcribe_audio(audio_bytes: bytes, filename: str, language: str | None = None) -> str:
    """
    Transcribe audio using OpenAI gpt-4o-mini-transcribe.
    When a target language is provided, a prompt is added to discourage
    automatic grammar correction so learner mistakes are preserved.
    """
    audio_file = io.BytesIO(audio_bytes)
    audio_file.name = filename

    kwargs: dict = {
        "model": "gpt-4o-mini-transcribe",
        "file": audio_file,
    }

    if language:
        kwargs["prompt"] = (
            f"Transcribe the following {language} speech exactly as spoken. "
            "Do not correct grammar, vocabulary, or pronunciation errors. "
            "Preserve all mistakes and non-standard forms verbatim."
        )

    response = await openai_client.audio.transcriptions.create(**kwargs)
    return response.text


async def _elevenlabs_pcm_stream(text: str, level: str = "B1") -> AsyncGenerator[bytes, None]:
    """
    Stream raw PCM 24kHz mono audio from ElevenLabs.
    Raises a detailed exception on failure.
    """
    api_key = getattr(settings, "ELEVENLABS_API_KEY", None)
    voice_id = getattr(settings, "ELEVENLABS_VOICE_ID", None)

    if not api_key:
        raise RuntimeError("ELEVENLABS_API_KEY is missing.")
    if not voice_id:
        raise RuntimeError("ELEVENLABS_VOICE_ID is missing.")

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream"

    params = {
        "output_format": "pcm_24000",
    }

    payload = {
        "text": text,
        "model_id": "eleven_flash_v2_5",
        "voice_settings": {
            "stability": 0.4,
            "similarity_boost": 0.6,
            "style": 0.8,
            "speed": _speed_for_level(level),
        },
    }

    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    timeout = httpx.Timeout(connect=10.0, read=60.0, write=20.0, pool=20.0)

    async with httpx.AsyncClient(timeout=timeout) as client:
        async with client.stream(
            "POST",
            url,
            params=params,
            headers=headers,
            json=payload,
        ) as response:
            if response.status_code >= 400:
                error_body = await response.aread()
                decoded = error_body.decode("utf-8", errors="ignore")
                raise RuntimeError(
                    f"ElevenLabs TTS failed with status {response.status_code}: {decoded}"
                )

            logger.info("TTS provider in use: elevenlabs")

            async for chunk in response.aiter_bytes(4096):
                if chunk:
                    yield chunk


async def _openai_pcm_stream(text: str) -> AsyncGenerator[bytes, None]:
    """
    Stream-like generator for OpenAI TTS PCM output.
    OpenAI returns the content as one blob, so we chunk it manually.
    """
    logger.warning("TTS provider in use: openai")

    response = await openai_client.audio.speech.create(
        model="tts-1",
        voice="nova",
        input=text,
        response_format="pcm",
    )

    pcm = response.content
    for i in range(0, len(pcm), 4096):
        yield pcm[i:i + 4096]


async def synthesize_sentence_stream(
    text: str,
    *,
    level: str = "B1",
    allow_fallback: bool = True,
) -> AsyncGenerator[bytes, None]:
    """
    Stream PCM 24kHz 16-bit mono audio for a single sentence.

    Behavior:
    - Prefer ElevenLabs if configured
    - Fall back to OpenAI only if allow_fallback=True
    - Logs clearly which provider is actually used
    """
    preferred_provider = _get_preferred_tts_provider()

    if preferred_provider == "elevenlabs":
        try:
            async for chunk in _elevenlabs_pcm_stream(text, level=level):
                yield chunk
            return
        except Exception as exc:
            logger.exception("ElevenLabs streaming failed.")
            sentry_sdk.capture_exception(exc)

            if not allow_fallback:
                raise

            logger.warning("Falling back to OpenAI TTS after ElevenLabs failure.")

    async for chunk in _openai_pcm_stream(text):
        yield chunk


async def _synthesize_with_elevenlabs_mp3(text: str) -> bytes:
    """
    Non-streaming ElevenLabs synthesis returning MP3 bytes.
    Useful for saving a file to disk for /turn-like endpoints.
    """
    api_key = getattr(settings, "ELEVENLABS_API_KEY", None)
    voice_id = getattr(settings, "ELEVENLABS_VOICE_ID", None)

    if not api_key:
        raise RuntimeError("ELEVENLABS_API_KEY is missing.")
    if not voice_id:
        raise RuntimeError("ELEVENLABS_VOICE_ID is missing.")

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"

    params = {
        "output_format": "mp3_44100_128",
    }

    payload = {
        "text": text,
        "model_id": "eleven_flash_v2_5",
        "voice_settings": {
            "stability": 0.6,
            "similarity_boost": 0.75,
            "style": 0.75,
            "speed": 0.90,
        },
    }

    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }

    timeout = httpx.Timeout(connect=10.0, read=60.0, write=20.0, pool=20.0)

    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.post(
            url,
            params=params,
            headers=headers,
            json=payload,
        )

    if response.status_code >= 400:
        decoded = response.text
        raise RuntimeError(
            f"ElevenLabs non-streaming TTS failed with status {response.status_code}: {decoded}"
        )

    logger.info("TTS provider in use for file synthesis: elevenlabs")
    return response.content


async def _synthesize_with_openai_mp3(text: str) -> bytes:
    """
    Non-streaming OpenAI synthesis returning MP3 bytes.
    """
    logger.warning("TTS provider in use for file synthesis: openai")

    response = await openai_client.audio.speech.create(
        model="tts-1",
        voice="nova",
        input=text,
    )
    return response.content


async def synthesize_speech(
    text: str,
    *,
    allow_fallback: bool = True,
) -> tuple[str, str, TTSProvider]:
    """
    Convert text to speech, save to disk, return:
    (file_path, audio_url, provider_used)

    This makes the provider explicit so you stop guessing.
    """
    filename = f"{uuid.uuid4()}.mp3"
    file_path = audio_dir / filename

    preferred_provider = _get_preferred_tts_provider()
    provider_used: TTSProvider

    if preferred_provider == "elevenlabs":
        try:
            audio_bytes = await _synthesize_with_elevenlabs_mp3(text)
            provider_used = "elevenlabs"
        except Exception as exc:
            logger.exception("ElevenLabs non-streaming synthesis failed.")
            sentry_sdk.capture_exception(exc)

            if not allow_fallback:
                raise

            logger.warning("Falling back to OpenAI TTS for file synthesis.")
            audio_bytes = await _synthesize_with_openai_mp3(text)
            provider_used = "openai"
    else:
        audio_bytes = await _synthesize_with_openai_mp3(text)
        provider_used = "openai"

    with open(file_path, "wb") as f:
        f.write(audio_bytes)

    return str(file_path), f"/audio/{filename}", provider_used