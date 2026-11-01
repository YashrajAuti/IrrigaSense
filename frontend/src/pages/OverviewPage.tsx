import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../layouts/AppLayout';
import { api } from '../services/api';
import { DashboardSummary, SensorReading } from '../types';
import { MetricCard } from '../components/MetricCard';
import { RecommendationPanel } from '../components/RecommendationPanel';
import { SoilMoistureChart } from '../components/SoilMoistureChart';
import { EnvironmentalChart } from '../components/EnvironmentalChart';
import { ZonesTable } from '../components/ZonesTable';
import { RecentActivityList } from '../components/RecentActivityList';
import { Droplet, Thermometer, CloudRain, Waves, RefreshCw, Power } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const OverviewPage: React.FC = () => {
  const context = useContext(AppContext);
  const navigate = useNavigate();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('24h');
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const data = await api.getDashboardSummary(
        context?.selectedFarmId || undefined,
        context?.selectedFieldId || undefined,
        selectedZoneId || undefined
      );
      setSummary(data);
      if (!selectedZoneId && data.zone) {
        setSelectedZoneId(data.zone.id);
      }

      // Load timeframe readings for chart
      const historyReadings = await api.getReadings(
        selectedZoneId || data.zone?.id || undefined,
        timeframe
      );
      setReadings(historyReadings);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [context?.selectedFarmId, context?.selectedFieldId, selectedZoneId, timeframe]);

  const handleZoneSelect = (zoneId: number) => {
    setSelectedZoneId(zoneId);
  };

  const handleQuickToggleZone = async (zoneId: number, currentPumpState: string) => {
    try {
      const isRunning = currentPumpState === 'ON';
      const response = await api.executeIrrigationCommand({
        zone_id: zoneId,
        action: isRunning ? 'STOP' : 'START',
        mode: 'Manual',
        runtime_minutes: 30,
        target_depth_mm: 4.0,
      });
      setActionMessage(response.message);
      setTimeout(() => setActionMessage(null), 5000);
      loadDashboard();
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`);
      setTimeout(() => setActionMessage(null), 5000);
    }
  };

  const handleReviewAction = () => {
    // Navigate to full Irrigation Control page
    navigate('/irrigation-control');
  };

  if (isLoading && !summary) {
    return (
      <div className="h-96 flex items-center justify-center space-x-3 text-slate-gray">
        <RefreshCw className="w-5 h-5 animate-spin text-cerulean" />
        <span className="text-sm font-medium">Loading telemetry and agricultural models...</span>
      </div>
    );
  }

  const metrics = summary?.metrics;

  return (
    <div className="space-y-6">
      {/* Action Notification Toast */}
      {actionMessage && (
        <div className="bg-graphite border border-cerulean/40 text-pure-white px-4 py-2.5 rounded text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-2">
            <Power className="w-4 h-4 text-cerulean" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-slate-gray hover:text-pure-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Header Info Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-pure-white">
            {summary?.field ? `${summary.field.name} (${summary.field.crop_type})` : 'Farm Overview'}
          </h1>
          <p className="text-xs text-slate-gray">
            Soil Matrix: {summary?.field?.soil_type || 'Clay Loam'} &bull; Area: {summary?.field?.area_sqm.toLocaleString() || '4,000'} m² &bull; Active Drip Zones
          </p>
        </div>

        <button
          onClick={loadDashboard}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded bg-graphite border border-border-gray hover:bg-obsidian text-xs text-slate-gray hover:text-pure-white transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Soil Moisture (% VWC)"
          value={metrics?.soil_moisture?.value ?? 42.0}
          unit="%"
          statusLabel={metrics?.soil_moisture?.status_label ?? 'Optimal'}
          statusColor={metrics?.soil_moisture?.status_color ?? 'green'}
          trendDescription={metrics?.soil_moisture?.trend_description}
          icon={Droplet}
        />
        <MetricCard
          title="Air Temperature"
          value={metrics?.air_temperature?.value ?? 28.5}
          unit="°C"
          statusLabel={metrics?.air_temperature?.status_label ?? 'Normal'}
          statusColor={metrics?.air_temperature?.status_color ?? 'blue'}
          trendDescription={metrics?.air_temperature?.trend_description}
          icon={Thermometer}
        />
        <MetricCard
          title="Relative Humidity"
          value={metrics?.relative_humidity?.value ?? 58.0}
          unit="%"
          statusLabel={metrics?.relative_humidity?.status_label ?? 'Moderate'}
          statusColor={metrics?.relative_humidity?.status_color ?? 'blue'}
          trendDescription={metrics?.relative_humidity?.trend_description}
          icon={CloudRain}
        />
        <MetricCard
          title="Water Requirement"
          value={metrics?.water_requirement?.value ?? 0}
          unit="L"
          statusLabel={metrics?.water_requirement?.status_label ?? 'Optimal'}
          statusColor={metrics?.water_requirement?.status_color ?? 'green'}
          trendDescription={metrics?.water_requirement?.trend_description}
          icon={Waves}
        />
      </div>

      {/* Recommendation Engine Banner */}
      {summary?.recommendation && (
        <RecommendationPanel
          recommendation={summary.recommendation}
          onReviewAction={handleReviewAction}
        />
      )}

      {/* Telemetry Charts: Soil Moisture & Environmental */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SoilMoistureChart
          readings={readings}
          timeframe={timeframe}
          onTimeframeChange={setTimeframe}
          lowerThreshold={summary?.field?.lower_moisture_threshold}
          upperThreshold={summary?.field?.upper_moisture_threshold}
        />
        <EnvironmentalChart readings={readings.slice(-48)} />
      </div>

      {/* Zones Table & Recent Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ZonesTable
            zones={summary?.zones_overview || []}
            selectedZoneId={selectedZoneId || undefined}
            onSelectZone={handleZoneSelect}
            onQuickToggleZone={handleQuickToggleZone}
          />
        </div>
        <div className="lg:col-span-1">
          <RecentActivityList
            events={summary?.recent_events || []}
            alerts={summary?.active_alerts || []}
            latestReading={readings.length > 0 ? readings[readings.length - 1] : null}
          />
        </div>
      </div>
    </div>
  );
};
