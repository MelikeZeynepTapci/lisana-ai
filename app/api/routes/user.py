from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.models import User, UserLanguageProfile

router = APIRouter(prefix="/api/user", tags=["user"])


class MeResponse(BaseModel):
    id: str
    email: str
    username: str | None
    full_name: str | None
    active_language: str | None
    active_level: str | None


@router.get("/me", response_model=MeResponse)
async def get_me(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(UserLanguageProfile).where(
            UserLanguageProfile.user_id == current_user.id,
            UserLanguageProfile.is_active == True,
        )
    )
    lang_profile = result.scalars().first()

    return MeResponse(
        id=str(current_user.id),
        email=current_user.email,
        username=current_user.username,
        full_name=current_user.full_name,
        active_language=lang_profile.language if lang_profile else None,
        active_level=lang_profile.current_level if lang_profile else None,
    )
