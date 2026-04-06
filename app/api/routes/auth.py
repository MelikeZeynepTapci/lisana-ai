from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.auth import _decode_token
from app.core.database import get_db
from app.models.models import User

router = APIRouter(prefix="/api/auth", tags=["auth"])

bearer_scheme = HTTPBearer()


class SyncResponse(BaseModel):
    id: str
    email: str
    username: str | None
    subscription_plan: str
    created: bool


class LookupRequest(BaseModel):
    username: str


class LookupResponse(BaseModel):
    email: str


class CheckRequest(BaseModel):
    email: str | None = None
    username: str | None = None


class CheckResponse(BaseModel):
    email_taken: bool
    username_taken: bool


@router.post("/sync", response_model=SyncResponse)
async def sync_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
):
    """
    Login/signup sonrasında çağrılır. Kullanıcıyı DB'ye kaydeder (idempotent).
    Supabase user_metadata'dan username ve full_name alır.
    """
    payload = await _decode_token(credentials.credentials)

    user_id: str = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token geçersiz")

    email: str = payload.get("email", "")
    metadata: dict = payload.get("user_metadata", {})
    username: str | None = metadata.get("username") or None
    full_name: str | None = metadata.get("full_name") or None

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user:
        # Update metadata if newly set
        changed = False
        if username and not user.username:
            user.username = username
            changed = True
        if full_name and not user.full_name:
            user.full_name = full_name
            changed = True
        if changed:
            await db.commit()
            await db.refresh(user)
        return SyncResponse(
            id=str(user.id),
            email=user.email,
            username=user.username,
            subscription_plan=user.subscription_plan,
            created=False,
        )

    user = User(id=user_id, email=email, username=username, full_name=full_name)
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return SyncResponse(
        id=str(user.id),
        email=user.email,
        username=user.username,
        subscription_plan=user.subscription_plan,
        created=True,
    )


@router.post("/check", response_model=CheckResponse)
async def check_availability(
    body: CheckRequest,
    db: AsyncSession = Depends(get_db),
):
    """Email veya username'in daha önce alınıp alınmadığını kontrol eder."""
    email_taken = False
    username_taken = False

    if body.email:
        result = await db.execute(select(User).where(User.email == body.email))
        email_taken = result.scalar_one_or_none() is not None

    if body.username:
        result = await db.execute(select(User).where(User.username == body.username))
        username_taken = result.scalar_one_or_none() is not None

    return CheckResponse(email_taken=email_taken, username_taken=username_taken)


@router.post("/lookup", response_model=LookupResponse)
async def lookup_by_username(
    body: LookupRequest,
    db: AsyncSession = Depends(get_db),
):
    """Username ile email'i döner (login için kullanılır)."""
    result = await db.execute(select(User).where(User.username == body.username))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kullanıcı bulunamadı")
    return LookupResponse(email=user.email)
