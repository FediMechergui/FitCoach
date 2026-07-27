/**
 * Recovering steps missed while the app was suspended or killed.
 *
 * Why this is needed: JavaScript stops running when the screen goes off or the
 * app is killed, so the accelerometer listener stops and `watchStepCount` loses
 * its subscription. Android's hardware counter keeps ticking at OS level, but
 * `Pedometer.getStepCountAsync` — the only API that can read an absolute total
 * over a date range — is **iOS-only**, so on Android there is no way to simply
 * ask "how many steps since I started?".
 *
 * Two honest recovery paths, in order of trust:
 *  1. **GPS** — for runs, the location foreground service survives being
 *     backgrounded and killed, so the traced route distance is real evidence.
 *     If that distance implies more steps than we counted, we trust it.
 *  2. **Cadence** — otherwise, estimate the unobserved window from the
 *     session's own measured cadence (steps per minute so far). This is an
 *     estimate and is deliberately conservative: cadence is capped at a
 *     realistic maximum and the credited gap is capped, so leaving the app shut
 *     for hours can never invent a huge number of steps.
 *
 * Everything here is pure so it can be tested; the service just applies it.
 */
import { stepsFromDistance } from './pedometer';

/** Longest unobserved window we'll ever credit, in minutes. */
export const MAX_GAP_CREDIT_MIN = 90;
/** Gaps shorter than this aren't worth estimating. */
export const MIN_GAP_SEC = 45;
/** Realistic cadence ceilings (steps/min) — caps runaway estimates. */
export const MAX_CADENCE = { walk: 130, run: 190 } as const;
/** Cadence assumed when we have no measured cadence to go on. */
export const DEFAULT_CADENCE = { walk: 100, run: 155 } as const;

export interface GapRecoveryInput {
  mode: 'walk' | 'run';
  /** steps counted so far this session */
  observedSteps: number;
  /** ms of the session we actually observed (start → last update) */
  observedMs: number;
  /** ms between the last update and now — the blind window */
  gapMs: number;
  /** GPS-measured route distance (m), if a route is being traced */
  gpsDistanceM?: number | null;
  heightCm: number;
}

export interface GapRecovery {
  /** extra steps to credit (never negative) */
  steps: number;
  basis: 'gps' | 'cadence' | 'none';
  /** true when the number is an estimate rather than measured evidence */
  estimated: boolean;
}

/** Measured cadence (steps/min) over the observed part of the session. */
export function measuredCadence(observedSteps: number, observedMs: number, mode: 'walk' | 'run'): number {
  const minutes = observedMs / 60_000;
  if (minutes < 0.5 || observedSteps <= 0) return DEFAULT_CADENCE[mode];
  const raw = observedSteps / minutes;
  return Math.min(raw, MAX_CADENCE[mode]);
}

export function recoverGapSteps(i: GapRecoveryInput): GapRecovery {
  const heightCm = i.heightCm > 0 ? i.heightCm : 170;

  // 1. GPS is real evidence and survives a kill — trust it over any estimate.
  if (i.gpsDistanceM && i.gpsDistanceM > 0) {
    const impliedTotal = stepsFromDistance(i.gpsDistanceM, heightCm, i.mode);
    if (impliedTotal > i.observedSteps) {
      return { steps: impliedTotal - i.observedSteps, basis: 'gps', estimated: false };
    }
    // GPS present and consistent with the count — nothing to recover.
    return { steps: 0, basis: 'gps', estimated: false };
  }

  // 2. Cadence estimate for the blind window, conservatively capped.
  if (i.gapMs < MIN_GAP_SEC * 1000) return { steps: 0, basis: 'none', estimated: false };
  const creditedMin = Math.min(i.gapMs / 60_000, MAX_GAP_CREDIT_MIN);
  const cadence = measuredCadence(i.observedSteps, i.observedMs, i.mode);
  const steps = Math.max(0, Math.round(creditedMin * cadence));
  return { steps, basis: 'cadence', estimated: true };
}
