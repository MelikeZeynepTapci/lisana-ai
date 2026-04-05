import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.core.database import get_db
from app.models.models import User

router = APIRouter(prefix="/api/auth", tags=["auth"])

bearer_scheme = HTTPBearer()


class SyncResponse(BaseModel):
    id: str
    email: str
    subscription_plan: str
    created: bool  # True if newly created, False if already existed


@router.post("/sync", response_model=SyncResponse)
async def sync_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
):
    """
    Signup/login sonrasında frontend tarafından çağrılır.
    Supabase JWT'den user_id ve email alır, users tablosuna kaydeder (idempotent).
    """
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token süresi dolmuş")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Geçersiz token")

    user_id: str = payload.get("sub")
    email: str = payload.get("email", "")

    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token geçersiz")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user:
        return SyncResponse(
            id=str(user.id),
            email=user.email,
            subscription_plan=user.subscription_plan,
            created=False,
        )

    user = User(id=user_id, email=email)
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return SyncResponse(
        id=str(user.id),
        email=user.email,
        subscription_plan=user.subscription_plan,
        created=True,
    )
