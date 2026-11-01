import React from 'react';
import { Info } from 'lucide-react';

export const DemoModeBanner: React.FC = () => {
  return (
    <div className="bg-obsidian border-b border-border-gray px-4 py-2 flex items-center justify-between text-xs text-slate-gray">
      <div className="flex items-center space-x-2">
        <Info className="w-3.5 h-3.5 text-cerulean shrink-0" />
        <span>
          <strong className="text-pure-white font-medium">Simulation Environment:</strong> All telemetry readings, moisture trends, and pump states are dynamically simulated. No physical pump, valve, or hardware sensor is connected.
        </span>
      </div>
      <div className="hidden sm:block text-[11px] font-mono text-slate-gray/80">
        Engine: Rule-Based Deterministic
      </div>
    </div>
  );
};
