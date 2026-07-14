/**
 * Sleep model. Sleep is the single biggest lever on training performance,
 * recovery and body-composition outcomes, so it is tracked as a first-class
 * signal and folded into the recovery score and coach tips.
 *
 * Adult sleep-need guidance follows the National Sleep Foundation (7–9 h).
 */

export const RECOMMENDED_SLEEP_MIN = 7;
export const RECOMMENDED_SLEEP_MAX = 9;
export const SLEEP_TARGET_DEFAULT = 8;

export interface SleepAssessment {
  status: 'short' | 'optimal' | 'long';
  label: string;
  /** 0..1 readiness contribution from last night's sleep */
  readiness: number;
}

export function assessNight(hours: number): SleepAssessment {
  if (hours < RECOMMENDED_SLEEP_MIN) {
    const readiness = Math.max(0.2, hours / RECOMMENDED_SLEEP_MIN);
    return { status: 'short', label: 'Under-slept', readiness };
  }
  if (hours > RECOMMENDED_SLEEP_MAX + 1) {
    return { status: 'long', label: 'Oversleeping', readiness: 0.85 };
  }
  return { status: 'optimal', label: 'Well rested', readiness: 1 };
}

/** Cumulative sleep debt (h) vs an 8h/night target over a window of nights. */
export function sleepDebt(hoursByNight: number[], target = SLEEP_TARGET_DEFAULT): number {
  const debt = hoursByNight.reduce((d, h) => d + (target - h), 0);
  return Math.round(debt * 10) / 10;
}

export function averageSleep(hoursByNight: number[]): number | null {
  if (hoursByNight.length === 0) return null;
  return Math.round((hoursByNight.reduce((s, h) => s + h, 0) / hoursByNight.length) * 10) / 10;
}

/**
 * Performance-readiness multiplier from recent sleep — a legible way to show the
 * training cost of poor sleep. Chronic short sleep (<6h) can cut power output,
 * reaction time and time-to-exhaustion; capped, transparent estimate.
 */
export function sleepPerformanceFactor(avgHours: number | null): number {
  if (avgHours == null) return 1;
  if (avgHours >= RECOMMENDED_SLEEP_MIN) return 1;
  // Down to ~0.8 at 5h and below.
  return Math.max(0.8, 1 - (RECOMMENDED_SLEEP_MIN - avgHours) * 0.06);
}

export const SLEEP_QUALITY_LABELS = ['Terrible', 'Poor', 'Okay', 'Good', 'Excellent'];
