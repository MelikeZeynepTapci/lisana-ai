from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost/linguatutor"

    # OpenAI
    OPENAI_API_KEY: str

    # ElevenLabs
    ELEVENLABS_API_KEY: str
    ELEVENLABS_VOICE_ID: str = "21m00Tcm4TlvDq8ikWAM"  # Rachel

    # Langfuse
    LANGFUSE_PUBLIC_KEY: Optional[str] = None
    LANGFUSE_SECRET_KEY: Optional[str] = None
    LANGFUSE_HOST: str = "https://cloud.langfuse.com"

    # Sentry
    SENTRY_DSN: Optional[str] = None

    # App
    ENVIRONMENT: str = "development"
    FRONTEND_URL: str = "http://localhost:3000"
    RAILWAY_STATIC_URL: Optional[str] = None

    # Audio storage (local for dev, can be S3/etc for prod)
    AUDIO_DIR: str = "audio_files"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
