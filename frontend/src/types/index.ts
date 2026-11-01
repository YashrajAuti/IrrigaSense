export interface Farm {
  id: number;
  name: string;
  location: string;
  total_area_sqm: number;
  created_at: string;
  fields?: Field[];
}

export interface Field {
  id: number;
  farm_id: number;
  name: string;
  crop_type: string;
  area_sqm: number;
  soil_type: string;
  lower_moisture_threshold: number;
  upper_moisture_threshold: number;
  created_at: string;
  zones?: IrrigationZone[];
}

export interface IrrigationZone {
  id: number;
  field_id: number;
  name: string;
  status: string; // Idle, Active, Paused, Offline
  operating_mode: string; // Manual, Automatic
  flow_rate_lpm: number;
  last_irrigation_at: string | null;
  simulated_pump_state: string; // OFF, ON, EMERGENCY_STOPPED
  current_runtime_minutes: number;
  max_runtime_minutes: number;
}

export interface SensorDevice {
  id: number;
  zone_id: number;
  device_serial: string;
  sensor_type: string;
  status: string; // Online, Offline, Degraded
  battery_level: number;
  signal_dbm: number;
  firmware_version: string;
  is_simulated: boolean;
  last_heartbeat: string;
}

export interface SensorReading {
  id: number;
  device_id: number;
  zone_id: number;
  timestamp: string;
  soil_moisture_percent: number;
  air_temperature_c: number;
  relative_humidity_percent: number;
  is_simulated: boolean;
  is_valid: boolean;
}

export interface IrrigationEvent {
  id: number;
  zone_id: number;
  trigger_type: string; // MANUAL, AUTOMATIC, SCHEDULED
  action: string; // START, STOP, EMERGENCY_STOP
  runtime_minutes: number;
  target_depth_mm: number;
  estimated_water_liters: number;
  status: string; // COMPLETED, ACTIVE, EMERGENCY_STOPPED
  notes?: string;
  is_simulated: boolean;
  started_at: string;
  stopped_at?: string | null;
}

export interface IrrigationSchedule {
  id: number;
  zone_id: number;
  name: string;
  scheduled_time: string;
  duration_minutes: number;
  target_depth_mm: number;
  days_of_week: string;
  is_active: boolean;
  created_at: string;
}

export interface WaterCalcRequest {
  irrigation_depth_mm: number;
  field_area_sqm: number;
  efficiency_percent?: number;
}

export interface WaterCalcResponse {
  irrigation_depth_mm: number;
  field_area_sqm: number;
  efficiency_percent: number;
  net_water_liters: number;
  gross_water_liters: number;
  net_water_cubic_meters: number;
  gross_water_cubic_meters: number;
  formula_explanation: string;
  is_ml_prediction: boolean;
}

export interface RecommendationResponse {
  zone_id: number;
  zone_name: string;
  crop_type: string;
  current_soil_moisture: number | null;
  lower_threshold: number;
  upper_threshold: number;
  recommended_action: 'IRRIGATE_NOW' | 'TARGET_OPTIMAL' | 'DELAY_OR_STOP' | 'INSUFFICIENT_DATA';
  urgency: 'HIGH' | 'NORMAL' | 'LOW' | 'WARNING';
  target_depth_mm: number;
  estimated_water_liters: number;
  reasons: string[];
  sensor_is_valid: boolean;
  sensor_is_stale: boolean;
  last_irrigation_hours_ago?: number | null;
  is_ml_prediction: boolean;
  disclaimer: string;
}

export interface AlertEvent {
  id: number;
  zone_id?: number | null;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  message: string;
  is_acknowledged: boolean;
  is_resolved: boolean;
  created_at: string;
}

export interface MetricCardItem {
  title: string;
  value: number;
  unit: string;
  status_label: string;
  status_color: 'green' | 'amber' | 'rose' | 'blue';
  is_simulated: boolean;
  trend_description?: string;
}

export interface ZoneOverviewItem {
  zone_id: number;
  zone_name: string;
  field_name: string;
  crop: string;
  soil_moisture: number;
  lower_threshold: number;
  upper_threshold: number;
  status: string;
  operating_mode: string;
  simulated_pump_state: string;
  last_irrigation: string;
  flow_rate_lpm: number;
}

export interface DashboardSummary {
  farm: Farm | null;
  field: Field | null;
  zone: IrrigationZone | null;
  metrics: Record<string, MetricCardItem>;
  recommendation: RecommendationResponse;
  zones_overview: ZoneOverviewItem[];
  recent_readings_24h: SensorReading[];
  recent_events: IrrigationEvent[];
  active_alerts: AlertEvent[];
  demo_mode: boolean;
  demo_badge_label: string;
  server_time: string;
}

export interface ForecastDay {
  day: string;
  predicted_depth_mm: number;
  estimated_volume_liters: number;
  condition: string;
}

export interface MLPredictionRequest {
  crop_type: string;
  growth_stage: string;
  soil_type: string;
  soil_moisture_percent: number;
  air_temp_c: number;
  relative_humidity_percent: number;
  solar_radiation_mj?: number;
  field_area_sqm: number;
  recent_rainfall_mm?: number;
  application_efficiency_percent?: number;
}

export interface MLPredictionResponse {
  crop_type: string;
  growth_stage: string;
  predicted_water_depth_mm: number;
  net_water_liters: number;
  gross_water_liters: number;
  gross_water_cubic_meters: number;
  forecast_horizon_hours: number;
  forecast_7d: Array<{
    day: string;
    predicted_depth_mm: number;
    estimated_volume_liters: number;
    condition: string;
  }>;
  contributing_factors: Record<string, number>;
  model_metrics: {
    mae: number;
    rmse: number;
    r2_score: number;
  };
  model_version: string;
  is_ml_prediction: boolean;
  transparency_note: string;
}

export interface FAO56Request {
  crop_type: string;
  growth_stage: string;
  air_temp_c: number;
  temp_max_c?: number;
  temp_min_c?: number;
  relative_humidity_percent: number;
  wind_speed_ms?: number;
  solar_radiation_mj_m2?: number;
  current_soil_moisture_percent: number;
  target_soil_moisture_percent?: number;
  field_area_sqm: number;
  application_efficiency_percent?: number;
  forecast_rainfall_mm?: number;
}

export interface FAO56Response {
  crop_type: string;
  growth_stage: string;
  kc: number;
  et0_mm_day: number;
  etc_mm_day: number;
  effective_rainfall_mm: number;
  soil_deficit_mm: number;
  net_irrigation_depth_mm: number;
  gross_irrigation_depth_mm: number;
  net_water_liters: number;
  gross_water_liters: number;
  gross_water_cubic_meters: number;
  formula_derivation: string;
  is_ml_prediction: boolean;
  method: string;
}
