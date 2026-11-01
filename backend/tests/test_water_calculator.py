import pytest
from app.services.water_calculator import calculate_water_requirement
from app.schemas.irrigation import WaterCalcRequest

def test_standard_water_volume_calculation():
    """
    Test the fundamental physical calculation:
    Water volume in litres = Irrigation depth in mm × Field area in square metres.
    1,000 m² with 5.0 mm depth requires 5,000 litres of net water.
    """
    req = WaterCalcRequest(
        irrigation_depth_mm=5.0,
        field_area_sqm=1000.0,
        efficiency_percent=100.0
    )
    res = calculate_water_requirement(req)
    assert res.net_water_liters == 5000.0
    assert res.gross_water_liters == 5000.0
    assert res.net_water_cubic_meters == 5.0
    assert res.gross_water_cubic_meters == 5.0
    assert res.is_ml_prediction is False

def test_efficiency_adjusted_gross_volume():
    """
    At 85% system efficiency, gross water volume required is:
    Net / (85 / 100) = 5,000 / 0.85 ≈ 5,882.35 litres.
    """
    req = WaterCalcRequest(
        irrigation_depth_mm=5.0,
        field_area_sqm=1000.0,
        efficiency_percent=85.0
    )
    res = calculate_water_requirement(req)
    assert res.net_water_liters == 5000.0
    assert res.gross_water_liters == 5882.35
    assert res.efficiency_percent == 85.0

def test_zero_irrigation_depth():
    """Zero depth yields zero required water."""
    req = WaterCalcRequest(
        irrigation_depth_mm=0.0,
        field_area_sqm=2500.0,
        efficiency_percent=90.0
    )
    res = calculate_water_requirement(req)
    assert res.net_water_liters == 0.0
    assert res.gross_water_liters == 0.0

def test_reject_negative_irrigation_depth():
    """Must reject negative irrigation depths."""
    with pytest.raises(Exception):
        WaterCalcRequest(
            irrigation_depth_mm=-2.5,
            field_area_sqm=1000.0
        )

def test_reject_zero_or_negative_area():
    """Must reject zero or negative field areas."""
    with pytest.raises(Exception):
        WaterCalcRequest(
            irrigation_depth_mm=5.0,
            field_area_sqm=0.0
        )
    with pytest.raises(Exception):
        WaterCalcRequest(
            irrigation_depth_mm=5.0,
            field_area_sqm=-500.0
        )

def test_reject_invalid_efficiency():
    """Must reject efficiency <= 0 or > 100%."""
    with pytest.raises(Exception):
        WaterCalcRequest(
            irrigation_depth_mm=5.0,
            field_area_sqm=1000.0,
            efficiency_percent=0.0
        )
    with pytest.raises(Exception):
        WaterCalcRequest(
            irrigation_depth_mm=5.0,
            field_area_sqm=1000.0,
            efficiency_percent=120.0
        )
