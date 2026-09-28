import { APP_RELEASE } from '@/data/changelog';
import { OFF_FIELDS, checkBarcode, cleanSearchWords, parseOffProduct, type OffProduct, type ParseResult } from '@/lib/openFoodFacts';

/**
 * Open Food Facts — the request.
 *
 * The app's third network call, and the most frugal of the three. What leaves
 * the phone is the barcode you typed, or the words you searched for. Nothing
 * else: no account, no identifier, no location, nothing from your diary. The
 * request names the fields it wants and the app keeps what it is given in its
 * own database, so a product looked up once is never asked for again.
 *
 * It never throws. Offline, a timeout, a refusal and a product nobody has
 * entered are all answers, and each has its own sentence on the screen.
 */

const HOST = 'https://world.openfoodfacts.org';
/** Open Food Facts' own search service. The older search address on the main site refuses more often than it answers. */
const SEARCH = 'https://search.openfoodfacts.org/search';
/** Open Food Facts asks every app to say what it is. This names the app and nothing about its user. */
const AGENT = `FitCoach/${APP_RELEASE} (Android; github.com/FediMechergui/FitCoach)`;
const TIMEOUT_MS = 10_000;

export type OffFailure = 'offline' | 'timeout' | 'busy' | 'server' | 'not-found' | 'unusable';

export type OffLookup =
  | { ok: true; product: OffProduct }
  | { ok: false; reason: OffFailure; detail?: Exclude<ParseResult, { ok: true }>['reason'] };

export type OffSearch = { ok: true; products: OffProduct[]; total: number } | { ok: false; reason: OffFailure };

export const OFF_FAILURE: Record<OffFailure, string> = {
  offline: 'No connection. A lookup needs the internet once; after that the product is kept on your phone.',
  timeout: 'Open Food Facts took too long to answer. Try again in a moment.',
  busy: 'Open Food Facts is asking everyone to slow down. Wait a minute and try again.',
  server: 'Open Food Facts could not answer just now.',
  'not-found': 'This product is not in Open Food Facts yet. You can enter its label by hand.',
  unusable: 'The record for this product cannot be used.',
};

async function getJson(url: string): Promise<{ ok: true; json: unknown } | { ok: false; reason: OffFailure }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': AGENT, Accept: 'application/json' } });
    if (res.status === 404) return { ok: false, reason: 'not-found' };
    if (res.status === 429) return { ok: false, reason: 'busy' };
    if (!res.ok) return { ok: false, reason: 'server' };
    return { ok: true, json: await res.json() };
  } catch (e) {
    const aborted = e instanceof Error && e.name === 'AbortError';
    return { ok: false, reason: aborted ? 'timeout' : 'offline' };
  } finally {
    clearTimeout(timer);
  }
}

/** Look one product up by its barcode. The barcode must already have passed `checkBarcode`. */
export async function lookupBarcode(text: string): Promise<OffLookup> {
  const verdict = checkBarcode(text);
  if (!verdict.ok) return { ok: false, reason: 'unusable' };
  const r = await getJson(`${HOST}/api/v2/product/${verdict.code}.json?fields=${OFF_FIELDS}`);
  if (!r.ok) return r;
  const body = r.json as { status?: number; product?: unknown } | null;
  if (!body || body.status !== 1 || !body.product) return { ok: false, reason: 'not-found' };
  const parsed = parseOffProduct(body.product, verdict.code);
  if (!parsed.ok) return { ok: false, reason: 'unusable', detail: parsed.reason };
  return { ok: true, product: parsed.product };
}

/**
 * Search by name. `tunisiaOnly` narrows to products recorded as sold in
 * Tunisia — a smaller list, and far more likely to be what is on the shelf.
 */
export async function searchProducts(words: string, tunisiaOnly: boolean): Promise<OffSearch> {
  const q = cleanSearchWords(words);
  if (q.length < 2) return { ok: true, products: [], total: 0 };
  const query = tunisiaOnly ? `${q} countries_tags:"en:tunisia"` : q;
  const params = [`q=${encodeURIComponent(query)}`, 'page_size=24', 'langs=fr,en,ar', `fields=${OFF_FIELDS}`].join('&');
  const r = await getJson(`${SEARCH}?${params}`);
  if (!r.ok) return r;
  const body = r.json as { count?: number; hits?: unknown[] } | null;
  const list = Array.isArray(body?.hits) ? (body?.hits as unknown[]) : [];
  const products: OffProduct[] = [];
  const seen = new Set<string>();
  for (const raw of list) {
    const parsed = parseOffProduct(raw);
    // A result with no usable nutrition is not offered: choosing it would only lead to a refusal.
    if (!parsed.ok || !parsed.product.barcode || seen.has(parsed.product.barcode)) continue;
    seen.add(parsed.product.barcode);
    products.push(parsed.product);
  }
  return { ok: true, products, total: typeof body?.count === 'number' ? body.count : products.length };
}
