import React from 'react';
import { IrrigationEvent, AlertEvent, SensorReading } from '../types';
import { Power, AlertTriangle, Activity, Bell } from 'lucide-react';

interface RecentActivityListProps {
  events: IrrigationEvent[];
  alerts: AlertEvent[];
  latestReading?: SensorReading | null;
}

export const RecentActivityList: React.FC<RecentActivityListProps> = ({
  events,
  alerts,
  latestReading,
}) => {
  // Combine activities into a unified chronological timeline
  type TimelineItem = {
    id: string;
    type: 'irrigation' | 'alert' | 'sensor';
    title: string;
    description: string;
    time: string;
    severity?: string;
  };

  const items: TimelineItem[] = [];

  events.slice(0, 4).forEach((e) => {
    items.push({
      id: `event-${e.id}`,
      type: 'irrigation',
      title: `Irrigation: ${e.action} (${e.trigger_type})`,
      description: e.notes || `Zone ${e.zone_id} runtime: ${e.runtime_minutes}m, ${e.estimated_water_liters}L`,
      time: e.started_at,
    });
  });

  alerts.slice(0, 3).forEach((a) => {
    items.push({
      id: `alert-${a.id}`,
      type: 'alert',
      title: a.title,
      description: a.message,
      time: a.created_at,
      severity: a.severity,
    });
  });

  if (latestReading) {
    items.push({
      id: `reading-${latestReading.id}`,
      type: 'sensor',
      title: 'Telemetry Heartbeat Ingested',
      description: `Moisture: ${latestReading.soil_moisture_percent.toFixed(1)}% | Temp: ${latestReading.air_temperature_c.toFixed(1)}°C | RH: ${latestReading.relative_humidity_percent.toFixed(1)}%`,
      time: latestReading.timestamp,
    });
  }

  // Sort descending by timestamp
  items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return (
    <div className="bg-graphite border border-border-gray rounded-md p-4">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-border-gray">
        <h2 className="text-sm font-semibold text-pure-white">Recent Field Activity & Logs</h2>
        <span className="text-xs text-slate-gray font-mono">Real-time Stream</span>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="text-xs text-slate-gray py-4 text-center">No recent activity logged.</div>
        ) : (
          items.map((item) => {
            let Icon = Activity;
            let iconClass = 'text-cerulean bg-cerulean/10 border-cerulean/20';

            if (item.type === 'irrigation') {
              Icon = Power;
              iconClass = 'text-field-green bg-field-green/10 border-field-green/20';
            } else if (item.type === 'alert') {
              Icon = item.severity === 'CRITICAL' ? AlertTriangle : Bell;
              iconClass =
                item.severity === 'CRITICAL'
                  ? 'text-neon-rose bg-neon-rose/10 border-neon-rose/20'
                  : 'text-amber-alert bg-amber-alert/10 border-amber-alert/20';
            }

            const formattedTime = new Date(item.time).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            });

            return (
              <div key={item.id} className="flex items-start space-x-3 text-xs">
                <div className={`p-1.5 rounded border shrink-0 mt-0.5 ${iconClass}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-pure-white truncate">{item.title}</span>
                    <span className="text-[10px] text-slate-gray font-mono shrink-0 ml-2">
                      {formattedTime}
                    </span>
                  </div>
                  <p className="text-slate-gray text-[11px] truncate mt-0.5">{item.description}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
