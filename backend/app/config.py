from typing import Any
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "JalSetu AI Core"
    SERVICE_NAME: str = "jalsetu-core"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    @field_validator("DEBUG", mode="before")
    @classmethod
    def parse_debug(cls, v: Any) -> Any:
        if isinstance(v, str):
            if v.lower() in ("release", "prod", "production", "false", "0", "no", "off"):
                return False
            if v.lower() in ("debug", "dev", "development", "true", "1", "yes", "on"):
                return True
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
