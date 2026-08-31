import { MICRO_KEYS } from '@/lib/micros';
import {
  parseNutritionPer100g,
  parsePhotoIdentification,
  extractJson,
  modelRoute,
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

/*
 * How long to wait.
 *
 * Free endpoints are not fast endpoints: the request queues behind everyone
 * else using the same free capacity, and a photograph is a large prompt to
 * begin with. 45 s was optimistic and timed out on a real meal over real
 * Wi-Fi — which then read to the user as "no connection", the one thing it
 * definitely was not. Two minutes is patient enough to be worth the wait and
 * short enough not to look frozen.
 */
const VISION_TIMEOUT_MS = 120_000;
const TEXT_TIMEOUT_MS = 60_000;

/**
 * Identification returns a short list, so it needs few output tokens; asking
 * for fewer is directly faster. Researching nutrition has 26 micronutrient
 * fields to fill and needs the room.
 */
const IDENTIFY_MAX_TOKENS = 1500;
const NUTRITION_MAX_TOKENS = 2400;

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
  | 'timeout'
  | 'rate-limited'
  | 'unauthorised'
  | 'data-policy'
  | 'unreadable'
  | 'failed';

export interface VisionResult<T> {
  data: T | null;
  error: VisionFailure | null;
}

/**
 * What actually came back when a call failed — status, the provider's own
 * words, which model. Shown in small print under the error card, because a
 * failure in the field that only says "did not work" leaves the user unable
 * to tell whether the feature works at all, let alone why it didn't.
 */
let lastDetail: string | null = null;
export function lastVisionDetail(): string | null {
  return lastDetail;
}


interface ChatMessageContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
}

async function post(
  content: ChatMessageContent[],
  responseFormat: Record<string, unknown> | undefined,
  timeoutMs: number,
  key: string,
  maxTokens: number
): Promise<VisionResult<unknown>> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  // Measured so a failure can say how big the request was and how long it
  // waited — the difference between "the photo is too heavy" and "the free
  // model is busy", which otherwise look identical from the outside.
  const body = JSON.stringify({
    model: activeModel(),
    models: modelRoute(activeModel()),
    messages: [{ role: 'user', content }],
    ...(responseFormat ? { response_format: responseFormat } : {}),
    temperature: 0,
    max_tokens: maxTokens,
  });
  const sentKb = Math.round(body.length / 1024);
  const startedAt = Date.now();
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
      body,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      lastDetail = `HTTP ${res.status}${body ? ` — ${body.slice(0, 220)}` : ''}`;
      if (res.status === 401 || res.status === 403) return { data: null, error: 'unauthorised' };
      if (res.status === 429) return { data: null, error: 'rate-limited' };
      /*
       * The most common first-run failure with :free models: the account's
       * privacy settings refuse providers that may train on prompts, and
       * OpenRouter answers 404 "no allowed providers". That is a setting on
       * the website, not a bug here — so it is named, not lumped into "failed".
       */
      if (/data policy|allowed providers|privacy/i.test(body)) return { data: null, error: 'data-policy' };
      return { data: null, error: 'failed' };
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string }; finish_reason?: string }>;
      error?: { message?: string };
    };
    // Some providers put their refusal in a 200 body instead of a status.
    if (json.error?.message) {
      const msg = String(json.error.message);
      lastDetail = msg.slice(0, 220);
      return {
        data: null,
        error: /data policy|allowed providers|privacy/i.test(msg) ? 'data-policy' : 'failed',
      };
    }

    const choice = json.choices?.[0];
    const text = choice?.message?.content;
    if (typeof text !== 'string' || !text.trim()) {
      lastDetail = `The model returned an empty reply (finish: ${choice?.finish_reason ?? 'unknown'}).`;
      return { data: null, error: 'unreadable' };
    }

    const parsed = extractJson(text);
    if (parsed == null) {
      // A reply cut off at the token ceiling is unreadable for a knowable
      // reason, and the retry doubles the budget rather than repeating itself.
      lastDetail =
        choice?.finish_reason === 'length'
          ? `The reply was cut short at the length limit, so its JSON never closed: "${text.slice(0, 300)}"`
          : `Not JSON: "${text.slice(0, 300)}"`;
      return { data: null, error: 'unreadable' };
    }
    lastDetail = null;
    return { data: parsed, error: null };
  } catch (e) {
    const aborted = e instanceof Error && e.name === 'AbortError';
    const waited = Math.round((Date.now() - startedAt) / 1000);
    lastDetail = aborted
      ? `Sent ${sentKb} KB, no reply in ${waited} s. A free model that is busy usually answers on a ` +
        `second try; if the size is large the photo is the problem.`
      : `Could not reach openrouter.ai at all (after ${waited} s, ${sentKb} KB).`;
    return { data: null, error: aborted ? 'timeout' : 'offline' };
  } finally {
    clearTimeout(timer);
  }
}

async function ask(
  content: ChatMessageContent[],
  schema: Record<string, unknown>,
  schemaName: string,
  timeoutMs: number,
  maxTokens: number
): Promise<VisionResult<unknown>> {
  const key = openRouterKey();
  if (!key) return { data: null, error: 'no-key' };

  /*
   * Ask for JSON in the only way these models actually support.
   *
   * A `json_schema` response format requires the provider to advertise
   * `structured_outputs`, and NONE of the free vision models this routes to
   * do — they support plain `response_format` only. Demanding the schema
   * therefore failed on every request: the model either refused the parameter
   * or ignored it and replied in prose, which read back as "the answer
   * couldn't be read".
   *
   * So: `json_object`, which they all support, with the schema spelled out in
   * the prompt since that mode constrains syntax but not shape. The reply is
   * then read by extractJson, which copes with a preamble or a code fence.
   *
   * The retry drops the format entirely and doubles the token budget, which
   * covers both a provider that dislikes the parameter and a reply cut off
   * mid-object. Auth, rate-limit, privacy and timeout answers are real, not
   * formatting problems, and are never retried.
   */
  const hint: ChatMessageContent = {
    type: 'text',
    text:
      'Reply with ONE JSON object and nothing else — no explanation, no code fence — ' +
      'matching exactly this JSON schema:\n' +
      JSON.stringify(schema),
  };
  const asked = [...content, hint];

  const first = await post(asked, { type: 'json_object' }, timeoutMs, key, maxTokens);
  if (first.error !== 'failed' && first.error !== 'unreadable') return first;

  return post(asked, undefined, timeoutMs, key, maxTokens * 2);
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
    VISION_TIMEOUT_MS,
    IDENTIFY_MAX_TOKENS
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
    TEXT_TIMEOUT_MS,
    NUTRITION_MAX_TOKENS
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
    case 'timeout':
      return (
        'The free model did not answer in time — they queue when busy. Your connection is ' +
        'fine; try again, and it often answers on the second attempt.'
      );
    case 'rate-limited':
      return 'The free model is busy (20 requests a minute, 50 a day). Try again shortly.';
    case 'unauthorised':
      return 'That key was refused. Check it at openrouter.ai/keys.';
    case 'data-policy':
      return (
        'Your OpenRouter privacy settings block free models. On openrouter.ai, open Settings ' +
        String.fromCharCode(8594) + ' Privacy and enable free model training, then try again ' + String.fromCharCode(8212) +
        ' free endpoints require it.'
      );
    case 'unreadable':
      return "The model's answer couldn't be read. Try again — or another photo, or add the food by hand.";
    default:
      return 'That did not work. You can still add the food by hand.';
  }
}
