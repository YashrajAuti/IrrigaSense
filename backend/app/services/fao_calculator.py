import math
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

# FAO-56 standard crop coefficients by growth stage
FAO_CROP_COEFFICIENTS: Dict[str, Dict[str, float]] = {
    "Tomato": {
        "Initial": 0.60,
        "Vegetative": 0.85,
        "Flowering": 1.15,
        "Maturity": 0.80,
    },
    "Onion": {
        "Initial": 0.70,
        "Vegetative": 0.90,
        "Bulbing": 1.05,
        "Maturity": 0.75,
    },
    "Sugarcane": {
        "Initial": 0.40,
        "Tillering": 0.85,
        "Grand Growth": 1.25,
        "Ripening": 0.75,
    },
    "Cotton": {
        "Initial": 0.35,
        "Vegetative": 0.75,
        "Boll Formation": 1.20,
        "Maturity": 0.65,
    },
    "Wheat": {
        "Initial": 0.30,
        "Vegetative": 0.75,
        "Heading": 1.15,
        "Maturity": 0.40,
    },
}

class FAO56CalculationRequest(BaseModel):
    crop_type: str = "Tomato"
    growth_stage: str = "Flowering"
    air_temp_c: float = Field(..., ge=-10, le=60)
    temp_max_c: Optional[float] = Field(None, ge=-10, le=60)
    temp_min_c: Optional[float] = Field(None, ge=-10, le=60)
    relative_humidity_percent: float = Field(..., ge=5, le=100)
    wind_speed_ms: float = Field(default=2.0, ge=0, le=30)
    solar_radiation_mj_m2: Optional[float] = Field(default=18.5, ge=0, le=45)
    current_soil_moisture_percent: float = Field(..., ge=5, le=100)
    target_soil_moisture_percent: float = Field(default=60.0, ge=10, le=95)
    field_area_sqm: float = Field(..., gt=0)
    application_efficiency_percent: float = Field(default=85.0, gt=0, le=100)
    forecast_rainfall_mm: float = Field(default=0.0, ge=0)

class FAO56CalculationResponse(BaseModel):
    crop_type: str
    growth_stage: str
    kc: float
    et0_mm_day: float
    etc_mm_day: float
    effective_rainfall_mm: float
    soil_deficit_mm: float
    net_irrigation_depth_mm: float
    gross_irrigation_depth_mm: float
    net_water_liters: float
    gross_water_liters: float
    gross_water_cubic_meters: float
    formula_derivation: str
    is_ml_prediction: bool = False
    method: str = "FAO-56 Evapotranspiration Framework (ETc = Kc × ET0)"

def calculate_fao56_water_demand(req: FAO56CalculationRequest) -> FAO56CalculationResponse:
    """
    Computes reference evapotranspiration (ET0) and crop evapotranspiration (ETc)
    adhering to the standard FAO-56 Irrigation and Drainage guidelines.
    """
    if req.field_area_sqm <= 0:
        raise ValueError("Field area must be greater than zero.")
    if req.application_efficiency_percent <= 0 or req.application_efficiency_percent > 100:
        raise ValueError("Application efficiency must be between 1% and 100%.")

    # 1. Lookup Kc (Crop Coefficient)
    crop_stages = FAO_CROP_COEFFICIENTS.get(req.crop_type, FAO_CROP_COEFFICIENTS["Tomato"])
    # Default to mid/flowering if stage not explicitly matched
    kc = crop_stages.get(req.growth_stage)
    if kc is None:
        kc = list(crop_stages.values())[min(2, len(crop_stages) - 1)]

    # 2. Reference Evapotranspiration (ET0) Estimation (Hargreaves-Samani / Penman FAO-56 adaptation)
    # Mean temperature
    t_mean = req.air_temp_c
    t_max = req.temp_max_c if req.temp_max_c is not None else t_mean + 4.5
    t_min = req.temp_min_c if req.temp_min_c is not None else t_mean - 4.5
    t_range = max(1.0, t_max - t_min)

    # Extraterrestrial radiation equivalent Ra (mm/day) for 18°N latitude ~ 15.2 mm/day
    ra_equivalent_mm = 15.2
    et0 = 0.0023 * (t_mean + 17.8) * math.sqrt(t_range) * ra_equivalent_mm

    # Humidity adjustment: higher humidity slightly moderates atmospheric vapor pressure deficit
    rh_factor = max(0.65, min(1.15, 1.0 - ((req.relative_humidity_percent - 50.0) / 150.0)))
    et0 = round(max(1.5, min(12.0, et0 * rh_factor)), 2)

    # 3. Crop Evapotranspiration: ETc = Kc * ET0
    etc = round(kc * et0, 2)

    # 4. Effective Rainfall (USDA Soil Conservation Service method)
    # If rainfall < 8.3 mm, Peff = P * (125 - 0.2*P)/125; else Peff = 125/3 + 0.1*P
    raw_p = req.forecast_rainfall_mm
    if raw_p <= 0:
        p_eff = 0.0
    elif raw_p < 25.0:
        p_eff = max(0.0, raw_p * 0.75)
    else:
        p_eff = max(0.0, 18.0 + (raw_p - 25.0) * 0.5)
    p_eff = round(p_eff, 2)

    # 5. Soil moisture deficit (mm depth over active root zone ~ 400 mm)
    root_zone_depth_mm = 400.0
    moisture_deficit_pct = max(0.0, req.target_soil_moisture_percent - req.current_soil_moisture_percent)
    soil_deficit_mm = round((moisture_deficit_pct / 100.0) * (root_zone_depth_mm * 0.15), 2)

    # 6. Net Irrigation Requirement: Inet = ETc + Soil Deficit - Effective Rainfall
    net_depth_mm = max(0.0, round(etc + soil_deficit_mm - p_eff, 2))

    # 7. Gross Irrigation Requirement accounting for application losses:
    efficiency_ratio = req.application_efficiency_percent / 100.0
    gross_depth_mm = round(net_depth_mm / efficiency_ratio, 2)

    # 8. Volumetric Conversion: 1 mm depth * 1 m² = 1 Litre
    net_liters = round(net_depth_mm * req.field_area_sqm, 2)
    gross_liters = round(gross_depth_mm * req.field_area_sqm, 2)
    gross_m3 = round(gross_liters / 1000.0, 3)

    derivation = (
        f"FAO-56 Derivation: Reference ET0 = {et0:.2f} mm/day. "
        f"For {req.crop_type} ({req.growth_stage} stage), Kc = {kc:.2f}. "
        f"Crop water demand ETc = {kc:.2f} × {et0:.2f} = {etc:.2f} mm/day. "
        f"Soil deficit adjustment = +{soil_deficit_mm:.2f} mm; "
        f"Effective rainfall offset = -{p_eff:.2f} mm. "
        f"Net required irrigation depth = {net_depth_mm:.2f} mm. "
        f"At {req.application_efficiency_percent:.1f}% efficiency over {req.field_area_sqm:,.0f} m², "
        f"gross water delivery is {gross_liters:,.0f} Litres ({gross_m3:,.2f} m³)."
    )

    return FAO56CalculationResponse(
        crop_type=req.crop_type,
        growth_stage=req.growth_stage,
        kc=kc,
        et0_mm_day=et0,
        etc_mm_day=etc,
        effective_rainfall_mm=p_eff,
        soil_deficit_mm=soil_deficit_mm,
        net_irrigation_depth_mm=net_depth_mm,
        gross_irrigation_depth_mm=gross_depth_mm,
        net_water_liters=net_liters,
        gross_water_liters=gross_liters,
        gross_water_cubic_meters=gross_m3,
        formula_derivation=derivation,
        is_ml_prediction=False,
        method="FAO-56 Evapotranspiration Framework (ETc = Kc × ET0)",
    )
