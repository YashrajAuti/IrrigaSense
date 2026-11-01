import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../layouts/AppLayout';
import { api } from '../services/api';
import { IrrigationZone, IrrigationEvent } from '../types';
import { Power, AlertOctagon, Play, Square, AlertTriangle } from 'lucide-react';

export const IrrigationControlPage: React.FC = () => {
  const context = useContext(AppContext);
  const [zones, setZones] = useState<IrrigationZone[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [events, setEvents] = useState<IrrigationEvent[]>([]);
  const [mode, setMode] = useState<'Manual' | 'Automatic'>('Manual');
  const [targetRuntime, setTargetRuntime] = useState<number>(30);
  const [targetDepth, setTargetDepth] = useState<number>(4.0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isEmergencyActive, setIsEmergencyActive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loadControlData = async () => {
    try {
      const zoneList = await api.getZones(context?.selectedFieldId || undefined);
      setZones(zoneList);
      const activeZoneId = selectedZoneId || (zoneList.length > 0 ? zoneList[0].id : null);
      setSelectedZoneId(activeZoneId);

      if (activeZoneId) {
        const eventList = await api.getIrrigationEvents(activeZoneId, 20);
        setEvents(eventList);

        const currentZone = zoneList.find((z) => z.id === activeZoneId);
        if (currentZone) {
          setMode(currentZone.operating_mode === 'Automatic' ? 'Automatic' : 'Manual');
          setIsEmergencyActive(currentZone.simulated_pump_state === 'EMERGENCY_STOPPED');
        }
      }
    } catch (err) {
      console.error('Failed to load irrigation control data:', err);
    }
  };

  useEffect(() => {
    loadControlData();
  }, [context?.selectedFieldId, selectedZoneId]);

  const activeZone = zones.find((z) => z.id === selectedZoneId);

  const handleExecuteCommand = async (action: 'START' | 'STOP' | 'EMERGENCY_STOP') => {
    if (!selectedZoneId) return;
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const res = await api.executeIrrigationCommand({
        zone_id: selectedZoneId,
        action,
        mode,
        runtime_minutes: targetRuntime,
        target_depth_mm: targetDepth,
      });

      setStatusMessage(res.message);
      setIsEmergencyActive(res.pump_state === 'EMERGENCY_STOPPED');
      await loadControlData();
      context?.refreshAppData();
    } catch (err: any) {
      setStatusMessage(`Command Rejected: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const isPumpOn = activeZone?.simulated_pump_state === 'ON';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-pure-white">Irrigation Actuation & Pump Controls</h1>
          <p className="text-xs text-slate-gray">
            Simulated solenoid manifold & high-pressure pump control (Max limit: 120 mins)
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-gray font-mono">Control Zone:</span>
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
        </div>
      </div>

      <div className="bg-obsidian border border-amber-alert/30 rounded p-3 text-xs flex items-center justify-between text-amber-alert">
        <div className="flex items-center space-x-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            <strong>Demo Safety Notice:</strong> No physical water pump or electrical relay is connected. All actuations run in software simulation. Maximum runtime cutoff is hard-limited to 120 minutes.
          </span>
        </div>
        <span className="hidden md:inline font-mono text-[10px] bg-amber-alert/15 px-2 py-0.5 rounded">
          DEMO ACTUATION
        </span>
      </div>

      {statusMessage && (
        <div className="bg-graphite border border-cerulean/40 text-pure-white px-4 py-2.5 rounded text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-2">
            <Power className="w-4 h-4 text-cerulean" />
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-gray hover:text-pure-white">
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-graphite border border-border-gray rounded-md p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border-gray mb-5">
              <div>
                <h2 className="text-base font-semibold text-pure-white">{activeZone?.name || 'Selected Zone'}</h2>
                <span className="text-xs text-slate-gray font-mono">
                  Flow: {activeZone?.flow_rate_lpm || 45} L/min &bull; Max Cutoff: {activeZone?.max_runtime_minutes || 120} mins
                </span>
              </div>

              <div className="flex items-center bg-obsidian border border-border-gray rounded p-1 space-x-1">
                <button
                  onClick={() => setMode('Manual')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    mode === 'Manual'
                      ? 'bg-cerulean text-pure-white'
                      : 'text-slate-gray hover:text-pure-white'
                  }`}
                >
                  Manual Mode
                </button>
                <button
                  onClick={() => setMode('Automatic')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    mode === 'Automatic'
                      ? 'bg-cerulean text-pure-white'
                      : 'text-slate-gray hover:text-pure-white'
                  }`}
                >
                  Automatic Mode
                </button>
              </div>
            </div>

            <div className="bg-obsidian rounded border border-border-gray p-4 flex flex-wrap items-center justify-between gap-4 mb-5">
              <div>
                <span className="text-xs text-slate-gray block mb-1">Simulated Pump Status</span>
                {isPumpOn && (
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-field-green animate-ping"></span>
                    <span className="text-lg font-bold font-mono text-field-green">PUMP RUNNING (SIMULATED)</span>
                  </div>
                )}
                {isEmergencyActive && (
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-neon-rose"></span>
                    <span className="text-lg font-bold font-mono text-neon-rose">EMERGENCY STOP ENGAGED</span>
                  </div>
                )}
                {!isPumpOn && !isEmergencyActive && (
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-slate-gray"></span>
                    <span className="text-lg font-bold font-mono text-slate-gray">STANDBY / OFF</span>
                  </div>
                )}
              </div>

              <div className="text-right font-mono text-xs text-slate-gray">
                <div>Active Runtime: <strong className="text-pure-white">{activeZone?.current_runtime_minutes || 0} min</strong></div>
                <div>Last Irrigation: <strong className="text-pure-white">{activeZone?.last_irrigation_at ? new Date(activeZone.last_irrigation_at).toLocaleTimeString() : 'Never'}</strong></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
              <div>
                <label className="block text-slate-gray mb-1.5">
                  Target Duration (Minutes) &bull; Max 120
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={targetRuntime}
                  onChange={(e) => setTargetRuntime(Math.min(120, Math.max(1, Number(e.target.value))))}
                  disabled={isPumpOn}
                  className="w-full bg-obsidian border border-border-gray rounded px-3 py-2 text-pure-white font-mono focus:border-cerulean focus:outline-none disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-slate-gray mb-1.5">
                  Target Depth (mm) &bull; Max 50
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="50"
                  value={targetDepth}
                  onChange={(e) => setTargetDepth(Math.min(50, Math.max(0.5, Number(e.target.value))))}
                  disabled={isPumpOn}
                  className="w-full bg-obsidian border border-border-gray rounded px-3 py-2 text-pure-white font-mono focus:border-cerulean focus:outline-none disabled:opacity-50"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {!isPumpOn ? (
                <button
                  onClick={() => handleExecuteCommand('START')}
                  disabled={isLoading || isEmergencyActive}
                  className={`inline-flex items-center space-x-2 px-5 py-2.5 rounded text-xs font-semibold transition-colors ${
                    isEmergencyActive
                      ? 'bg-obsidian border border-border-gray text-slate-gray cursor-not-allowed'
                      : 'bg-field-green text-jet-black hover:bg-field-green/90 shadow'
                  }`}
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Irrigation</span>
                </button>
              ) : (
                <button
                  onClick={() => handleExecuteCommand('STOP')}
                  disabled={isLoading}
                  className="inline-flex items-center space-x-2 bg-amber-alert text-jet-black px-5 py-2.5 rounded text-xs font-semibold hover:bg-amber-alert/90 transition-colors shadow"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>Stop Irrigation</span>
                </button>
              )}

              <button
                onClick={() => handleExecuteCommand('EMERGENCY_STOP')}
                disabled={isLoading}
                className="inline-flex items-center space-x-2 bg-neon-rose text-pure-white px-5 py-2.5 rounded text-xs font-semibold hover:bg-neon-rose/90 transition-colors shadow"
              >
                <AlertOctagon className="w-4 h-4" />
                <span>Emergency Stop</span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-graphite border border-border-gray rounded-md p-4 flex flex-col">
          <div className="pb-3 border-b border-border-gray mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-pure-white">Command Log & Events</h3>
            <span className="text-[11px] font-mono text-slate-gray">Last 20 Runs</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[460px]">
            {events.length === 0 ? (
              <div className="text-xs text-slate-gray py-4 text-center">No irrigation events logged yet.</div>
            ) : (
              events.map((e) => {
                const isEmergency = e.action === 'EMERGENCY_STOP';
                return (
                  <div
                    key={e.id}
                    className={`p-2.5 rounded border text-xs space-y-1 ${
                      isEmergency
                        ? 'bg-neon-rose/10 border-neon-rose/30 text-neon-rose'
                        : 'bg-obsidian border-border-gray text-pure-white'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="font-semibold">{e.action} ({e.trigger_type})</span>
                      <span className="text-slate-gray">
                        {new Date(e.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-gray">
                      Runtime: {e.runtime_minutes} min &bull; Water: {e.estimated_water_liters.toLocaleString()} L
                    </div>
                    {e.notes && <div className="text-[10px] text-slate-gray/80 truncate">{e.notes}</div>}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
