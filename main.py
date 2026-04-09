from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.core.config import settings
from app.core.sentry import init_sentry
from app.api.routes import session, conversation, auth, user, onboarding

init_sentry()

app = FastAPI(title="LinguaTutor API", version="1.0.0")

# CORS
allowed_origins = [settings.FRONTEND_URL, "http://localhost:3000"]
if settings.RAILWAY_STATIC_URL:
    allowed_origins.append(f"https://{settings.RAILWAY_STATIC_URL}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# Serve audio files
audio_dir = Path(settings.AUDIO_DIR)
audio_dir.mkdir(exist_ok=True)
app.mount("/audio", StaticFiles(directory=str(audio_dir)), name="audio")

# Routes
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(onboarding.router)
app.include_router(session.router)
app.include_router(conversation.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
