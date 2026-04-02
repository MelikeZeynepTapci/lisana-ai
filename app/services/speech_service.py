import uuid
from pathlib import Path
from openai import AsyncOpenAI
from app.core.config import settings

openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

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
    Convert text to speech using OpenAI TTS.
    Returns (file_path, audio_url).
    """
    filename = f"{uuid.uuid4()}.mp3"
    file_path = audio_dir / filename

    response = await openai_client.audio.speech.create(
        model="tts-1",
        voice="nova",
        input=text,
    )

    with open(file_path, "wb") as f:
        f.write(response.content)

    audio_url = f"/audio/{filename}"
    return str(file_path), audio_url
