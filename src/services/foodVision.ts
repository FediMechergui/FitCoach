import { MICRO_KEYS } from '@/lib/micros';
import {
  parseNutritionPer100g,
  parsePhotoIdentification,
  extractJson,
  DEFAULT_MODEL,
  FALLBACK_MODELS,
  type AiNutritionPer100g,
  type AiPhotoIdentification,
} from '@/lib/aiFood';

export { DEFAULT_MODEL, FALLBACK_MODELS, extractJson } from '@/lib/aiFood';
import { openRouterKey, kvGet, KV_OPENROUTER_MODEL } from '@/repositories/kvRepo';

/**
 * Reading a meal from a photograph, through OpenRouter.
 *
 * This is the app's second network call and the first that leaves with anything
 * personal, so it follows the same rules as the weather fetch: it never throws
 * into the caller, it times out rather than hanging, and every failure — no
 * key, no signal, a refusal, a malformed reply — reads simply as "no result",
 * leaving the manual entry path exactly as it was.
 *
 * The key is read from the device's own database (see repositories/kvRepo);
 * nothing is baked into the bundle, because this repository is public and a key
 * shipped inside an app can be extracted from it.
 *
 * Two questions are asked, deliberately separately:
 *
 *  1. **What is on the plate?** Vision models are genuinely good at naming food
 *     and passable at judging a portion. That is all this call asks for — no
 *     nutrition numbers, because anything the catalogue already knows should
 *     come from the catalogue's curated data instead.
 *  2. **What is in this food?** Only for the items the catalogue does not have,
 *     and asked once for all of them together rather than one call each, which
 *     matters against a free tier of 20 requests a minute.
 *
 * Nothing either call returns is trusted on arrival; lib/aiFood range-checks and
 * cross-checks all of it before it can reach the diary.
 */

const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

/** Vision is slower than a weather lookup; still bounded. */
const VISION_TIMEOUT_MS = 45_000;
const TEXT_TIMEOUT_MS = 30_000;

function activeModel(): string {
  const stored = kvGet<string>(KV_OPENROUTER_MODEL);
  return typeof stored === 'string' && stored.trim() ? stored.trim() : DEFAULT_MODEL;
}

/** Is the feature set up at all? */
export function hasFoodVisionKey(): boolean {
  return openRouterKey() != null;
}

export type VisionFailure =
  | 'no-key'
  | 'offline'
  | 'rate-limited'
  | 'unauthorised'
  | 'unreadable'
  | 'failed';

export interface VisionResult<T> {
  data: T | null;
  error: VisionFailure | null;
}


interface ChatMessageContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
}

async function ask(
  content: ChatMessageContent[],
  schema: Record<string, unknown>,
  schemaName: string,
  timeoutMs: number
): Promise<VisionResult<unknown>> {
  const key = openRouterKey();
  if (!key) return { data: null, error: 'no-key' };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        // Attribution only; carries no personal data.
        'X-Title': 'FitCoach',
      },
      body: JSON.stringify({
        model: activeModel(),
        models: [activeModel(), ...FALLBACK_MODELS.filter((m) => m !== activeModel())],
        messages: [{ role: 'user', content }],
        response_format: { type: 'json_schema', json_schema: { name: schemaName, schema } },
        temperature: 0,
        max_tokens: 1600,
      }),
    });

    if (res.status === 401 || res.status === 403) return { data: null, error: 'unauthorised' };
    if (res.status === 429) return { data: null, error: 'rate-limited' };
    if (!res.ok) return { data: null, error: 'failed' };

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = json.choices?.[0]?.message?.content;
    if (typeof text !== 'string' || !text.trim()) return { data: null, error: 'unreadable' };

    const parsed = extractJson(text);
    return parsed == null ? { data: null, error: 'unreadable' } : { data: parsed, error: null };
  } catch (e) {
    // Abort, DNS failure, no signal — all indistinguishable and all "no result".
    const aborted = e instanceof Error && e.name === 'AbortError';
    return { data: null, error: aborted ? 'offline' : 'offline' };
  } finally {
    clearTimeout(timer);
  }
}

// ── 1. What is on the plate? ─────────────────────────────────────────────────

const IDENTIFY_SCHEMA = {
  type: 'object',
  properties: {
    dishName: { type: 'string', description: 'the meal as a whole, e.g. "chicken couscous"' },
    items: {
      type: 'array',
      description: 'each distinct food visible, separately',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'the food alone, e.g. "grilled chicken breast"' },
          grams: { type: 'number', description: 'estimated edible weight in grams' },
          confidence: { type: 'number', description: '0 to 1' },
        },
        required: ['name', 'grams', 'confidence'],
      },
    },
  },
  required: ['dishName', 'items'],
};

const IDENTIFY_PROMPT =
  'Identify every distinct food in this photograph of a meal. ' +
  'For each one give its common English name and estimate its edible weight in grams, ' +
  'judging portion size against any plate, cutlery or hand visible for scale. ' +
  'Name foods plainly ("grilled chicken breast", "white rice"), not by brand or restaurant dish. ' +
  'List components separately rather than as one combined dish. ' +
  'Give a confidence between 0 and 1 for each. ' +
  'If the photograph does not show food, return an empty items array. ' +
  'Do not estimate calories or nutrients.';

/** Identify the foods in a JPEG, given as raw base64 (no data: prefix). */
export async function identifyFoodInPhoto(
  base64Jpeg: string
): Promise<VisionResult<AiPhotoIdentification>> {
  const { data, error } = await ask(
    [
      { type: 'text', text: IDENTIFY_PROMPT },
      { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Jpeg}` } },
    ],
    IDENTIFY_SCHEMA,
    'food_identification',
    VISION_TIMEOUT_MS
  );
  if (error) return { data: null, error };
  const parsed = parsePhotoIdentification(data);
  return parsed ? { data: parsed, error: null } : { data: null, error: 'unreadable' };
}

// ── 2. What is in a food we don't have? ──────────────────────────────────────

/** The micro block, built from the real key list so it can never drift. */
const MICRO_SCHEMA = {
  type: 'object',
  description: 'per 100 g; omit anything not known rather than guessing',
  properties: Object.fromEntries(MICRO_KEYS.map((k) => [k, { type: 'number' }])),
};

const NUTRITION_SCHEMA = {
  type: 'object',
  properties: {
    foods: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          calories: { type: 'number', description: 'kcal per 100 g' },
          protein: { type: 'number', description: 'g per 100 g' },
          carbs: { type: 'number', description: 'g per 100 g' },
          fat: { type: 'number', description: 'g per 100 g' },
          fiber: { type: 'number', description: 'g per 100 g' },
          form: { type: 'string', enum: ['solid', 'liquid'] },
          basis: { type: 'string', description: 'one short line on where the figures come from' },
          micros: MICRO_SCHEMA,
        },
        required: ['name', 'calories', 'protein', 'carbs', 'fat', 'fiber', 'form'],
      },
    },
  },
  required: ['foods'],
};

/**
 * Look up nutrition for foods the catalogue doesn't have — all of them in one
 * request, because the free tier allows twenty a minute and a plate can easily
 * have four unknowns.
 *
 * Returns a map keyed by the name asked for, so a partial answer still helps.
 */
export async function researchNutrition(
  names: string[]
): Promise<VisionResult<Map<string, AiNutritionPer100g>>> {
  const wanted = names.map((n) => n.trim()).filter(Boolean);
  if (wanted.length === 0) return { data: new Map(), error: null };

  const prompt =
    'Give standard reference nutrition per 100 g of edible portion for each food listed, ' +
    'as prepared the way the name describes. ' +
    'Use well-established food composition data (USDA FoodData Central or an equivalent national table). ' +
    'Give vitamins and minerals only where the value is actually known for this food; ' +
    'omit any nutrient you are unsure of rather than estimating it. ' +
    'Units: calories kcal, macronutrients grams, and each micronutrient in the unit its key names ' +
    '(_mg milligrams, _ug micrograms). ' +
    'Return one entry per food, reusing the exact name given.\n\nFoods:\n' +
    wanted.map((n) => `- ${n}`).join('\n');

  const { data, error } = await ask(
    [{ type: 'text', text: prompt }],
    NUTRITION_SCHEMA,
    'food_nutrition',
    TEXT_TIMEOUT_MS
  );
  if (error) return { data: null, error };

  const rows = (data as { foods?: unknown[] } | null)?.foods;
  if (!Array.isArray(rows)) return { data: null, error: 'unreadable' };

  const out = new Map<string, AiNutritionPer100g>();
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const name = (row as { name?: unknown }).name;
    if (typeof name !== 'string') continue;
    const parsed = parseNutritionPer100g(row);
    if (parsed) out.set(name.trim().toLowerCase(), parsed);
  }
  return { data: out, error: out.size > 0 ? null : 'unreadable' };
}

/** A human explanation for each way this can fail. */
export function failureMessage(e: VisionFailure): string {
  switch (e) {
    case 'no-key':
      return 'Add your OpenRouter key to use photo logging.';
    case 'offline':
      return 'No connection — the photo needs the internet. Everything else still works offline.';
    case 'rate-limited':
      return 'The free model is busy (20 requests a minute, 50 a day). Try again shortly.';
    case 'unauthorised':
      return 'That key was refused. Check it at openrouter.ai/keys.';
    case 'unreadable':
      return "The model's answer couldn't be read. Try another photo, or add the food by hand.";
    default:
      return 'That did not work. You can still add the food by hand.';
  }
}
