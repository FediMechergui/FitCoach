import { clamp } from './format';

/**
 * Smart calorie & macro calculator (spec §3.6).
 * Pipeline: Mifflin-St Jeor BMR → TDEE (activity multiplier) → goal offset →
 * macro split. Includes a dynamic TDEE refinement from real trend data (§3.6.3).
 */

export type Sex = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Goal = 'lose_fat' | 'maintain' | 'build_muscle' | 'recomp' | 'performance';
export type RateOfChange = 'slow' | 'moderate' | 'aggressive';

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Sedentary — little/no exercise',
  light: 'Light — 1–3 days/week',
  moderate: 'Moderate — 3–5 days/week',
  active: 'Active — 6–7 days/week',
  very_active: 'Very active — hard training / physical job',
};

export const GOAL_LABELS: Record<Goal, string> = {
  lose_fat: 'Lose fat',
  maintain: 'Maintain',
  build_muscle: 'Build muscle',
  recomp: 'Build muscle & burn fat',
  performance: 'Athletic performance',
};

/** Display order for goal pickers — new goals go last, never in the middle. */
export const GOAL_ORDER: Goal[] = ['lose_fat', 'maintain', 'build_muscle', 'recomp', 'performance'];

export const GOAL_BLURBS: Record<Goal, string> = {
  lose_fat: 'Calorie deficit, protein-forward',
  maintain: 'Hold your current weight',
  build_muscle: 'Slight surplus, progressive overload',
  recomp: 'Near maintenance with very high protein and hard lifting — the scale barely moves while composition does',
  performance: 'Fuelled for training: maintenance-plus, carb-forward',
};

/**
 * An honest note per goal — mostly so "recomp" is not sold as magic. Shown in
 * the goal pickers.
 */
export const GOAL_NOTES: Record<Goal, string> = {
  lose_fat: 'Fastest way down, but some lean mass goes with it unless protein and lifting stay high.',
  maintain: 'Useful between pushes, and after a cut to let intake normalise.',
  build_muscle: 'A surplus builds muscle fastest — and some fat comes with it. That is the trade.',
  recomp:
    'Real, but slow, and it works best for beginners, returners and people carrying more fat. '
    + 'It needs three things at once: protein around 2.4 g per kg of lean mass, hard progressive '
    + 'lifting, and enough sleep. Watch your lifts and the tape — not the scale, which is supposed '
    + 'to stay roughly flat.',
  performance: 'Prioritises fuelling and recovery over body composition. Weight may drift up slightly.',
};

export interface CalorieInputs {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: Goal;
  rate: RateOfChange;
  bodyFatPct?: number | null;
  /** measured fat-free mass — when present, BMR uses Katch-McArdle instead */
  leanMassKg?: number | null;
}

export interface MacroTargets {
  protein: number; // g
  carbs: number; // g
  fat: number; // g
}

export interface CalorieResult {
  bmr: number;
  tdee: number;
  calorieTarget: number;
  macros: MacroTargets;
  goalOffsetPct: number;
  /** which BMR formula produced `bmr` */
  bmrBasis: 'mifflin' | 'katch';
}

/** Mifflin-St Jeor Basal Metabolic Rate. */
export function calculateBMR(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(base + (sex === 'male' ? 5 : -161));
}

/**
 * Katch-McArdle BMR from measured fat-free mass. Preferred over Mifflin when
 * body composition is actually measured, because it accounts for how much of
 * your weight is metabolically active tissue rather than assuming it.
 */
export function calculateBMRFromLeanMass(leanMassKg: number): number {
  return Math.round(370 + 21.6 * leanMassKg);
}

/** BMR × activity multiplier. */
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

/**
 * Goal offset as a fraction of TDEE (spec §3.6.4).
 * Fat loss: −12–22%, maintenance: 0, muscle gain: +8–15%. Magnitude scales
 * with the chosen rate of change.
 *
 * Recomposition sits deliberately close to maintenance: a small deficit is
 * enough to lose fat while still leaving the energy to build. Go steeper and it
 * stops being a recomp and becomes a cut. Performance runs at or just above
 * maintenance because under-fuelling is what wrecks training quality.
 */
export function goalOffsetPct(goal: Goal, rate: RateOfChange): number {
  if (goal === 'maintain') return 0;
  const loss = { slow: -0.12, moderate: -0.17, aggressive: -0.22 };
  const gain = { slow: 0.08, moderate: 0.12, aggressive: 0.15 };
  const recomp = { slow: -0.03, moderate: -0.07, aggressive: -0.1 };
  const performance = { slow: 0, moderate: 0.03, aggressive: 0.05 };
  if (goal === 'lose_fat') return loss[rate];
  if (goal === 'recomp') return recomp[rate];
  if (goal === 'performance') return performance[rate];
  return gain[rate];
}

/**
 * Macro split (spec §3.6.5):
 *  - Protein 1.6–2.2 g/kg bodyweight (higher on a cut / muscle gain)
 *  - Fat 20–30% of calories
 *  - Carbs = remainder
 * If body-fat % is known, protein is anchored to lean mass to avoid over-
 * prescribing for higher-bodyfat users.
 */
export function calculateMacros(
  calorieTarget: number,
  weightKg: number,
  goal: Goal,
  bodyFatPct?: number | null
): MacroTargets {
  // Recomp gets the highest protein of any goal — it is the single lever that
  // makes building and losing at the same time possible. Performance runs
  // lower protein and higher carbs, because fuel is the limiter there.
  const PROTEIN_PER_KG: Record<Goal, number> = {
    maintain: 1.8, lose_fat: 2.2, build_muscle: 2.0, recomp: 2.4, performance: 1.8,
  };
  const proteinPerKg = PROTEIN_PER_KG[goal] ?? 2.0;
  const proteinBasisKg =
    bodyFatPct && bodyFatPct > 0 && bodyFatPct < 60
      ? weightKg * (1 - bodyFatPct / 100) * 1.15 // ~lean mass, mildly padded
      : weightKg;
  const protein = Math.round(proteinPerKg * proteinBasisKg);

  const fatPctOfCals =
    goal === 'lose_fat' || goal === 'recomp' ? 0.25 : goal === 'performance' ? 0.22 : 0.28;
  const fat = Math.round((calorieTarget * fatPctOfCals) / 9);

  const proteinCals = protein * 4;
  const fatCals = fat * 9;
  const carbs = Math.max(0, Math.round((calorieTarget - proteinCals - fatCals) / 4));

  return { protein, carbs, fat };
}

/**
 * Full calculation pipeline. When measured lean mass is supplied (from a body
 * composition weigh-in), BMR comes from Katch-McArdle; otherwise Mifflin-St Jeor.
 */
export function computeTargets(input: CalorieInputs): CalorieResult {
  const useKatch = input.leanMassKg != null && input.leanMassKg > 0;
  const bmr = useKatch
    ? calculateBMRFromLeanMass(input.leanMassKg as number)
    : calculateBMR(input.sex, input.weightKg, input.heightCm, input.age);
  const tdee = calculateTDEE(bmr, input.activityLevel);
  const offset = goalOffsetPct(input.goal, input.rate);
  // Never prescribe below BMR for safety.
  const calorieTarget = Math.max(bmr, Math.round(tdee * (1 + offset)));
  const macros = calculateMacros(calorieTarget, input.weightKg, input.goal, input.bodyFatPct);
  return { bmr, tdee, calorieTarget, macros, goalOffsetPct: offset, bmrBasis: useKatch ? 'katch' : 'mifflin' };
}

/**
 * Dynamic TDEE refinement (spec §3.6.3). Compares actual average intake against
 * actual weight change over a window to back out real maintenance calories.
 *
 *   Δweight(kg) over N days → energy balance = Δkg × 7700 kcal/kg
 *   realTDEE ≈ avgIntake − (energyBalance / N)
 *
 * The estimate is blended with the formula TDEE and clamped to ±25% to stay
 * robust against noisy short windows / water-weight swings.
 */
export function refineTDEE(params: {
  formulaTDEE: number;
  avgDailyIntake: number;
  weightChangeKg: number; // end − start over the window
  days: number;
}): number {
  const { formulaTDEE, avgDailyIntake, weightChangeKg, days } = params;
  if (days < 10 || avgDailyIntake <= 0) return formulaTDEE;
  const dailyEnergyBalance = (weightChangeKg * 7700) / days;
  const impliedTDEE = avgDailyIntake - dailyEnergyBalance;
  const blended = 0.6 * impliedTDEE + 0.4 * formulaTDEE;
  return Math.round(clamp(blended, formulaTDEE * 0.75, formulaTDEE * 1.25));
}

/** Water goal heuristic: ~35 ml per kg bodyweight, floored at 2 L (spec §3.5). */
export function recommendedWaterMl(weightKg: number): number {
  return Math.max(2000, Math.round((weightKg * 35) / 50) * 50);
}
