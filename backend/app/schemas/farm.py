from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field as PydanticField

class IrrigationZoneBase(BaseModel):
    name: str
    status: str = "Idle"
    operating_mode: str = "Manual"
    flow_rate_lpm: float = 45.0
    max_runtime_minutes: int = 120

class IrrigationZoneCreate(IrrigationZoneBase):
    field_id: int

class IrrigationZoneUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    operating_mode: Optional[str] = None
    flow_rate_lpm: Optional[float] = None
    max_runtime_minutes: Optional[int] = None

class IrrigationZoneRead(IrrigationZoneBase):
    id: int
    field_id: int
    last_irrigation_at: Optional[datetime] = None
    simulated_pump_state: str = "OFF"
    current_runtime_minutes: int = 0

    class Config:
        from_attributes = True

class FieldBase(BaseModel):
    name: str
    crop_type: str
    area_sqm: float = PydanticField(..., gt=0)
    soil_type: str = "Clay Loam"
    lower_moisture_threshold: float = PydanticField(..., ge=0, le=100)
    upper_moisture_threshold: float = PydanticField(..., ge=0, le=100)

class FieldCreate(FieldBase):
    farm_id: int

class FieldUpdate(BaseModel):
    name: Optional[str] = None
    crop_type: Optional[str] = None
    area_sqm: Optional[float] = PydanticField(None, gt=0)
    soil_type: Optional[str] = None
    lower_moisture_threshold: Optional[float] = PydanticField(None, ge=0, le=100)
    upper_moisture_threshold: Optional[float] = PydanticField(None, ge=0, le=100)

class FieldRead(FieldBase):
    id: int
    farm_id: int
    created_at: datetime
    zones: List[IrrigationZoneRead] = []

    class Config:
        from_attributes = True

class FarmBase(BaseModel):
    name: str
    location: str
    total_area_sqm: float = PydanticField(..., gt=0)

class FarmCreate(FarmBase):
    pass

class FarmRead(FarmBase):
    id: int
    created_at: datetime
    fields: List[FieldRead] = []

    class Config:
        from_attributes = True
