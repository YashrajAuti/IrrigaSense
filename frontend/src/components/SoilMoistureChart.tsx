import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { SensorReading } from '../types';

interface SoilMoistureChartProps {
  readings: SensorReading[];
  timeframe: '24h' | '7d' | '30d';
  onTimeframeChange: (tf: '24h' | '7d' | '30d') => void;
  lowerThreshold?: number;
  upperThreshold?: number;
}

export const SoilMoistureChart: React.FC<SoilMoistureChartProps> = ({
  readings,
  timeframe,
  onTimeframeChange,
  lowerThreshold = 40,
  upperThreshold = 65,
}) => {
  const chartData = readings.map((r) => {
    const d = new Date(r.timestamp);
    const label =
      timeframe === '24h'
        ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
        : `${d.getMonth() + 1}/${d.getDate()} ${d.toLocaleTimeString([], { hour: '2-digit', hour12: false })}:00`;

    return {
      timestamp: label,
      rawTime: r.timestamp,
      moisture: r.soil_moisture_percent,
    };
  });

  return (
    <div className="bg-graphite border border-border-gray rounded-md p-4">
      {/* Header & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-pure-white">Soil Moisture Telemetry History</h2>
          <span className="text-xs text-slate-gray">
            Volumetric Water Content (% VWC) &bull; Simulated In-Situ Probes
          </span>
        </div>

        <div className="flex items-center space-x-1 bg-obsidian border border-border-gray rounded p-0.5">
          {(['24h', '7d', '30d'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeframeChange(tf)}
              className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                timeframe === tf
                  ? 'bg-cerulean text-pure-white font-medium'
                  : 'text-slate-gray hover:text-pure-white'
              }`}
            >
              {tf === '24h' ? '24h' : tf === '7d' ? '7d' : '30d'}
            </button>
          ))}
        </div>
      </div>

      {/* Recharts Area Container */}
      <div className="h-64 w-full">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-gray">
            No telemetry records available for this interval.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="moistureGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2A9DDB" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#2A9DDB" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#292C33" vertical={false} />

              <XAxis
                dataKey="timestamp"
                stroke="#8B929E"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#292C33' }}
              />

              <YAxis
                stroke="#8B929E"
                fontSize={11}
                domain={[20, 90]}
                tickLine={false}
                axisLine={{ stroke: '#292C33' }}
                unit="%"
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: '#111114',
                  borderColor: '#292C33',
                  borderRadius: '4px',
                  color: '#F5F7FA',
                  fontSize: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                }}
                formatter={(value: any) => [`${Number(value).toFixed(1)}%`, 'Soil Moisture']}
                labelFormatter={(label) => `Time: ${label}`}
              />

              {/* Threshold Lines */}
              <ReferenceLine
                y={lowerThreshold}
                stroke="#E8AD45"
                strokeDasharray="4 4"
                label={{
                  value: `Min (${lowerThreshold}%)`,
                  fill: '#E8AD45',
                  fontSize: 10,
                  position: 'insideBottomRight',
                }}
              />
              <ReferenceLine
                y={upperThreshold}
                stroke="#49B675"
                strokeDasharray="4 4"
                label={{
                  value: `Max (${upperThreshold}%)`,
                  fill: '#49B675',
                  fontSize: 10,
                  position: 'insideTopRight',
                }}
              />

              <Area
                type="monotone"
                dataKey="moisture"
                stroke="#2A9DDB"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#moistureGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Chart Legend */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-gray mt-3 pt-2.5 border-t border-border-gray/50">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-0.5 bg-cerulean inline-block"></span>
            <span>Recorded Moisture</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-0.5 border-b border-dashed border-amber-alert inline-block"></span>
            <span>Lower Threshold ({lowerThreshold}%)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-0.5 border-b border-dashed border-field-green inline-block"></span>
            <span>Upper Threshold ({upperThreshold}%)</span>
          </div>
        </div>

        <span className="font-mono text-[10px]">Data points: {chartData.length}</span>
      </div>
    </div>
  );
};
