import { clamp } from './format';

/**
 * Smart calorie & macro calculator (spec §3.6).
 * Pipeline: Mifflin-St Jeor BMR → TDEE (activity multiplier) → goal offset →
 * macro split. Includes a dynamic TDEE refinement from real trend data (§3.6.3).
 */

export type Sex = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Goal = 'lose_fat' | 'maintain' | 'build_muscle';
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
}

/** Mifflin-St Jeor Basal Metabolic Rate. */
export function calculateBMR(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(base + (sex === 'male' ? 5 : -161));
}

/** BMR × activity multiplier. */
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

/**
 * Goal offset as a fraction of TDEE (spec §3.6.4).
 * Fat loss: −15–20%, maintenance: 0, muscle gain: +10–15%. Magnitude scales
 * with the chosen rate of change.
 */
export function goalOffsetPct(goal: Goal, rate: RateOfChange): number {
  if (goal === 'maintain') return 0;
  const loss = { slow: -0.12, moderate: -0.17, aggressive: -0.22 };
  const gain = { slow: 0.08, moderate: 0.12, aggressive: 0.15 };
  return goal === 'lose_fat' ? loss[rate] : gain[rate];
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
  const proteinPerKg = goal === 'maintain' ? 1.8 : goal === 'lose_fat' ? 2.2 : 2.0;
  const proteinBasisKg =
    bodyFatPct && bodyFatPct > 0 && bodyFatPct < 60
      ? weightKg * (1 - bodyFatPct / 100) * 1.15 // ~lean mass, mildly padded
      : weightKg;
  const protein = Math.round(proteinPerKg * proteinBasisKg);

  const fatPctOfCals = goal === 'lose_fat' ? 0.25 : 0.28;
  const fat = Math.round((calorieTarget * fatPctOfCals) / 9);

  const proteinCals = protein * 4;
  const fatCals = fat * 9;
  const carbs = Math.max(0, Math.round((calorieTarget - proteinCals - fatCals) / 4));

  return { protein, carbs, fat };
}

/** Full calculation pipeline. */
export function computeTargets(input: CalorieInputs): CalorieResult {
  const bmr = calculateBMR(input.sex, input.weightKg, input.heightCm, input.age);
  const tdee = calculateTDEE(bmr, input.activityLevel);
  const offset = goalOffsetPct(input.goal, input.rate);
  // Never prescribe below BMR for safety.
  const calorieTarget = Math.max(bmr, Math.round(tdee * (1 + offset)));
  const macros = calculateMacros(calorieTarget, input.weightKg, input.goal, input.bodyFatPct);
  return { bmr, tdee, calorieTarget, macros, goalOffsetPct: offset };
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
