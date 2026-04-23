from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.models import User, UserProfile, UserLanguageProfile
from app.services.ai_service import generate_welcome_message

router = APIRouter(prefix="/api/onboarding", tags=["onboarding"])


class OnboardingData(BaseModel):
    language: str
    level: str
    focus: str = ""
    daily_goal_minutes: int
    interests: list[str]
    intro_sentence: str = ""
    city: str = ""


class WelcomeRequest(BaseModel):
    language: str
    level: str
    focus: str = ""
    interests: list[str]
    intro_sentence: str = ""


class WelcomeResponse(BaseModel):
    message: str


@router.post("/welcome", response_model=WelcomeResponse)
async def get_welcome_message(
    body: WelcomeRequest,
    current_user: User = Depends(get_current_user),
):
    """Generate Maya's personalized welcome message."""
    try:
        message = await generate_welcome_message(
            language=body.language,
            level=body.level,
            focus=body.focus,
            interests=body.interests,
            intro_sentence=body.intro_sentence,
        )
    except Exception:
        # Fallback message if API fails
        message = f"Great, let's start learning {body.language}! I've seen your level and goals — we'll make great progress together.\n\nReady to begin?"
    return WelcomeResponse(message=message)


@router.post("/complete")
async def complete_onboarding(
    body: OnboardingData,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Save onboarding data and create language profile."""
    onboarding_data = {
        "language": body.language,
        "level": body.level,
        "focus": body.focus,
        "daily_goal_minutes": body.daily_goal_minutes,
        "interests": body.interests,
        "intro_sentence": body.intro_sentence,
        "city": body.city,
        "completed_at": datetime.now(timezone.utc).isoformat(),
    }

    # Upsert user_profiles
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    if profile:
        profile.onboarding_data = onboarding_data
    else:
        profile = UserProfile(user_id=current_user.id, onboarding_data=onboarding_data)
        db.add(profile)

    # Upsert user_language_profiles
    result = await db.execute(
        select(UserLanguageProfile).where(
            UserLanguageProfile.user_id == current_user.id,
            UserLanguageProfile.language == body.language,
        )
    )
    lang_profile = result.scalar_one_or_none()
    if lang_profile:
        lang_profile.current_level = body.level
        lang_profile.is_active = True
    else:
        lang_profile = UserLanguageProfile(
            user_id=current_user.id,
            language=body.language,
            current_level=body.level,
            is_active=True,
        )
        db.add(lang_profile)

    await db.commit()
    return {"ok": True}


@router.post("/reset")
async def reset_onboarding(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Clear onboarding data so the user can redo the onboarding flow."""
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    if profile:
        profile.onboarding_data = {}
    await db.commit()
    return {"ok": True}
