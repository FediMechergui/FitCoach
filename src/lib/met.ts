/**
 * MET-based calorie-burn estimation (spec §3.1 recap, §3.4).
 *   kcal = MET × 3.5 × weightKg / 200 × minutes
 * (equivalent to MET × weightKg × hours, since 3.5 mlO2/kg/min ≈ 1 MET and
 * 1 L O2 ≈ 5 kcal).
 */

export function caloriesFromMet(met: number, weightKg: number, durationSec: number): number {
  const minutes = durationSec / 60;
  return Math.round((met * 3.5 * weightKg) / 200 * minutes);
}

/** Fallback MET by session type when a specific exercise MET isn't known. */
export const SESSION_TYPE_MET: Record<string, number> = {
  strength: 5,
  calisthenics: 6,
  cardio: 7,
  outdoor: 9,
  sport: 7,
  mindbody: 3,
  meditation: 1.3,
  custom: 4,
};

/**
 * Walking/running MET scales with pace. Uses speed (km/h) to pick a MET from
 * the Compendium of Physical Activities.
 */
export function walkRunMet(speedKmh: number): number {
  if (speedKmh <= 0) return 2.0;
  if (speedKmh < 4) return 2.8; // slow walk
  if (speedKmh < 5.5) return 3.5; // moderate walk
  if (speedKmh < 6.5) return 5.0; // brisk walk
  if (speedKmh < 8) return 7.0; // very brisk / jog
  if (speedKmh < 9.7) return 9.0; // ~10 min/mi
  if (speedKmh < 11.3) return 10.5;
  if (speedKmh < 12.9) return 11.5;
  return 12.8; // fast run
}

/**
 * Estimate calories for a walk/run from steps, distance and duration.
 * Distance drives speed → MET; falls back to a per-step estimate if no time.
 */
export function walkCalories(params: {
  weightKg: number;
  distanceM: number;
  durationSec: number;
  steps: number;
}): number {
  const { weightKg, distanceM, durationSec, steps } = params;
  if (durationSec > 0 && distanceM > 0) {
    const speedKmh = distanceM / 1000 / (durationSec / 3600);
    return caloriesFromMet(walkRunMet(speedKmh), weightKg, durationSec);
  }
  // ~0.04 kcal per step for a ~70kg adult, scaled by bodyweight.
  return Math.round(steps * 0.04 * (weightKg / 70));
}
