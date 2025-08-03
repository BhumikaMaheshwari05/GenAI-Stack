# backend/app/core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:password@localhost/genai_stack"
    OPENAI_API_KEY: Optional[str] = None
    GOOGLE_API_KEY: Optional[str] = None
    SERPAPI_API_KEY: Optional[str] = None
    CHROMA_HOST: str = "localhost"
    CHROMA_PORT: int = 8000

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()