from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.config import settings
from app.models.models import Base  # noqa: F401 — single source of truth

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    connect_args={"statement_cache_size": 0, "ssl": "require"},
)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
