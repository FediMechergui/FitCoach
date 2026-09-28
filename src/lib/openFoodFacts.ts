import type { MicroProfile } from '@/lib/micros';

/**
 * Open Food Facts — reading what comes back. Pure.
 *
 * Open Food Facts is a free, open database of packaged food, entered by the
 * people who buy it (openfoodfacts.org, data under the Open Database Licence).
 * That is its strength — it has products no company would bother with — and
 * its limit: an entry is as good as whoever typed it. So nothing here trusts
 * a record blindly. A product is parsed, its gaps are named, numbers that
 * cannot be true are refused, and the screen shows all of it before anything
 * is saved.
 *
 * The network lives in services/openFoodFacts.ts. This file never touches it.
 */

// ── Barcodes ─────────────────────────────────────────────────────────────────

/** Digits only: what was typed, with spaces and dashes taken out. */
export function cleanBarcode(text: string): string {
  return (text ?? '').replace(/[\s-]/g, '');
}

/**
 * The check digit of an EAN-13, EAN-8 or UPC-A code: from the right, the
 * digits before the last are weighted 3, 1, 3, 1… and the last digit brings
 * the total to a multiple of ten. A mistyped digit almost always fails it.
 */
export function barcodeChecksumOk(code: string): boolean {
  if (!/^\d+$/.test(code)) return false;
  const digits = code.split('').map(Number);
  const check = digits.pop() as number;
  let sum = 0;
  for (let i = digits.length - 1, w = 3; i >= 0; i--, w = w === 3 ? 1 : 3) sum += digits[i] * w;
  return (10 - (sum % 10)) % 10 === check;
}

export type BarcodeVerdict = { ok: true; code: string } | { ok: false; reason: 'empty' | 'characters' | 'length' | 'checksum' };

/** EAN-13, UPC-A (12) and EAN-8 are what food wears. Anything else is refused before a request is made. */
export function checkBarcode(text: string): BarcodeVerdict {
  const code = cleanBarcode(text);
  if (!code) return { ok: false, reason: 'empty' };
  if (!/^\d+$/.test(code)) return { ok: false, reason: 'characters' };
  if (![8, 12, 13].includes(code.length)) return { ok: false, reason: 'length' };
  if (!barcodeChecksumOk(code)) return { ok: false, reason: 'checksum' };
  return { ok: true, code };
}

export type BarcodeReading =
  | { kind: 'read'; code: string }
  /** digits were read, but they fail the check: shown for correction, never looked up */
  | { kind: 'doubtful'; digits: string }
  | { kind: 'none' };

/**
 * What a model said it read under a barcode, judged.
 *
 * A model reading digits from a photograph will sometimes read one wrong, and
 * a wrong barcode is a DIFFERENT PRODUCT, not a worse answer. So its word is
 * never taken: every candidate is put through the check digit, and only one
 * that passes is accepted. Digits that fail are handed back to be corrected
 * against the pack, and are not looked up.
 */
export function judgeBarcodeReading(raw: unknown): BarcodeReading {
  const found: string[] = [];
  const take = (v: unknown) => {
    if (typeof v === 'number' && Number.isFinite(v)) found.push(String(Math.trunc(v)));
    else if (typeof v === 'string') found.push(v);
  };
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    take(o.barcode);
    if (Array.isArray(o.alternatives)) o.alternatives.forEach(take);
  } else take(raw);

  const candidates = found.map((t) => t.replace(/\D/g, '')).filter((t) => t.length >= 6 && t.length <= 14);
  for (const t of candidates) {
    const v = checkBarcode(t);
    if (v.ok) return { kind: 'read', code: v.code };
  }
  const closest = candidates.find((t) => [8, 12, 13].includes(t.length)) ?? candidates[0];
  return closest ? { kind: 'doubtful', digits: closest } : { kind: 'none' };
}

export const BARCODE_REASON: Record<Exclude<BarcodeVerdict, { ok: true }>['reason'], string> = {
  empty: 'Type the numbers printed under the barcode.',
  characters: 'A barcode is digits only.',
  length: 'A food barcode has 8, 12 or 13 digits.',
  checksum: 'That number does not add up: one digit is mistyped. Check it against the pack.',
};

// ── Products ─────────────────────────────────────────────────────────────────

export interface OffMacros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface OffProduct {
  barcode: string;
  name: string;
  brand: string | null;
  /** "330 ml", "500 g" — the size of the pack, as printed */
  quantity: string | null;
  /** per 100 g, or per 100 ml for a drink */
  per100: OffMacros;
  /** true when the record is per 100 ml */
  liquid: boolean;
  /** grams (or millilitres) in one serving, when the record gives one */
  servingG: number | null;
  /** the serving as printed: "30 g", "1 biscuit (12 g)" */
  servingLabel: string | null;
  sugars: number | null;
  saturatedFat: number | null;
  salt: number | null;
  micros: Partial<MicroProfile>;
  /** a to e, when the product has been scored */
  nutriScore: string | null;
  /** 1 to 4: how processed it is */
  nova: number | null;
  allergens: string[];
  ingredients: string | null;
  /** countries where it is recorded as sold, as plain names */
  countries: string[];
  /** what the record does not have — named, so the screen can say so */
  missing: Array<'calories' | 'protein' | 'carbs' | 'fat' | 'fiber'>;
}

export type ParseResult = { ok: true; product: OffProduct } | { ok: false; reason: 'empty' | 'unnamed' | 'no-nutrition' | 'implausible' };

const num = (v: unknown): number | null => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v.replace(',', '.')) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : null;
};

const str = (v: unknown): string | null => {
  if (typeof v !== 'string') return null;
  const t = v.replace(/\s+/g, ' ').trim();
  return t.length ? t : null;
};

const tagName = (tag: string): string =>
  tag
    .replace(/^[a-z]{2}:/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

/** The fields asked of the API — a request names what it wants and gets nothing else. */
export const OFF_FIELDS = [
  'code',
  'product_name',
  'product_name_fr',
  'product_name_en',
  'product_name_ar',
  'generic_name',
  'brands',
  'quantity',
  'serving_size',
  'serving_quantity',
  'nutrition_data_per',
  'nutriments',
  'nutriscore_grade',
  'nova_group',
  'allergens_tags',
  'ingredients_text',
  'ingredients_text_fr',
  'countries_tags',
].join(',');

/**
 * One record from Open Food Facts, read with suspicion.
 *
 * Refused outright: a record with no name, a record with no energy and no
 * macro at all, and a record whose numbers cannot be true (more than 100 g of
 * macros in 100 g of food, or more energy than pure fat holds). A partial
 * record is accepted with its gaps listed.
 */
export function parseOffProduct(raw: unknown, fallbackCode = ''): ParseResult {
  if (!raw || typeof raw !== 'object') return { ok: false, reason: 'empty' };
  const p = raw as Record<string, unknown>;
  const name = str(p.product_name) ?? str(p.product_name_fr) ?? str(p.product_name_en) ?? str(p.product_name_ar) ?? str(p.generic_name);
  if (!name) return { ok: false, reason: 'unnamed' };

  const n = (p.nutriments && typeof p.nutriments === 'object' ? p.nutriments : {}) as Record<string, unknown>;
  const kcal = num(n['energy-kcal_100g']) ?? (num(n['energy-kj_100g']) != null ? (num(n['energy-kj_100g']) as number) / 4.184 : null) ?? (num(n['energy_100g']) != null ? (num(n['energy_100g']) as number) / 4.184 : null);
  const protein = num(n.proteins_100g);
  const carbs = num(n.carbohydrates_100g);
  const fat = num(n.fat_100g);
  const fiber = num(n.fiber_100g);

  if (kcal == null && protein == null && carbs == null && fat == null) return { ok: false, reason: 'no-nutrition' };

  const macroSum = (protein ?? 0) + (carbs ?? 0) + (fat ?? 0);
  // 100 g of food cannot hold more than 100 g of macros, nor more energy than 100 g of fat.
  if (macroSum > 101 || (kcal != null && kcal > 905) || (fiber != null && fiber > 100)) return { ok: false, reason: 'implausible' };

  const missing: OffProduct['missing'] = [];
  if (kcal == null) missing.push('calories');
  if (protein == null) missing.push('protein');
  if (carbs == null) missing.push('carbs');
  if (fat == null) missing.push('fat');
  if (fiber == null) missing.push('fiber');

  // Energy that was not given is derived from what was, the way the rest of the app does it.
  const derived = (protein ?? 0) * 4 + Math.max(0, (carbs ?? 0) - (fiber ?? 0)) * 4 + (fiber ?? 0) * 2 + (fat ?? 0) * 9;
  const r1 = (v: number) => Math.round(v * 10) / 10;

  const servingG = num(p.serving_quantity);
  const quantity = str(p.quantity);
  const servingLabel = str(p.serving_size);
  const liquid = str(p.nutrition_data_per) === '100ml' || /\b(ml|cl|l)\b/i.test(`${quantity ?? ''} ${servingLabel ?? ''}`);

  // Micronutrients arrive in grams per 100 g; the app keeps them in mg or µg.
  const micros: Partial<MicroProfile> = {};
  const mg = (key: keyof MicroProfile, field: string) => {
    const v = num(n[`${field}_100g`]);
    if (v != null && v > 0) micros[key] = r1(v * 1000);
  };
  const ug = (key: keyof MicroProfile, field: string) => {
    const v = num(n[`${field}_100g`]);
    if (v != null && v > 0) micros[key] = r1(v * 1_000_000);
  };
  mg('sodium_mg', 'sodium');
  mg('calcium_mg', 'calcium');
  mg('iron_mg', 'iron');
  mg('magnesium_mg', 'magnesium');
  mg('potassium_mg', 'potassium');
  mg('zinc_mg', 'zinc');
  mg('vitaminC_mg', 'vitamin-c');
  ug('vitaminA_ug', 'vitamin-a');
  ug('vitaminD_ug', 'vitamin-d');
  ug('vitaminB12_ug', 'vitamin-b12');

  const grade = str(p.nutriscore_grade)?.toLowerCase() ?? null;
  const nova = num(p.nova_group);
  const tags = (v: unknown): string[] => (Array.isArray(v) ? v.filter((t): t is string => typeof t === 'string').map(tagName) : []);

  return {
    ok: true,
    product: {
      barcode: str(p.code) ?? fallbackCode,
      name: name.slice(0, 80),
      // The product endpoint gives brands as one string, the search service as a list.
      brand: (Array.isArray(p.brands) ? str(p.brands[0]) : str(p.brands)?.split(',')[0].trim()) ?? null,
      quantity,
      per100: {
        calories: Math.round(kcal ?? derived),
        protein: r1(protein ?? 0),
        carbs: r1(carbs ?? 0),
        fat: r1(fat ?? 0),
        fiber: r1(Math.min(fiber ?? 0, carbs ?? fiber ?? 0)),
      },
      liquid,
      servingG: servingG != null && servingG > 0 && servingG <= 2000 ? servingG : null,
      servingLabel,
      sugars: num(n.sugars_100g),
      saturatedFat: num(n['saturated-fat_100g']),
      salt: num(n.salt_100g),
      micros,
      nutriScore: grade && /^[a-e]$/.test(grade) ? grade : null,
      nova: nova != null && nova >= 1 && nova <= 4 ? Math.round(nova) : null,
      allergens: tags(p.allergens_tags),
      ingredients: (str(p.ingredients_text_fr) ?? str(p.ingredients_text))?.slice(0, 600) ?? null,
      countries: tags(p.countries_tags),
      missing,
    },
  };
}

export const PARSE_REASON: Record<Exclude<ParseResult, { ok: true }>['reason'], string> = {
  empty: 'The record came back empty.',
  unnamed: 'The record has no product name, so it cannot be told apart from another.',
  'no-nutrition': 'Nobody has entered the nutrition table for this product yet.',
  implausible: 'The numbers on this record cannot be true, so it was not used. You can enter the label by hand.',
};

// ── From a product to a food ─────────────────────────────────────────────────

export type OffBasis = 'serving' | '100';

/** The amounts for one serving, or for 100 g when the record gives no serving. */
export function offPortion(p: OffProduct, basis: OffBasis): { label: string; macros: OffMacros; micros: Partial<MicroProfile>; factor: number } {
  const unit = p.liquid ? 'ml' : 'g';
  const useServing = basis === 'serving' && p.servingG != null;
  const factor = useServing ? (p.servingG as number) / 100 : 1;
  const r1 = (v: number) => Math.round(v * 10) / 10;
  const micros: Partial<MicroProfile> = {};
  for (const [k, v] of Object.entries(p.micros)) micros[k as keyof MicroProfile] = r1((v as number) * factor);
  return {
    label: useServing ? (p.servingLabel ?? `${r1(p.servingG as number)} ${unit}`) : `100 ${unit}`,
    macros: {
      calories: Math.round(p.per100.calories * factor),
      protein: r1(p.per100.protein * factor),
      carbs: r1(p.per100.carbs * factor),
      fat: r1(p.per100.fat * factor),
      fiber: r1(p.per100.fiber * factor),
    },
    micros,
    factor,
  };
}

/**
 * The words of a search, made safe to put in a query: the search service reads
 * quotes, colons and brackets as syntax, so they are taken out.
 */
export function cleanSearchWords(words: string): string {
  return (words ?? '')
    .replace(/["'`:()\[\]{}\\/^~*?!+\-&|<>=]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);
}

/** The name a saved product wears: the brand first when the name does not already carry it. */
export function offDisplayName(p: OffProduct): string {
  if (!p.brand || p.name.toLowerCase().includes(p.brand.toLowerCase())) return p.name;
  return `${p.brand} ${p.name}`.slice(0, 80);
}

export const NUTRISCORE_NOTE: Record<string, string> = {
  a: 'Nutri-Score A: among the best of its kind',
  b: 'Nutri-Score B',
  c: 'Nutri-Score C',
  d: 'Nutri-Score D',
  e: 'Nutri-Score E: among the poorest of its kind',
};

export const NOVA_NOTE: Record<number, string> = {
  1: 'Unprocessed or barely processed',
  2: 'A processed cooking ingredient',
  3: 'Processed',
  4: 'Ultra-processed',
};
