/**
 * The outdoor "parameters" — how GPS behaves, what it tells you on the way,
 * and how a finished route is drawn and shared. Pure: defaults and validation
 * only; the stored copy lives in the key-value store (repositories/outdoorRepo).
 */

export type GpsAccuracy = 'precise' | 'balanced' | 'saver';
export type MapStyle = 'dark' | 'light' | 'warm';

export interface OutdoorSettings {
  /** how hard the receiver works: fixes more often and finer, or less battery */
  accuracy: GpsAccuracy;
  /** pause by itself at a crossing or in a vehicle */
  autoPause: boolean;
  /** a notification at every split (each km by default) */
  splitAlerts: boolean;
  splitM: number;
  /**
   * Real map pictures behind a finished route. 'unset' until asked once: the
   * pictures come from a map server, which then sees the area of the route.
   */
  realMap: 'unset' | 'on' | 'off';
  mapStyle: MapStyle;
  /**
   * Metres cut from each end of a route on anything SHARED — where a walk starts
   * and ends is usually your door. The app's own screens always show it all.
   */
  hideEndsM: number;
  /** distance markers (1 km, 2 km…) along a drawn route */
  kmMarkers: boolean;
}

export const DEFAULT_OUTDOOR_SETTINGS: OutdoorSettings = {
  accuracy: 'balanced',
  autoPause: true,
  splitAlerts: true,
  splitM: 1000,
  realMap: 'unset',
  mapStyle: 'dark',
  hideEndsM: 200,
  kmMarkers: true,
};

export const ACCURACY_LABEL: Record<GpsAccuracy, string> = {
  precise: 'Precise',
  balanced: 'Balanced',
  saver: 'Battery saver',
};

export const ACCURACY_NOTE: Record<GpsAccuracy, string> = {
  precise: 'A fix every 2 s and every 3 m. Best for track reps and twisting trails; uses the most battery.',
  balanced: 'A fix every 3 s and every 5 m. Right for most walks, runs and rides.',
  saver: 'A fix every 5 s and every 10 m. For long hikes where the battery matters more than the corners.',
};

/** Receiver settings per mode: [ms between fixes, metres between fixes]. */
export const ACCURACY_INTERVALS: Record<GpsAccuracy, { timeMs: number; distanceM: number }> = {
  precise: { timeMs: 2000, distanceM: 3 },
  balanced: { timeMs: 3000, distanceM: 5 },
  saver: { timeMs: 5000, distanceM: 10 },
};

export const SPLIT_OPTIONS_M = [500, 1000, 1609, 2000, 5000] as const;
export const HIDE_ENDS_OPTIONS_M = [0, 100, 200, 500] as const;

export const MAP_STYLE_LABEL: Record<MapStyle, string> = {
  dark: 'Night',
  light: 'Day',
  warm: 'Medina',
};

export function sanitizeOutdoorSettings(v: unknown): OutdoorSettings {
  const o = (v && typeof v === 'object' ? v : {}) as Partial<OutdoorSettings>;
  const d = DEFAULT_OUTDOOR_SETTINGS;
  return {
    accuracy: o.accuracy === 'precise' || o.accuracy === 'saver' || o.accuracy === 'balanced' ? o.accuracy : d.accuracy,
    autoPause: typeof o.autoPause === 'boolean' ? o.autoPause : d.autoPause,
    splitAlerts: typeof o.splitAlerts === 'boolean' ? o.splitAlerts : d.splitAlerts,
    splitM: typeof o.splitM === 'number' && (SPLIT_OPTIONS_M as readonly number[]).includes(o.splitM) ? o.splitM : d.splitM,
    realMap: o.realMap === 'on' || o.realMap === 'off' ? o.realMap : 'unset',
    mapStyle: o.mapStyle === 'light' || o.mapStyle === 'warm' || o.mapStyle === 'dark' ? o.mapStyle : d.mapStyle,
    hideEndsM: typeof o.hideEndsM === 'number' && (HIDE_ENDS_OPTIONS_M as readonly number[]).includes(o.hideEndsM) ? o.hideEndsM : d.hideEndsM,
    kmMarkers: typeof o.kmMarkers === 'boolean' ? o.kmMarkers : d.kmMarkers,
  };
}

/** Which split a cumulative distance has reached (0 before the first). */
export function splitIndex(distanceM: number, splitM: number): number {
  return splitM > 0 && distanceM > 0 ? Math.floor(distanceM / splitM) : 0;
}

export function splitLabel(index: number, splitM: number): string {
  if (splitM === 1609) return `Mile ${index}`;
  if (splitM === 1000) return `Km ${index}`;
  const km = (index * splitM) / 1000;
  return `${Number.isInteger(km) ? km : km.toFixed(1)} km`;
}
