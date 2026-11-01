import math
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.farm import Farm, Field, IrrigationZone
from app.models.sensor import SensorDevice, SensorReading
from app.models.irrigation import IrrigationEvent, IrrigationSchedule
from app.models.alert import AlertEvent
from app.models.settings import SystemSetting

def seed_demonstration_dataset(db: Session, force_reset: bool = False):
    """
    Seeds a realistic, reproducible demonstration dataset tailored to Indian agriculture.
    Data is persisted in SQLite and evolves sensibly over time without erratic random jitter.
    """
    existing_farm = db.query(Farm).first()
    if existing_farm and not force_reset:
        return

    if force_reset:
        db.query(AlertEvent).delete()
        db.query(IrrigationSchedule).delete()
        db.query(IrrigationEvent).delete()
        db.query(SensorReading).delete()
        db.query(SensorDevice).delete()
        db.query(IrrigationZone).delete()
        db.query(Field).delete()
        db.query(Farm).delete()
        db.query(SystemSetting).delete()
        db.commit()

    # 1. Example Farm
    farm = Farm(
        name="Sahyadri Agro Estate",
        location="Baramati, Pune District, Maharashtra, India",
        total_area_sqm=15000.0,
        created_at=datetime.utcnow() - timedelta(days=90),
    )
    db.add(farm)
    db.flush()

    # 2. Fields with Indian crops and distinct soil/crop thresholds
    field_tomato = Field(
        farm_id=farm.id,
        name="Krishna Valley Plot A",
        crop_type="Tomato",
        area_sqm=4000.0,
        soil_type="Clay Loam",
        lower_moisture_threshold=40.0,
        upper_moisture_threshold=65.0,
        created_at=datetime.utcnow() - timedelta(days=60),
    )
    field_onion = Field(
        farm_id=farm.id,
        name="Deccan Basin Plot B",
        crop_type="Onion",
        area_sqm=3500.0,
        soil_type="Sandy Loam",
        lower_moisture_threshold=35.0,
        upper_moisture_threshold=60.0,
        created_at=datetime.utcnow() - timedelta(days=60),
    )
    field_sugarcane = Field(
        farm_id=farm.id,
        name="Godavari Canal Plot C",
        crop_type="Sugarcane",
        area_sqm=5000.0,
        soil_type="Black Cotton Soil (Vertisol)",
        lower_moisture_threshold=50.0,
        upper_moisture_threshold=75.0,
        created_at=datetime.utcnow() - timedelta(days=60),
    )
    field_cotton = Field(
        farm_id=farm.id,
        name="Malwa Plateau Plot D",
        crop_type="Cotton",
        area_sqm=2500.0,
        soil_type="Red Sandy Loam",
        lower_moisture_threshold=30.0,
        upper_moisture_threshold=55.0,
        created_at=datetime.utcnow() - timedelta(days=60),
    )
    db.add_all([field_tomato, field_onion, field_sugarcane, field_cotton])
    db.flush()

    # 3. Irrigation Zones
    zone_1 = IrrigationZone(
        field_id=field_tomato.id,
        name="Zone 1 - Main Drip Lateral",
        status="Idle",
        operating_mode="Manual",
        flow_rate_lpm=50.0,
        simulated_pump_state="OFF",
        last_irrigation_at=datetime.utcnow() - timedelta(hours=14),
        max_runtime_minutes=120,
    )
    zone_2 = IrrigationZone(
        field_id=field_onion.id,
        name="Zone 2 - Micro-Sprinkler Bed",
        status="Idle",
        operating_mode="Automatic",
        flow_rate_lpm=35.0,
        simulated_pump_state="OFF",
        last_irrigation_at=datetime.utcnow() - timedelta(hours=36),
        max_runtime_minutes=90,
    )
    zone_3 = IrrigationZone(
        field_id=field_sugarcane.id,
        name="Zone 3 - Deep Furrow Drip",
        status="Idle",
        operating_mode="Automatic",
        flow_rate_lpm=65.0,
        simulated_pump_state="OFF",
        last_irrigation_at=datetime.utcnow() - timedelta(hours=8),
        max_runtime_minutes=120,
    )
    db.add_all([zone_1, zone_2, zone_3])
    db.flush()

    # 4. Sensor Devices
    sensor_1 = SensorDevice(
        zone_id=zone_1.id,
        device_serial="SN-IS-PUNE-101",
        sensor_type="Soil Moisture & Atmospheric Duo",
        status="Online",
        battery_level=94.5,
        signal_dbm=-64,
        firmware_version="v2.1.0",
        is_simulated=True,
        last_heartbeat=datetime.utcnow(),
    )
    sensor_2 = SensorDevice(
        zone_id=zone_2.id,
        device_serial="SN-IS-PUNE-102",
        sensor_type="Atmospheric Trio & Matric Potential",
        status="Online",
        battery_level=88.0,
        signal_dbm=-71,
        firmware_version="v2.1.0",
        is_simulated=True,
        last_heartbeat=datetime.utcnow(),
    )
    sensor_3 = SensorDevice(
        zone_id=zone_3.id,
        device_serial="SN-IS-PUNE-103",
        sensor_type="Multi-Depth Capacitive Array",
        status="Online",
        battery_level=97.2,
        signal_dbm=-59,
        firmware_version="v2.1.0",
        is_simulated=True,
        last_heartbeat=datetime.utcnow(),
    )
    db.add_all([sensor_1, sensor_2, sensor_3])
    db.flush()

    # 5. Realistic Historical Sensor Readings (Past 30 days, sampled every 2 hours)
    now = datetime.utcnow()
    total_hours = 30 * 24
    step_hours = 2

    # Initial moisture baselines for the 3 zones
    current_moistures = [58.0, 52.0, 68.0]
    devices = [sensor_1, sensor_2, sensor_3]
    zones = [zone_1, zone_2, zone_3]

    readings_to_add = []

    for h in range(total_hours, -1, -step_hours):
        t = now - timedelta(hours=h)
        hour_of_day = t.hour

        # Diurnal solar temperature curve (cool at 05:00 ~21°C, warm at 14:00 ~34°C)
        temp_cycle = math.sin((hour_of_day - 8) * math.pi / 12)
        base_temp = 27.5 + temp_cycle * 6.5
        # Diurnal humidity is inversely related to temperature (higher at dawn ~82%, lower afternoon ~42%)
        base_humidity = 62.0 - temp_cycle * 20.0

        for idx in range(3):
            # Soil moisture depletes slowly due to evapotranspiration (faster during hot day)
            evap_rate = 0.22 if 10 <= hour_of_day <= 18 else 0.08
            current_moistures[idx] -= (evap_rate * step_hours)

            # Simulated irrigation recharge events at specific points in history
            # e.g., recharge when moisture drops below threshold or at known timestamps
            min_thresh = [40.0, 35.0, 50.0][idx]
            if current_moistures[idx] < min_thresh:
                # Irrigation occurs! Recharge by +22% to reach field capacity
                current_moistures[idx] = min([65.0, 60.0, 75.0][idx], current_moistures[idx] + 20.0)

            reading = SensorReading(
                device_id=devices[idx].id,
                zone_id=zones[idx].id,
                timestamp=t,
                soil_moisture_percent=round(current_moistures[idx], 1),
                air_temperature_c=round(base_temp + (idx * 0.4), 1),
                relative_humidity_percent=round(max(20.0, min(95.0, base_humidity - (idx * 1.5))), 1),
                is_simulated=True,
                is_valid=True,
            )
            readings_to_add.append(reading)

    db.bulk_save_objects(readings_to_add)
    db.flush()

    # 6. Simulated Irrigation Events
    events = [
        IrrigationEvent(
            zone_id=zone_1.id,
            trigger_type="MANUAL",
            action="STOP",
            runtime_minutes=45,
            target_depth_mm=4.5,
            estimated_water_liters=18000.0,
            status="COMPLETED",
            notes="Scheduled supplemental drip irrigation for flowering tomato crop.",
            is_simulated=True,
            started_at=now - timedelta(hours=14, minutes=45),
            stopped_at=now - timedelta(hours=14),
        ),
        IrrigationEvent(
            zone_id=zone_2.id,
            trigger_type="AUTOMATIC",
            action="STOP",
            runtime_minutes=35,
            target_depth_mm=3.5,
            estimated_water_liters=12250.0,
            status="COMPLETED",
            notes="Automatic threshold trigger reached (34.2% moisture). Restored to 56%.",
            is_simulated=True,
            started_at=now - timedelta(hours=36, minutes=35),
            stopped_at=now - timedelta(hours=36),
        ),
        IrrigationEvent(
            zone_id=zone_3.id,
            trigger_type="AUTOMATIC",
            action="STOP",
            runtime_minutes=60,
            target_depth_mm=5.0,
            estimated_water_liters=25000.0,
            status="COMPLETED",
            notes="Sugarcane canopy irrigation cycle completed.",
            is_simulated=True,
            started_at=now - timedelta(hours=8, minutes=60),
            stopped_at=now - timedelta(hours=8),
        ),
        IrrigationEvent(
            zone_id=zone_1.id,
            trigger_type="SCHEDULED",
            action="STOP",
            runtime_minutes=40,
            target_depth_mm=4.0,
            estimated_water_liters=16000.0,
            status="COMPLETED",
            notes="Morning baseline cycle.",
            is_simulated=True,
            started_at=now - timedelta(days=3, hours=5),
            stopped_at=now - timedelta(days=3, hours=4, minutes=20),
        ),
    ]
    db.add_all(events)

    # 7. Scheduled irrigation slots
    schedules = [
        IrrigationSchedule(
            zone_id=zone_1.id,
            name="Tomato Morning Drip",
            scheduled_time="06:30",
            duration_minutes=45,
            target_depth_mm=4.5,
            days_of_week="Mon,Wed,Fri",
            is_active=True,
        ),
        IrrigationSchedule(
            zone_id=zone_2.id,
            name="Onion Dawn Mist",
            scheduled_time="05:45",
            duration_minutes=30,
            target_depth_mm=3.0,
            days_of_week="Tue,Thu,Sat",
            is_active=True,
        ),
        IrrigationSchedule(
            zone_id=zone_3.id,
            name="Sugarcane Deep Soak",
            scheduled_time="19:00",
            duration_minutes=60,
            target_depth_mm=6.0,
            days_of_week="Mon,Thu",
            is_active=False,
        ),
    ]
    db.add_all(schedules)

    # 8. Realistic Alerts
    alerts = [
        AlertEvent(
            zone_id=zone_1.id,
            severity="WARNING",
            title="Moisture Depletion Alert",
            message="Zone 1 (Tomato) soil moisture (38.4%) has dipped below the 40.0% lower threshold.",
            is_acknowledged=False,
            is_resolved=False,
            created_at=now - timedelta(hours=2, minutes=15),
        ),
        AlertEvent(
            zone_id=zone_2.id,
            severity="INFO",
            title="Scheduled Cycle Success",
            message="Zone 2 micro-sprinklers completed simulated 35-minute run successfully.",
            is_acknowledged=True,
            is_resolved=True,
            created_at=now - timedelta(hours=36),
        ),
        AlertEvent(
            zone_id=None,
            severity="CRITICAL",
            title="Atmospheric Heat Advisory",
            message="Peak canopy temperature exceeded 36.5°C during afternoon solar window. Evapotranspiration accelerated.",
            is_acknowledged=False,
            is_resolved=False,
            created_at=now - timedelta(hours=7, minutes=40),
        ),
    ]
    db.add_all(alerts)

    # 9. System settings
    settings_records = [
        SystemSetting(key="DEMO_MODE", value="true", description="Operating in simulated hardware demo mode"),
        SystemSetting(key="SIMULATION_LABEL", value="DEMO MODE — SIMULATED DATA", description="Persistent UI banner text"),
        SystemSetting(key="MAX_RUNTIME_LIMIT_MIN", value="120", description="Max pump runtime safety cutoff"),
        SystemSetting(key="DEFAULT_EFFICIENCY", value="85.0", description="Drip irrigation application efficiency (%)"),
        SystemSetting(key="FARM_NAME", value="Sahyadri Agro Estate", description="Primary demonstration farm"),
    ]
    db.add_all(settings_records)

    db.commit()
