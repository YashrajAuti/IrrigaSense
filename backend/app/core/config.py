import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "IrrigaSense Backend API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DEMO_MODE: bool = True
    SIMULATION_LABEL: str = "DEMO MODE — SIMULATED DATA"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./irrigasense.db")
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
