import { haversine, type LatLng } from './geo';

/**
 * Real-map geometry — Web Mercator, the projection every slippy map uses.
 *
 * Pure: no network, no React. Given a route and a box to draw it in, this
 * picks the zoom that fits the whole route, the tiles that cover the box and
 * where each one goes, and where every point of the route lands on top of
 * them. The tiles themselves are fetched by services/mapTiles.
 *
 * Distances are in display points ("dp"). A tile is drawn TILE_DP points wide —
 * half its 256 pixels — so on a phone screen each tile pixel is roughly one
 * screen pixel and the map stays crisp, at the price of one zoom level more.
 */

export const TILE_PX = 256;
export const TILE_DP = 128;
export const MIN_ZOOM = 3;
/** Tiles above this add nothing for a walk and cost the map server more. */
export const MAX_ZOOM = 17;
/** No route ever needs more tiles than this; a bigger box is a bug. */
export const MAX_TILES = 48;

const MAX_LAT = 85.05112878;

export function worldX(lng: number, z: number, tileDp = TILE_DP): number {
  return ((lng + 180) / 360) * Math.pow(2, z) * tileDp;
}

export function worldY(lat: number, z: number, tileDp = TILE_DP): number {
  const clamped = Math.max(-MAX_LAT, Math.min(MAX_LAT, lat));
  const r = (clamped * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * Math.pow(2, z) * tileDp;
}

export interface MapTile {
  z: number;
  x: number;
  y: number;
  /** where it is drawn inside the box */
  left: number;
  top: number;
  key: string;
}

export interface MapViewport {
  z: number;
  width: number;
  height: number;
  /** world position of the box's top-left corner, at this zoom */
  originX: number;
  originY: number;
  tiles: MapTile[];
}

/**
 * The deepest zoom at which the route, plus padding, fits the box — centred.
 * Returns null for a route with fewer than two distinct points.
 */
export function fitViewport(
  route: LatLng[],
  width: number,
  height: number,
  opts: { pad?: number; maxZoom?: number; tileDp?: number } = {}
): MapViewport | null {
  if (route.length < 2 || !(width > 0) || !(height > 0)) return null;
  const pad = opts.pad ?? 24;
  const tileDp = opts.tileDp ?? TILE_DP;
  const maxZoom = Math.min(MAX_ZOOM, opts.maxZoom ?? MAX_ZOOM);
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;
  for (const [lat, lng] of route) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  }
  if (!Number.isFinite(minLat) || (maxLat - minLat < 1e-7 && maxLng - minLng < 1e-7)) return null;

  const innerW = Math.max(1, width - pad * 2);
  const innerH = Math.max(1, height - pad * 2);
  let z = maxZoom;
  for (; z > MIN_ZOOM; z--) {
    const w = worldX(maxLng, z, tileDp) - worldX(minLng, z, tileDp);
    const h = worldY(minLat, z, tileDp) - worldY(maxLat, z, tileDp);
    if (w <= innerW && h <= innerH) break;
  }
  const cx = (worldX(minLng, z, tileDp) + worldX(maxLng, z, tileDp)) / 2;
  const cy = (worldY(maxLat, z, tileDp) + worldY(minLat, z, tileDp)) / 2;
  const originX = cx - width / 2;
  const originY = cy - height / 2;

  const n = Math.pow(2, z);
  const tiles: MapTile[] = [];
  const x0 = Math.floor(originX / tileDp);
  const x1 = Math.floor((originX + width) / tileDp);
  const y0 = Math.max(0, Math.floor(originY / tileDp));
  const y1 = Math.min(n - 1, Math.floor((originY + height) / tileDp));
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const wrapped = ((tx % n) + n) % n;
      tiles.push({ z, x: wrapped, y: ty, left: tx * tileDp - originX, top: ty * tileDp - originY, key: `${z}/${wrapped}/${ty}` });
    }
  }
  if (tiles.length > MAX_TILES) return null;
  return { z, width, height, originX, originY, tiles };
}

/** A route point's place inside the box. */
export function project(vp: MapViewport, p: LatLng, tileDp = TILE_DP): { x: number; y: number } {
  return { x: worldX(p[1], vp.z, tileDp) - vp.originX, y: worldY(p[0], vp.z, tileDp) - vp.originY };
}

/** SVG path data for a route on this viewport. */
export function routePath(vp: MapViewport, route: LatLng[], tileDp = TILE_DP): string {
  let d = '';
  for (let i = 0; i < route.length; i++) {
    const { x, y } = project(vp, route[i], tileDp);
    d += `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)} `;
  }
  return d.trim();
}

/**
 * Points along the route at every `everyM` metres: where the 1 km, 2 km…
 * markers go. Interpolated inside the segment that crosses each mark, so a
 * marker sits on the line exactly where that distance was reached.
 */
export function distanceMarks(route: LatLng[], everyM = 1000, max = 60): Array<{ m: number; at: LatLng }> {
  const marks: Array<{ m: number; at: LatLng }> = [];
  if (route.length < 2 || !(everyM > 0)) return marks;
  let walked = 0;
  let next = everyM;
  for (let i = 1; i < route.length && marks.length < max; i++) {
    const a = route[i - 1];
    const b = route[i];
    const seg = haversine(a, b);
    while (seg > 0 && walked + seg >= next && marks.length < max) {
      const t = (next - walked) / seg;
      marks.push({ m: next, at: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t] });
      next += everyM;
    }
    walked += seg;
  }
  return marks;
}

/**
 * How often to mark the route so the markers never crowd: every km up to
 * 12 km, then every 2, 5 or 10.
 */
export function markSpacingM(totalM: number): number {
  if (totalM <= 12_000) return 1000;
  if (totalM <= 25_000) return 2000;
  if (totalM <= 60_000) return 5000;
  return 10_000;
}

/**
 * The route with its first and last `metres` cut away — for anything that
 * leaves the phone. Where a walk starts and ends is usually a front door.
 * Keeps at least two points; a route too short to trim is cut to its middle.
 */
export function trimRouteEnds(route: LatLng[], metres: number): LatLng[] {
  if (!(metres > 0) || route.length < 3) return route;
  const cum: number[] = [0];
  for (let i = 1; i < route.length; i++) cum.push(cum[i - 1] + haversine(route[i - 1], route[i]));
  const total = cum[cum.length - 1];
  if (total <= metres * 2 + 50) {
    const mid = Math.floor(route.length / 2);
    return route.slice(Math.max(0, mid - 1), Math.min(route.length, mid + 1));
  }
  const kept = route.filter((_, i) => cum[i] >= metres && cum[i] <= total - metres);
  return kept.length >= 2 ? kept : route.slice(Math.floor(route.length / 2) - 1, Math.floor(route.length / 2) + 1);
}

/** The map server: OpenStreetMap's own standard tiles. One place to change it. */
export const TILE_PROVIDER = {
  name: 'OpenStreetMap',
  /** {z}/{x}/{y} only — the request carries nothing else */
  url: (z: number, x: number, y: number) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`,
  attribution: '© OpenStreetMap contributors',
} as const;
