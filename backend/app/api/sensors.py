from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field as PydanticField
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.sensor import SensorDevice, SensorReading
from app.schemas.sensor import SensorDeviceRead, SensorDeviceCreate

router = APIRouter(prefix="/sensors", tags=["Sensors & Hardware Ingestion"])

class HardwarePayloadIngest(BaseModel):
    device_serial: str
    auth_token: Optional[str] = "demo-hw-secret-key"
    soil_moisture_percent: float = PydanticField(..., ge=0, le=100)
    air_temperature_c: float = PydanticField(..., ge=-20, le=70)
    relative_humidity_percent: float = PydanticField(..., ge=0, le=100)
    battery_level: Optional[float] = PydanticField(None, ge=0, le=100)
    signal_dbm: Optional[int] = PydanticField(None, ge=-120, le=0)

@router.get("", response_model=List[SensorDeviceRead])
def list_sensors(
    zone_id: Optional[int] = Query(None, description="Filter sensors by Zone ID"),
    db: Session = Depends(get_db)
):
    query = db.query(SensorDevice)
    if zone_id is not None:
        query = query.filter(SensorDevice.zone_id == zone_id)
    return query.all()

@router.get("/{sensor_id}", response_model=SensorDeviceRead)
def get_sensor(sensor_id: int, db: Session = Depends(get_db)):
    sensor = db.query(SensorDevice).filter(SensorDevice.id == sensor_id).first()
    if not sensor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Sensor {sensor_id} not found")
    return sensor

@router.post("", response_model=SensorDeviceRead, status_code=status.HTTP_201_CREATED)
def create_sensor(sensor_in: SensorDeviceCreate, db: Session = Depends(get_db)):
    sensor = SensorDevice(**sensor_in.model_dump())
    db.add(sensor)
    db.commit()
    db.refresh(sensor)
    return sensor

@router.post("/ingest-hardware", status_code=status.HTTP_200_OK)
def ingest_hardware_sensor_packet(
    payload: HardwarePayloadIngest,
    db: Session = Depends(get_db)
):
    """
    Ingests live telemetry packets from physical ESP32 / LoRaWAN edge controllers.
    Validates sensor identity, battery condition, signal strength, and creates a reading.
    """
    device = db.query(SensorDevice).filter(SensorDevice.device_serial == payload.device_serial).first()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device serial '{payload.device_serial}' is not registered in IrrigaSense fleet."
        )

    # Update device heartbeat and diagnostics
    device.last_heartbeat = datetime.utcnow()
    device.status = "Online"
    device.is_simulated = False
    if payload.battery_level is not None:
        device.battery_level = payload.battery_level
    if payload.signal_dbm is not None:
        device.signal_dbm = payload.signal_dbm

    # Create verified telemetry reading
    reading = SensorReading(
        device_id=device.id,
        zone_id=device.zone_id,
        timestamp=datetime.utcnow(),
        soil_moisture_percent=payload.soil_moisture_percent,
        air_temperature_c=payload.air_temperature_c,
        relative_humidity_percent=payload.relative_humidity_percent,
        is_simulated=False,
        is_valid=True,
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)

    return {
        "success": True,
        "message": f"Hardware telemetry from {device.device_serial} successfully ingested.",
        "reading_id": reading.id,
        "is_hardware": True
    }
