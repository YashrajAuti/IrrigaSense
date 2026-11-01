import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number;
  unit: string;
  statusLabel: string;
  statusColor: 'green' | 'amber' | 'rose' | 'blue';
  isSimulated?: boolean;
  trendDescription?: string;
  icon: LucideIcon;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  statusLabel,
  statusColor,
  isSimulated = true,
  trendDescription,
  icon: Icon,
}) => {
  const colorMap = {
    green: 'text-field-green border-field-green/30 bg-field-green/10',
    amber: 'text-amber-alert border-amber-alert/30 bg-amber-alert/10',
    rose: 'text-neon-rose border-neon-rose/30 bg-neon-rose/10',
    blue: 'text-cerulean border-cerulean/30 bg-cerulean/10',
  };

  const badgeClass = colorMap[statusColor] || colorMap.blue;

  return (
    <div className="bg-graphite border border-border-gray rounded-md p-4 flex flex-col justify-between hover:border-border-gray/80 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-gray">{title}</span>
        <div className="p-1.5 rounded bg-obsidian border border-border-gray text-slate-gray">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline space-x-2 my-1">
        <span className="text-2xl font-bold tracking-tight text-pure-white font-mono">
          {typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 1 }) : value}
        </span>
        <span className="text-xs font-mono text-slate-gray">{unit}</span>
      </div>

      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border-gray/50 text-[11px]">
        <span className={`px-2 py-0.5 rounded text-[10px] font-mono border font-medium ${badgeClass}`}>
          {statusLabel}
        </span>

        {isSimulated && (
          <span className="text-[10px] text-slate-gray/70 font-mono tracking-tight">
            SIMULATED
          </span>
        )}
      </div>

      {trendDescription && (
        <div className="text-[11px] text-slate-gray mt-1.5 truncate">
          {trendDescription}
        </div>
      )}
    </div>
  );
};
