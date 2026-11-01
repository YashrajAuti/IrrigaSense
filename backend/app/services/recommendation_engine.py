from datetime import datetime
from typing import Optional, List
from app.models.farm import IrrigationZone, Field
from app.models.sensor import SensorReading
from app.schemas.irrigation import RecommendationResponse
from app.services.water_calculator import calculate_water_requirement
from app.schemas.irrigation import WaterCalcRequest

def evaluate_irrigation_recommendation(
    zone: IrrigationZone,
    field: Field,
    latest_reading: Optional[SensorReading],
    hours_since_last_irrigation: Optional[float] = None,
    forecast_rainfall_mm: float = 0.0,
    pump_fault: bool = False,
) -> RecommendationResponse:
    """
    Transparent, agronomic rule-based irrigation decision engine.
    
    Evaluates:
    - Sensor data presence and validity
    - Telemetry freshness (>24h stale cutoff)
    - Hardware/Pump fault status
    - Crop-specific lower & upper moisture thresholds
    - Anti-cycling hysteresis (prevents rapid on/off switching near threshold boundaries)
    - Recent irrigation cooldown periods (avoids waterlogging during infiltration)
    - Expected/forecast precipitation (delays irrigation when rain will satisfy deficit)
    """
    reasons: List[str] = []
    lower_th = field.lower_moisture_threshold
    upper_th = field.upper_moisture_threshold
    HYSTERESIS_BAND = 2.0  # 2% moisture hysteresis buffer

    # 1. Sensor presence check
    if latest_reading is None:
        return RecommendationResponse(
            zone_id=zone.id,
            zone_name=zone.name,
            crop_type=field.crop_type,
            current_soil_moisture=None,
            lower_threshold=lower_th,
            upper_threshold=upper_th,
            recommended_action="INSUFFICIENT_DATA",
            urgency="WARNING",
            target_depth_mm=0.0,
            estimated_water_liters=0.0,
            reasons=["Safety interlock: No telemetry record found for this zone. Automatic irrigation blocked."],
            sensor_is_valid=False,
            sensor_is_stale=True,
            last_irrigation_hours_ago=hours_since_last_irrigation,
            is_ml_prediction=False,
        )

    # 2. Sensor validity & stale check (> 24 hours without heartbeat)
    sensor_age_hours = (datetime.utcnow() - latest_reading.timestamp).total_seconds() / 3600.0
    is_stale = sensor_age_hours > 24.0
    is_valid = latest_reading.is_valid and not is_stale
    current_moisture = latest_reading.soil_moisture_percent

    if not is_valid:
        if is_stale:
            reasons.append(f"Sensor telemetry is stale (recorded {sensor_age_hours:.1f} hours ago; cutoff is 24h).")
        if not latest_reading.is_valid:
            reasons.append("Sensor diagnostic flagged latest telemetry reading as invalid/unreliable.")
        reasons.append("Safety rule: Automatic irrigation is disabled when sensor reliability is compromised.")

        return RecommendationResponse(
            zone_id=zone.id,
            zone_name=zone.name,
            crop_type=field.crop_type,
            current_soil_moisture=current_moisture,
            lower_threshold=lower_th,
            upper_threshold=upper_th,
            recommended_action="INSUFFICIENT_DATA",
            urgency="WARNING",
            target_depth_mm=0.0,
            estimated_water_liters=0.0,
            reasons=reasons,
            sensor_is_valid=False,
            sensor_is_stale=is_stale,
            last_irrigation_hours_ago=hours_since_last_irrigation,
            is_ml_prediction=False,
        )

    # 3. Equipment fault check
    if pump_fault or zone.simulated_pump_state == "EMERGENCY_STOPPED":
        reasons.append("Hardware alert: Pump or valve indicates an active fault or Emergency Stop lockout.")
        reasons.append("Safety interlock: Automatic and scheduled operations are locked.")
        return RecommendationResponse(
            zone_id=zone.id,
            zone_name=zone.name,
            crop_type=field.crop_type,
            current_soil_moisture=current_moisture,
            lower_threshold=lower_th,
            upper_threshold=upper_th,
            recommended_action="DELAY_OR_STOP",
            urgency="HIGH",
            target_depth_mm=0.0,
            estimated_water_liters=0.0,
            reasons=reasons,
            sensor_is_valid=True,
            sensor_is_stale=False,
            last_irrigation_hours_ago=hours_since_last_irrigation,
            is_ml_prediction=False,
        )

    reasons.append(f"Current moisture: {current_moisture:.1f}% vs target range [{lower_th:.1f}% - {upper_th:.1f}%] for {field.crop_type}.")

    # 4. Infiltration Cooldown Check (e.g. within 3 hours after irrigation stop)
    cooldown_active = hours_since_last_irrigation is not None and hours_since_last_irrigation < 3.0

    # 5. Moisture Deficit Evaluation
    if current_moisture < lower_th:
        deficit_pct = lower_th - current_moisture
        target_depth = min(8.0, max(3.0, round(deficit_pct * 0.4, 1)))

        # Rule 5A: Forecast rainfall check
        if forecast_rainfall_mm >= target_depth:
            reasons.append(
                f"Rainfall forecast of {forecast_rainfall_mm:.1f} mm exceeds calculated deficit depth of {target_depth:.1f} mm."
            )
            reasons.append("Recommend holding/delaying irrigation to conserve pumped water and utilize natural precipitation.")
            return RecommendationResponse(
                zone_id=zone.id,
                zone_name=zone.name,
                crop_type=field.crop_type,
                current_soil_moisture=current_moisture,
                lower_threshold=lower_th,
                upper_threshold=upper_th,
                recommended_action="DELAY_OR_STOP",
                urgency="LOW",
                target_depth_mm=0.0,
                estimated_water_liters=0.0,
                reasons=reasons,
                sensor_is_valid=True,
                sensor_is_stale=False,
                last_irrigation_hours_ago=hours_since_last_irrigation,
                is_ml_prediction=False,
            )

        # Rule 5B: Infiltration cooldown check
        if cooldown_active:
            reasons.append(
                f"Irrigation ran {hours_since_last_irrigation:.1f}h ago. "
                "Water infiltration and capillary distribution are still in progress."
            )
            reasons.append("Anti-saturation rule: Delaying additional irrigation to prevent root hypoxia.")
            return RecommendationResponse(
                zone_id=zone.id,
                zone_name=zone.name,
                crop_type=field.crop_type,
                current_soil_moisture=current_moisture,
                lower_threshold=lower_th,
                upper_threshold=upper_th,
                recommended_action="DELAY_OR_STOP",
                urgency="LOW",
                target_depth_mm=0.0,
                estimated_water_liters=0.0,
                reasons=reasons,
                sensor_is_valid=True,
                sensor_is_stale=False,
                last_irrigation_hours_ago=hours_since_last_irrigation,
                is_ml_prediction=False,
            )

        # Rule 5C: Actionable Irrigation Required
        reasons.append(f"Moisture is {deficit_pct:.1f}% below configured minimum threshold.")
        calc_res = calculate_water_requirement(WaterCalcRequest(
            irrigation_depth_mm=target_depth,
            field_area_sqm=field.area_sqm
        ))
        reasons.append(
            f"Precision recommendation: Apply {target_depth:.1f} mm depth ({calc_res.gross_water_liters:,.0f} L gross at 85% drip efficiency) to replenish root zone."
        )

        return RecommendationResponse(
            zone_id=zone.id,
            zone_name=zone.name,
            crop_type=field.crop_type,
            current_soil_moisture=current_moisture,
            lower_threshold=lower_th,
            upper_threshold=upper_th,
            recommended_action="IRRIGATE_NOW",
            urgency="HIGH" if deficit_pct > 8 else "NORMAL",
            target_depth_mm=target_depth,
            estimated_water_liters=calc_res.gross_water_liters,
            reasons=reasons,
            sensor_is_valid=True,
            sensor_is_stale=False,
            last_irrigation_hours_ago=hours_since_last_irrigation,
            is_ml_prediction=False,
        )

    # 6. Anti-cycling / Hysteresis Band: between lower_th and lower_th + HYSTERESIS_BAND
    elif lower_th <= current_moisture <= (lower_th + HYSTERESIS_BAND):
        reasons.append("Moisture is within the lower hysteresis stabilization band.")
        reasons.append("Anti-cycling rule: Pump held in standby to avoid rapid cycling.")
        return RecommendationResponse(
            zone_id=zone.id,
            zone_name=zone.name,
            crop_type=field.crop_type,
            current_soil_moisture=current_moisture,
            lower_threshold=lower_th,
            upper_threshold=upper_th,
            recommended_action="TARGET_OPTIMAL",
            urgency="LOW",
            target_depth_mm=0.0,
            estimated_water_liters=0.0,
            reasons=reasons,
            sensor_is_valid=True,
            sensor_is_stale=False,
            last_irrigation_hours_ago=hours_since_last_irrigation,
            is_ml_prediction=False,
        )

    # 7. Optimal Moisture Range
    elif lower_th < current_moisture <= upper_th:
        reasons.append(f"Moisture is in the target optimal range for {field.crop_type} root zone.")
        reasons.append("No active irrigation needed. Soil water reserve is sufficient.")
        return RecommendationResponse(
            zone_id=zone.id,
            zone_name=zone.name,
            crop_type=field.crop_type,
            current_soil_moisture=current_moisture,
            lower_threshold=lower_th,
            upper_threshold=upper_th,
            recommended_action="TARGET_OPTIMAL",
            urgency="LOW",
            target_depth_mm=0.0,
            estimated_water_liters=0.0,
            reasons=reasons,
            sensor_is_valid=True,
            sensor_is_stale=False,
            last_irrigation_hours_ago=hours_since_last_irrigation,
            is_ml_prediction=False,
        )

    # 8. Surplus Moisture (> upper_th)
    else:
        surplus = current_moisture - upper_th
        reasons.append(f"Soil moisture exceeds upper threshold by {surplus:.1f}%.")
        reasons.append("Root zone near saturation. Halt all irrigation to prevent nutrient leaching.")
        return RecommendationResponse(
            zone_id=zone.id,
            zone_name=zone.name,
            crop_type=field.crop_type,
            current_soil_moisture=current_moisture,
            lower_threshold=lower_th,
            upper_threshold=upper_th,
            recommended_action="DELAY_OR_STOP",
            urgency="LOW",
            target_depth_mm=0.0,
            estimated_water_liters=0.0,
            reasons=reasons,
            sensor_is_valid=True,
            sensor_is_stale=False,
            last_irrigation_hours_ago=hours_since_last_irrigation,
            is_ml_prediction=False,
        )
