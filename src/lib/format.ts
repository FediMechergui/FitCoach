/** Display formatting helpers, unit-aware where relevant. */

export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

/** Compact clock like "45m" / "1h 20m" for recaps. */
export function formatDurationLong(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

export function kgToLb(kg: number): number {
  return kg * 2.2046226218;
}

export function lbToKg(lb: number): number {
  return lb / 2.2046226218;
}

export function cmToFtIn(cm: number): { ft: number; inch: number } {
  const totalIn = cm / 2.54;
  return { ft: Math.floor(totalIn / 12), inch: Math.round(totalIn % 12) };
}

export function formatWeight(kg: number, unit: 'metric' | 'imperial'): string {
  if (unit === 'imperial') return `${kgToLb(kg).toFixed(1)} lb`;
  return `${kg.toFixed(1)} kg`;
}

export function formatDistance(meters: number, unit: 'metric' | 'imperial'): string {
  if (unit === 'imperial') {
    const miles = meters / 1609.344;
    return miles >= 0.1 ? `${miles.toFixed(2)} mi` : `${Math.round(meters * 1.09361)} yd`;
  }
  return meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${Math.round(meters)} m`;
}

/** Pace in seconds-per-km → "m:ss /km" (or /mi in imperial). */
export function formatPace(secPerKm: number | null | undefined, unit: 'metric' | 'imperial'): string {
  if (!secPerKm || !isFinite(secPerKm) || secPerKm <= 0) return '—';
  const perUnit = unit === 'imperial' ? secPerKm * 1.609344 : secPerKm;
  const m = Math.floor(perUnit / 60);
  const s = Math.round(perUnit % 60);
  return `${m}:${String(s).padStart(2, '0')} /${unit === 'imperial' ? 'mi' : 'km'}`;
}

export function formatCalories(kcal: number): string {
  return `${Math.round(kcal)} kcal`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Format any number for display with at most `maxDecimals` decimal places, and
 * NO long floating-point tails: 0.22 stays 0.22, 0.00000025 becomes 0, 5 stays
 * "5" (trailing zeros stripped). Use this anywhere a computed/estimated value is
 * rendered so users never see 0.30000000000000004.
 */
export function fmtNum(value: number, maxDecimals = 2): string {
  if (value == null || !isFinite(value)) return '0';
  const rounded = Number(value.toFixed(maxDecimals));
  const safe = Object.is(rounded, -0) ? 0 : rounded;
  return String(safe);
}

export function round(value: number, decimals = 0): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}
