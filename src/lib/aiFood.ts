/**
 * Turning a model's answer about food into numbers we're willing to store.
 *
 * A vision model is genuinely good at *recognising* food and reasonable at
 * naming a portion. It is not a measuring instrument, and it will answer a
 * question about vitamin B12 with the same confidence either way. So nothing it
 * returns is trusted on arrival — every field is parsed, range-checked and
 * cross-checked against physics before it is allowed near the diary:
 *
 *  · **Shape.** Anything not matching the expected JSON is rejected outright
 *    rather than coerced, so a chatty or malformed reply logs nothing.
 *  · **Mass.** Macronutrients in 100 g of food cannot weigh more than 100 g.
 *  · **Energy.** Calories must agree with the model's own macros under Atwater.
 *    When they disagree the macros win and the calories are recomputed — macros
 *    are the more reliable output, and this makes the entry self-consistent.
 *  · **Plausibility.** A micronutrient value absurdly beyond anything real food
 *    contains is dropped, one key at a time, rather than poisoning the profile.
 *
 * What survives is stored **per 100 g** — the convention nutrition data comes
 * in, and the form that makes the food reusable at any portion later.
 *
 * Everything here is pure so scripts/verify-engines.ts can test it without a
 * network or a device.
 */
import { MICRO_KEYS, rdiFor, type MicroKey, type MicroProfile } from './micros';
import { caloriesFromMacros } from './foodMath';
import type { FoodForm } from './digestion';

// ── What we ask the model for ────────────────────────────────────────────────

/** One food the model believes it can see, and how much of it. */
export interface AiFoodPortion {
  name: string;
  /** the model's portion estimate, grams */
  grams: number;
  /** the model's own confidence, 0–1 */
  confidence: number;
}

/** The result of looking at one photograph. */
export interface AiPhotoIdentification {
  /** what the plate is, as a whole ("chicken couscous") */
  dishName: string;
  items: AiFoodPortion[];
}

/** Nutrition for a food the catalogue doesn't have, per 100 g. */
export interface AiNutritionPer100g {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  micros?: Partial<MicroProfile>;
  form: FoodForm;
  /** the model's own note on where the figure comes from, for the UI */
  basis?: string;
}

// ── Limits ───────────────────────────────────────────────────────────────────

/** No single photographed portion is credible beyond this. grams. */
export const MAX_PORTION_G = 2000;
/** Below this a "portion" is a garnish the model invented. grams. */
export const MIN_PORTION_G = 1;
/** More items than this on one plate means the model is listing, not seeing. */
export const MAX_ITEMS = 12;
/**
 * How far the stated calories may sit from the Atwater figure before the macros
 * are believed instead. A fraction of the computed value.
 */
export const ENERGY_TOLERANCE = 0.25;
/**
 * A micronutrient beyond this multiple of its daily value *in 100 g of food* is
 * not a food, it is a hallucination.
 *
 * Set just above the real extremes rather than far above them: Brazil nuts
 * carry about 34x the selenium daily value per 100 g and table salt about 26x
 * the sodium, and almost nothing edible goes further. At 100 the ceiling was
 * so generous it admitted the very error it exists to catch — a decimal
 * point slipping one place, turning 53 mg of vitamin C into 530 or 5300.
 */
export const MICRO_SANITY_MULTIPLE = 40;

// ── Parsing ──────────────────────────────────────────────────────────────────

function num(v: unknown): number | null {
  // parseFloat, not Number: a model answering outside an enforced schema
  // writes "150 g" or "0.9 (approx)", and the number in front IS the answer.
  // Number() turns all of those into NaN and the whole item was dropped.
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
}

function cleanName(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim().replace(/\s+/g, ' ');
  return s.length > 0 && s.length <= 80 ? s : null;
}

/**
 * Parse what the model saw. Returns null — logging nothing — rather than
 * guessing at a reply that doesn't have the shape we asked for.
 */
export function parsePhotoIdentification(raw: unknown): AiPhotoIdentification | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const list = Array.isArray(o.items) ? o.items : null;
  if (!list || list.length === 0) return null;

  const items: AiFoodPortion[] = [];
  for (const entry of list.slice(0, MAX_ITEMS)) {
    if (!entry || typeof entry !== 'object') continue;
    const e = entry as Record<string, unknown>;
    const name = cleanName(e.name);
    const grams = num(e.grams);
    if (!name || grams == null) continue;
    if (grams < MIN_PORTION_G || grams > MAX_PORTION_G) continue;
    const conf = num(e.confidence);
    items.push({
      name,
      grams: Math.round(grams),
      confidence: conf != null ? Math.min(1, Math.max(0, conf)) : 0.5,
    });
  }
  if (items.length === 0) return null;

  return {
    dishName: cleanName(o.dishName) ?? items[0].name,
    items,
  };
}

/** Drop micronutrient values that no real food could carry in 100 g. */
export function sanitiseMicros(raw: unknown): Partial<MicroProfile> | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  const out: Partial<MicroProfile> = {};
  let kept = 0;
  for (const key of MICRO_KEYS as readonly MicroKey[]) {
    const v = num(o[key]);
    if (v == null || v < 0) continue;
    if (v === 0) continue;
    // Judged against the male DV purely as a scale reference — this is an
    // absurdity filter, not a nutritional target.
    const ceiling = rdiFor(key, 'male') * MICRO_SANITY_MULTIPLE;
    if (ceiling > 0 && v > ceiling) continue;
    out[key] = Math.round(v * 100) / 100;
    kept += 1;
  }
  return kept > 0 ? out : undefined;
}

/**
 * Parse researched nutrition for one food, per 100 g, enforcing that it is
 * physically possible and internally consistent.
 */
export function parseNutritionPer100g(raw: unknown): AiNutritionPer100g | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;

  const protein = num(o.protein);
  const carbs = num(o.carbs);
  const fat = num(o.fat);
  if (protein == null || carbs == null || fat == null) return null;
  if (protein < 0 || carbs < 0 || fat < 0) return null;

  // 100 g of food cannot contain more than 100 g of macronutrients.
  if (protein + carbs + fat > 100) return null;

  const fiber = Math.min(Math.max(0, num(o.fiber) ?? 0), carbs);
  const macros = { protein, carbs, fat, fiber };

  // Energy has to match the macros. When it doesn't, the macros are the better
  // evidence and the calorie figure is rebuilt from them.
  const atwater = caloriesFromMacros(macros);
  const stated = num(o.calories);
  const calories =
    stated != null && stated > 0 && Math.abs(stated - atwater) <= Math.max(15, atwater * ENERGY_TOLERANCE)
      ? Math.round(stated)
      : atwater;

  const form: FoodForm = o.form === 'liquid' ? 'liquid' : 'solid';
  const basis = typeof o.basis === 'string' ? o.basis.trim().slice(0, 160) : undefined;

  return {
    calories,
    protein: Math.round(protein * 10) / 10,
    carbs: Math.round(carbs * 10) / 10,
    fat: Math.round(fat * 10) / 10,
    fiber: Math.round(fiber * 10) / 10,
    micros: sanitiseMicros(o.micros),
    form,
    basis: basis || undefined,
  };
}

// ── Scaling ──────────────────────────────────────────────────────────────────

export interface ScaledPortion {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  micros?: Partial<MicroProfile>;
}

/** Nutrition for `grams` of a food described per 100 g. */
export function scalePer100g(n: AiNutritionPer100g, grams: number): ScaledPortion {
  const f = Math.max(0, grams) / 100;
  const round1 = (v: number) => Math.round(v * 10) / 10;
  let micros: Partial<MicroProfile> | undefined;
  if (n.micros) {
    micros = {};
    for (const [k, v] of Object.entries(n.micros)) {
      if (typeof v === 'number' && Number.isFinite(v)) {
        micros[k as MicroKey] = Math.round(v * f * 100) / 100;
      }
    }
  }
  return {
    calories: Math.round(n.calories * f),
    protein: round1(n.protein * f),
    carbs: round1(n.carbs * f),
    fat: round1(n.fat * f),
    fiber: round1(n.fiber * f),
    micros,
  };
}

// ── Which model, and reading its reply ───────────────────────────────────────

/**
 * The free vision model this ships with, and what to fall back to.
 *
 * All are free and image-capable, and all support a JSON response schema, which
 * is what makes the reply parseable rather than prose. OpenRouter walks this
 * list in order when one is rate-limited or down, so a busy free endpoint
 * degrades into a slower answer instead of a failure.
 *
 * Every entry is a NAMED general-purpose multimodal model. A router is not
 * allowed here, and neither is anything that merely accepts an image: the free
 * catalogue also contains a content-safety classifier that takes pictures, and
 * routing a photograph of an egg to it produced the reply "User Safety: safe"
 * — a perfectly valid answer to a question nobody asked.
 */
export const DEFAULT_MODEL = 'google/gemma-4-31b-it:free';
export const FALLBACK_MODELS = [
  'minimax/minimax-m3:free',
  'google/gemma-4-26b-a4b-it:free',
  'dots-studio/dots-3-note-preview:free',
];

/**
 * Models that accept an image but cannot describe a meal, and routers that may
 * hand the request to one of them. Never routed to, however the list above is
 * edited later.
 */
export const EXCLUDED_MODEL_PATTERNS = [
  'openrouter/free', // a router: picks any free model, classifiers included
  'content-safety', // answers "User Safety: safe", not "an egg"
  'guard', // llama-guard and friends: moderation, not description
  'moderation',
  'lyria', // audio generation
  'embed', // embeddings
];

/** Would routing to this model be a category error? */
export function isUsableVisionModel(id: string): boolean {
  const lower = id.toLowerCase();
  return !EXCLUDED_MODEL_PATTERNS.some((bad) => lower.includes(bad));
}

/**
 * OpenRouter refuses a routing list longer than this, and refuses it with a
 * 400 before any model sees the request.
 *
 * This shipped as four (a primary plus three fallbacks), so EVERY call failed
 * outright — the feature never once reached a model. Hence the hard cap, and
 * the guard that keeps the route inside it whatever the fallback list becomes.
 */
export const MAX_ROUTE_MODELS = 3;

/**
 * The models to try, primary first, within the length OpenRouter accepts and
 * excluding anything that cannot actually describe a photograph.
 */
export function modelRoute(primary: string): string[] {
  const usable = [primary, ...FALLBACK_MODELS.filter((m) => m !== primary)].filter(isUsableVisionModel);
  // If a chosen model is itself unusable, fall back to the shipped default
  // rather than sending nothing at all.
  const route = usable.length > 0 ? usable : [DEFAULT_MODEL];
  return route.slice(0, MAX_ROUTE_MODELS);
}

/** Models sometimes wrap JSON in prose or a code fence. Dig it out. */
export function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    // Fall back to the outermost braces, for a reply with a sentence around it.
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(candidate.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}
