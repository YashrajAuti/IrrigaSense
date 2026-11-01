from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database.session import engine, Base, SessionLocal
from app.services.demo_data import seed_demonstration_dataset
import app.models  # ensure all models are registered

# API Routers
from app.api import (
    health,
    farms,
    fields,
    zones,
    sensors,
    readings,
    irrigation,
    alerts,
    dashboard,
    settings as settings_api,
    predictions,
    analytics,
)

# Create database tables
Base.metadata.create_all(bind=engine)

# Seed demo dataset on startup
with SessionLocal() as db:
    seed_demonstration_dataset(db, force_reset=False)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-Based Smart Irrigation and Crop Water Management Platform (Backend API)",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(health.router)
app.include_router(farms.router, prefix=settings.API_V1_STR)
app.include_router(fields.router, prefix=settings.API_V1_STR)
app.include_router(zones.router, prefix=settings.API_V1_STR)
app.include_router(sensors.router, prefix=settings.API_V1_STR)
app.include_router(readings.router, prefix=settings.API_V1_STR)
app.include_router(irrigation.router, prefix=settings.API_V1_STR)
app.include_router(alerts.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(settings_api.router, prefix=settings.API_V1_STR)
app.include_router(predictions.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)

@app.get("/")
def root_info():
    return {
        "project": "IrrigaSense: AI-Based Smart Irrigation and Crop Water Management Platform",
        "mode": settings.SIMULATION_LABEL,
        "docs": "/docs",
        "api_v1": settings.API_V1_STR,
    }
