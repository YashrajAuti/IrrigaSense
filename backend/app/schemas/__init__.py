from app.schemas.farm import (
    FarmBase, FarmCreate, FarmRead,
    FieldBase, FieldCreate, FieldRead, FieldUpdate,
    IrrigationZoneBase, IrrigationZoneCreate, IrrigationZoneRead, IrrigationZoneUpdate
)
from app.schemas.sensor import (
    SensorDeviceBase, SensorDeviceCreate, SensorDeviceRead,
    SensorReadingBase, SensorReadingCreate, SensorReadingRead
)
from app.schemas.irrigation import (
    IrrigationEventRead, IrrigationCommandRequest, IrrigationCommandResponse,
    IrrigationScheduleBase, IrrigationScheduleCreate, IrrigationScheduleRead,
    WaterCalcRequest, WaterCalcResponse, RecommendationResponse
)
from app.schemas.alert import AlertEventBase, AlertEventCreate, AlertEventUpdate, AlertEventRead
from app.schemas.dashboard import DashboardSummaryResponse, MetricCardItem

__all__ = [
    "FarmBase", "FarmCreate", "FarmRead",
    "FieldBase", "FieldCreate", "FieldRead", "FieldUpdate",
    "IrrigationZoneBase", "IrrigationZoneCreate", "IrrigationZoneRead", "IrrigationZoneUpdate",
    "SensorDeviceBase", "SensorDeviceCreate", "SensorDeviceRead",
    "SensorReadingBase", "SensorReadingCreate", "SensorReadingRead",
    "IrrigationEventRead", "IrrigationCommandRequest", "IrrigationCommandResponse",
    "IrrigationScheduleBase", "IrrigationScheduleCreate", "IrrigationScheduleRead",
    "WaterCalcRequest", "WaterCalcResponse", "RecommendationResponse",
    "AlertEventBase", "AlertEventCreate", "AlertEventUpdate", "AlertEventRead",
    "DashboardSummaryResponse", "MetricCardItem",
]
