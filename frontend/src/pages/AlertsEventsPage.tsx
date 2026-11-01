import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AlertEvent } from '../types';
import { BellRing, AlertTriangle, Info, CheckCircle2, Check, ShieldAlert } from 'lucide-react';

export const AlertsEventsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'INFO'>('ALL');
  const [unresolvedOnly, setUnresolvedOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadAlerts = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAlerts(unresolvedOnly);
      setAlerts(data);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [unresolvedOnly]);

  const handleAcknowledge = async (alertId: number) => {
    try {
      await api.acknowledgeAlert(alertId);
      loadAlerts();
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filterSeverity !== 'ALL' && a.severity !== filterSeverity) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-pure-white">System Alerts & Agro-Climatic Events</h1>
          <p className="text-xs text-slate-gray">
            Environmental threshold alarms, moisture deficit alerts, and equipment anomalies
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-graphite border border-border-gray rounded p-0.5 text-xs">
            {(['ALL', 'CRITICAL', 'WARNING', 'INFO'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-3 py-1 rounded transition-colors ${
                  filterSeverity === sev
                    ? 'bg-cerulean text-pure-white font-medium'
                    : 'text-slate-gray hover:text-pure-white'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          <label className="flex items-center space-x-2 text-xs text-slate-gray bg-graphite border border-border-gray rounded px-3 py-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={unresolvedOnly}
              onChange={(e) => setUnresolvedOnly(e.target.checked)}
              className="rounded border-border-gray text-cerulean focus:ring-0 bg-obsidian"
            />
            <span>Unresolved Only</span>
          </label>
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-graphite border border-border-gray rounded-md p-8 text-center text-xs text-slate-gray">
            No alerts matching current filter parameters.
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            let badgeClass = 'bg-cerulean/15 text-cerulean border-cerulean/30';
            let Icon = Info;

            if (alert.severity === 'CRITICAL') {
              badgeClass = 'bg-neon-rose/15 text-neon-rose border-neon-rose/30';
              Icon = ShieldAlert;
            } else if (alert.severity === 'WARNING') {
              badgeClass = 'bg-amber-alert/15 text-amber-alert border-amber-alert/30';
              Icon = AlertTriangle;
            }

            return (
              <div
                key={alert.id}
                className="bg-graphite border border-border-gray rounded-md p-4 flex flex-wrap items-start justify-between gap-4"
              >
                <div className="flex items-start space-x-3.5">
                  <div className={`p-2 rounded border mt-0.5 ${badgeClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2.5">
                      <h3 className="text-sm font-semibold text-pure-white">{alert.title}</h3>
                      <span className={`px-2 py-0.2 rounded text-[10px] font-mono border ${badgeClass}`}>
                        {alert.severity}
                      </span>
                      {alert.is_acknowledged && (
                        <span className="text-[10px] text-slate-gray font-mono bg-obsidian border border-border-gray px-1.5 py-0.2 rounded">
                          ACKNOWLEDGED
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-gray mt-1 leading-relaxed">{alert.message}</p>
                    <div className="text-[10px] text-slate-gray/70 font-mono mt-2">
                      Timestamp: {new Date(alert.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-center sm:self-auto">
                  {!alert.is_acknowledged && (
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      className="inline-flex items-center space-x-1.5 bg-obsidian border border-border-gray hover:border-cerulean text-pure-white px-3 py-1.5 rounded text-xs transition-colors"
                    >
                      <Check className="w-3.5 h-3.5 text-cerulean" />
                      <span>Acknowledge</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
