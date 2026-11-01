import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["demo_mode"] is True
    assert "DEMO MODE — SIMULATED DATA" in data["simulation_label"]
    assert data["hardware_connected"] is False

def test_farms_endpoint():
    response = client.get("/api/v1/farms")
    assert response.status_code == 200
    farms = response.json()
    assert len(farms) >= 1
    assert "Sahyadri" in farms[0]["name"]

def test_fields_endpoint():
    response = client.get("/api/v1/fields")
    assert response.status_code == 200
    fields = response.json()
    assert len(fields) >= 3
    crop_names = [f["crop_type"] for f in fields]
    assert "Tomato" in crop_names

def test_zones_endpoint():
    response = client.get("/api/v1/zones")
    assert response.status_code == 200
    zones = response.json()
    assert len(zones) >= 3

def test_dashboard_summary_endpoint():
    response = client.get("/api/v1/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert "metrics" in data
    assert "soil_moisture" in data["metrics"]
    assert "air_temperature" in data["metrics"]
    assert "relative_humidity" in data["metrics"]
    assert "water_requirement" in data["metrics"]
    assert "recommendation" in data
    assert "zones_overview" in data
    assert data["demo_mode"] is True

def test_water_calculator_api():
    payload = {
        "irrigation_depth_mm": 5.0,
        "field_area_sqm": 1000.0,
        "efficiency_percent": 85.0
    }
    response = client.post("/api/v1/irrigation/calculate-water", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["net_water_liters"] == 5000.0
    assert data["gross_water_liters"] == 5882.35
    assert data["is_ml_prediction"] is False

def test_irrigation_command_manual_start_stop_emergency():
    # 1. Start irrigation on Zone 1
    start_payload = {
        "zone_id": 1,
        "action": "START",
        "mode": "Manual",
        "runtime_minutes": 25,
        "target_depth_mm": 4.0
    }
    res_start = client.post("/api/v1/irrigation/command", json=start_payload)
    assert res_start.status_code == 200
    start_data = res_start.json()
    assert start_data["success"] is True
    assert start_data["pump_state"] == "ON"
    assert "SIMULATED PUMP ONLY" in start_data["simulation_warning"]

    # 2. Emergency Stop overrides immediately
    stop_payload = {
        "zone_id": 1,
        "action": "EMERGENCY_STOP",
        "mode": "Manual"
    }
    res_stop = client.post("/api/v1/irrigation/command", json=stop_payload)
    assert res_stop.status_code == 200
    stop_data = res_stop.json()
    assert stop_data["success"] is True
    assert stop_data["pump_state"] == "EMERGENCY_STOPPED"
