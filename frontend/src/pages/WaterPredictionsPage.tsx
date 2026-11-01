import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { MLPredictionResponse, FAO56Response, WaterCalcResponse } from '../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import {
  BrainCircuit,
  Calculator,
  Leaf,
  Info,
  CheckCircle2,
  TrendingUp,
  Cpu,
  Layers,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export const WaterPredictionsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ml' | 'fao' | 'volume'>('ml');

  // Common Input Parameters
  const [cropType, setCropType] = useState('Tomato');
  const [growthStage, setGrowthStage] = useState('Flowering');
  const [soilType, setSoilType] = useState('Clay Loam');
  const [soilMoisture, setSoilMoisture] = useState<number>(32.0);
  const [airTemp, setAirTemp] = useState<number>(30.5);
  const [humidity, setHumidity] = useState<number>(54.0);
  const [solarRadiation, setSolarRadiation] = useState<number>(19.5);
  const [fieldArea, setFieldArea] = useState<number>(4000.0);
  const [forecastRain, setForecastRain] = useState<number>(0.0);
  const [efficiency, setEfficiency] = useState<number>(85.0);

  // Results State
  const [mlResult, setMlResult] = useState<MLPredictionResponse | null>(null);
  const [faoResult, setFaoResult] = useState<FAO56Response | null>(null);
  const [volResult, setVolResult] = useState<WaterCalcResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const runAllModels = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [ml, fao, vol] = await Promise.all([
        api.predictML({
          crop_type: cropType,
          growth_stage: growthStage,
          soil_type: soilType,
          soil_moisture_percent: Number(soilMoisture),
          air_temp_c: Number(airTemp),
          relative_humidity_percent: Number(humidity),
          solar_radiation_mj: Number(solarRadiation),
          field_area_sqm: Number(fieldArea),
          recent_rainfall_mm: Number(forecastRain),
          application_efficiency_percent: Number(efficiency),
        }),
        api.calculateFAO56({
          crop_type: cropType,
          growth_stage: growthStage,
          air_temp_c: Number(airTemp),
          relative_humidity_percent: Number(humidity),
          solar_radiation_mj_m2: Number(solarRadiation),
          current_soil_moisture_percent: Number(soilMoisture),
          field_area_sqm: Number(fieldArea),
          application_efficiency_percent: Number(efficiency),
          forecast_rainfall_mm: Number(forecastRain),
        }),
        api.calculateWater({
          irrigation_depth_mm: 4.5,
          field_area_sqm: Number(fieldArea),
          efficiency_percent: Number(efficiency),
        }),
      ]);

      setMlResult(ml);
      setFaoResult(fao);
      setVolResult(vol);
    } catch (err: any) {
      setErrorMsg(err.message || 'Model prediction failed.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runAllModels();
  }, []);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-pure-white">Crop Water Requirement Analytics & Modeling</h1>
        <p className="text-xs text-slate-gray">
          Multi-paradigm evaluation: Supervised Machine Learning vs Scientific FAO-56 vs Volumetric Derivation
        </p>
      </div>

      {/* Model Selection Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-graphite border border-border-gray rounded-md p-1.5">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveTab('ml')}
            className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded text-xs font-medium transition-colors ${
              activeTab === 'ml'
                ? 'bg-cerulean text-pure-white shadow'
                : 'text-slate-gray hover:text-pure-white'
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>1. ML Model (Random Forest)</span>
          </button>

          <button
            onClick={() => setActiveTab('fao')}
            className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded text-xs font-medium transition-colors ${
              activeTab === 'fao'
                ? 'bg-cerulean text-pure-white shadow'
                : 'text-slate-gray hover:text-pure-white'
            }`}
          >
            <Leaf className="w-3.5 h-3.5" />
            <span>2. Scientific FAO-56 (ETc = Kc × ET0)</span>
          </button>

          <button
            onClick={() => setActiveTab('volume')}
            className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded text-xs font-medium transition-colors ${
              activeTab === 'volume'
                ? 'bg-cerulean text-pure-white shadow'
                : 'text-slate-gray hover:text-pure-white'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>3. Volumetric Hydrology</span>
          </button>
        </div>

        <button
          onClick={runAllModels}
          disabled={isLoading}
          className="inline-flex items-center space-x-1.5 bg-obsidian border border-border-gray hover:border-cerulean text-pure-white px-3 py-1.5 rounded text-xs font-medium transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-cerulean" />
          <span>Recompute Models</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 rounded bg-neon-rose/10 border border-neon-rose/30 text-neon-rose text-xs">
          {errorMsg}
        </div>
      )}

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Input Parameters Panel */}
        <div className="bg-graphite border border-border-gray rounded-md p-5 space-y-4">
          <div className="pb-3 border-b border-border-gray flex items-center justify-between">
            <h2 className="text-sm font-semibold text-pure-white">Field & Atmospheric Inputs</h2>
            <span className="text-[10px] font-mono text-slate-gray">Live Variables</span>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); runAllModels(); }} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-gray mb-1">Crop Type</label>
                <select
                  value={cropType}
                  onChange={(e) => setCropType(e.target.value)}
                  className="w-full bg-obsidian border border-border-gray rounded px-2.5 py-1.5 text-pure-white focus:border-cerulean focus:outline-none"
                >
                  <option value="Tomato">Tomato</option>
                  <option value="Onion">Onion</option>
                  <option value="Sugarcane">Sugarcane</option>
                  <option value="Cotton">Cotton</option>
                  <option value="Wheat">Wheat</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-gray mb-1">Growth Stage</label>
                <select
                  value={growthStage}
                  onChange={(e) => setGrowthStage(e.target.value)}
                  className="w-full bg-obsidian border border-border-gray rounded px-2.5 py-1.5 text-pure-white focus:border-cerulean focus:outline-none"
                >
                  <option value="Initial">Initial</option>
                  <option value="Vegetative">Vegetative</option>
                  <option value="Flowering">Flowering / Mid</option>
                  <option value="Maturity">Maturity / Late</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-gray mb-1">Soil Moisture (% VWC)</label>
                <input
                  type="number"
                  step="0.5"
                  min="5"
                  max="95"
                  value={soilMoisture}
                  onChange={(e) => setSoilMoisture(Number(e.target.value))}
                  className="w-full bg-obsidian border border-border-gray rounded px-2.5 py-1.5 text-pure-white font-mono focus:border-cerulean focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-gray mb-1">Air Temperature (°C)</label>
                <input
                  type="number"
                  step="0.5"
                  min="10"
                  max="55"
                  value={airTemp}
                  onChange={(e) => setAirTemp(Number(e.target.value))}
                  className="w-full bg-obsidian border border-border-gray rounded px-2.5 py-1.5 text-pure-white font-mono focus:border-cerulean focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-gray mb-1">Relative Humidity (%)</label>
                <input
                  type="number"
                  step="1"
                  min="15"
                  max="95"
                  value={humidity}
                  onChange={(e) => setHumidity(Number(e.target.value))}
                  className="w-full bg-obsidian border border-border-gray rounded px-2.5 py-1.5 text-pure-white font-mono focus:border-cerulean focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-gray mb-1">Solar Rad (MJ/m²)</label>
                <input
                  type="number"
                  step="0.5"
                  min="5"
                  max="35"
                  value={solarRadiation}
                  onChange={(e) => setSolarRadiation(Number(e.target.value))}
                  className="w-full bg-obsidian border border-border-gray rounded px-2.5 py-1.5 text-pure-white font-mono focus:border-cerulean focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-gray mb-1">Field Area (m²)</label>
                <input
                  type="number"
                  step="100"
                  min="100"
                  max="500000"
                  value={fieldArea}
                  onChange={(e) => setFieldArea(Number(e.target.value))}
                  className="w-full bg-obsidian border border-border-gray rounded px-2.5 py-1.5 text-pure-white font-mono focus:border-cerulean focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-gray mb-1">Forecast Rain (mm)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  value={forecastRain}
                  onChange={(e) => setForecastRain(Number(e.target.value))}
                  className="w-full bg-obsidian border border-border-gray rounded px-2.5 py-1.5 text-pure-white font-mono focus:border-cerulean focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-gray mb-1">Irrigation Efficiency (%)</label>
              <input
                type="number"
                step="1"
                min="50"
                max="100"
                value={efficiency}
                onChange={(e) => setEfficiency(Number(e.target.value))}
                className="w-full bg-obsidian border border-border-gray rounded px-2.5 py-1.5 text-pure-white font-mono focus:border-cerulean focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-cerulean text-pure-white py-2 rounded text-xs font-semibold hover:bg-cerulean/90 transition-colors shadow mt-2"
            >
              Update Prediction
            </button>
          </form>
        </div>

        {/* Right Output Panels */}
        <div className="lg:col-span-2 space-y-6">
          {/* TAB 1: MACHINE LEARNING MODEL OUTPUT */}
          {activeTab === 'ml' && mlResult && (
            <div className="bg-graphite border border-border-gray rounded-md p-5 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border-gray">
                <div className="flex items-center space-x-2">
                  <BrainCircuit className="w-4 h-4 text-cerulean" />
                  <h2 className="text-sm font-semibold text-pure-white">
                    Supervised Machine Learning Regression Output
                  </h2>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cerulean/15 text-cerulean border border-cerulean/30">
                  {mlResult.model_version}
                </span>
              </div>

              {/* Metric Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-obsidian border border-border-gray p-3 rounded">
                  <span className="text-[11px] text-slate-gray block">Predicted Demand</span>
                  <span className="text-2xl font-bold font-mono text-pure-white">
                    {mlResult.predicted_water_depth_mm}
                  </span>
                  <span className="text-[11px] text-slate-gray ml-1">mm/day</span>
                </div>

                <div className="bg-obsidian border border-border-gray p-3 rounded">
                  <span className="text-[11px] text-slate-gray block">Gross Delivery (85% eff)</span>
                  <span className="text-2xl font-bold font-mono text-cerulean">
                    {mlResult.gross_water_liters.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-slate-gray ml-1">Litres</span>
                </div>

                <div className="bg-obsidian border border-border-gray p-3 rounded">
                  <span className="text-[11px] text-slate-gray block">Test MAE (Held-Out)</span>
                  <span className="text-xl font-bold font-mono text-field-green">
                    ±{mlResult.model_metrics.mae}
                  </span>
                  <span className="text-[11px] text-slate-gray ml-1">mm</span>
                </div>

                <div className="bg-obsidian border border-border-gray p-3 rounded">
                  <span className="text-[11px] text-slate-gray block">Model R² Score</span>
                  <span className="text-xl font-bold font-mono text-field-green">
                    {mlResult.model_metrics.r2_score}
                  </span>
                  <span className="text-[10px] text-slate-gray ml-1">(Variance)</span>
                </div>
              </div>

              {/* 7-Day Forecast Horizon Chart */}
              <div className="bg-obsidian border border-border-gray rounded p-4">
                <h3 className="text-xs font-semibold text-pure-white mb-2">7-Day Projected Crop Water Requirement</h3>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mlResult.forecast_7d} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#292C33" vertical={false} />
                      <XAxis dataKey="day" stroke="#8B929E" fontSize={10} tickLine={false} />
                      <YAxis stroke="#8B929E" fontSize={10} tickLine={false} unit=" mm" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#111114',
                          borderColor: '#292C33',
                          borderRadius: '4px',
                          color: '#F5F7FA',
                          fontSize: '11px',
                        }}
                        formatter={(val: any) => [`${Number(val).toFixed(2)} mm`, 'Predicted Depth']}
                      />
                      <Bar dataKey="predicted_depth_mm" fill="#2A9DDB" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Feature Importance / Contributing Factors Breakdown */}
              <div className="space-y-2 text-xs">
                <span className="text-xs font-semibold text-slate-gray uppercase tracking-wider block">
                  Model Feature Importance Weights:
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  {Object.entries(mlResult.contributing_factors).map(([factor, weight]) => (
                    <div key={factor} className="p-2 rounded bg-obsidian border border-border-gray flex justify-between">
                      <span className="text-slate-gray">{factor}</span>
                      <span className="text-pure-white font-bold">{(weight * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-border-gray text-[11px] text-slate-gray">
                {mlResult.transparency_note}
              </div>
            </div>
          )}

          {/* TAB 2: SCIENTIFIC FAO-56 OUTPUT */}
          {activeTab === 'fao' && faoResult && (
            <div className="bg-graphite border border-border-gray rounded-md p-5 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border-gray">
                <div className="flex items-center space-x-2">
                  <Leaf className="w-4 h-4 text-field-green" />
                  <h2 className="text-sm font-semibold text-pure-white">
                    FAO-56 Penman-Monteith & Crop Coefficient Derivation
                  </h2>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-field-green/15 text-field-green border border-field-green/30">
                  ETc = Kc × ET0
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-obsidian border border-border-gray p-3 rounded">
                  <span className="text-[11px] text-slate-gray block">Reference ET0</span>
                  <span className="text-2xl font-bold font-mono text-pure-white">{faoResult.et0_mm_day}</span>
                  <span className="text-[11px] text-slate-gray ml-1">mm/day</span>
                </div>

                <div className="bg-obsidian border border-border-gray p-3 rounded">
                  <span className="text-[11px] text-slate-gray block">Crop Factor (Kc)</span>
                  <span className="text-2xl font-bold font-mono text-field-green">{faoResult.kc}</span>
                  <span className="text-[10px] text-slate-gray ml-1">({faoResult.growth_stage})</span>
                </div>

                <div className="bg-obsidian border border-border-gray p-3 rounded">
                  <span className="text-[11px] text-slate-gray block">Net Irrigation Depth</span>
                  <span className="text-2xl font-bold font-mono text-pure-white">{faoResult.net_irrigation_depth_mm}</span>
                  <span className="text-[11px] text-slate-gray ml-1">mm</span>
                </div>

                <div className="bg-obsidian border border-border-gray p-3 rounded">
                  <span className="text-[11px] text-slate-gray block">Gross Water Delivery</span>
                  <span className="text-2xl font-bold font-mono text-cerulean">
                    {faoResult.gross_water_liters.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-slate-gray ml-1">L</span>
                </div>
              </div>

              <div className="bg-obsidian p-4 rounded border border-border-gray space-y-2 text-xs">
                <span className="text-xs font-semibold text-slate-gray uppercase tracking-wider block">
                  Agronomic Step-by-Step Derivation:
                </span>
                <p className="text-pure-white leading-relaxed font-sans text-xs">
                  {faoResult.formula_derivation}
                </p>
              </div>

              <div className="pt-3 border-t border-border-gray text-[11px] text-slate-gray">
                Standard: FAO Irrigation and Drainage Paper No. 56 (Rome, Italy)
              </div>
            </div>
          )}

          {/* TAB 3: PHYSICAL VOLUMETRIC HYDROLOGY OUTPUT */}
          {activeTab === 'volume' && volResult && (
            <div className="bg-graphite border border-border-gray rounded-md p-5 space-y-5">
              <div className="flex items-center space-x-2 pb-3 border-b border-border-gray">
                <Calculator className="w-4 h-4 text-cerulean" />
                <h2 className="text-sm font-semibold text-pure-white">
                  Deterministic Hydrological Volume Conversion
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-obsidian border border-border-gray p-4 rounded">
                  <span className="text-xs text-slate-gray block">Net Volume (1 mm = 1.0 L/m²)</span>
                  <div className="text-2xl font-bold font-mono text-pure-white my-1">
                    {volResult.net_water_liters.toLocaleString()} L
                  </div>
                  <span className="text-xs text-slate-gray font-mono">{volResult.net_water_cubic_meters} m³</span>
                </div>

                <div className="bg-obsidian border border-border-gray p-4 rounded">
                  <span className="text-xs text-slate-gray block">Gross Pump Requirement (at {volResult.efficiency_percent}%)</span>
                  <div className="text-2xl font-bold font-mono text-cerulean my-1">
                    {volResult.gross_water_liters.toLocaleString()} L
                  </div>
                  <span className="text-xs text-slate-gray font-mono">{volResult.gross_water_cubic_meters} m³</span>
                </div>
              </div>

              <div className="bg-obsidian p-4 rounded border border-border-gray text-xs space-y-2">
                <span className="font-semibold text-slate-gray block uppercase">Physics Principle:</span>
                <p className="text-pure-white leading-relaxed">{volResult.formula_explanation}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
