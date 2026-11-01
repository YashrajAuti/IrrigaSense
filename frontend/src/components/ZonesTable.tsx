import React from 'react';
import { ZoneOverviewItem } from '../types';
import { Power, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface ZonesTableProps {
  zones: ZoneOverviewItem[];
  selectedZoneId?: number;
  onSelectZone: (zoneId: number) => void;
  onQuickToggleZone?: (zoneId: number, currentPumpState: string) => void;
}

export const ZonesTable: React.FC<ZonesTableProps> = ({
  zones,
  selectedZoneId,
  onSelectZone,
  onQuickToggleZone,
}) => {
  return (
    <div className="bg-graphite border border-border-gray rounded-md overflow-hidden">
      <div className="p-4 border-b border-border-gray flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-pure-white">Irrigation Management Zones</h2>
          <span className="text-xs text-slate-gray">
            Field parcels &bull; Dynamic operating status and simulated pump control
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-obsidian/60 text-slate-gray border-b border-border-gray font-mono text-[11px] uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">Zone & Field</th>
              <th className="px-4 py-3">Crop</th>
              <th className="px-4 py-3">Current Moisture</th>
              <th className="px-4 py-3">Operating Mode</th>
              <th className="px-4 py-3">Pump State</th>
              <th className="px-4 py-3">Last Irrigation</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-gray/60 text-pure-white">
            {zones.map((zone) => {
              const isSelected = selectedZoneId === zone.zone_id;
              const isPumpOn = zone.simulated_pump_state === 'ON';
              const isEmergency = zone.simulated_pump_state === 'EMERGENCY_STOPPED';

              let moistureBadgeClass = 'text-field-green bg-field-green/10 border-field-green/20';
              if (zone.soil_moisture < zone.lower_threshold) {
                moistureBadgeClass = 'text-neon-rose bg-neon-rose/10 border-neon-rose/20';
              } else if (zone.soil_moisture > zone.upper_threshold) {
                moistureBadgeClass = 'text-amber-alert bg-amber-alert/10 border-amber-alert/20';
              }

              const formattedTime =
                zone.last_irrigation && zone.last_irrigation !== 'Never'
                  ? new Date(zone.last_irrigation).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'No events logged';

              return (
                <tr
                  key={zone.zone_id}
                  onClick={() => onSelectZone(zone.zone_id)}
                  className={`hover:bg-obsidian/40 cursor-pointer transition-colors ${
                    isSelected ? 'bg-cerulean/5' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-pure-white flex items-center space-x-1.5">
                      <span>{zone.zone_name}</span>
                      {isSelected && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-cerulean/20 text-cerulean font-mono">
                          Active
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-gray">{zone.field_name}</span>
                  </td>

                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-obsidian border border-border-gray text-pure-white font-medium">
                      {zone.crop}
                    </span>
                  </td>

                  <td className="px-4 py-3 font-mono">
                    <span className={`px-2 py-0.5 rounded text-[11px] border font-medium ${moistureBadgeClass}`}>
                      {zone.soil_moisture.toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-slate-gray block mt-0.5">
                      Target: {zone.lower_threshold.toFixed(0)} - {zone.upper_threshold.toFixed(0)}%
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <span className="text-slate-gray font-mono">{zone.operating_mode}</span>
                  </td>

                  <td className="px-4 py-3 font-mono">
                    {isPumpOn && (
                      <span className="inline-flex items-center space-x-1 text-field-green bg-field-green/10 border border-field-green/30 px-2 py-0.5 rounded text-[11px] animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-field-green"></span>
                        <span>RUNNING (SIM)</span>
                      </span>
                    )}
                    {isEmergency && (
                      <span className="inline-flex items-center space-x-1 text-neon-rose bg-neon-rose/10 border border-neon-rose/30 px-2 py-0.5 rounded text-[11px]">
                        <AlertCircle className="w-3 h-3" />
                        <span>EMERGENCY STOP</span>
                      </span>
                    )}
                    {!isPumpOn && !isEmergency && (
                      <span className="text-slate-gray bg-obsidian border border-border-gray px-2 py-0.5 rounded text-[11px]">
                        STANDBY
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-slate-gray font-mono text-[11px]">
                    {formattedTime}
                  </td>

                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    {onQuickToggleZone && (
                      <button
                        onClick={() => onQuickToggleZone(zone.zone_id, zone.simulated_pump_state)}
                        className={`p-1.5 rounded border transition-colors ${
                          isPumpOn
                            ? 'bg-neon-rose/15 text-neon-rose border-neon-rose/30 hover:bg-neon-rose/25'
                            : 'bg-cerulean/15 text-cerulean border-cerulean/30 hover:bg-cerulean/25'
                        }`}
                        title={isPumpOn ? 'Stop simulated pump' : 'Start simulated pump'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
