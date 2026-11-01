import React, { useState, useEffect } from 'react';
import { Farm, Field } from '../types';
import { AlertCircle, Wifi, WifiOff, Clock } from 'lucide-react';

interface TopBarProps {
  farms: Farm[];
  fields: Field[];
  selectedFarmId: number | null;
  selectedFieldId: number | null;
  onSelectFarm: (id: number) => void;
  onSelectField: (id: number) => void;
  isConnected: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  farms,
  fields,
  selectedFarmId,
  selectedFieldId,
  onSelectFarm,
  onSelectField,
  isConnected,
}) => {
  const [currentDateTime, setCurrentDateTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentDateTime(
        now.toLocaleString('en-US', {
          timeZone: 'Asia/Kolkata',
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }) + ' IST'
      );
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 bg-obsidian border-b border-border-gray px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Product title & Selectors */}
      <div className="flex items-center space-x-3 sm:space-x-6 overflow-x-auto py-1">
        <div className="hidden lg:flex items-center space-x-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-gray">Farm:</span>
          <select
            value={selectedFarmId || ''}
            onChange={(e) => onSelectFarm(Number(e.target.value))}
            className="bg-graphite text-pure-white text-xs rounded border border-border-gray px-2.5 py-1.5 focus:border-cerulean focus:outline-none"
            aria-label="Select Farm"
          >
            {farms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-gray">Field:</span>
          <select
            value={selectedFieldId || ''}
            onChange={(e) => onSelectField(Number(e.target.value))}
            className="bg-graphite text-pure-white text-xs rounded border border-border-gray px-2.5 py-1.5 focus:border-cerulean focus:outline-none"
            aria-label="Select Field"
          >
            {fields.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.crop_type})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: Date/Time, Connection Status & Demo Indicator */}
      <div className="flex items-center space-x-3 sm:space-x-4 shrink-0">
        {/* Live Clock */}
        <div className="hidden md:flex items-center space-x-1.5 text-xs text-slate-gray font-mono bg-graphite/50 px-2.5 py-1 rounded border border-border-gray/60">
          <Clock className="w-3.5 h-3.5 text-slate-gray" />
          <span>{currentDateTime}</span>
        </div>

        {/* Connection status */}
        <div
          className={`flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded border ${
            isConnected
              ? 'bg-field-green/10 text-field-green border-field-green/20'
              : 'bg-neon-rose/10 text-neon-rose border-neon-rose/20'
          }`}
          title={isConnected ? 'Backend API connected' : 'Backend API disconnected'}
        >
          {isConnected ? (
            <>
              <Wifi className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-mono">ONLINE</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-mono">OFFLINE</span>
            </>
          )}
        </div>

        {/* Persistent Demo Mode Badge */}
        <div
          className="flex items-center space-x-1.5 bg-amber-alert/10 text-amber-alert border border-amber-alert/30 px-2.5 py-1 rounded text-xs font-mono font-medium tracking-wide shadow-sm"
          title="Operating in simulated demonstration mode without physical IoT hardware."
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">DEMO MODE — SIMULATED DATA</span>
          <span className="sm:hidden">SIMULATED</span>
        </div>
      </div>
    </header>
  );
};
