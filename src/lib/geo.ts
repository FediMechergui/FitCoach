/**
 * Geo helpers for GPS route tracking (runs / outdoor sessions).
 * A route point is a [latitude, longitude] tuple. Distances are metres.
 */
export type LatLng = [number, number];

const R = 6_371_000; // Earth radius (m)
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance between two points, in metres (haversine). */
export function haversine(a: LatLng, b: LatLng): number {
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Total path length of a route (sum of segment distances), metres. */
export function routeDistanceM(route: LatLng[]): number {
  let total = 0;
  for (let i = 1; i < route.length; i++) total += haversine(route[i - 1], route[i]);
  return total;
}

/**
 * Project a lat/lng route into 0..1 x/y coordinates for drawing a "circuit"
 * shape. Aspect ratio is preserved (both axes share one scale) and the shape is
 * centred in the unit box; latitude is flipped so north is up. Returns null if
 * there aren't enough distinct points to draw.
 */
export function normalizeRoute(route: LatLng[]): { points: Array<{ x: number; y: number }> } | null {
  if (route.length < 2) return null;
  const lats = route.map((p) => p[0]);
  const lngs = route.map((p) => p[1]);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const midLat = (minLat + maxLat) / 2;

  // Metres from the min corner (longitude corrected for latitude).
  const latSpanM = (maxLat - minLat) * 111_320;
  const lngSpanM = (maxLng - minLng) * 111_320 * Math.cos(toRad(midLat));
  if (latSpanM < 1 && lngSpanM < 1) return null; // essentially stationary

  // Shared scale preserves the real shape; centre within the 0..1 box.
  const span = Math.max(latSpanM, lngSpanM, 1);
  const offX = (span - lngSpanM) / 2;
  const offY = (span - latSpanM) / 2;
  const points = route.map((p) => {
    const xM = (p[1] - minLng) * 111_320 * Math.cos(toRad(midLat));
    const yM = (p[0] - minLat) * 111_320;
    return {
      x: (offX + xM) / span,
      y: 1 - (offY + yM) / span, // flip so north is up
    };
  });
  return { points };
}

export function parseRoute(json: string | null | undefined): LatLng[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    if (Array.isArray(arr)) return arr.filter((p) => Array.isArray(p) && p.length === 2) as LatLng[];
  } catch {
    /* ignore malformed */
  }
  return [];
}
