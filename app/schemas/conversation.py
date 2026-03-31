from pydantic import BaseModel


class TurnResponse(BaseModel):
    user_transcript: str
    ai_text: str
    audio_url: str
    latency_ms: int
