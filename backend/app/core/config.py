import os
from pydantic_settings import BaseSettings

def _resolve_database_url() -> str:
    env_url = os.getenv("DATABASE_URL")
    if env_url:
        if env_url.startswith("postgres://"):
            return env_url.replace("postgres://", "postgresql://", 1)
        return env_url
    if os.getenv("VERCEL"):
        tmp_db = "/tmp/irrigasense.db"
        if not os.path.exists(tmp_db):
            base_db = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "irrigasense.db")
            if os.path.exists(base_db):
                import shutil
                try:
                    shutil.copyfile(base_db, tmp_db)
                except Exception:
                    pass
        return f"sqlite:///{tmp_db}"
    return "sqlite:///./irrigasense.db"

class Settings(BaseSettings):
    PROJECT_NAME: str = "IrrigaSense Backend API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DEMO_MODE: bool = True
    SIMULATION_LABEL: str = "DEMO MODE — SIMULATED DATA"
    DATABASE_URL: str = _resolve_database_url()
    MAX_IRRIGATION_RUNTIME_MINUTES: int = 120
    DEFAULT_EFFICIENCY_PERCENT: float = 85.0
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*",
    ]

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
