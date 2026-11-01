from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.sensor import SensorReading, SensorDevice
from app.schemas.sensor import SensorReadingRead, SensorReadingCreate

router = APIRouter(prefix="/readings", tags=["Sensor Readings"])

@router.get("", response_model=List[SensorReadingRead])
def list_readings(
    zone_id: Optional[int] = Query(None, description="Filter readings by Zone ID"),
    timeframe: str = Query("24h", regex="^(24h|7d|30d|all)$", description="Timeframe filter: 24h, 7d, 30d, all"),
    limit: int = Query(500, ge=1, le=2000, description="Max readings to return"),
    db: Session = Depends(get_db)
):
    query = db.query(SensorReading)
    if zone_id is not None:
        query = query.filter(SensorReading.zone_id == zone_id)

    now = datetime.utcnow()
    if timeframe == "24h":
        start_time = now - timedelta(hours=24)
        query = query.filter(SensorReading.timestamp >= start_time)
    elif timeframe == "7d":
        start_time = now - timedelta(days=7)
        query = query.filter(SensorReading.timestamp >= start_time)
    elif timeframe == "30d":
        start_time = now - timedelta(days=30)
        query = query.filter(SensorReading.timestamp >= start_time)

    # Order ascending for chart timeline display
    readings = query.order_by(SensorReading.timestamp.asc()).limit(limit).all()
    return readings

@router.get("/latest", response_model=Optional[SensorReadingRead])
def get_latest_reading(
    zone_id: int = Query(..., description="Zone ID for latest telemetry"),
    db: Session = Depends(get_db)
):
    reading = (
        db.query(SensorReading)
        .filter(SensorReading.zone_id == zone_id)
        .order_by(SensorReading.timestamp.desc())
        .first()
    )
    return reading

@router.post("", response_model=SensorReadingRead, status_code=status.HTTP_201_CREATED)
def record_simulated_reading(reading_in: SensorReadingCreate, db: Session = Depends(get_db)):
    reading = SensorReading(**reading_in.model_dump())
    db.add(reading)
    
    # Update device heartbeat
    device = db.query(SensorDevice).filter(SensorDevice.id == reading_in.device_id).first()
    if device:
        device.last_heartbeat = datetime.utcnow()

    db.commit()
    db.refresh(reading)
    return reading
