import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../layouts/AppLayout';
import { api } from '../services/api';
import { IrrigationZone, SensorDevice, SensorReading } from '../types';
import { Activity, Droplet, Thermometer, CloudRain, Wifi, RefreshCw, Send, ShieldAlert } from 'lucide-react';

export const LiveMonitoringPage: React.FC = () => {
  const context = useContext(AppContext);
  const [zones, setZones] = useState<IrrigationZone[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [sensors, setSensors] = useState<SensorDevice[]>([]);
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [latestReading, setLatestReading] = useState<SensorReading | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Manual telemetry simulation form state
  const [simMoisture, setSimMoisture] = useState<number>(38.5);
  const [simTemp, setSimTemp] = useState<number>(29.0);
  const [simHumidity, setSimHumidity] = useState<number>(55.0);
  const [injectStatus, setInjectStatus] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const zoneList = await api.getZones(context?.selectedFieldId || undefined);
      setZones(zoneList);

      const activeZone = selectedZoneId || (zoneList.length > 0 ? zoneList[0].id : null);
      setSelectedZoneId(activeZone);

      if (activeZone) {
        const [sensorList, historyReadings] = await Promise.all([
          api.getSensors(activeZone),
          api.getReadings(activeZone, '24h'),
        ]);
        setSensors(sensorList);
        setReadings(historyReadings);
        if (historyReadings.length > 0) {
          setLatestReading(historyReadings[historyReadings.length - 1]);
        }
      }
    } catch (err) {
      console.error('Failed to load monitoring data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [context?.selectedFieldId, selectedZoneId]);

  const handleInjectTelemetry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedZoneId || sensors.length === 0) return;
    try {
      setInjectStatus('Submitting simulated telemetry packet...');
      await api.recordReading({
        device_id: sensors[0].id,
        zone_id: selectedZoneId,
        soil_moisture_percent: Number(simMoisture),
        air_temperature_c: Number(simTemp),
        relative_humidity_percent: Number(simHumidity),
      });
      setInjectStatus('Simulated packet ingested successfully.');
      setTimeout(() => setInjectStatus(null), 4000);
      loadData();
    } catch (err: any) {
      setInjectStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Zone Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-pure-white">Live Telemetry & Sensor Monitoring</h1>
          <p className="text-xs text-slate-gray">
            Real-time wireless capacitive soil probes and micro-climate telemetry (Simulated)
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-gray font-mono">Active Zone:</span>
          <select
            value={selectedZoneId || ''}
            onChange={(e) => setSelectedZoneId(Number(e.target.value))}
            className="bg-graphite text-pure-white text-xs rounded border border-border-gray px-3 py-1.5 focus:border-cerulean focus:outline-none"
          >
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name} ({z.status})
              </option>
            ))}
          </select>

          <button
            onClick={loadData}
            className="p-1.5 rounded bg-graphite border border-border-gray text-slate-gray hover:text-pure-white"
            title="Refresh Stream"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Gauges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Soil Moisture Gauge Card */}
        <div className="bg-graphite border border-border-gray rounded-md p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-gray uppercase tracking-wider">Volumetric Soil Moisture</span>
            <Droplet className="w-4 h-4 text-cerulean" />
          </div>
          <div className="my-4 text-center">
            <span className="text-4xl font-extrabold font-mono text-pure-white">
              {latestReading ? latestReading.soil_moisture_percent.toFixed(1) : '--'}
              <span className="text-base text-slate-gray ml-1">%</span>
            </span>
            <div className="w-full bg-obsidian rounded-full h-2.5 mt-4 border border-border-gray overflow-hidden">
              <div
                className="bg-cerulean h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, latestReading?.soil_moisture_percent || 0))}%` }}
              ></div>
            </div>
          </div>
          <div className="text-[11px] text-slate-gray flex justify-between pt-2 border-t border-border-gray/50">
            <span>Wilting Point: 20%</span>
            <span>Field Capacity: 70%</span>
          </div>
        </div>

        {/* Ambient Temperature Gauge Card */}
        <div className="bg-graphite border border-border-gray rounded-md p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-gray uppercase tracking-wider">Ambient Temperature</span>
            <Thermometer className="w-4 h-4 text-amber-alert" />
          </div>
          <div className="my-4 text-center">
            <span className="text-4xl font-extrabold font-mono text-pure-white">
              {latestReading ? latestReading.air_temperature_c.toFixed(1) : '--'}
              <span className="text-base text-slate-gray ml-1">°C</span>
            </span>
            <div className="w-full bg-obsidian rounded-full h-2.5 mt-4 border border-border-gray overflow-hidden">
              <div
                className="bg-amber-alert h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, ((latestReading?.air_temperature_c || 20) - 10) * 2.5))}%` }}
              ></div>
            </div>
          </div>
          <div className="text-[11px] text-slate-gray flex justify-between pt-2 border-t border-border-gray/50">
            <span>Range: 10°C - 50°C</span>
            <span>Thermal Stress: &gt; 35°C</span>
          </div>
        </div>

        {/* Relative Humidity Gauge Card */}
        <div className="bg-graphite border border-border-gray rounded-md p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-gray uppercase tracking-wider">Relative Humidity</span>
            <CloudRain className="w-4 h-4 text-field-green" />
          </div>
          <div className="my-4 text-center">
            <span className="text-4xl font-extrabold font-mono text-pure-white">
              {latestReading ? latestReading.relative_humidity_percent.toFixed(1) : '--'}
              <span className="text-base text-slate-gray ml-1">%</span>
            </span>
            <div className="w-full bg-obsidian rounded-full h-2.5 mt-4 border border-border-gray overflow-hidden">
              <div
                className="bg-field-green h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, latestReading?.relative_humidity_percent || 0))}%` }}
              ></div>
            </div>
          </div>
          <div className="text-[11px] text-slate-gray flex justify-between pt-2 border-t border-border-gray/50">
            <span>Vapor Deficit: Normal</span>
            <span>Dew Point: 18.2°C</span>
          </div>
        </div>
      </div>

      {/* Sensor Device Status & Diagnostic Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sensor Hardware Fleet Details */}
        <div className="bg-graphite border border-border-gray rounded-md p-4">
          <h2 className="text-sm font-semibold text-pure-white mb-3">Associated In-Situ Sensor Nodes</h2>
          <div className="space-y-3">
            {sensors.map((s) => (
              <div key={s.id} className="p-3 rounded bg-obsidian border border-border-gray text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Wifi className="w-3.5 h-3.5 text-field-green" />
                    <span className="font-mono font-medium text-pure-white">{s.device_serial}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-field-green/10 text-field-green border border-field-green/30">
                    {s.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-gray text-[11px] font-mono">
                  <div>Type: <span className="text-pure-white">{s.sensor_type}</span></div>
                  <div>Battery: <span className="text-pure-white">{s.battery_level}%</span></div>
                  <div>Signal: <span className="text-pure-white">{s.signal_dbm} dBm</span></div>
                  <div>FW: <span className="text-pure-white">{s.firmware_version}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Telemetry Injection Sandbox (Demo Mode Tool) */}
        <div className="bg-graphite border border-border-gray rounded-md p-4">
          <div className="flex items-center space-x-2 mb-2">
            <ShieldAlert className="w-4 h-4 text-cerulean" />
            <h2 className="text-sm font-semibold text-pure-white">Inject Telemetry Simulation Packet</h2>
          </div>
          <p className="text-xs text-slate-gray mb-4">
            Test how the irrigation decision engine responds to dry, optimal, or saturated soil conditions by injecting a simulated reading into SQLite.
          </p>

          <form onSubmit={handleInjectTelemetry} className="space-y-3 text-xs">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-gray mb-1">Moisture (% VWC)</label>
                <input
                  type="number"
                  step="0.1"
                  min="5"
                  max="95"
                  value={simMoisture}
                  onChange={(e) => setSimMoisture(parseFloat(e.target.value))}
                  className="w-full bg-obsidian border border-border-gray rounded px-2.5 py-1.5 text-pure-white font-mono focus:border-cerulean focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-gray mb-1">Temperature (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="60"
                  value={simTemp}
                  onChange={(e) => setSimTemp(parseFloat(e.target.value))}
                  className="w-full bg-obsidian border border-border-gray rounded px-2.5 py-1.5 text-pure-white font-mono focus:border-cerulean focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-gray mb-1">Humidity (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="10"
                  max="100"
                  value={simHumidity}
                  onChange={(e) => setSimHumidity(parseFloat(e.target.value))}
                  className="w-full bg-obsidian border border-border-gray rounded px-2.5 py-1.5 text-pure-white font-mono focus:border-cerulean focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-amber-alert font-mono">
                {injectStatus || 'Ready to simulate packet.'}
              </span>
              <button
                type="submit"
                className="inline-flex items-center space-x-1.5 bg-cerulean text-pure-white px-3.5 py-1.5 rounded font-medium hover:bg-cerulean/90 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Transmit Packet</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
