/**
 * YouTube without a player: the app is offline-first, so a video is a link
 * that opens the YouTube app (or browser) — the session keeps running in the
 * background, the rest timer is a timestamp, nothing is interrupted. What we
 * store is the 11-character video id; everything else derives from it.
 */

const ID_RE = /^[A-Za-z0-9_-]{11}$/;

/**
 * Pull a video id out of anything a person might paste: a watch URL, a
 * youtu.be short link, a Shorts link, an embed URL, a mobile URL, or the bare
 * id itself. Returns null when nothing usable is there.
 */
export function parseYouTubeId(input: string | null | undefined): string | null {
  if (!input) return null;
  const s = input.trim();
  if (ID_RE.test(s)) return s;
  const patterns = [
    /[?&]v=([A-Za-z0-9_-]{11})/, // watch?v=
    /youtu\.be\/([A-Za-z0-9_-]{11})/, // short link
    /\/shorts\/([A-Za-z0-9_-]{11})/, // shorts
    /\/embed\/([A-Za-z0-9_-]{11})/, // embed
    /\/live\/([A-Za-z0-9_-]{11})/, // live replays
    /\/v\/([A-Za-z0-9_-]{11})/, // legacy
  ];
  for (const re of patterns) {
    const m = s.match(re);
    if (m) return m[1];
  }
  return null;
}

export function youtubeWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}

/** hqdefault is the largest thumbnail that exists for every video. */
export function youtubeThumb(id: string): string {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

/** When no video is pinned, a search is still a door — never a dead end. */
export function youtubeSearchUrl(exerciseName: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${exerciseName} how to proper form`)}`;
}

export function formatVideoLength(lengthS: number | undefined | null): string | null {
  if (lengthS == null || !Number.isFinite(lengthS)) return null;
  const m = Math.floor(lengthS / 60);
  const s = lengthS % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
