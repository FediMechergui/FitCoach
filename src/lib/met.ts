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

/**
 * NET calories — the burn *above* resting metabolism.
 *
 * A MET value of 1 is you sitting still, so the gross figure above includes
 * calories your body would have spent anyway. That matters here because the
 * calorie target already covers resting metabolism through TDEE: crediting the
 * gross number counts roughly an extra 1 MET × time twice (about 85 kcal for an
 * hour at 80 kg), which flatters every session and quietly corrupts the
 * energy-balance and over-training maths.
 *
 * So exercise burn is (MET − 1). Gross stays available for anywhere a raw
 * Compendium figure is wanted.
 */
export function netCaloriesFromMet(met: number, weightKg: number, durationSec: number): number {
  const net = Math.max(0, met - 1);
  const minutes = durationSec / 60;
  return Math.round((net * 3.5 * weightKg) / 200 * minutes);
}

/**
 * Grade multiplier for walking/running on a slope. Climbing costs substantially
 * more than level ground; descending is slightly cheaper than level but never
 * free (braking is work), so the multiplier is floored.
 *
 * `gradePct` is rise/run × 100 — so 100 m of climb over 2 km is 5%.
 */
export function gradeMultiplier(gradePct: number): number {
  if (!Number.isFinite(gradePct) || gradePct === 0) return 1;
  // ~+8% energy cost per 1% incline, ~−3% per 1% decline, clamped to sane bounds.
  const raw = gradePct > 0 ? 1 + gradePct * 0.08 : 1 + gradePct * 0.03;
  return Math.max(0.85, Math.min(2.5, raw));
}

/** Fallback MET by session type when a specific exercise MET isn't known. */
export const SESSION_TYPE_MET: Record<string, number> = {
  strength: 5,
  calisthenics: 6,
  cardio: 7,
  outdoor: 9,
  sport: 7,
  martial_arts: 9.5,
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
 * Calories for a walk / run.
 *
 * Pace (from distance ÷ time) picks the MET, elevation adjusts for grade, and
 * the result is NET of resting metabolism — see `netCaloriesFromMet` for why
 * that matters to the energy-balance maths.
 *
 * `activeSec` is the important input: pass the time actually spent moving, with
 * paused / stationary / in-vehicle stretches removed. Using wall-clock time
 * instead credits standing at a crossing — or riding a bus — as exercise.
 * Distance should likewise already exclude rejected vehicle segments.
 */
export function walkCalories(params: {
  weightKg: number;
  distanceM: number;
  /** wall-clock duration of the session */
  durationSec: number;
  steps: number;
  /** moving time only; defaults to durationSec when not tracked */
  activeSec?: number;
  /** net elevation climbed, metres — drives the grade adjustment */
  elevationGainM?: number;
}): number {
  const { weightKg, distanceM, durationSec, steps } = params;
  const active = params.activeSec != null && params.activeSec > 0 ? Math.min(params.activeSec, durationSec) : durationSec;

  if (active > 0 && distanceM > 0) {
    const speedKmh = distanceM / 1000 / (active / 3600);
    // Pace is derived from moving time, so a paused session doesn't look slower
    // than it was — which would otherwise pick a lower MET as well.
    const gradePct = params.elevationGainM && distanceM > 0 ? (params.elevationGainM / distanceM) * 100 : 0;
    const met = walkRunMet(speedKmh) * gradeMultiplier(gradePct);
    return netCaloriesFromMet(met, weightKg, active);
  }

  // No usable distance: fall back to steps. ~0.04 kcal/step gross at 70 kg, so
  // scale by weight and take the net share (roughly 0.75 of gross at walking METs).
  if (steps > 0) return Math.round(steps * 0.03 * (weightKg / 70));
  // Nothing but time — assume a slow walk rather than reporting zero.
  return active > 0 ? netCaloriesFromMet(2.8, weightKg, active) : 0;
}
