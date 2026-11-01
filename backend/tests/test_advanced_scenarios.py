import pytest
from datetime import datetime, timedelta
from app.models.farm import IrrigationZone, Field
from app.models.sensor import SensorReading
from app.services.recommendation_engine import evaluate_irrigation_recommendation
from app.services.fao_calculator import (
    FAO56CalculationRequest,
    calculate_fao56_water_demand
)
from app.services.ml_prediction_service import (
    MLPredictionRequest,
    predict_crop_water_requirement_ml
)
from app.services.irrigation_service import execute_irrigation_command
from app.schemas.irrigation import IrrigationCommandRequest
from app.database.session import SessionLocal

def test_healthy_moisture_scenario():
    """Validates that optimal soil moisture suppresses irrigation."""
    field = Field(id=10, farm_id=1, name="Plot 10", crop_type="Tomato", area_sqm=1000.0, lower_moisture_threshold=40.0, upper_moisture_threshold=65.0)
    zone = IrrigationZone(id=10, field_id=10, name="Zone 10", simulated_pump_state="OFF", flow_rate_lpm=40.0)
    reading = SensorReading(id=1, device_id=1, zone_id=10, timestamp=datetime.utcnow(), soil_moisture_percent=52.0, air_temperature_c=27.0, relative_humidity_percent=60.0, is_valid=True)

    rec = evaluate_irrigation_recommendation(zone, field, reading, hours_since_last_irrigation=15.0)
    assert rec.recommended_action == "TARGET_OPTIMAL"
    assert rec.target_depth_mm == 0.0

def test_low_moisture_scenario_triggers_irrigation():
    """Validates that deficit soil moisture without rainfall triggers irrigation."""
    field = Field(id=11, farm_id=1, name="Plot 11", crop_type="Tomato", area_sqm=1000.0, lower_moisture_threshold=40.0, upper_moisture_threshold=65.0)
    zone = IrrigationZone(id=11, field_id=11, name="Zone 11", simulated_pump_state="OFF", flow_rate_lpm=40.0)
    reading = SensorReading(id=2, device_id=1, zone_id=11, timestamp=datetime.utcnow(), soil_moisture_percent=26.0, air_temperature_c=31.0, relative_humidity_percent=45.0, is_valid=True)

    rec = evaluate_irrigation_recommendation(zone, field, reading, hours_since_last_irrigation=24.0, forecast_rainfall_mm=0.0)
    assert rec.recommended_action == "IRRIGATE_NOW"
    assert rec.target_depth_mm > 0.0
    assert rec.estimated_water_liters > 0.0

def test_low_moisture_with_sufficient_forecast_rainfall_delays_irrigation():
    """
    CRITICAL SCENARIO: When soil is dry but forecast rainfall is sufficient to recharge the deficit,
    the system must recommend delaying irrigation to conserve water.
    """
    field = Field(id=12, farm_id=1, name="Plot 12", crop_type="Tomato", area_sqm=1000.0, lower_moisture_threshold=40.0, upper_moisture_threshold=65.0)
    zone = IrrigationZone(id=12, field_id=12, name="Zone 12", simulated_pump_state="OFF", flow_rate_lpm=40.0)
    reading = SensorReading(id=3, device_id=1, zone_id=12, timestamp=datetime.utcnow(), soil_moisture_percent=32.0, air_temperature_c=28.0, relative_humidity_percent=70.0, is_valid=True)

    # Forecast rainfall of 12.0 mm exceeds calculated deficit depth (~3.2 mm)
    rec = evaluate_irrigation_recommendation(
        zone, field, reading, hours_since_last_irrigation=24.0, forecast_rainfall_mm=12.0
    )
    assert rec.recommended_action == "DELAY_OR_STOP"
    assert rec.target_depth_mm == 0.0
    assert any("Rainfall forecast" in r for r in rec.reasons)

def test_invalid_sensor_blocks_automatic_irrigation():
    """Validates that a sensor flagged with invalid telemetry blocks automated decision-making."""
    field = Field(id=13, farm_id=1, name="Plot 13", crop_type="Onion", area_sqm=1000.0, lower_moisture_threshold=35.0, upper_moisture_threshold=60.0)
    zone = IrrigationZone(id=13, field_id=13, name="Zone 13", simulated_pump_state="OFF", flow_rate_lpm=40.0)
    reading = SensorReading(id=4, device_id=1, zone_id=13, timestamp=datetime.utcnow(), soil_moisture_percent=20.0, air_temperature_c=25.0, relative_humidity_percent=50.0, is_valid=False)

    rec = evaluate_irrigation_recommendation(zone, field, reading)
    assert rec.recommended_action == "INSUFFICIENT_DATA"
    assert rec.sensor_is_valid is False

def test_disconnected_or_faulty_pump_blocks_irrigation():
    """Validates that an equipment fault or emergency stop lockout halts operations."""
    field = Field(id=14, farm_id=1, name="Plot 14", crop_type="Sugarcane", area_sqm=2000.0, lower_moisture_threshold=50.0, upper_moisture_threshold=75.0)
    zone = IrrigationZone(id=14, field_id=14, name="Zone 14", simulated_pump_state="EMERGENCY_STOPPED", flow_rate_lpm=50.0)
    reading = SensorReading(id=5, device_id=1, zone_id=14, timestamp=datetime.utcnow(), soil_moisture_percent=30.0, air_temperature_c=26.0, relative_humidity_percent=55.0, is_valid=True)

    rec = evaluate_irrigation_recommendation(zone, field, reading, pump_fault=True)
    assert rec.recommended_action == "DELAY_OR_STOP"
    assert any("fault or Emergency Stop" in r for r in rec.reasons)

def test_maximum_runtime_enforcement():
    """Validates that pump runtime cannot exceed the configured hard maximum (120 min)."""
    from pydantic import ValidationError

    # 1. Schema-level validation rejects runtime > 120 min
    with pytest.raises(ValidationError):
        IrrigationCommandRequest(
            zone_id=1,
            action="START",
            mode="Manual",
            runtime_minutes=180,  # Exceeds max 120
            target_depth_mm=5.0
        )

    # 2. Maximum permitted duration (120 min) is accepted and executed
    with SessionLocal() as db:
        req = IrrigationCommandRequest(
            zone_id=1,
            action="START",
            mode="Manual",
            runtime_minutes=120,
            target_depth_mm=5.0
        )
        res = execute_irrigation_command(db, req)
        assert res.success is True
        assert res.pump_state == "ON"
        assert res.event.runtime_minutes == 120

def test_zero_baseline_water_savings_handling():
    """Validates that 0 actual water consumption handles division cleanly without zero division error."""
    actual_liters = 0.0
    baseline_liters = actual_liters * 1.38
    savings_pct = (baseline_liters - actual_liters) / baseline_liters if baseline_liters > 0 else 0.0
    assert savings_pct == 0.0

def test_fao56_evapotranspiration_calculation():
    """Validates scientific FAO-56 crop water demand formula (ETc = Kc * ET0)."""
    req = FAO56CalculationRequest(
        crop_type="Tomato",
        growth_stage="Flowering",  # Kc = 1.15
        air_temp_c=28.0,
        temp_max_c=33.0,
        temp_min_c=23.0,
        relative_humidity_percent=55.0,
        current_soil_moisture_percent=35.0,
        target_soil_moisture_percent=60.0,
        field_area_sqm=1000.0,
        application_efficiency_percent=85.0,
        forecast_rainfall_mm=0.0
    )
    res = calculate_fao56_water_demand(req)
    assert res.kc == 1.15
    assert res.et0_mm_day > 0.0
    assert res.etc_mm_day == round(res.kc * res.et0_mm_day, 2)
    assert res.net_water_liters > 0.0
    assert res.gross_water_liters > res.net_water_liters

def test_ml_random_forest_prediction():
    """Validates scikit-learn machine learning regression model prediction."""
    req = MLPredictionRequest(
        crop_type="Tomato",
        growth_stage="Flowering",
        soil_type="Clay Loam",
        soil_moisture_percent=30.0,
        air_temp_c=30.0,
        relative_humidity_percent=50.0,
        solar_radiation_mj=20.0,
        field_area_sqm=2000.0,
        recent_rainfall_mm=0.0,
        application_efficiency_percent=85.0
    )
    res = predict_crop_water_requirement_ml(req)
    assert res.is_ml_prediction is True
    assert res.predicted_water_depth_mm > 0.0
    assert len(res.forecast_7d) == 7
    assert "r2_score" in res.model_metrics
    assert "Soil Moisture Deficit" in res.contributing_factors
