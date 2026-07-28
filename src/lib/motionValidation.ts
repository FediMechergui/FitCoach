/**
 * Is this actually walking or running — or a car, or standing still?
 *
 * A GPS trace alone can't tell a jog from a bus ride: both cover ground. What
 * separates them is **cadence**. Human legs top out around 190 steps/min, and a
 * vehicle produces almost none, so speed and cadence together classify motion
 * reliably:
 *
 *   fast + no cadence  → vehicle   (reject the distance, pause the session)
 *   fast + cadence     → running   (legitimate, even if quick)
 *   slow + no cadence  → stationary (pause; you're waiting at a crossing)
 *   slow + cadence     → walking
 *
 * Getting this wrong in the generous direction inflates distance and calories,
 * which is why the vehicle test leans on the *absence of cadence* rather than
 * speed alone — a genuinely fast runner keeps their steps.
 */

export type MotionKind = 'walking' | 'running' | 'vehicle' | 'stationary';

/** Above this speed with no cadence, it isn't human movement. m/s (≈25 km/h). */
export const VEHICLE_SPEED_MS = 7;
/** No credible human gait exceeds this. m/s (≈32 km/h) — Bolt peaked ~12.4. */
export const IMPOSSIBLE_SPEED_MS = 9;
/** Below this you're effectively not moving. m/s (≈1 km/h). */
export const STATIONARY_SPEED_MS = 0.3;
/** Running starts around here for most people. m/s (≈7.2 km/h). */
export const RUN_SPEED_MS = 2;
/** Minimum cadence that counts as "actually stepping". steps/min. */
export const MIN_ACTIVE_CADENCE = 20;

export interface MotionSample {
  /** metres per second over the segment */
  speedMs: number;
  /**
   * Steps per minute over the same window, or null when unknown (no step
   * sensor). With cadence unknown we fall back to speed alone and only reject
   * physically impossible speeds, rather than guessing someone is in a car.
   */
  cadenceSpm: number | null;
}

export interface MotionVerdict {
  kind: MotionKind;
  /** should this segment's distance count toward the session? */
  countDistance: boolean;
  /** should the session be auto-paused while this persists? */
  shouldPause: boolean;
  /** plain-language reason, for the UI */
  reason: string;
}

export function classifyMotion(s: MotionSample): MotionVerdict {
  const speed = Number.isFinite(s.speedMs) && s.speedMs > 0 ? s.speedMs : 0;
  const cadence = s.cadenceSpm;
  const stepping = cadence != null && cadence >= MIN_ACTIVE_CADENCE;

  // Nobody runs this fast — it's a vehicle regardless of what cadence says.
  if (speed >= IMPOSSIBLE_SPEED_MS) {
    return {
      kind: 'vehicle',
      countDistance: false,
      shouldPause: true,
      reason: 'Moving too fast to be on foot — looks like a vehicle, so tracking is paused.',
    };
  }

  // Fast and not stepping → vehicle. Fast AND stepping → a real run.
  if (speed >= VEHICLE_SPEED_MS && cadence != null && !stepping) {
    return {
      kind: 'vehicle',
      countDistance: false,
      shouldPause: true,
      reason: 'Covering ground with no steps detected — looks like a vehicle, so tracking is paused.',
    };
  }

  if (speed < STATIONARY_SPEED_MS && !stepping) {
    return {
      kind: 'stationary',
      countDistance: false,
      shouldPause: true,
      reason: 'No movement detected — paused until you start again.',
    };
  }

  const running = speed >= RUN_SPEED_MS;
  return {
    kind: running ? 'running' : 'walking',
    countDistance: true,
    shouldPause: false,
    reason: running ? 'Running pace.' : 'Walking pace.',
  };
}

/** Speed implied by a GPS segment, in m/s. */
export function segmentSpeedMs(distanceM: number, elapsedMs: number): number {
  if (!(elapsedMs > 0) || !(distanceM > 0)) return 0;
  return distanceM / (elapsedMs / 1000);
}

/**
 * Should a GPS segment's distance be trusted for an on-foot session?
 * Used by the background location task, where cadence isn't available — so this
 * only rejects speeds no human gait can produce.
 */
export function isPlausibleOnFootSegment(distanceM: number, elapsedMs: number): boolean {
  const speed = segmentSpeedMs(distanceM, elapsedMs);
  return speed < IMPOSSIBLE_SPEED_MS;
}

/**
 * How long to stay paused-worthy before actually pausing, so a red light or a
 * momentary GPS glitch doesn't stop the session. Milliseconds.
 */
export const PAUSE_CONFIRM_MS = 25_000;
/** And how long of good motion before resuming. */
export const RESUME_CONFIRM_MS = 5_000;
