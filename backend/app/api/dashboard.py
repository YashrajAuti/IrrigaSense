from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.config import settings
from app.models.farm import Farm, Field, IrrigationZone
from app.models.sensor import SensorReading
from app.models.irrigation import IrrigationEvent
from app.models.alert import AlertEvent
from app.schemas.dashboard import DashboardSummaryResponse, MetricCardItem
from app.schemas.farm import FarmRead, FieldRead, IrrigationZoneRead
from app.schemas.sensor import SensorReadingRead
from app.schemas.irrigation import IrrigationEventRead, RecommendationResponse
from app.schemas.alert import AlertEventRead
from app.services.recommendation_engine import evaluate_irrigation_recommendation

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    farm_id: Optional[int] = Query(None),
    field_id: Optional[int] = Query(None),
    zone_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    # Determine active Farm
    farm = None
    if farm_id:
        farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        farm = db.query(Farm).first()

    # Determine active Field
    field = None
    if field_id:
        field = db.query(Field).filter(Field.id == field_id).first()
    elif farm:
        field = db.query(Field).filter(Field.farm_id == farm.id).first()
    if not field:
        field = db.query(Field).first()

    # Determine active Zone
    zone = None
    if zone_id:
        zone = db.query(IrrigationZone).filter(IrrigationZone.id == zone_id).first()
    elif field:
        zone = db.query(IrrigationZone).filter(IrrigationZone.field_id == field.id).first()
    if not zone:
        zone = db.query(IrrigationZone).first()

    # Get latest reading for the selected zone
    latest_reading = None
    recent_readings: List[SensorReading] = []
    if zone:
        latest_reading = (
            db.query(SensorReading)
            .filter(SensorReading.zone_id == zone.id)
            .order_by(SensorReading.timestamp.desc())
            .first()
        )
        since_24h = datetime.utcnow() - timedelta(hours=24)
        recent_readings = (
            db.query(SensorReading)
            .filter(SensorReading.zone_id == zone.id, SensorReading.timestamp >= since_24h)
            .order_by(SensorReading.timestamp.asc())
            .all()
        )

    # Calculate recommendation
    hours_since_last = None
    if zone and zone.last_irrigation_at:
        hours_since_last = (datetime.utcnow() - zone.last_irrigation_at).total_seconds() / 3600.0

    if zone and field:
        recommendation = evaluate_irrigation_recommendation(zone, field, latest_reading, hours_since_last)
    else:
        recommendation = RecommendationResponse(
            zone_id=0,
            zone_name="N/A",
            crop_type="N/A",
            current_soil_moisture=None,
            lower_threshold=40.0,
            upper_threshold=65.0,
            recommended_action="INSUFFICIENT_DATA",
            urgency="WARNING",
            target_depth_mm=0.0,
            estimated_water_liters=0.0,
            reasons=["No zone selected or configured."],
            sensor_is_valid=False,
            sensor_is_stale=True,
            is_ml_prediction=False,
        )

    # Build the 4 Metric Cards
    moisture_val = latest_reading.soil_moisture_percent if latest_reading else 42.0
    temp_val = latest_reading.air_temperature_c if latest_reading else 28.5
    humidity_val = latest_reading.relative_humidity_percent if latest_reading else 58.0
    water_req_val = recommendation.estimated_water_liters

    # Color & status determinations
    if field:
        if moisture_val < field.lower_moisture_threshold:
            moisture_status = "Deficit"
            moisture_color = "rose" if (field.lower_moisture_threshold - moisture_val) > 8 else "amber"
        elif moisture_val > field.upper_moisture_threshold:
            moisture_status = "Surplus"
            moisture_color = "amber"
        else:
            moisture_status = "Optimal"
            moisture_color = "green"
    else:
        moisture_status = "Normal"
        moisture_color = "green"

    temp_status = "Elevated" if temp_val > 34 else ("Normal" if temp_val >= 20 else "Cool")
    temp_color = "amber" if temp_val > 34 else "blue"

    metrics: Dict[str, MetricCardItem] = {
        "soil_moisture": MetricCardItem(
            title="Soil Moisture",
            value=moisture_val,
            unit="%",
            status_label=moisture_status,
            status_color=moisture_color,
            is_simulated=True,
            trend_description=f"Target: {field.lower_moisture_threshold:.0f}% - {field.upper_moisture_threshold:.0f}%" if field else None,
        ),
        "air_temperature": MetricCardItem(
            title="Air Temperature",
            value=temp_val,
            unit="°C",
            status_label=temp_status,
            status_color=temp_color,
            is_simulated=True,
            trend_description="Field canopy sensor",
        ),
        "relative_humidity": MetricCardItem(
            title="Relative Humidity",
            value=humidity_val,
            unit="%",
            status_label="Moderate" if 40 <= humidity_val <= 70 else ("High" if humidity_val > 70 else "Low"),
            status_color="blue",
            is_simulated=True,
            trend_description="Atmospheric vapor density",
        ),
        "water_requirement": MetricCardItem(
            title="Predicted Water Req.",
            value=water_req_val,
            unit="Litres",
            status_label="Action Required" if water_req_val > 0 else "Satisfied",
            status_color="rose" if water_req_val > 0 else "green",
            is_simulated=True,
            trend_description=f"Depth: {recommendation.target_depth_mm} mm over {field.area_sqm:,.0f} m²" if field else None,
        ),
    }

    # All zones summary table
    all_zones = db.query(IrrigationZone).all()
    zones_overview = []
    for z in all_zones:
        z_field = db.query(Field).filter(Field.id == z.field_id).first()
        z_latest = (
            db.query(SensorReading)
            .filter(SensorReading.zone_id == z.id)
            .order_by(SensorReading.timestamp.desc())
            .first()
        )
        zones_overview.append({
            "zone_id": z.id,
            "zone_name": z.name,
            "field_name": z_field.name if z_field else "Field",
            "crop": z_field.crop_type if z_field else "Crop",
            "soil_moisture": z_latest.soil_moisture_percent if z_latest else 0.0,
            "lower_threshold": z_field.lower_moisture_threshold if z_field else 40.0,
            "upper_threshold": z_field.upper_moisture_threshold if z_field else 65.0,
            "status": z.status,
            "operating_mode": z.operating_mode,
            "simulated_pump_state": z.simulated_pump_state,
            "last_irrigation": z.last_irrigation_at.isoformat() if z.last_irrigation_at else "Never",
            "flow_rate_lpm": z.flow_rate_lpm,
        })

    # Recent activity
    recent_events = (
        db.query(IrrigationEvent)
        .order_by(IrrigationEvent.started_at.desc())
        .limit(10)
        .all()
    )
    active_alerts = (
        db.query(AlertEvent)
        .filter(AlertEvent.is_resolved == False)
        .order_by(AlertEvent.created_at.desc())
        .limit(5)
        .all()
    )

    return DashboardSummaryResponse(
        farm=FarmRead.model_validate(farm) if farm else None,
        field=FieldRead.model_validate(field) if field else None,
        zone=IrrigationZoneRead.model_validate(zone) if zone else None,
        metrics=metrics,
        recommendation=recommendation,
        zones_overview=zones_overview,
        recent_readings_24h=[SensorReadingRead.model_validate(r) for r in recent_readings],
        recent_events=[IrrigationEventRead.model_validate(e) for e in recent_events],
        active_alerts=[AlertEventRead.model_validate(a) for a in active_alerts],
        demo_mode=settings.DEMO_MODE,
        demo_badge_label=settings.SIMULATION_LABEL,
        server_time=datetime.utcnow(),
    )
