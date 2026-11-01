import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { SensorDevice, IrrigationZone } from '../types';
import { Cpu, Wifi, Battery, BatteryCharging, Radio, CheckCircle2, AlertCircle, RefreshCw, Plus, Terminal, Send, X } from 'lucide-react';

export const SensorManagementPage: React.FC = () => {
  const [sensors, setSensors] = useState<SensorDevice[]>([]);
  const [zones, setZones] = useState<IrrigationZone[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showGatewayInfo, setShowGatewayInfo] = useState(false);

  // Registration Form State
  const [newSerial, setNewSerial] = useState('');
  const [newZoneId, setNewZoneId] = useState<number>(1);
  const [newSensorType, setNewSensorType] = useState('FDR Soil Capacitance 3-in-1');
  const [newBattery, setNewBattery] = useState<number>(95);

  // Hardware Test Telemetry State
  const [testSerial, setTestSerial] = useState('ESP32-NODE-01');
  const [testMoisture, setTestMoisture] = useState<number>(24.5);
  const [testTemp, setTestTemp] = useState<number>(31.2);
  const [testHumidity, setTestHumidity] = useState<number>(55.0);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const loadSensors = async () => {
    setIsLoading(true);
    try {
      const [sensorList, zoneList] = await Promise.all([
        api.getSensors(),
        api.getZones(),
      ]);
      setSensors(sensorList);
      setZones(zoneList);
      if (zoneList.length > 0 && !newZoneId) {
        setNewZoneId(zoneList[0].id);
      }
    } catch (err) {
      console.error('Failed to load sensors:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSensors();
  }, []);

  const handleRegisterSensor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createSensor({
        device_serial: newSerial || `PROBE-SN-${Math.floor(1000 + Math.random() * 9000)}`,
        zone_id: Number(newZoneId),
        sensor_type: newSensorType,
        battery_level: Number(newBattery),
        status: 'Active',
      });
      setIsModalOpen(false);
      setNewSerial('');
      loadSensors();
    } catch (err) {
      console.error('Failed to register sensor:', err);
    }
  };

  const handleSendTestTelemetry = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await api.ingestHardwareSensor({
        device_serial: testSerial,
        soil_moisture_percent: Number(testMoisture),
        air_temperature_c: Number(testTemp),
        relative_humidity_percent: Number(testHumidity),
        battery_level: 92,
        signal_dbm: -68,
      });
      setTestResult({ success: true, message: `Packet Accepted! Ingested reading ID #${res.reading_id}` });
      loadSensors();
    } catch (err: any) {
      setTestResult({ success: false, message: err?.message || 'Ingestion rejected (device serial must exist in fleet)' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-pure-white">Sensor Hardware & Probe Fleet</h1>
          <p className="text-xs text-slate-gray">
            In-situ soil capacitance arrays, wireless transceivers, and battery diagnostics (Simulated telemetry)
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowGatewayInfo(!showGatewayInfo)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded bg-graphite border border-border-gray hover:bg-obsidian text-xs text-cerulean transition-colors font-medium"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>{showGatewayInfo ? 'Hide Hardware Gateway' : 'ESP32 / Edge Gateway'}</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded bg-cerulean text-pure-white text-xs font-semibold hover:bg-cerulean/90 transition-colors shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Probe</span>
          </button>

          <button
            onClick={loadSensors}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded bg-graphite border border-border-gray hover:bg-obsidian text-xs text-slate-gray hover:text-pure-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Scan Fleet</span>
          </button>
        </div>
      </div>

      {/* Hardware Gateway Integration Panel */}
      {showGatewayInfo && (
        <div className="bg-obsidian border border-cerulean/40 rounded-md p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border-gray">
            <div className="flex items-center space-x-2 text-cerulean font-semibold text-xs">
              <Terminal className="w-4 h-4" />
              <span>Physical Hardware Ingestion Webhook (ESP32 / LoRaWAN Bridge)</span>
            </div>
            <span className="text-[11px] font-mono text-field-green">ENDPOINT: POST /api/v1/sensors/ingest-hardware</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-gray block mb-1 font-mono">Payload Schema (JSON):</span>
              <pre className="bg-graphite p-3 rounded text-[11px] font-mono text-pure-white overflow-x-auto border border-border-gray">
{`{
  "device_serial": "ESP32-NODE-01",
  "auth_token": "demo-hw-secret-key",
  "soil_moisture_percent": 24.5,
  "air_temperature_c": 31.2,
  "relative_humidity_percent": 55.0,
  "battery_level": 92.0,
  "signal_dbm": -68
}`}
              </pre>
            </div>

            <div className="space-y-3 bg-graphite p-3 rounded border border-border-gray">
              <span className="text-pure-white font-semibold block text-xs">Dispatch Test Telemetry Packet</span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-slate-gray">Target Probe</label>
                  <select
                    value={testSerial}
                    onChange={(e) => setTestSerial(e.target.value)}
                    className="w-full bg-obsidian border border-border-gray rounded p-1 text-xs text-pure-white font-mono mt-0.5"
                  >
                    {sensors.map((s) => (
                      <option key={s.id} value={s.device_serial}>
                        {s.device_serial}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-gray">Moisture (% VWC)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={testMoisture}
                    onChange={(e) => setTestMoisture(Number(e.target.value))}
                    className="w-full bg-obsidian border border-border-gray rounded p-1 text-xs text-pure-white font-mono mt-0.5"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-gray">Air Temp (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={testTemp}
                    onChange={(e) => setTestTemp(Number(e.target.value))}
                    className="w-full bg-obsidian border border-border-gray rounded p-1 text-xs text-pure-white font-mono mt-0.5"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={handleSendTestTelemetry}
                  disabled={isTesting}
                  className="inline-flex items-center space-x-1.5 px-3 py-1 bg-cerulean text-pure-white rounded text-xs font-semibold hover:bg-cerulean/90 disabled:opacity-50"
                >
                  <Send className="w-3 h-3" />
                  <span>{isTesting ? 'Sending...' : 'Send Live Packet'}</span>
                </button>

                {testResult && (
                  <span
                    className={`text-[11px] font-mono ${
                      testResult.success ? 'text-field-green' : 'text-neon-rose'
                    }`}
                  >
                    {testResult.message}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IoT Hardware Integration Roadmap Notice */}
      <div className="bg-obsidian border border-border-gray rounded p-4 text-xs space-y-1.5">
        <div className="flex items-center space-x-2 text-cerulean font-semibold">
          <Radio className="w-4 h-4" />
          <span>Physical IoT Hardware Ready</span>
        </div>
        <p className="text-slate-gray leading-relaxed">
          The IrrigaSense sensor telemetry schema is architected to ingest real MQTT/HTTP payload packets from physical LoRaWAN/ESP32 sensor nodes. In current Demo Mode, all probe readings and battery telemetry run against verified deterministic SQLite simulations.
        </p>
      </div>

      {/* Sensor Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sensors.map((sensor) => {
          const zone = zones.find((z) => z.id === sensor.zone_id);

          return (
            <div key={sensor.id} className="bg-graphite border border-border-gray rounded-md p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-border-gray mb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-1.5 rounded bg-obsidian border border-border-gray text-cerulean">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold font-mono text-pure-white">{sensor.device_serial}</h3>
                      <span className="text-[11px] text-slate-gray">
                        {zone?.name || `Zone ${sensor.zone_id}`}
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-field-green/10 text-field-green border border-field-green/30">
                    {sensor.status}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded bg-obsidian border border-border-gray/60 flex items-center justify-between">
                    <span className="text-slate-gray">Probe Model</span>
                    <span className="text-pure-white font-medium">{sensor.sensor_type}</span>
                  </div>

                  <div className="p-2.5 rounded bg-obsidian border border-border-gray/60 flex items-center justify-between">
                    <span className="text-slate-gray flex items-center space-x-1.5">
                      <Battery className="w-3.5 h-3.5 text-field-green" />
                      <span>Battery Cell</span>
                    </span>
                    <span className="font-mono text-pure-white font-medium">{sensor.battery_level}% (LiFePO4)</span>
                  </div>

                  <div className="p-2.5 rounded bg-obsidian border border-border-gray/60 flex items-center justify-between">
                    <span className="text-slate-gray flex items-center space-x-1.5">
                      <Wifi className="w-3.5 h-3.5 text-cerulean" />
                      <span>Radio Signal (RSSI)</span>
                    </span>
                    <span className="font-mono text-pure-white font-medium">{sensor.signal_dbm} dBm</span>
                  </div>

                  <div className="p-2.5 rounded bg-obsidian border border-border-gray/60 flex items-center justify-between">
                    <span className="text-slate-gray">Firmware Build</span>
                    <span className="font-mono text-slate-gray">{sensor.firmware_version}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border-gray/50 flex items-center justify-between text-[11px] text-slate-gray font-mono">
                <span>SIMULATED PROBE</span>
                <span>Heartbeat: {new Date(sensor.last_heartbeat).toLocaleTimeString()}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Register Probe Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-graphite border border-border-gray rounded-md w-full max-w-md p-5 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-gray hover:text-pure-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-semibold text-pure-white mb-1">Register New Sensor Probe</h3>
            <p className="text-xs text-slate-gray mb-4">
              Add a new wireless in-situ capacitance soil node or ambient microclimate probe
            </p>

            <form onSubmit={handleRegisterSensor} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-gray mb-1">Device Serial / Node ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ESP32-NODE-04 or PROBE-SN-8821"
                  value={newSerial}
                  onChange={(e) => setNewSerial(e.target.value)}
                  className="w-full bg-obsidian border border-border-gray rounded px-3 py-2 text-pure-white focus:outline-hidden focus:border-cerulean font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-gray mb-1">Assigned Irrigation Zone</label>
                <select
                  value={newZoneId}
                  onChange={(e) => setNewZoneId(Number(e.target.value))}
                  className="w-full bg-obsidian border border-border-gray rounded px-3 py-2 text-pure-white focus:outline-hidden focus:border-cerulean"
                >
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name} (Zone #{z.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-gray mb-1">Probe / Transceiver Type</label>
                <select
                  value={newSensorType}
                  onChange={(e) => setNewSensorType(e.target.value)}
                  className="w-full bg-obsidian border border-border-gray rounded px-3 py-2 text-pure-white focus:outline-hidden focus:border-cerulean"
                >
                  <option value="FDR Soil Capacitance 3-in-1">FDR Soil Capacitance 3-in-1 (Moisture, Temp, EC)</option>
                  <option value="TDR Multi-Depth Moisture Sensor">TDR Multi-Depth Moisture Sensor</option>
                  <option value="Ambient Microclimate HT-02">Ambient Microclimate HT-02 (Air Temp & RH)</option>
                  <option value="Tipping Bucket Rain Gauge">Tipping Bucket Digital Rain Gauge</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-gray mb-1">Battery Cell Charge Level (%)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={newBattery}
                  onChange={(e) => setNewBattery(Number(e.target.value))}
                  className="w-full bg-obsidian border border-border-gray rounded px-3 py-2 text-pure-white focus:outline-hidden focus:border-cerulean font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-border-gray">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-border-gray text-slate-gray hover:text-pure-white hover:bg-obsidian transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-cerulean text-pure-white font-semibold hover:bg-cerulean/90 transition-colors"
                >
                  Confirm Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
