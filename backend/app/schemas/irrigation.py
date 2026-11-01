from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field as PydanticField

class IrrigationEventRead(BaseModel):
    id: int
    zone_id: int
    trigger_type: str
    action: str
    runtime_minutes: int
    target_depth_mm: float
    estimated_water_liters: float
    status: str
    notes: Optional[str] = None
    is_simulated: bool
    started_at: datetime
    stopped_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class IrrigationCommandRequest(BaseModel):
    zone_id: int
    action: str  # START, STOP, EMERGENCY_STOP
    mode: str = "Manual"  # Manual, Automatic
    target_depth_mm: Optional[float] = PydanticField(default=5.0, ge=0, le=50)
    runtime_minutes: Optional[int] = PydanticField(default=30, ge=1, le=120)

class IrrigationCommandResponse(BaseModel):
    success: bool
    message: str
    zone_id: int
    pump_state: str
    event: Optional[IrrigationEventRead] = None
    simulation_warning: str = "SIMULATED PUMP ONLY — No physical pump hardware is connected."

class IrrigationScheduleBase(BaseModel):
    name: str
    scheduled_time: str
    duration_minutes: int = PydanticField(..., ge=1, le=120)
    target_depth_mm: float = PydanticField(..., ge=0, le=50)
    days_of_week: str
    is_active: bool = True

class IrrigationScheduleCreate(IrrigationScheduleBase):
    zone_id: int

class IrrigationScheduleRead(IrrigationScheduleBase):
    id: int
    zone_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class WaterCalcRequest(BaseModel):
    irrigation_depth_mm: float = PydanticField(..., ge=0, le=100, description="Irrigation depth in millimeters")
    field_area_sqm: float = PydanticField(..., gt=0, le=1000000, description="Field area in square meters")
    efficiency_percent: Optional[float] = PydanticField(
        default=85.0, gt=0, le=100, description="Irrigation system application efficiency percentage (0-100)"
    )

class WaterCalcResponse(BaseModel):
    irrigation_depth_mm: float
    field_area_sqm: float
    efficiency_percent: float
    net_water_liters: float
    gross_water_liters: float
    net_water_cubic_meters: float
    gross_water_cubic_meters: float
    formula_explanation: str
    is_ml_prediction: bool = False

class RecommendationResponse(BaseModel):
    zone_id: int
    zone_name: str
    crop_type: str
    current_soil_moisture: Optional[float] = None
    lower_threshold: float
    upper_threshold: float
    recommended_action: str  # "IRRIGATE_NOW", "TARGET_OPTIMAL", "DELAY_OR_STOP", "INSUFFICIENT_DATA"
    urgency: str  # "HIGH", "NORMAL", "LOW", "WARNING"
    target_depth_mm: float
    estimated_water_liters: float
    reasons: List[str]
    sensor_is_valid: bool
    sensor_is_stale: bool
    last_irrigation_hours_ago: Optional[float] = None
    is_ml_prediction: bool = False
    disclaimer: str = "Rule-based agricultural decision engine. Not yet a validated machine learning model."
