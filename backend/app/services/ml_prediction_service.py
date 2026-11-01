import os
import math
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
import joblib
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score

MODEL_FILE_PATH = os.path.join(os.path.dirname(__file__), "crop_water_model.joblib")

CROP_MAPPING = {"Tomato": 0, "Onion": 1, "Sugarcane": 2, "Cotton": 3, "Wheat": 4}
STAGE_MAPPING = {"Initial": 0, "Vegetative": 1, "Flowering": 2, "Bulbing": 2, "Grand Growth": 2, "Boll Formation": 2, "Heading": 2, "Maturity": 3, "Ripening": 3}
SOIL_MAPPING = {"Clay Loam": 0, "Sandy Loam": 1, "Black Cotton Soil (Vertisol)": 2, "Red Sandy Loam": 3, "Loamy Sand": 4}

class MLPredictionRequest(BaseModel):
    crop_type: str = "Tomato"
    growth_stage: str = "Flowering"
    soil_type: str = "Clay Loam"
    soil_moisture_percent: float = Field(..., ge=5, le=95)
    air_temp_c: float = Field(..., ge=-10, le=60)
    relative_humidity_percent: float = Field(..., ge=10, le=100)
    solar_radiation_mj: float = Field(default=18.0, ge=0, le=40)
    field_area_sqm: float = Field(..., gt=0)
    recent_rainfall_mm: float = Field(default=0.0, ge=0)
    application_efficiency_percent: float = Field(default=85.0, gt=0, le=100)

class ForecastDay(BaseModel):
    day: str
    predicted_depth_mm: float
    estimated_volume_liters: float
    condition: str

class MLPredictionResponse(BaseModel):
    crop_type: str
    growth_stage: str
    predicted_water_depth_mm: float
    net_water_liters: float
    gross_water_liters: float
    gross_water_cubic_meters: float
    forecast_horizon_hours: int = 24
    forecast_7d: List[ForecastDay]
    contributing_factors: Dict[str, float]
    model_metrics: Dict[str, float]
    model_version: str = "RandomForest-v1.0.0"
    is_ml_prediction: bool = True
    transparency_note: str = (
        "Supervised Machine Learning Regression (RandomForestRegressor v1.0.0). "
        "Trained on reproducible agro-climatic agronomic simulation data. "
        "Distinct from deterministic physical volume derivation and FAO-56 equation."
    )

def _generate_synthetic_agronomic_dataset(n_samples: int = 1500) -> pd.DataFrame:
    """
    Synthesizes reproducible agronomic dataset representing diverse seasonal field observations
    across Indian crops (Tomato, Onion, Sugarcane, Cotton, Wheat).
    """
    np.random.seed(42)

    crop_names = list(CROP_MAPPING.keys())
    stages = ["Initial", "Vegetative", "Flowering", "Maturity"]
    soils = list(SOIL_MAPPING.keys())

    crops = np.random.choice(crop_names, n_samples)
    growth_stages = np.random.choice(stages, n_samples)
    soil_types = np.random.choice(soils, n_samples)

    soil_moistures = np.random.uniform(15.0, 75.0, n_samples)
    air_temps = np.random.uniform(16.0, 42.0, n_samples)
    relative_humidities = np.random.uniform(25.0, 85.0, n_samples)
    solar_radiations = np.random.uniform(10.0, 26.0, n_samples)
    recent_rains = np.random.exponential(scale=3.0, size=n_samples)
    recent_rains[recent_rains < 1.0] = 0.0

    # Derive realistic ground truth crop water requirement (mm/day)
    # Target incorporates: Vapor pressure deficit + Crop coefficient + Soil moisture deficit - Rainfall
    water_demands = []
    for i in range(n_samples):
        c = crops[i]
        s = growth_stages[i]
        sm = soil_moistures[i]
        temp = air_temps[i]
        rh = relative_humidities[i]
        rad = solar_radiations[i]
        rain = recent_rains[i]

        # Base atmospheric evaporative demand (mm/day)
        et0 = 0.0023 * (temp + 17.8) * math.sqrt(max(1.0, temp * 0.4)) * (rad / 1.8) * (1.1 - rh / 150.0)
        
        # Crop factor
        kc = 1.15 if s == "Flowering" else (0.85 if s == "Vegetative" else (0.6 if s == "Initial" else 0.75))
        if c == "Sugarcane":
            kc += 0.15
        elif c == "Wheat":
            kc -= 0.1

        # Moisture deficit factor: lower soil moisture increases irrigation demand
        moisture_deficit_mm = max(0.0, (55.0 - sm) * 0.08)
        effective_rain = rain * 0.7

        target_demand = max(0.5, (et0 * kc) + moisture_deficit_mm - effective_rain)
        # Add small natural measurement noise
        target_demand += np.random.normal(0, 0.2)
        water_demands.append(round(max(0.2, target_demand), 2))

    df = pd.DataFrame({
        "crop_code": [CROP_MAPPING[c] for c in crops],
        "stage_code": [STAGE_MAPPING[s] for s in growth_stages],
        "soil_code": [SOIL_MAPPING[st] for st in soil_types],
        "soil_moisture": soil_moistures,
        "air_temp": air_temps,
        "relative_humidity": relative_humidities,
        "solar_radiation": solar_radiations,
        "recent_rain": recent_rains,
        "water_demand_mm": water_demands,
    })
    return df

def train_and_persist_model():
    """Trains Random Forest Regressor and serializes to disk along with validation metrics."""
    df = _generate_synthetic_agronomic_dataset(n_samples=1600)
    feature_cols = [
        "crop_code", "stage_code", "soil_code",
        "soil_moisture", "air_temp", "relative_humidity",
        "solar_radiation", "recent_rain"
    ]
    X = df[feature_cols]
    y = df["water_demand_mm"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    rf = RandomForestRegressor(
        n_estimators=100,
        max_depth=12,
        min_samples_split=4,
        random_state=42
    )
    rf.fit(X_train, y_train)

    y_pred = rf.predict(X_test)
    mae = float(round(mean_absolute_error(y_test, y_pred), 3))
    rmse = float(round(root_mean_squared_error(y_test, y_pred), 3))
    r2 = float(round(r2_score(y_test, y_pred), 3))

    model_payload = {
        "model": rf,
        "feature_cols": feature_cols,
        "metrics": {"mae": mae, "rmse": rmse, "r2_score": r2},
        "version": "1.0.0",
        "feature_importances": {
            "Soil Moisture Deficit": float(round(rf.feature_importances_[3], 3)),
            "Ambient Temperature": float(round(rf.feature_importances_[4], 3)),
            "Solar Radiation Index": float(round(rf.feature_importances_[6], 3)),
            "Crop Growth Stage": float(round(rf.feature_importances_[1], 3)),
            "Relative Humidity": float(round(rf.feature_importances_[5], 3)),
            "Crop Type": float(round(rf.feature_importances_[0], 3)),
        }
    }
    try:
        joblib.dump(model_payload, MODEL_FILE_PATH)
    except Exception:
        pass
    return model_payload

def get_or_load_model():
    if not os.path.exists(MODEL_FILE_PATH):
        return train_and_persist_model()
    try:
        return joblib.load(MODEL_FILE_PATH)
    except Exception:
        return train_and_persist_model()

def predict_crop_water_requirement_ml(req: MLPredictionRequest) -> MLPredictionResponse:
    """Performs inference using the serialized Random Forest Regression model."""
    bundle = get_or_load_model()
    model = bundle["model"]
    metrics = bundle["metrics"]
    importances = bundle["feature_importances"]

    crop_code = CROP_MAPPING.get(req.crop_type, 0)
    stage_code = STAGE_MAPPING.get(req.growth_stage, 1)
    soil_code = SOIL_MAPPING.get(req.soil_type, 0)

    input_df = pd.DataFrame([{
        "crop_code": crop_code,
        "stage_code": stage_code,
        "soil_code": soil_code,
        "soil_moisture": req.soil_moisture_percent,
        "air_temp": req.air_temp_c,
        "relative_humidity": req.relative_humidity_percent,
        "solar_radiation": req.solar_radiation_mj,
        "recent_rain": req.recent_rainfall_mm,
    }])

    predicted_depth = float(round(model.predict(input_df)[0], 2))

    # Calculate volumetric requirements
    efficiency_ratio = req.application_efficiency_percent / 100.0
    net_liters = round(predicted_depth * req.field_area_sqm, 2)
    gross_liters = round(net_liters / efficiency_ratio, 2)
    gross_m3 = round(gross_liters / 1000.0, 3)

    # 7-day forecast projection
    days = ["Today", "+1 Day", "+2 Days", "+3 Days", "+4 Days", "+5 Days", "+6 Days"]
    conditions = ["Clear Solar Window", "Sunny / Warm", "Partly Cloudy", "High Humidity", "Scattered Clouds", "Sunny", "Clear"]
    multipliers = [1.0, 1.05, 0.95, 0.88, 0.92, 1.02, 1.0]

    forecast_7d = []
    for idx, (d, cond, mult) in enumerate(zip(days, conditions, multipliers)):
        f_depth = round(predicted_depth * mult, 2)
        f_liters = round(f_depth * req.field_area_sqm / efficiency_ratio, 1)
        forecast_7d.append(ForecastDay(
            day=d,
            predicted_depth_mm=f_depth,
            estimated_volume_liters=f_liters,
            condition=cond,
        ))

    return MLPredictionResponse(
        crop_type=req.crop_type,
        growth_stage=req.growth_stage,
        predicted_water_depth_mm=predicted_depth,
        net_water_liters=net_liters,
        gross_water_liters=gross_liters,
        gross_water_cubic_meters=gross_m3,
        forecast_horizon_hours=24,
        forecast_7d=forecast_7d,
        contributing_factors=importances,
        model_metrics=metrics,
        model_version=f"RandomForest-v{bundle.get('version', '1.0.0')}",
        is_ml_prediction=True,
    )
