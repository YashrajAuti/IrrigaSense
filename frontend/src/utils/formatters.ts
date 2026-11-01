export function formatVolume(liters: number): string {
  if (liters >= 1000) {
    return `${(liters / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })} m³ (${liters.toLocaleString()} L)`;
  }
  return `${liters.toLocaleString(undefined, { maximumFractionDigits: 0 })} L`;
}

export function formatMoisture(percentage: number | null | undefined): string {
  if (percentage === null || percentage === undefined) return 'N/A';
  return `${percentage.toFixed(1)}% VWC`;
}

export function formatTemperature(celsius: number | null | undefined): string {
  if (celsius === null || celsius === undefined) return 'N/A';
  return `${celsius.toFixed(1)}°C`;
}

export function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
