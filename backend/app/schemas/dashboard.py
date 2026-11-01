from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from app.schemas.farm import FarmRead, FieldRead, IrrigationZoneRead
from app.schemas.sensor import SensorReadingRead
from app.schemas.irrigation import IrrigationEventRead, RecommendationResponse
from app.schemas.alert import AlertEventRead

class MetricCardItem(BaseModel):
    title: str
    value: float
    unit: str
    status_label: str
    status_color: str  # green, amber, rose, blue
    is_simulated: bool = True
    trend_description: Optional[str] = None

class DashboardSummaryResponse(BaseModel):
    farm: Optional[FarmRead] = None
    field: Optional[FieldRead] = None
    zone: Optional[IrrigationZoneRead] = None
    metrics: Dict[str, MetricCardItem]
    recommendation: RecommendationResponse
    zones_overview: List[Dict[str, Any]]
    recent_readings_24h: List[SensorReadingRead]
    recent_events: List[IrrigationEventRead]
    active_alerts: List[AlertEventRead]
    demo_mode: bool = True
    demo_badge_label: str = "DEMO MODE — SIMULATED DATA"
    server_time: datetime
