import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { SensorReading } from '../types';

interface EnvironmentalChartProps {
  readings: SensorReading[];
}

export const EnvironmentalChart: React.FC<EnvironmentalChartProps> = ({ readings }) => {
  const [activeSeries, setActiveSeries] = useState<'both' | 'temp' | 'humidity'>('both');

  const chartData = readings.map((r) => {
    const d = new Date(r.timestamp);
    const label = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    return {
      timestamp: label,
      temperature: r.air_temperature_c,
      humidity: r.relative_humidity_percent,
    };
  });

  return (
    <div className="bg-graphite border border-border-gray rounded-md p-4">
      {/* Header & Series Selectors */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-pure-white">Atmospheric & Canopy Conditions</h2>
          <span className="text-xs text-slate-gray">
            Ambient Air Temperature (°C) & Relative Humidity (% RH)
          </span>
        </div>

        <div className="flex items-center space-x-1 bg-obsidian border border-border-gray rounded p-0.5">
          <button
            onClick={() => setActiveSeries('both')}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              activeSeries === 'both' ? 'bg-cerulean text-pure-white font-medium' : 'text-slate-gray hover:text-pure-white'
            }`}
          >
            Combined
          </button>
          <button
            onClick={() => setActiveSeries('temp')}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              activeSeries === 'temp' ? 'bg-cerulean text-pure-white font-medium' : 'text-slate-gray hover:text-pure-white'
            }`}
          >
            Temp Only
          </button>
          <button
            onClick={() => setActiveSeries('humidity')}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              activeSeries === 'humidity' ? 'bg-cerulean text-pure-white font-medium' : 'text-slate-gray hover:text-pure-white'
            }`}
          >
            Humidity Only
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 w-full">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-gray">
            No atmospheric telemetry records available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#292C33" vertical={false} />

              <XAxis
                dataKey="timestamp"
                stroke="#8B929E"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#292C33' }}
              />

              {(activeSeries === 'both' || activeSeries === 'temp') && (
                <YAxis
                  yAxisId="left"
                  stroke="#E8AD45"
                  fontSize={11}
                  domain={[15, 45]}
                  tickLine={false}
                  axisLine={{ stroke: '#292C33' }}
                  unit="°C"
                />
              )}

              {(activeSeries === 'both' || activeSeries === 'humidity') && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#2A9DDB"
                  fontSize={11}
                  domain={[20, 100]}
                  tickLine={false}
                  axisLine={{ stroke: '#292C33' }}
                  unit="%"
                />
              )}

              <Tooltip
                contentStyle={{
                  backgroundColor: '#111114',
                  borderColor: '#292C33',
                  borderRadius: '4px',
                  color: '#F5F7FA',
                  fontSize: '12px',
                }}
              />

              {(activeSeries === 'both' || activeSeries === 'temp') && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="temperature"
                  name="Temperature (°C)"
                  stroke="#E8AD45"
                  strokeWidth={2}
                  dot={false}
                />
              )}

              {(activeSeries === 'both' || activeSeries === 'humidity') && (
                <Line
                  yAxisId={activeSeries === 'both' ? 'right' : 'left'}
                  type="monotone"
                  dataKey="humidity"
                  name="Humidity (% RH)"
                  stroke="#2A9DDB"
                  strokeWidth={2}
                  dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="flex items-center space-x-4 text-[11px] text-slate-gray mt-3 pt-2.5 border-t border-border-gray/50">
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-0.5 bg-amber-alert inline-block"></span>
          <span>Air Temperature (°C)</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-0.5 bg-cerulean inline-block"></span>
          <span>Relative Humidity (% RH)</span>
        </div>
      </div>
    </div>
  );
};
