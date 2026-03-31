from pydantic import BaseModel
from datetime import datetime


class SessionCreate(BaseModel):
    language: str
    scenario: str
    level: str = "intermediate"


class SessionResponse(BaseModel):
    session_id: str
    language: str
    scenario: str
    level: str
    created_at: datetime

    model_config = {"from_attributes": True}


class MessageOut(BaseModel):
    id: str
    role: str
    text: str
    audio_url: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class HistoryResponse(BaseModel):
    session_id: str
    language: str
    scenario: str
    messages: list[MessageOut]
