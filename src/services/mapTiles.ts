import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';
import { TILE_PROVIDER, type MapTile } from '@/lib/mapTiles';

/**
 * Map tiles — the squares of real map behind a finished route.
 *
 * The privacy rule this app keeps for pictures holds here too: nothing on
 * screen is drawn from a web address. Each tile is downloaded once to the
 * phone and every map, and every shared story, is drawn from that file.
 *
 * What leaves the phone: a request for each square of map around the route,
 * named only by zoom, column and row (z/x/y). That tells the map server the
 * AREA the route is in — which is why the first real map asks before it is
 * drawn (Profile → Outdoor & GPS, or the prompt on the route). No route, no
 * time, no distance, no identity is ever sent.
 *
 * OpenStreetMap's tile servers are run by volunteers, and their usage policy
 * is kept: an identifying User-Agent, the attribution on every map, tiles kept
 * on the phone for a month rather than fetched again, at most two downloads at
 * once, and nothing fetched in advance or in bulk.
 */

const DIR = `${FileSystem.cacheDirectory ?? FileSystem.documentDirectory}map-tiles/osm/`;
const KEEP_MS = 30 * 86_400_000;
const PARALLEL = 2;

const version = (Constants.expoConfig?.version as string | undefined) ?? '2.0.0';
export const TILE_USER_AGENT = `FitCoach/${version} (personal fitness app; +https://github.com/FediMechergui/FitCoach)`;

function fileFor(t: Pick<MapTile, 'z' | 'x' | 'y'>): string {
  return `${DIR}${t.z}_${t.x}_${t.y}.png`;
}

let dirReady = false;
async function ensureDir(): Promise<void> {
  if (dirReady) return;
  try {
    await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
  } catch {
    // already there
  }
  dirReady = true;
}

/** A tile already on the phone and young enough to use, or null. */
async function cached(t: MapTile): Promise<string | null> {
  try {
    const uri = fileFor(t);
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists || !info.size) return null;
    const ageMs = info.modificationTime ? Date.now() - info.modificationTime * 1000 : 0;
    return ageMs < KEEP_MS ? uri : null;
  } catch {
    return null;
  }
}

async function download(t: MapTile): Promise<string | null> {
  const uri = fileFor(t);
  try {
    const res = await FileSystem.downloadAsync(TILE_PROVIDER.url(t.z, t.x, t.y), uri, {
      headers: { 'User-Agent': TILE_USER_AGENT },
    });
    if (res.status !== 200) {
      await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
      return null;
    }
    return res.uri;
  } catch {
    return null;
  }
}

/**
 * The local file for every tile, downloading what is missing. A tile that
 * cannot be had (offline, refused) maps to null and the map simply shows the
 * background there. Never throws.
 */
export async function loadTiles(tiles: MapTile[], onProgress?: (done: number, total: number) => void): Promise<Record<string, string | null>> {
  await ensureDir();
  const out: Record<string, string | null> = {};
  let done = 0;
  const queue = [...tiles];
  const worker = async () => {
    while (queue.length) {
      const t = queue.shift()!;
      out[t.key] = (await cached(t)) ?? (await download(t));
      done += 1;
      onProgress?.(done, tiles.length);
    }
  };
  await Promise.all(Array.from({ length: Math.min(PARALLEL, tiles.length) }, worker));
  return out;
}
