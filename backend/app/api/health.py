from datetime import datetime
from fastapi import APIRouter
from app.core.config import settings

router = APIRouter()

@router.get("/health", tags=["Health"])
def get_health_status():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "demo_mode": settings.DEMO_MODE,
        "simulation_label": settings.SIMULATION_LABEL,
        "hardware_connected": False,
        "timestamp": datetime.utcnow().isoformat(),
    }
