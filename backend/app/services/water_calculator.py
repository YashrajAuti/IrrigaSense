from app.schemas.irrigation import WaterCalcRequest, WaterCalcResponse

def calculate_water_requirement(request: WaterCalcRequest) -> WaterCalcResponse:
    """
    Transparent water volume calculation service.
    
    Physics Formula:
    Water volume in litres = Irrigation depth in mm × Field area in square metres
    
    1 mm of water depth over 1 m² corresponds to:
    0.001 m × 1 m² = 0.001 m³ = 1 Litre.
    
    Gross water volume accounts for application efficiency:
    Gross Litres = Net Litres / (Efficiency % / 100)
    """
    if request.irrigation_depth_mm < 0:
        raise ValueError("Irrigation depth cannot be negative.")
    if request.field_area_sqm <= 0:
        raise ValueError("Field area must be greater than zero.")
    if request.efficiency_percent is not None:
        if request.efficiency_percent <= 0 or request.efficiency_percent > 100:
            raise ValueError("Application efficiency must be between 1% and 100%.")

    efficiency = request.efficiency_percent or 85.0
    
    # Net water calculation: 1 mm depth * 1 m² = 1 Litre
    net_liters = round(request.irrigation_depth_mm * request.field_area_sqm, 2)
    net_m3 = round(net_liters / 1000.0, 3)

    # Gross water accounting for distribution & application efficiency (drip/sprinkler losses)
    gross_liters = round(net_liters / (efficiency / 100.0), 2)
    gross_m3 = round(gross_liters / 1000.0, 3)

    explanation = (
        f"Calculated for {request.field_area_sqm:,.0f} m² field with target depth {request.irrigation_depth_mm:.1f} mm. "
        f"1 mm over 1 m² equals 1.0 Litre. Net required volume is {net_liters:,.0f} Litres ({net_m3:,.2f} m³). "
        f"At {efficiency:.1f}% system efficiency, gross water volume required is {gross_liters:,.0f} Litres ({gross_m3:,.2f} m³)."
    )

    return WaterCalcResponse(
        irrigation_depth_mm=request.irrigation_depth_mm,
        field_area_sqm=request.field_area_sqm,
        efficiency_percent=efficiency,
        net_water_liters=net_liters,
        gross_water_liters=gross_liters,
        net_water_cubic_meters=net_m3,
        gross_water_cubic_meters=gross_m3,
        formula_explanation=explanation,
        is_ml_prediction=False,
    )
