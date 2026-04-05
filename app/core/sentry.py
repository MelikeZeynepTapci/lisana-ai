import sentry_sdk
from app.core.config import settings


def init_sentry():
    dsn = settings.SENTRY_DSN
    if dsn and "..." not in dsn and dsn.startswith("https://"):
        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            environment=settings.ENVIRONMENT,
            traces_sample_rate=0.1,
        )
