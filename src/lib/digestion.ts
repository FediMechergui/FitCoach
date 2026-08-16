/**
 * How long after a meal until it is comfortable — and safe — to train.
 *
 * ── The physiology ──
 * The number that matters is gastric emptying: how long food sits in the
 * stomach before it moves on. Training with a full stomach diverts blood
 * toward working muscle and away from the gut, which stalls digestion, and
 * running or jumping with a stomach full of food is a reliable recipe for
 * cramp, reflux and nausea. Emptying is not fixed — it depends mostly on the
 * meal's SIZE and its FAT content, then on protein and fibre. Liquids clear in
 * under an hour; a small carbohydrate snack in about an hour; a mixed meal in
 * two to three; a large, fatty one in four or more.
 *
 * ── The model ──
 * A base time from the meal's energy (larger meals empty slower, roughly
 * linearly over the range that matters), pushed out by fat, protein and fibre
 * per gram, then scaled by what you're about to do — an easy walk tolerates a
 * fuller stomach than sprints or heavy squats. It is an ESTIMATE grounded in
 * the standard ranges above, and the UI says so; individual tolerance varies
 * and the user's own experience is the final word. Every function is pure so
 * the numbers can be checked without a device.
 */

export type TrainingIntensity = 'light' | 'moderate' | 'hard';

export interface MealForDigestion {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  /** epoch ms the meal was eaten (its diary createdAt) */
  eatenAt: number;
}

/**
 * Minutes for a meal to clear enough to train at the given intensity.
 *
 * Calibration points, from the standard gastric-emptying ranges:
 *   200 kcal carb snack, moderate → ~60 min
 *   600 kcal mixed meal, moderate → ~150 min
 *   900 kcal fatty meal (40 g fat), hard → ~240+ min
 * A hydration-only entry (0 kcal) needs essentially no wait.
 */
export function digestionMinutes(meal: MealForDigestion, intensity: TrainingIntensity = 'moderate'): number {
  const kcal = Math.max(0, meal.calories);
  if (kcal < 20) return 5;

  // Base from energy: ~45 min for a small snack, then ~12 min per further
  // 100 kcal — a 200 kcal snack lands near an hour, a 600 kcal meal near two
  // before fat and protein push it further out.
  let minutes = 45 + Math.max(0, kcal - 150) * 0.12;

  // Fat is the biggest brake on emptying — about 1.5 min per gram once past a
  // token amount. Protein and fibre slow it more gently.
  minutes += Math.max(0, meal.fatG - 5) * 1.5;
  minutes += Math.max(0, meal.proteinG - 10) * 0.6;
  minutes += Math.max(0, meal.fiberG - 3) * 2;

  // What you're about to do decides how empty the stomach needs to be.
  const factor = intensity === 'light' ? 0.6 : intensity === 'hard' ? 1.25 : 1;
  minutes *= factor;

  return Math.round(clamp(minutes, 5, 300));
}

export interface DigestionStatus {
  /** minutes since the meal */
  elapsedMin: number;
  /** minutes the model says the meal needs, for the intensity asked */
  requiredMin: number;
  /** minutes still to wait; 0 when clear */
  remainingMin: number;
  /** 0..1 how far through digestion the meal is */
  progress: number;
  ready: boolean;
  /** which intensity is safe RIGHT NOW, given how long it's been */
  readyFor: TrainingIntensity | null;
  /** epoch ms at which the requested intensity becomes safe */
  readyAt: number;
}

/**
 * Where a meal is in its digestion right now, for the intensity you intend.
 * `readyFor` answers the more useful question — "what CAN I do now?" — by
 * checking the lighter intensities too, so a heavy lunch that isn't ready for
 * sprints may still be fine for a walk.
 */
export function digestionStatus(
  meal: MealForDigestion,
  intensity: TrainingIntensity = 'moderate',
  now = Date.now()
): DigestionStatus {
  const requiredMin = digestionMinutes(meal, intensity);
  const elapsedMin = Math.max(0, Math.round((now - meal.eatenAt) / 60_000));
  const remainingMin = Math.max(0, requiredMin - elapsedMin);
  const progress = requiredMin > 0 ? clamp(elapsedMin / requiredMin, 0, 1) : 1;

  let readyFor: TrainingIntensity | null = null;
  for (const level of ['hard', 'moderate', 'light'] as const) {
    if (elapsedMin >= digestionMinutes(meal, level)) { readyFor = level; break; }
  }

  return {
    elapsedMin,
    requiredMin,
    remainingMin,
    progress,
    ready: remainingMin === 0,
    readyFor,
    readyAt: meal.eatenAt + requiredMin * 60_000,
  };
}

/**
 * The status that governs training NOW: the most recent meal that is still
 * digesting. Older meals that have cleared don't count, and if nothing is in
 * the way the answer is simply "clear".
 */
export function currentDigestion(
  meals: MealForDigestion[],
  intensity: TrainingIntensity = 'moderate',
  now = Date.now()
): DigestionStatus | null {
  const pending = meals
    .map((m) => digestionStatus(m, intensity, now))
    .filter((s) => !s.ready)
    .sort((a, b) => b.remainingMin - a.remainingMin);
  return pending[0] ?? null;
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
 * water/coffee) fall out naturally via the <20 kcal floor in digestionMinutes.
 */
export function mealsFromEntries(
  entries: Array<{ calories: number; proteinG: number; carbsG: number; fatG: number; fiberG: number; createdAt: number }>
): MealForDigestion[] {
  return entries.map((e) => ({
    calories: e.calories,
    proteinG: e.proteinG,
    carbsG: e.carbsG,
    fatG: e.fatG,
    fiberG: e.fiberG,
    eatenAt: e.createdAt,
  }));
}
