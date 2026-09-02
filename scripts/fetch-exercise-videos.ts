/**
 * Fetch one verified YouTube tutorial per built-in exercise.
 *
 *   npx tsx scripts/fetch-exercise-videos.ts            # resume from cache
 *   npx tsx scripts/fetch-exercise-videos.ts --fresh    # ignore the cache
 *
 * For every non-alias entry in EXERCISE_LIBRARY this queries YouTube's public
 * results page, parses `ytInitialData`, scores the candidates (name-token
 * match, instructional wording, sane length, trusted channel, views), and
 * confirms the winner is a real public video via YouTube's oEmbed endpoint
 * before it is written. Nothing is guessed: an id lands in the map only after
 * oEmbed answered 200 for it. Aliases inherit their primary's video.
 *
 * Output: src/data/exerciseVideos.ts (sorted by slug, committed as data).
 * Cache:  scripts/.cache/exercise-videos.json (resumable; safe to delete).
 */
import fs from 'node:fs';
import path from 'node:path';
import { EXERCISE_LIBRARY } from '../src/data/exercises';

interface Candidate {
  id: string;
  title: string;
  channel: string;
  lengthS: number | null;
  views: number | null;
}
interface Pick {
  id: string;
  title: string;
  channel: string;
  lengthS: number | null;
  query: string;
  score: number;
}

const CACHE = path.join('scripts', '.cache', 'exercise-videos.json');
const OUT = path.join('src', 'data', 'exerciseVideos.ts');
const FRESH = process.argv.includes('--fresh');
/** --redo=slug-a,slug-b : forget these cache entries and fetch them again */
const REDO = new Set(
  (process.argv.find((a) => a.startsWith('--redo=')) ?? '--redo=')
    .slice('--redo='.length)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
);
/**
 * slug → search query, for exercises whose plain name finds the wrong thing
 * ("Thread the Needle" finds sewing, "Surfing" finds paddle boards). Committed
 * and hand-reviewed; the generator consults it before building a query.
 */
const OVERRIDES_FILE = path.join('scripts', 'video-query-overrides.json');
const QUERY_OVERRIDES: Record<string, string> = fs.existsSync(OVERRIDES_FILE)
  ? JSON.parse(fs.readFileSync(OVERRIDES_FILE, 'utf8'))
  : {};
/**
 * slug → video ids a reviewer rejected. A redo bans the pick it replaces, so a
 * sharper query can never re-land on the same popular-but-wrong result.
 */
const AVOID_FILE = path.join('scripts', 'video-avoid.json');
const AVOID: Record<string, string[]> = fs.existsSync(AVOID_FILE)
  ? JSON.parse(fs.readFileSync(AVOID_FILE, 'utf8'))
  : {};
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';

const TRUSTED = [
  'jeff nippard', 'jeremy ethier', 'athlean-x', 'scotthermanfitness', 'renaissance periodization',
  'squat university', 'calisthenicmovement', 'fitnessfaqs', 'puregym', 'national academy of sports medicine',
  'bodybuilding.com', 'buff dudes', 'mind pump', 'alan thrall', 'juggernaut training systems',
  'hybrid calisthenics', 'yoga with adriene', 'tom merrick', 'fighttips', 'precision striking', 'howcast',
  'gmb fitness', 'muscle & motion', 'omarisuf', 'stronger by science', 'movement by david', 'saturno movement',
  'minus the gym', 'chris heria', 'thenx', 'musclewiki', 'menshealth', "men's health", 'nuffield health',
  'physiotutors', 'e3 rehab', 'yoga journal', 'breathe and flow', 'mady morrison', 'fightcamp',
  'expertvillage', 'wikihow', 'the yoga institute', 'boxing science',
];
const STOP = new Set(['the', 'a', 'an', 'with', 'and', 'on', 'of', 'to', 'in', 'for', 'or', 'per']);
const INSTRUCTIONAL = /how to|proper form|form|tutorial|technique|guide|properly|step by step|for beginners|explained|do a |do the /i;
const NEGATIVE = /#shorts|\bvs\.?\b|mistakes|don't|worst|never do|stop doing|dangerous|fail|compilation/i;

function query(e: (typeof EXERCISE_LIBRARY)[number]): string {
  const override = QUERY_OVERRIDES[e.slug];
  if (override) return override;
  const name = e.name.replace(/\(.*?\)/g, '').trim();
  switch (e.sessionType) {
    case 'strength':
    case 'calisthenics':
      return `${name} exercise proper form how to`;
    case 'cardio':
      return `${name} technique how to`;
    case 'martial_arts':
      return `${name} technique tutorial`;
    case 'meditation':
      return `${name} how to step by step`;
    case 'mindbody':
      return `${name} how to tutorial`;
    default:
      return `${name} how to`;
  }
}

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/[\s-]+/)
    .filter((t) => t && !STOP.has(t));
}

function parseLength(t: string | undefined): number | null {
  if (!t) return null;
  const parts = t.split(':').map(Number);
  if (parts.some((n) => Number.isNaN(n))) return null;
  return parts.reduce((acc, n) => acc * 60 + n, 0);
}

function parseViews(t: string | undefined): number | null {
  if (!t) return null;
  const m = t.replace(/,/g, '').match(/([\d.]+)\s*([KMB])?/i);
  if (!m) return null;
  const n = parseFloat(m[1]);
  const mult = ({ k: 1e3, m: 1e6, b: 1e9 } as Record<string, number>)[(m[2] ?? '').toLowerCase()] ?? 1;
  return Math.round(n * mult);
}

function score(c: Candidate, name: string): number {
  const nameToks = tokens(name);
  const titleToks = [...new Set(tokens(c.title))];
  const hit = nameToks.filter((t) => titleToks.some((x) => x === t || x.startsWith(t) || t.startsWith(x))).length;
  let s = nameToks.length ? (3 * hit) / nameToks.length : 0;
  if (INSTRUCTIONAL.test(c.title)) s += 2;
  if (NEGATIVE.test(c.title)) s -= 1.5;
  if (c.lengthS != null) {
    if (c.lengthS < 20) s -= 1;
    else if (c.lengthS >= 40 && c.lengthS <= 900) s += 1.5;
    else if (c.lengthS > 1500) s -= 1;
  }
  if (TRUSTED.some((t) => c.channel.toLowerCase().includes(t))) s += 1;
  if (c.views) s += Math.log10(c.views) / 4;
  return s;
}

async function search(q: string): Promise<Candidate[]> {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
  const res = await fetch(url, {
    headers: { 'user-agent': UA, 'accept-language': 'en-US,en;q=0.9', cookie: 'CONSENT=YES+cb; SOCS=CAI' },
  });
  const html = await res.text();
  const m = html.match(/var ytInitialData = (\{.*?\});<\/script>/s);
  if (!m) return [];
  const out: Candidate[] = [];
  const walk = (o: unknown): void => {
    if (Array.isArray(o)) {
      o.forEach(walk);
      return;
    }
    if (o && typeof o === 'object') {
      const v = (o as Record<string, unknown>).videoRenderer as Record<string, any> | undefined;
      if (v?.videoId) {
        out.push({
          id: v.videoId,
          title: (v.title?.runs ?? []).map((r: { text: string }) => r.text).join(''),
          channel: v.ownerText?.runs?.[0]?.text ?? '',
          lengthS: parseLength(v.lengthText?.simpleText),
          views: parseViews(v.viewCountText?.simpleText),
        });
      }
      Object.values(o as Record<string, unknown>).forEach(walk);
    }
  };
  walk(JSON.parse(m[1]));
  return out;
}

async function exists(id: string): Promise<boolean> {
  const r = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`, {
    headers: { 'user-agent': UA },
  });
  return r.status === 200;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** A dropped connection is a pause, not a verdict — back off and try again
    rather than burning through the catalogue while the network is down. */
async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  let delay = 4000;
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= 4) throw err;
      console.warn(`[retry ${attempt}] ${label}: ${(err as Error).message} — waiting ${delay / 1000}s`);
      await sleep(delay);
      delay *= 2;
    }
  }
}

async function main() {
  fs.mkdirSync(path.dirname(CACHE), { recursive: true });
  const cache: Record<string, Pick> =
    !FRESH && fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : {};
  for (const slug of REDO) {
    const prev = cache[slug]?.id;
    if (prev) AVOID[slug] = Array.from(new Set([...(AVOID[slug] ?? []), prev]));
    delete cache[slug];
  }
  if (REDO.size) {
    fs.writeFileSync(AVOID_FILE, JSON.stringify(AVOID, null, 2) + '\n');
    console.log(`redoing ${REDO.size} slug(s) with ${Object.keys(QUERY_OVERRIDES).length} query override(s) and ${Object.keys(AVOID).length} avoid list(s) on file`);
  }
  const primaries = EXERCISE_LIBRARY.filter((e) => !e.aliasOf);
  let done = 0;
  for (const e of primaries) {
    if (cache[e.slug]) {
      done++;
      continue;
    }
    const q = query(e);
    try {
      const banned = new Set(AVOID[e.slug] ?? []);
      const cands = (await withRetry(() => search(q), e.slug)).filter((c) => c.id && c.title && !banned.has(c.id));
      // With an override on file, its words are the reviewer's intent — score against them.
      const ranked = cands.map((c) => ({ c, s: score(c, QUERY_OVERRIDES[e.slug] ?? e.name) })).sort((a, b) => b.s - a.s);
      let picked: Pick | null = null;
      for (const { c, s } of ranked.slice(0, 4)) {
        if (await withRetry(() => exists(c.id), `${e.slug} oembed`)) {
          picked = { id: c.id, title: c.title, channel: c.channel, lengthS: c.lengthS, query: q, score: Math.round(s * 100) / 100 };
          break;
        }
        await sleep(200);
      }
      if (picked) cache[e.slug] = picked;
      else console.warn(`[miss] ${e.slug} (${cands.length} candidates)`);
    } catch (err) {
      console.warn(`[error] ${e.slug}:`, (err as Error).message);
    }
    done++;
    fs.writeFileSync(CACHE, JSON.stringify(cache, null, 1));
    if (done % 10 === 0) console.log(`${done}/${primaries.length} · ${Object.keys(cache).length} found`);
    await sleep(600);
  }

  // Aliases inherit; emit the data module.
  const rows: Array<[string, Pick]> = [];
  for (const e of EXERCISE_LIBRARY) {
    const p = cache[e.aliasOf ?? e.slug];
    if (p) rows.push([e.slug, p]);
  }
  rows.sort((a, b) => a[0].localeCompare(b[0]));
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const body = rows
    .map(
      ([slug, p]) =>
        `  '${slug}': { id: '${p.id}', title: '${esc(p.title)}', channel: '${esc(p.channel)}'${p.lengthS != null ? `, lengthS: ${p.lengthS}` : ''} },`
    )
    .join('\n');
  const ts = `/**
 * One verified YouTube tutorial per built-in exercise — GENERATED DATA.
 *
 * Built by scripts/fetch-exercise-videos.ts: each id was the best-scoring
 * result for the exercise's how-to query AND answered 200 from YouTube's
 * oEmbed endpoint at generation time. Aliases carry their primary's video.
 * Regenerate with \`npx tsx scripts/fetch-exercise-videos.ts\`; hand-fix an
 * entry here if a better video is known — the generator's cache keeps it
 * unless run with --fresh.
 *
 * Generated ${new Date().toISOString().slice(0, 10)} · ${rows.length} of ${EXERCISE_LIBRARY.length} exercises.
 */

export interface ExerciseVideo {
  /** YouTube video id (11 chars) */
  id: string;
  title: string;
  channel: string;
  lengthS?: number;
}

export const EXERCISE_VIDEOS: Record<string, ExerciseVideo> = {
${body}
};
`;
  fs.writeFileSync(OUT, ts);
  console.log(`wrote ${OUT}: ${rows.length}/${EXERCISE_LIBRARY.length} exercises with a verified video`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
