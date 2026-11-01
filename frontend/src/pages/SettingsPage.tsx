import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../layouts/AppLayout';
import { api } from '../services/api';
import { Settings, RefreshCw, Database, Server, Shield, Check } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const context = useContext(AppContext);
  const [settingsList, setSettingsList] = useState<Array<{ key: string; value: string; description: string }>>([]);
  const [backendHealth, setBackendHealth] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      api.getSettings(),
      api.checkHealth().catch(() => null),
    ])
      .then(([settings, health]) => {
        setSettingsList(settings);
        setBackendHealth(health);
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-pure-white">System Settings & Engine Configuration</h1>
        <p className="text-xs text-slate-gray">
          Global agro-system constants, safety runtime limits, and demonstration database control
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backend & Runtime Status */}
        <div className="bg-graphite border border-border-gray rounded-md p-5 space-y-4">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-border-gray">
            <Server className="w-4 h-4 text-cerulean" />
            <h2 className="text-sm font-semibold text-pure-white">Backend Environment</h2>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded bg-obsidian border border-border-gray/60">
              <span className="text-slate-gray">Engine Mode</span>
              <span className="font-mono text-amber-alert font-bold">DEMO MODE — SIMULATED DATA</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded bg-obsidian border border-border-gray/60">
              <span className="text-slate-gray">Database Driver</span>
              <span className="font-mono text-pure-white">SQLite 3 (Local File: irrigasense.db)</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded bg-obsidian border border-border-gray/60">
              <span className="text-slate-gray">API Health Status</span>
              <span className="font-mono text-field-green font-semibold">
                {backendHealth?.status?.toUpperCase() || 'ONLINE'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded bg-obsidian border border-border-gray/60">
              <span className="text-slate-gray">Pump Hardware Safety Limit</span>
              <span className="font-mono text-cerulean font-bold">120 Minutes Auto-Cutoff</span>
            </div>
          </div>
        </div>

        {/* Database Demonstration Reset Card */}
        <div className="bg-graphite border border-border-gray rounded-md p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2.5 pb-3 border-b border-border-gray mb-3">
              <Database className="w-4 h-4 text-amber-alert" />
              <h2 className="text-sm font-semibold text-pure-white">Demonstration Dataset Control</h2>
            </div>

            <p className="text-xs text-slate-gray leading-relaxed mb-4">
              IrrigaSense includes an Indian agricultural baseline dataset (Baramati, Maharashtra) covering Tomato, Onion, Sugarcane, and Cotton with evolving diurnal telemetry. If you have modified thresholds or injected abnormal telemetry, you can re-seed the demonstration database at any time.
            </p>
          </div>

          <div className="pt-3 border-t border-border-gray">
            <button
              onClick={() => context?.openResetModal()}
              className="w-full inline-flex items-center justify-center space-x-2 bg-amber-alert/15 text-amber-alert border border-amber-alert/30 hover:bg-amber-alert/25 py-2 px-4 rounded text-xs font-semibold transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Demonstration Dataset...</span>
            </button>
          </div>
        </div>
      </div>

      {/* Measurement & Localization Preferences */}
      <div className="bg-graphite border border-border-gray rounded-md p-5 space-y-4">
        <div className="flex items-center space-x-2.5 pb-3 border-b border-border-gray">
          <Shield className="w-4 h-4 text-cerulean" />
          <h2 className="text-sm font-semibold text-pure-white">Agricultural Measurement Units & Localization</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded bg-obsidian border border-border-gray/60 space-y-1.5">
            <span className="text-slate-gray block">Field Area Unit</span>
            <div className="flex items-center space-x-2 pt-1">
              <button className="px-3 py-1 rounded bg-cerulean text-pure-white font-semibold">Hectares (ha)</button>
              <button className="px-3 py-1 rounded bg-graphite border border-border-gray text-slate-gray hover:text-pure-white">Acres (ac)</button>
            </div>
            <span className="text-[10px] text-slate-gray block pt-1">1 Hectare = 2.47105 Acres</span>
          </div>

          <div className="p-3 rounded bg-obsidian border border-border-gray/60 space-y-1.5">
            <span className="text-slate-gray block">Irrigation Volume Unit</span>
            <div className="flex items-center space-x-2 pt-1">
              <button className="px-3 py-1 rounded bg-cerulean text-pure-white font-semibold">Litres (L)</button>
              <button className="px-3 py-1 rounded bg-graphite border border-border-gray text-slate-gray hover:text-pure-white">Cubic Metres (m³)</button>
            </div>
            <span className="text-[10px] text-slate-gray block pt-1">1 mm over 1 m² = 1.0 Litre</span>
          </div>

          <div className="p-3 rounded bg-obsidian border border-border-gray/60 space-y-1.5">
            <span className="text-slate-gray block">Agro-Climatic Timezone</span>
            <div className="pt-1">
              <span className="font-mono text-pure-white bg-graphite border border-border-gray px-2.5 py-1 rounded block">
                Asia/Kolkata (IST, UTC+05:30)
              </span>
            </div>
            <span className="text-[10px] text-slate-gray block pt-1">Standard Indian Agro-Zone Base</span>
          </div>
        </div>
      </div>

      {/* Persistent System Key-Value Store */}
      <div className="bg-graphite border border-border-gray rounded-md p-5">
        <h2 className="text-sm font-semibold text-pure-white mb-3">Persisted Configuration Parameters</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-obsidian/70 text-slate-gray font-mono text-[11px] uppercase border-b border-border-gray">
              <tr>
                <th className="px-4 py-2.5">Key</th>
                <th className="px-4 py-2.5">Configured Value</th>
                <th className="px-4 py-2.5">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-gray/50 text-pure-white">
              {settingsList.map((s) => (
                <tr key={s.key} className="hover:bg-obsidian/40">
                  <td className="px-4 py-2.5 font-mono text-cerulean font-medium">{s.key}</td>
                  <td className="px-4 py-2.5 font-mono">{s.value}</td>
                  <td className="px-4 py-2.5 text-slate-gray">{s.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
