from fastapi import APIRouter, HTTPException, status
from app.services.ml_prediction_service import (
    MLPredictionRequest,
    MLPredictionResponse,
    predict_crop_water_requirement_ml,
    get_or_load_model
)
from app.services.fao_calculator import (
    FAO56CalculationRequest,
    FAO56CalculationResponse,
    calculate_fao56_water_demand
)

router = APIRouter(prefix="/predictions", tags=["Predictions & Agronomic Modeling"])

@router.post("/ml", response_model=MLPredictionResponse)
def predict_water_demand_ml(request: MLPredictionRequest):
    """
    Supervised Machine Learning prediction using trained RandomForestRegressor.
    Features: Crop Type, Growth Stage, Soil Type, Soil Moisture, Temp, Humidity, Solar Radiation, Rainfall.
    """
    try:
        return predict_crop_water_requirement_ml(request)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/fao-56", response_model=FAO56CalculationResponse)
def calculate_fao56_evapotranspiration(request: FAO56CalculationRequest):
    """
    Scientific FAO-56 framework calculation: ETc = Kc * ET0.
    Incorporate crop growth stage coefficients, USDA effective rainfall, and soil moisture deficit.
    """
    try:
        return calculate_fao56_water_demand(request)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))

@router.get("/metrics")
def get_ml_model_metadata():
    """
    Returns verified evaluation metrics (MAE, RMSE, R² on held-out test split)
    and feature importance weights of the active Random Forest regression model.
    """
    bundle = get_or_load_model()
    return {
        "model_name": "RandomForestRegressor",
        "version": bundle.get("version", "1.0.0"),
        "evaluation_metrics": bundle.get("metrics", {}),
        "feature_importances": bundle.get("feature_importances", {}),
        "status": "LOADED",
        "transparency": "Trained on reproducible agronomic simulation dataset."
    }
