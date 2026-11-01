from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from app.models.farm import IrrigationZone, Field
from app.models.sensor import SensorReading
from app.models.irrigation import IrrigationEvent
from app.schemas.irrigation import IrrigationCommandRequest, IrrigationCommandResponse, IrrigationEventRead
from app.services.water_calculator import calculate_water_requirement
from app.schemas.irrigation import WaterCalcRequest

def execute_irrigation_command(
    db: Session,
    request: IrrigationCommandRequest
) -> IrrigationCommandResponse:
    zone = db.query(IrrigationZone).filter(IrrigationZone.id == request.zone_id).first()
    if not zone:
        raise ValueError(f"Irrigation Zone ID {request.zone_id} not found.")

    field = db.query(Field).filter(Field.id == zone.field_id).first()
    action = request.action.upper()

    # Safety: Emergency Stop takes immediate unconditional precedence
    if action == "EMERGENCY_STOP":
        zone.simulated_pump_state = "EMERGENCY_STOPPED"
        zone.status = "Idle"
        zone.current_runtime_minutes = 0

        event = IrrigationEvent(
            zone_id=zone.id,
            trigger_type="MANUAL_OVERRIDE",
            action="EMERGENCY_STOP",
            runtime_minutes=0,
            target_depth_mm=0.0,
            estimated_water_liters=0.0,
            status="EMERGENCY_STOPPED",
            notes="EMERGENCY STOP executed by operator. Simulated pump stopped and locked.",
            is_simulated=True,
            started_at=datetime.utcnow(),
            stopped_at=datetime.utcnow(),
        )
        db.add(event)
        db.commit()
        db.refresh(event)

        return IrrigationCommandResponse(
            success=True,
            message=f"EMERGENCY STOP executed on {zone.name}. Simulated pump halted.",
            zone_id=zone.id,
            pump_state=zone.simulated_pump_state,
            event=IrrigationEventRead.model_validate(event),
        )

    if action == "STOP":
        zone.simulated_pump_state = "OFF"
        zone.status = "Idle"
        runtime = zone.current_runtime_minutes
        zone.current_runtime_minutes = 0

        event = IrrigationEvent(
            zone_id=zone.id,
            trigger_type=request.mode.upper(),
            action="STOP",
            runtime_minutes=runtime,
            target_depth_mm=0.0,
            estimated_water_liters=round(runtime * zone.flow_rate_lpm, 1),
            status="COMPLETED",
            notes=f"Simulated irrigation stopped normally after {runtime} minutes.",
            is_simulated=True,
            started_at=datetime.utcnow() - timedelta(minutes=runtime),
            stopped_at=datetime.utcnow(),
        )
        db.add(event)
        db.commit()
        db.refresh(event)

        return IrrigationCommandResponse(
            success=True,
            message=f"Simulated irrigation stopped for {zone.name}.",
            zone_id=zone.id,
            pump_state=zone.simulated_pump_state,
            event=IrrigationEventRead.model_validate(event),
        )

    if action == "START":
        # Check if currently locked in emergency stop
        if zone.simulated_pump_state == "EMERGENCY_STOPPED" and request.mode == "Automatic":
            return IrrigationCommandResponse(
                success=False,
                message="Cannot start automatic irrigation while Emergency Stop is active. Reset to Manual first.",
                zone_id=zone.id,
                pump_state=zone.simulated_pump_state,
            )

        # Enforce max runtime
        target_minutes = min(request.runtime_minutes or 30, zone.max_runtime_minutes)
        target_depth = request.target_depth_mm or 4.0

        # Automatic mode safety check: ensure sensor reading is valid and fresh
        if request.mode.upper() == "AUTOMATIC":
            latest_reading = (
                db.query(SensorReading)
                .filter(SensorReading.zone_id == zone.id)
                .order_by(SensorReading.timestamp.desc())
                .first()
            )
            if not latest_reading or not latest_reading.is_valid:
                return IrrigationCommandResponse(
                    success=False,
                    message="Automatic irrigation blocked: Sensor readings are absent or invalid.",
                    zone_id=zone.id,
                    pump_state=zone.simulated_pump_state,
                )
            age_hours = (datetime.utcnow() - latest_reading.timestamp).total_seconds() / 3600.0
            if age_hours > 24.0:
                return IrrigationCommandResponse(
                    success=False,
                    message=f"Automatic irrigation blocked: Sensor reading is stale ({age_hours:.1f}h old).",
                    zone_id=zone.id,
                    pump_state=zone.simulated_pump_state,
                )

        # Calculate estimated water requirement
        area = field.area_sqm if field else 1000.0
        calc_res = calculate_water_requirement(WaterCalcRequest(
            irrigation_depth_mm=target_depth,
            field_area_sqm=area
        ))

        zone.simulated_pump_state = "ON"
        zone.status = "Active"
        zone.operating_mode = request.mode.capitalize()
        zone.current_runtime_minutes = target_minutes
        zone.last_irrigation_at = datetime.utcnow()

        event = IrrigationEvent(
            zone_id=zone.id,
            trigger_type=request.mode.upper(),
            action="START",
            runtime_minutes=target_minutes,
            target_depth_mm=target_depth,
            estimated_water_liters=calc_res.gross_water_liters,
            status="ACTIVE",
            notes=f"Simulated pump activated for {target_minutes} min (depth {target_depth} mm, target volume {calc_res.gross_water_liters:,.0f} L).",
            is_simulated=True,
            started_at=datetime.utcnow(),
        )
        db.add(event)
        db.commit()
        db.refresh(event)

        return IrrigationCommandResponse(
            success=True,
            message=f"Simulated irrigation started for {zone.name} ({target_minutes} min duration).",
            zone_id=zone.id,
            pump_state=zone.simulated_pump_state,
            event=IrrigationEventRead.model_validate(event),
        )

    raise ValueError(f"Unsupported irrigation action '{request.action}'. Expected START, STOP, or EMERGENCY_STOP.")
