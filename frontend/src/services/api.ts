import {
  Farm,
  Field,
  IrrigationZone,
  SensorDevice,
  SensorReading,
  IrrigationEvent,
  IrrigationSchedule,
  WaterCalcRequest,
  WaterCalcResponse,
  RecommendationResponse,
  AlertEvent,
  DashboardSummary,
  MLPredictionRequest,
  MLPredictionResponse,
  FAO56Request,
  FAO56Response,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  const response = await fetch(fullUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let message = `API Request failed with status ${response.status}`;
    try {
      const parsed = JSON.parse(errorBody);
      if (parsed.detail) message = parsed.detail;
    } catch {
      if (errorBody) message = errorBody;
    }
    throw new Error(message);
  }

  return response.json();
}

export const api = {
  // Health
  checkHealth: async () => {
    return fetchJson<{ status: string; demo_mode: boolean; simulation_label: string; timestamp: string }>('/health');
  },

  // Farms
  getFarms: async (): Promise<Farm[]> => {
    return fetchJson<Farm[]>('/api/v1/farms');
  },
  getFarm: async (farmId: number): Promise<Farm> => {
    return fetchJson<Farm>(`/api/v1/farms/${farmId}`);
  },

  // Fields
  getFields: async (farmId?: number): Promise<Field[]> => {
    const query = farmId ? `?farm_id=${farmId}` : '';
    return fetchJson<Field[]>(`/api/v1/fields${query}`);
  },
  updateFieldThresholds: async (fieldId: number, lower: number, upper: number): Promise<Field> => {
    return fetchJson<Field>(`/api/v1/fields/${fieldId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        lower_moisture_threshold: lower,
        upper_moisture_threshold: upper,
      }),
    });
  },

  // Zones
  getZones: async (fieldId?: number): Promise<IrrigationZone[]> => {
    const query = fieldId ? `?field_id=${fieldId}` : '';
    return fetchJson<IrrigationZone[]>(`/api/v1/zones${query}`);
  },
  updateZone: async (zoneId: number, data: Partial<IrrigationZone>): Promise<IrrigationZone> => {
    return fetchJson<IrrigationZone>(`/api/v1/zones/${zoneId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Sensors
  getSensors: async (zoneId?: number): Promise<SensorDevice[]> => {
    const query = zoneId ? `?zone_id=${zoneId}` : '';
    return fetchJson<SensorDevice[]>(`/api/v1/sensors${query}`);
  },
  createSensor: async (data: {
    zone_id: number;
    device_serial: string;
    sensor_type: string;
    battery_level?: number;
    status?: string;
  }): Promise<SensorDevice> => {
    return fetchJson<SensorDevice>('/api/v1/sensors', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  ingestHardwareSensor: async (payload: {
    device_serial: string;
    soil_moisture_percent: number;
    air_temperature_c: number;
    relative_humidity_percent: number;
    battery_level?: number;
    signal_dbm?: number;
  }) => {
    return fetchJson<{ success: boolean; message: string; reading_id: number; is_hardware: boolean }>(
      '/api/v1/sensors/ingest-hardware',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  },

  // Sensor Readings
  getReadings: async (zoneId?: number, timeframe: '24h' | '7d' | '30d' = '24h'): Promise<SensorReading[]> => {
    const params = new URLSearchParams();
    if (zoneId) params.append('zone_id', zoneId.toString());
    params.append('timeframe', timeframe);
    return fetchJson<SensorReading[]>(`/api/v1/readings?${params.toString()}`);
  },
  recordReading: async (data: {
    device_id: number;
    zone_id: number;
    soil_moisture_percent: number;
    air_temperature_c: number;
    relative_humidity_percent: number;
  }): Promise<SensorReading> => {
    return fetchJson<SensorReading>('/api/v1/readings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Irrigation Controls & Calculations
  executeIrrigationCommand: async (params: {
    zone_id: number;
    action: 'START' | 'STOP' | 'EMERGENCY_STOP';
    mode?: 'Manual' | 'Automatic';
    runtime_minutes?: number;
    target_depth_mm?: number;
  }) => {
    return fetchJson<{
      success: boolean;
      message: string;
      zone_id: number;
      pump_state: string;
      event?: IrrigationEvent;
      simulation_warning: string;
    }>('/api/v1/irrigation/command', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  getIrrigationEvents: async (zoneId?: number, limit = 50): Promise<IrrigationEvent[]> => {
    const params = new URLSearchParams();
    if (zoneId) params.append('zone_id', zoneId.toString());
    params.append('limit', limit.toString());
    return fetchJson<IrrigationEvent[]>(`/api/v1/irrigation/events?${params.toString()}`);
  },

  getSchedules: async (zoneId?: number): Promise<IrrigationSchedule[]> => {
    const query = zoneId ? `?zone_id=${zoneId}` : '';
    return fetchJson<IrrigationSchedule[]>(`/api/v1/irrigation/schedules${query}`);
  },
  createSchedule: async (data: Omit<IrrigationSchedule, 'id' | 'created_at'>): Promise<IrrigationSchedule> => {
    return fetchJson<IrrigationSchedule>('/api/v1/irrigation/schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  toggleSchedule: async (scheduleId: number): Promise<IrrigationSchedule> => {
    return fetchJson<IrrigationSchedule>(`/api/v1/irrigation/schedules/${scheduleId}/toggle`, {
      method: 'PATCH',
    });
  },
  deleteSchedule: async (scheduleId: number): Promise<void> => {
    await fetch(`${API_BASE_URL}/api/v1/irrigation/schedules/${scheduleId}`, {
      method: 'DELETE',
    });
  },

  calculateWater: async (request: WaterCalcRequest): Promise<WaterCalcResponse> => {
    return fetchJson<WaterCalcResponse>('/api/v1/irrigation/calculate-water', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  getRecommendation: async (zoneId: number): Promise<RecommendationResponse> => {
    return fetchJson<RecommendationResponse>(`/api/v1/irrigation/recommendation/${zoneId}`);
  },

  // Machine Learning & FAO-56 Predictions
  predictML: async (request: MLPredictionRequest): Promise<MLPredictionResponse> => {
    return fetchJson<MLPredictionResponse>('/api/v1/predictions/ml', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },
  calculateFAO56: async (request: FAO56Request): Promise<FAO56Response> => {
    return fetchJson<FAO56Response>('/api/v1/predictions/fao-56', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },
  getModelMetrics: async () => {
    return fetchJson<{
      model_name: string;
      version: string;
      evaluation_metrics: { mae: number; rmse: number; r2_score: number };
      feature_importances: Record<string, number>;
      status: string;
      transparency: string;
    }>('/api/v1/predictions/metrics');
  },

  // Analytics & CSV Export
  getWaterUsageAnalytics: async (zoneId?: number, days = 30) => {
    const params = new URLSearchParams();
    if (zoneId) params.append('zone_id', zoneId.toString());
    params.append('days', days.toString());
    return fetchJson<{
      days: number;
      actual_liters: number;
      baseline_liters: number;
      water_saved_liters: number;
      savings_percentage: number;
      total_events: number;
      is_baseline_estimated: boolean;
      methodology: string;
    }>(`/api/v1/analytics/water-usage?${params.toString()}`);
  },
  getExportCSVUrl: () => `${API_BASE_URL}/api/v1/analytics/export-csv`,

  // Alerts
  getAlerts: async (unresolvedOnly = false): Promise<AlertEvent[]> => {
    return fetchJson<AlertEvent[]>(`/api/v1/alerts?unresolved_only=${unresolvedOnly}`);
  },
  acknowledgeAlert: async (alertId: number): Promise<AlertEvent> => {
    return fetchJson<AlertEvent>(`/api/v1/alerts/${alertId}/acknowledge`, {
      method: 'POST',
    });
  },

  // Dashboard
  getDashboardSummary: async (farmId?: number, fieldId?: number, zoneId?: number): Promise<DashboardSummary> => {
    const params = new URLSearchParams();
    if (farmId) params.append('farm_id', farmId.toString());
    if (fieldId) params.append('field_id', fieldId.toString());
    if (zoneId) params.append('zone_id', zoneId.toString());
    return fetchJson<DashboardSummary>(`/api/v1/dashboard/summary?${params.toString()}`);
  },

  // Settings & Reset
  getSettings: async () => {
    return fetchJson<Array<{ key: string; value: string; description: string }>>('/api/v1/settings');
  },
  resetDemoData: async (confirmReset: boolean) => {
    return fetchJson<{ success: boolean; message: string; simulated: boolean }>('/api/v1/settings/reset-demo-data', {
      method: 'POST',
      body: JSON.stringify({ confirm_reset: confirmReset }),
    });
  },
};
