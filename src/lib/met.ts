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
  // Compendium: Pilates (mat, general) ~3.0; a Hyrox-style race mixes running
  // at ~10 with stations at ~6–8, about 8.5 averaged over a session.
  pilates: 3,
  hyrox: 8.5,
};

/**
 * A MET curve as anchor points from the Compendium of Physical Activities,
 * read by straight-line interpolation between them.
 *
 * Until 3.8.0 these were steps: 6.4 km/h and 7.9 km/h cost the same, and every
 * run faster than 12.9 km/h was valued as if it were 12.9 — a 16 km/h tempo
 * run came out a fifth short. A curve has no cliffs to fall off: two runs a
 * few seconds per kilometre apart now cost a few kilocalories apart. Below
 * the first anchor the first value stands; above the last, the last slope
 * carries on, capped at a ceiling no human holds for long.
 */
type Curve = ReadonlyArray<readonly [number, number]>;

function readCurve(curve: Curve, x: number, ceiling: number): number {
  if (!Number.isFinite(x) || x <= curve[0][0]) return curve[0][1];
  for (let i = 1; i < curve.length; i++) {
    const [x1, y1] = curve[i];
    if (x <= x1) {
      const [x0, y0] = curve[i - 1];
      return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
    }
  }
  const [xa, ya] = curve[curve.length - 2];
  const [xb, yb] = curve[curve.length - 1];
  return Math.min(ceiling, yb + ((x - xb) / (xb - xa)) * (yb - ya));
}

/** km/h → MET, walking (Compendium codes 17xxx). */
export const WALKING_CURVE: Curve = [
  [2.0, 2.0],
  [3.2, 2.8],
  [4.0, 3.0],
  [4.8, 3.5],
  [5.6, 4.3],
  [6.4, 5.0],
  [7.2, 7.0],
  [8.0, 8.3],
];

/** km/h → MET, running (Compendium codes 12xxx). */
export const RUNNING_CURVE: Curve = [
  [6.4, 6.0],
  [8.0, 8.3],
  [8.4, 9.0],
  [9.7, 9.8],
  [10.8, 10.5],
  [11.3, 11.0],
  [12.1, 11.5],
  [12.9, 11.8],
  [13.8, 12.3],
  [14.5, 12.8],
  [16.1, 14.5],
  [17.7, 16.0],
  [19.3, 19.0],
  [20.9, 19.8],
  [22.5, 23.0],
];

/** km/h → MET, cycling outdoors on the flat (Compendium codes 01xxx). */
export const CYCLING_CURVE: Curve = [
  [8, 3.5],
  [14, 4.0],
  [17.5, 6.8],
  [21, 8.0],
  [24, 10.0],
  [28, 12.0],
  [33, 15.8],
];

/**
 * Walking or running by speed.
 *
 * With no gait given, walking anchors carry to 7.2 km/h and running ones take
 * over from 8 km/h — one rising curve, so a faster pace never costs less. A
 * gait, when known, picks its own curve: a 6.5 km/h jog is a run and costs
 * like one; an 8 km/h race walk costs like the walk it is.
 */
export function walkRunMet(speedKmh: number, gait?: 'walk' | 'run'): number {
  if (!Number.isFinite(speedKmh) || speedKmh <= 0) return 2.0;
  if (gait === 'run') return round2(readCurve(RUNNING_CURVE, speedKmh, 23));
  if (gait === 'walk') return round2(readCurve(WALKING_CURVE, speedKmh, 10));
  if (speedKmh <= 7.2) return round2(readCurve(WALKING_CURVE, speedKmh, 10));
  if (speedKmh >= 8) return round2(readCurve(RUNNING_CURVE, speedKmh, 23));
  // 7.2 → 8 km/h: the brisk walk turns into the jog without a step.
  return round2(7.0 + ((speedKmh - 7.2) / 0.8) * (8.3 - 7.0));
}

/** Cycling by road speed. A bike is not a run: 20 km/h is ~8 METs, not ~19. */
export function cyclingMet(speedKmh: number): number {
  if (!Number.isFinite(speedKmh) || speedKmh <= 0) return 3.5;
  return round2(readCurve(CYCLING_CURVE, speedKmh, 16));
}

/**
 * Swimming by pace. Compendium: leisurely ~6, moderate freestyle 8.3, fast
 * 9.8; a pace slower than 3:00 per 100 m is treated as easy swimming.
 */
export function swimMet(metresPerSecond: number): number {
  if (!Number.isFinite(metresPerSecond) || metresPerSecond <= 0) return 6.0;
  const per100s = 100 / metresPerSecond;
  // Read on the negative of seconds-per-100 m, so the x axis rises with speed.
  return round2(readCurve([[-180, 5.8], [-120, 8.3], [-90, 9.8], [-60, 11.0]], -per100s, 11));
}

/** Rowing (ergometer or boat) by split. ~2:30 per 500 m is ~7 METs, 2:00 is ~10. */
export function rowMet(metresPerSecond: number): number {
  if (!Number.isFinite(metresPerSecond) || metresPerSecond <= 0) return 4.8;
  return round2(readCurve([[2.5, 4.8], [3.33, 7.0], [4.17, 10.0], [4.76, 12.0]], metresPerSecond, 14));
}

export type PaceKind = 'walk' | 'run' | 'cycle' | 'swim' | 'row';

/** The MET a distance covered in a time is worth, for the kind of movement it was. */
export function paceMet(kind: PaceKind, distanceM: number, durationS: number): number | null {
  if (!(distanceM > 0) || !(durationS > 0)) return null;
  const ms = distanceM / durationS;
  const kmh = ms * 3.6;
  switch (kind) {
    case 'walk':
      return walkRunMet(kmh, 'walk');
    case 'run':
      return walkRunMet(kmh, 'run');
    case 'cycle':
      return cyclingMet(kmh);
    case 'swim':
      return swimMet(ms);
    case 'row':
      return rowMet(ms);
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
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
  /**
   * How the ground was covered. 'walk' and 'run' pick their own Compendium
   * curve; 'none' is a wheel (a bike), costed by the cycling curve and never
   * by steps. Omitted, the speed decides between walking and running.
   */
  gait?: 'walk' | 'run' | 'none';
}): number {
  const { weightKg, distanceM, durationSec, steps } = params;
  const gait = params.gait;
  const active = params.activeSec != null && params.activeSec > 0 ? Math.min(params.activeSec, durationSec) : durationSec;

  if (active > 0 && distanceM > 0) {
    const speedKmh = distanceM / 1000 / (active / 3600);
    // Pace is derived from moving time, so a paused session doesn't look slower
    // than it was — which would otherwise pick a lower MET as well.
    const gradePct = params.elevationGainM && distanceM > 0 ? (params.elevationGainM / distanceM) * 100 : 0;
    const met = (gait === 'none' ? cyclingMet(speedKmh) : walkRunMet(speedKmh, gait)) * gradeMultiplier(gradePct);
    return netCaloriesFromMet(met, weightKg, active);
  }

  // A bike has no steps to fall back on; time at an easy ride is the floor.
  if (gait === 'none') return active > 0 ? netCaloriesFromMet(4.0, weightKg, active) : 0;

  // No usable distance: fall back to steps. ~0.04 kcal/step gross at 70 kg, so
  // scale by weight and take the net share (roughly 0.75 of gross at walking METs).
  if (steps > 0) return Math.round(steps * 0.03 * (weightKg / 70));
  // Nothing but time — assume a slow walk rather than reporting zero.
  return active > 0 ? netCaloriesFromMet(2.8, weightKg, active) : 0;
}
