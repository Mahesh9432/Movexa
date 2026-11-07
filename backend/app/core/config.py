from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "Movexa API"
    APP_VERSION: str = "1.0.0"
    DATABASE_URL: str = "postgresql+psycopg://postgres:password@localhost:5432/movexa"

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[2] / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
