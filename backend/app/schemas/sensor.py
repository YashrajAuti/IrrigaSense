from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field as PydanticField

class SensorDeviceBase(BaseModel):
    device_serial: str
    sensor_type: str
    status: str = "Online"
    battery_level: float = PydanticField(..., ge=0, le=100)
    signal_dbm: int
    firmware_version: str = "v1.4.2"
    is_simulated: bool = True

class SensorDeviceCreate(SensorDeviceBase):
    zone_id: int

class SensorDeviceRead(SensorDeviceBase):
    id: int
    zone_id: int
    last_heartbeat: datetime

    class Config:
        from_attributes = True

class SensorReadingBase(BaseModel):
    soil_moisture_percent: float = PydanticField(..., ge=0, le=100)
    air_temperature_c: float = PydanticField(..., ge=-20, le=70)
    relative_humidity_percent: float = PydanticField(..., ge=0, le=100)
    is_simulated: bool = True
    is_valid: bool = True

class SensorReadingCreate(SensorReadingBase):
    device_id: int
    zone_id: int

class SensorReadingRead(SensorReadingBase):
    id: int
    device_id: int
    zone_id: int
    timestamp: datetime

    class Config:
        from_attributes = True
