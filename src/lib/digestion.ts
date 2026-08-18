/**
 * How long after eating until it is comfortable — and safe — to train.
 *
 * ── The physiology ──
 * The number that matters is gastric emptying: how much food is still in the
 * stomach. Training on a full stomach diverts blood toward working muscle and
 * away from the gut, which stalls digestion, and running or jumping with a
 * stomach full of food is a reliable recipe for cramp, reflux and nausea.
 *
 * Three facts drive the model:
 *   1. The stomach lets food through at a rate governed mainly by ENERGY —
 *      roughly 2–4 kcal per minute for a mixed solid meal, a little faster
 *      when it is fuller (a bigger meal empties faster per minute but still
 *      takes longer overall). Simple carbohydrate clears fastest; that is
 *      the reference speed for solids.
 *   3. LIQUIDS are a different case. A drink leaves the stomach far faster
 *      than the same calories as food: nutrient drinks half-empty in roughly
 *      half the time of a solid meal, and they skip most of the 20–30 minute
 *      lag phase that solids sit through before emptying starts at all. So a
 *      500 kcal smoothie is not a 500 kcal plate — the clock runs it at about
 *      twice the speed and settles it in a quarter of the time. Every food in
 *      the catalogue is marked liquid or solid, and so is every food you add.
 *   2. Composition slows it. Fat is the biggest brake (the duodenum senses fat
 *      and holds the stomach back — a fatty meal can take twice as long),
 *      protein slows it moderately, fibre adds bulk and viscosity. Carbs are
 *      the fast fraction — the more of the meal is carbohydrate, the closer to
 *      the reference speed it runs.
 *
 * ── The model: a stomach LOAD, not a per-meal timer ──
 * Every meal adds its calories to what is already there. The load drains at
 *   dR/dt = −(B + K·R) / s
 * where B is a base rate, K makes fuller stomachs drain a little faster, and s
 * is the "slowness" of what is in there — 1.0 for a lean carbohydrate meal,
 * up to ~2 for a fatty one — blended by weight when meals stack. You are
 * ready to train when the load is below a threshold that depends on what you
 * are about to do: sprints and heavy squats want a nearly empty stomach; a
 * walk tolerates a fair amount. That is why the answer is CUMULATIVE — a
 * 300 kcal snack an hour after lunch does not start its own 40-minute clock,
 * it lands on top of the ~300 kcal of lunch still in there, and the wait is
 * for the whole 600.
 *
 * Calibration (standard guidance in brackets):
 *   250 kcal snack,       hard   → ~30 min   [30–60]
 *   400 kcal snack,       hard   → ~1 h 25   [1–2 h]
 *   600 kcal mixed meal,  normal → ~2 h      [2–3 h]
 *   600 kcal mixed meal,  hard   → ~2 h 35   [2–3 h]
 *   1000 kcal fatty meal, hard   → ~4 h 20   [3–4 h+]
 *   a walk after any of them     → 0–35 min  (fine, even helpful)
 * Everything is an ESTIMATE grounded in those ranges; the UI says so, and the
 * user's own tolerance is the final word. Every function is pure so the
 * numbers can be checked without a device.
 */

export type TrainingIntensity = 'light' | 'moderate' | 'hard';
/** How the stomach treats it. Every catalogue food and every custom food carries one. */
export type FoodForm = 'solid' | 'liquid';

export interface MealForDigestion {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  /** epoch ms the meal was eaten (its diary createdAt) */
  eatenAt: number;
  /** liquid or solid; missing means solid (every row from before the flag) */
  form?: FoodForm;
}

// ── Model constants ────────────────────────────────────────────────────────

/** Base emptying rate, kcal-equivalents per minute, for a lean meal. */
export const EMPTY_BASE_KCAL_PER_MIN = 2.0;
/** Fuller stomachs drain a little faster: extra rate per kcal present. */
export const EMPTY_RATE_PER_KCAL = 0.004;
/** Meals under this are hydration or a bite — they add nothing. */
export const MIN_MEAL_KCAL = 20;
/**
 * How empty the stomach must be (kcal-equivalents still inside) for each
 * intensity. A walk after a meal is fine — good, even; sprints are not.
 */
export const READY_THRESHOLD_KCAL: Record<TrainingIntensity, number> = { light: 500, moderate: 260, hard: 180 };
/**
 * A settling floor after the LAST bite regardless of size — solids sit in a
 * lag phase for the first while before they empty at all.
 */
export const SETTLE_MIN: Record<TrainingIntensity, number> = { light: 0, moderate: 20, hard: 30 };
/** A drink barely has a lag phase — a shake needs a quarter of an hour before sprints, not half. */
export const LIQUID_SETTLE_MIN: Record<TrainingIntensity, number> = { light: 0, moderate: 10, hard: 15 };
/** Liquids drain at about twice the rate of the same calories as solid food. */
export const LIQUID_SPEED = 2;
export const MAX_WAIT_MIN = 300;

/**
 * How much slower than a lean carbohydrate meal this meal empties (1 = same,
 * 2 = half speed). Built from energy SHARES rather than grams, because grams
 * already scale with the calories that set the base time — this term is
 * purely about the mix. Carbs are the remainder: the fast fraction.
 */
export function mealSlowness(meal: Pick<MealForDigestion, 'calories' | 'proteinG' | 'fatG' | 'fiberG'> & { form?: FoodForm }): number {
  const kcal = Math.max(1, meal.calories);
  const fatShare = clamp((meal.fatG * 9) / kcal, 0, 1);
  const proteinShare = clamp((meal.proteinG * 4) / kcal, 0, 1);
  const fibrePer100 = clamp((meal.fiberG / kcal) * 100, 0, 6);
  const s = clamp(1 + 1.2 * Math.max(0, fatShare - 0.15) + 0.4 * Math.max(0, proteinShare - 0.15) + 0.08 * fibrePer100, 1, 2);
  // A liquid runs the same composition at LIQUID_SPEED × the rate.
  return meal.form === 'liquid' ? s / LIQUID_SPEED : s;
}

/** The slowest a liquid can be, the fastest a solid: the bounds of `mealSlowness`. */
export const MIN_SLOWNESS = 1 / LIQUID_SPEED;

/** Energy shares of a meal — for showing WHY it is slow or fast. */
export function mealShares(meal: Pick<MealForDigestion, 'calories' | 'proteinG' | 'carbsG' | 'fatG'>) {
  const kcal = Math.max(1, meal.calories);
  const fat = clamp((meal.fatG * 9) / kcal, 0, 1);
  const protein = clamp((meal.proteinG * 4) / kcal, 0, 1);
  const carbs = clamp(1 - fat - protein, 0, 1);
  return { carbs, protein, fat };
}

/** Load left after draining `r0` for `minutes` at slowness `s`. Closed form of the ODE above. */
export function drain(r0: number, minutes: number, s: number): number {
  if (r0 <= 0 || minutes <= 0) return Math.max(0, r0);
  const B = EMPTY_BASE_KCAL_PER_MIN;
  const K = EMPTY_RATE_PER_KCAL;
  const r = ((B + K * r0) * Math.exp((-K * minutes) / Math.max(MIN_SLOWNESS, s)) - B) / K;
  return Math.max(0, r);
}

/** Minutes to drain from `r0` down to `target` at slowness `s`; 0 if already there. */
export function minutesToDrain(r0: number, target: number, s: number): number {
  if (r0 <= target) return 0;
  const B = EMPTY_BASE_KCAL_PER_MIN;
  const K = EMPTY_RATE_PER_KCAL;
  return (Math.max(MIN_SLOWNESS, s) / K) * Math.log((B + K * r0) / (B + K * target));
}

export interface StomachLoad {
  /** kcal-equivalents still in the stomach now */
  loadKcal: number;
  /** blended slowness of what is in there */
  slowness: number;
  /** meals that still contribute (eaten, and not yet drained away before the next) */
  meals: MealForDigestion[];
  /** epoch ms of the most recent contributing meal */
  lastEatenAt: number | null;
  /** total calories of the contributing meals (what went in) */
  eatenKcal: number;
  /** what the last bite was — a drink settles far faster than a plate */
  lastForm: FoodForm;
}

/**
 * Walk the meals in order: drain what was there until each meal, add it,
 * re-blend the slowness; then drain to `now`. Meals still in the future (a
 * clock quirk) are ignored. This is THE cumulative step.
 */
export function stomachLoad(meals: MealForDigestion[], now = Date.now()): StomachLoad {
  const sorted = meals
    .filter((m) => m.calories >= MIN_MEAL_KCAL && m.eatenAt <= now)
    .sort((a, b) => a.eatenAt - b.eatenAt);
  let load = 0;
  let s = 1;
  let t = sorted[0]?.eatenAt ?? now;
  const contributing: MealForDigestion[] = [];
  for (const m of sorted) {
    load = drain(load, (m.eatenAt - t) / 60_000, s);
    if (load < 1) { contributing.length = 0; s = 1; load = 0; }
    const add = m.calories;
    const sm = mealSlowness(m);
    s = load + add > 0 ? (load * s + add * sm) / (load + add) : 1;
    load += add;
    contributing.push(m);
    t = m.eatenAt;
  }
  load = drain(load, (now - t) / 60_000, s);
  if (load < 1) return { loadKcal: 0, slowness: 1, meals: [], lastEatenAt: null, eatenKcal: 0, lastForm: 'solid' };
  const last = contributing[contributing.length - 1];
  return {
    loadKcal: Math.round(load),
    slowness: Math.round(s * 100) / 100,
    meals: contributing,
    lastEatenAt: last?.eatenAt ?? null,
    eatenKcal: Math.round(contributing.reduce((a, m) => a + m.calories, 0)),
    lastForm: last?.form === 'liquid' ? 'liquid' : 'solid',
  };
}

/**
 * Minutes from `now` until the given intensity is safe, for a stomach load
 * that is `s`-slow with the last bite at `lastEatenAt`. Threshold wait and
 * settling floor combined; capped.
 */
function waitFor(load: StomachLoad, intensity: TrainingIntensity, now: number): number {
  if (load.loadKcal <= 0 || load.lastEatenAt == null) return 0;
  const drainMin = minutesToDrain(load.loadKcal, READY_THRESHOLD_KCAL[intensity], load.slowness);
  const sinceLast = (now - load.lastEatenAt) / 60_000;
  const settle = load.lastForm === 'liquid' ? LIQUID_SETTLE_MIN : SETTLE_MIN;
  const settleMin = Math.max(0, settle[intensity] - sinceLast);
  return Math.round(clamp(Math.max(drainMin, settleMin), 0, MAX_WAIT_MIN));
}

/**
 * Minutes for ONE meal, eaten alone on an empty stomach, to clear enough to
 * train at the given intensity. The single-meal view of the same model — used
 * for the per-meal line and for the calibration table above.
 */
export function digestionMinutes(meal: MealForDigestion, intensity: TrainingIntensity = 'moderate'): number {
  const kcal = Math.max(0, meal.calories);
  if (kcal < MIN_MEAL_KCAL) return 0;
  const drainMin = minutesToDrain(kcal, READY_THRESHOLD_KCAL[intensity], mealSlowness(meal));
  const settle = meal.form === 'liquid' ? LIQUID_SETTLE_MIN : SETTLE_MIN;
  return Math.round(clamp(Math.max(drainMin, settle[intensity]), 0, MAX_WAIT_MIN));
}

export interface DigestionStatus {
  /** minutes since the last contributing meal */
  elapsedMin: number;
  /** minutes the model says are needed from that meal, for the intensity asked */
  requiredMin: number;
  /** minutes still to wait; 0 when clear */
  remainingMin: number;
  /** 0..1 how far along the wait is */
  progress: number;
  ready: boolean;
  /** which intensity is safe RIGHT NOW */
  readyFor: TrainingIntensity | null;
  /** epoch ms at which the requested intensity becomes safe */
  readyAt: number;
  /** kcal-equivalents still in the stomach (0 when clear) */
  loadKcal: number;
  /** how many meals are stacked in that load */
  mealCount: number;
  /** calories that went in across those meals */
  eatenKcal: number;
}

/**
 * Where ONE meal is in its digestion right now, as if eaten alone — the
 * per-meal line in the diary. For "can I train now?" use currentDigestion,
 * which stacks every meal.
 */
export function digestionStatus(
  meal: MealForDigestion,
  intensity: TrainingIntensity = 'moderate',
  now = Date.now()
): DigestionStatus {
  return statusFromLoad(stomachLoad([meal], now), intensity, now);
}

/**
 * The status that governs training NOW: the whole stomach load — every meal
 * still in there, stacked — and how long until it is low enough for the
 * intensity you intend. Null when nothing is in the way.
 */
export function currentDigestion(
  meals: MealForDigestion[],
  intensity: TrainingIntensity = 'moderate',
  now = Date.now()
): DigestionStatus | null {
  const load = stomachLoad(meals, now);
  if (load.loadKcal <= 0) return null;
  const s = statusFromLoad(load, intensity, now);
  return s.ready ? null : s;
}

function statusFromLoad(load: StomachLoad, intensity: TrainingIntensity, now: number): DigestionStatus {
  if (load.loadKcal <= 0 || load.lastEatenAt == null) {
    return { elapsedMin: 0, requiredMin: 0, remainingMin: 0, progress: 1, ready: true, readyFor: 'hard', readyAt: now, loadKcal: 0, mealCount: 0, eatenKcal: 0 };
  }
  const remainingMin = waitFor(load, intensity, now);
  const elapsedMin = Math.max(0, Math.round((now - load.lastEatenAt) / 60_000));
  const requiredMin = elapsedMin + remainingMin;
  let readyFor: TrainingIntensity | null = null;
  for (const level of ['hard', 'moderate', 'light'] as const) {
    if (waitFor(load, level, now) === 0) { readyFor = level; break; }
  }
  return {
    elapsedMin,
    requiredMin,
    remainingMin,
    progress: requiredMin > 0 ? clamp(elapsedMin / requiredMin, 0, 1) : 1,
    ready: remainingMin === 0,
    readyFor,
    readyAt: now + remainingMin * 60_000,
    loadKcal: load.loadKcal,
    mealCount: load.meals.length,
    eatenKcal: load.eatenKcal,
  };
}

/** "45 min", "1 h 20", "clear" */
export function formatWait(minutes: number): string {
  if (minutes <= 0) return 'clear';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`;
}

export const INTENSITY_LABEL: Record<TrainingIntensity, string> = {
  light: 'a walk or mobility',
  moderate: 'a normal session',
  hard: 'sprints or heavy lifting',
};

/** Which intensity a session type usually is, for the default question. */
export function intensityForSessionType(sessionType: string): TrainingIntensity {
  switch (sessionType) {
    case 'mindbody':
    case 'meditation':
      return 'light';
    case 'strength':
    case 'calisthenics':
    case 'martial_arts':
    case 'sport':
      return 'hard';
    default:
      return 'moderate';
  }
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/**
 * Turn the day's diary rows into digestion inputs. Hydration-only rows (0 kcal
 * water/coffee) fall out naturally via the MIN_MEAL_KCAL floor.
 */
export function mealsFromEntries(
  entries: Array<{ calories: number; proteinG: number; carbsG: number; fatG: number; fiberG: number; createdAt: number; form?: string | null }>
): MealForDigestion[] {
  return entries.map((e) => ({
    calories: e.calories,
    proteinG: e.proteinG,
    carbsG: e.carbsG,
    fatG: e.fatG,
    fiberG: e.fiberG,
    eatenAt: e.createdAt,
    form: e.form === 'liquid' ? 'liquid' : 'solid',
  }));
}
