import os
import uuid
import time
from pathlib import Path
from openai import AsyncOpenAI
from elevenlabs.client import AsyncElevenLabs
from elevenlabs import VoiceSettings
from app.core.config import settings

openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
elevenlabs_client = AsyncElevenLabs(api_key=settings.ELEVENLABS_API_KEY)

audio_dir = Path(settings.AUDIO_DIR)
audio_dir.mkdir(exist_ok=True)


async def transcribe_audio(audio_bytes: bytes, filename: str) -> str:
    """Transcribe audio using OpenAI Whisper."""
    import io
    audio_file = io.BytesIO(audio_bytes)
    audio_file.name = filename

    response = await openai_client.audio.transcriptions.create(
        model="whisper-1",
        file=audio_file,
    )
    return response.text


async def synthesize_speech(text: str) -> tuple[str, str]:
    """
    Convert text to speech using ElevenLabs.
    Returns (file_path, audio_url).
    """
    audio_stream = await elevenlabs_client.generate(
        text=text,
        voice=settings.ELEVENLABS_VOICE_ID,
        model="eleven_multilingual_v2",
        voice_settings=VoiceSettings(
            stability=0.5,
            similarity_boost=0.75,
            style=0.0,
            use_speaker_boost=True,
        ),
    )

    filename = f"{uuid.uuid4()}.mp3"
    file_path = audio_dir / filename

    chunks = []
    async for chunk in audio_stream:
        chunks.append(chunk)

    with open(file_path, "wb") as f:
        f.write(b"".join(chunks))

    audio_url = f"/audio/{filename}"
    return str(file_path), audio_url
