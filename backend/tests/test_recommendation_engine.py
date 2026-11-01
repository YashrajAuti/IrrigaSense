from datetime import datetime, timedelta
from app.models.farm import IrrigationZone, Field
from app.models.sensor import SensorReading
from app.services.recommendation_engine import evaluate_irrigation_recommendation

def test_recommendation_deficit_triggers_irrigate_now():
    field = Field(
        id=1,
        farm_id=1,
        name="Tomato Plot",
        crop_type="Tomato",
        area_sqm=4000.0,
        lower_moisture_threshold=40.0,
        upper_moisture_threshold=65.0
    )
    zone = IrrigationZone(
        id=1,
        field_id=1,
        name="Zone 1",
        flow_rate_lpm=50.0,
        simulated_pump_state="OFF"
    )
    reading = SensorReading(
        id=1,
        device_id=1,
        zone_id=1,
        timestamp=datetime.utcnow(),
        soil_moisture_percent=32.0,  # Below lower 40.0%
        air_temperature_c=28.0,
        relative_humidity_percent=55.0,
        is_valid=True,
    )

    rec = evaluate_irrigation_recommendation(zone, field, reading, hours_since_last_irrigation=24.0)
    assert rec.recommended_action == "IRRIGATE_NOW"
    assert rec.target_depth_mm > 0.0
    assert rec.estimated_water_liters > 0.0
    assert rec.is_ml_prediction is False
    assert any("below configured minimum" in r for r in rec.reasons)

def test_recommendation_optimal_moisture():
    field = Field(
        id=1,
        farm_id=1,
        name="Tomato Plot",
        crop_type="Tomato",
        area_sqm=4000.0,
        lower_moisture_threshold=40.0,
        upper_moisture_threshold=65.0
    )
    zone = IrrigationZone(
        id=1,
        field_id=1,
        name="Zone 1",
        flow_rate_lpm=50.0,
        simulated_pump_state="OFF"
    )
    reading = SensorReading(
        id=1,
        device_id=1,
        zone_id=1,
        timestamp=datetime.utcnow(),
        soil_moisture_percent=54.0,  # Optimal (between 40 and 65)
        air_temperature_c=26.0,
        relative_humidity_percent=60.0,
        is_valid=True,
    )

    rec = evaluate_irrigation_recommendation(zone, field, reading, hours_since_last_irrigation=12.0)
    assert rec.recommended_action == "TARGET_OPTIMAL"
    assert rec.target_depth_mm == 0.0
    assert rec.estimated_water_liters == 0.0

def test_recommendation_surplus_moisture():
    field = Field(
        id=1,
        farm_id=1,
        name="Tomato Plot",
        crop_type="Tomato",
        area_sqm=4000.0,
        lower_moisture_threshold=40.0,
        upper_moisture_threshold=65.0
    )
    zone = IrrigationZone(
        id=1,
        field_id=1,
        name="Zone 1",
        flow_rate_lpm=50.0,
        simulated_pump_state="OFF"
    )
    reading = SensorReading(
        id=1,
        device_id=1,
        zone_id=1,
        timestamp=datetime.utcnow(),
        soil_moisture_percent=72.0,  # Surplus > 65.0%
        air_temperature_c=24.0,
        relative_humidity_percent=80.0,
        is_valid=True,
    )

    rec = evaluate_irrigation_recommendation(zone, field, reading, hours_since_last_irrigation=6.0)
    assert rec.recommended_action == "DELAY_OR_STOP"
    assert rec.target_depth_mm == 0.0

def test_stale_sensor_reading_blocks_automatic_irrigation():
    field = Field(
        id=1,
        farm_id=1,
        name="Tomato Plot",
        crop_type="Tomato",
        area_sqm=4000.0,
        lower_moisture_threshold=40.0,
        upper_moisture_threshold=65.0
    )
    zone = IrrigationZone(
        id=1,
        field_id=1,
        name="Zone 1",
        flow_rate_lpm=50.0,
        simulated_pump_state="OFF"
    )
    # Reading older than 24 hours
    reading = SensorReading(
        id=1,
        device_id=1,
        zone_id=1,
        timestamp=datetime.utcnow() - timedelta(hours=30),
        soil_moisture_percent=30.0,
        air_temperature_c=25.0,
        relative_humidity_percent=50.0,
        is_valid=True,
    )

    rec = evaluate_irrigation_recommendation(zone, field, reading, hours_since_last_irrigation=48.0)
    assert rec.recommended_action == "INSUFFICIENT_DATA"
    assert rec.sensor_is_stale is True
    assert rec.sensor_is_valid is False
