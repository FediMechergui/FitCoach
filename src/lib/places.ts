import { haversine, type LatLng } from '@/lib/geo';

/**
 * Places — the arithmetic. Pure.
 *
 * A place is a name, a kind and, when the user has them, coordinates. Nothing
 * here knows about a network: distance is computed on the phone, the map is
 * a projection drawn on the phone, and "open in maps" hands the coordinates
 * to whatever map app the phone already has.
 */

/** What the map is drawn inside: the box Tunisia sits in, with a margin. */
export const TUNISIA_BOX = { south: 30.1, north: 37.7, west: 7.3, east: 11.9 } as const;

export function validCoords(lat: unknown, lng: unknown): boolean {
  return typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0);
}

/** Parse what someone typed into a coordinate field. Accepts a comma for the decimal. */
export function parseCoord(text: string, limit: 90 | 180): number | null {
  const t = text.trim().replace(',', '.');
  if (!t || !/^-?\d+(\.\d+)?$/.test(t)) return null;
  const v = Number(t);
  return Number.isFinite(v) && Math.abs(v) <= limit ? v : null;
}

export function distanceKm(from: LatLng | null, lat: number | null | undefined, lng: number | null | undefined): number | null {
  if (!from || !validCoords(lat, lng)) return null;
  return haversine(from, [lat as number, lng as number]) / 1000;
}

export function formatDistance(km: number | null): string {
  if (km == null) return '';
  if (km < 1) return `${Math.max(10, Math.round((km * 1000) / 10) * 10)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

/** Nearest first; places without coordinates keep their order, after the ones that have them. */
export function sortByDistance<T extends { latitude: number | null; longitude: number | null }>(items: T[], from: LatLng | null): Array<T & { km: number | null }> {
  const withKm = items.map((p, i) => ({ ...p, km: distanceKm(from, p.latitude, p.longitude), i }));
  withKm.sort((a, b) => {
    if (a.km == null && b.km == null) return a.i - b.i;
    if (a.km == null) return 1;
    if (b.km == null) return -1;
    return a.km - b.km || a.i - b.i;
  });
  return withKm.map(({ i: _i, ...rest }) => rest as T & { km: number | null });
}

/**
 * Where a coordinate falls on a map of the given size, north up. A plain
 * equirectangular projection, with longitude squeezed by the cosine of the
 * middle latitude so the country keeps its shape. Null when outside the box.
 */
export function projectToMap(lat: number, lng: number, width: number, height: number): { x: number; y: number } | null {
  const b = TUNISIA_BOX;
  if (!validCoords(lat, lng) || lat < b.south || lat > b.north || lng < b.west || lng > b.east) return null;
  const k = Math.cos((((b.south + b.north) / 2) * Math.PI) / 180);
  const spanX = (b.east - b.west) * k;
  const spanY = b.north - b.south;
  const scale = Math.min(width / spanX, height / spanY);
  const offX = (width - spanX * scale) / 2;
  const offY = (height - spanY * scale) / 2;
  return { x: offX + (lng - b.west) * k * scale, y: offY + (b.north - lat) * scale };
}

/** A geo: link any map app on the phone can open. The name is a label, not a search. */
export function geoUrl(lat: number, lng: number, name: string): string {
  const label = encodeURIComponent(name.replace(/[()]/g, ' ').trim().slice(0, 60));
  return `geo:${lat.toFixed(6)},${lng.toFixed(6)}?q=${lat.toFixed(6)},${lng.toFixed(6)}(${label})`;
}

export function parseActivities(csv: string | null | undefined): string[] {
  return (csv ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
