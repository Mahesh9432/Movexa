
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "Movexa API"
    APP_VERSION: str = "1.0.0"

    DATABASE_URL: str = (
        "postgresql+psycopg://postgres:password@localhost:5432/movexa"
    )

    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Separate secret for prototype administrator verification.
    ADMIN_VERIFICATION_KEY: str | None = None

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[2] / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
