from pathlib import Path
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "JalSetu AI"
    APP_VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    API_V1_STR: str = "/api/v1"
    
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    
    DATABASE_URL: str = "sqlite:///./jalsetu.db"
    
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000"
    ]
    
    DATA_DIR: str = "./data"
    
    @field_validator("CORS_ORIGINS", mode="before")
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v
    
    @property
    def resolved_data_dir(self) -> Path:
        """Resolve data directory relative to project root or configured path."""
        p = Path(self.DATA_DIR)
        if p.is_absolute() and p.exists():
            return p
        # Check current working directory
        cwd_data = Path.cwd() / self.DATA_DIR
        if cwd_data.exists():
            return cwd_data
        # Check relative to backend folder (parent)
        parent_data = Path(__file__).resolve().parent.parent.parent.parent / "data"
        if parent_data.exists():
            return parent_data
        return p

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()

