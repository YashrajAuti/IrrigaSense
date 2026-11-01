import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { DashboardSummary } from '../types';

export function useDashboard(farmId?: number, fieldId?: number, zoneId?: number, pollIntervalMs = 30000) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      const data = await api.getDashboardSummary(farmId, fieldId, zoneId);
      setSummary(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard telemetry');
    } finally {
      setIsLoading(false);
    }
  }, [farmId, fieldId, zoneId]);

  useEffect(() => {
    setIsLoading(true);
    fetchSummary();

    if (pollIntervalMs > 0) {
      const interval = setInterval(fetchSummary, pollIntervalMs);
      return () => clearInterval(interval);
    }
  }, [fetchSummary, pollIntervalMs]);

  return { summary, isLoading, error, refetch: fetchSummary };
}
