/**
 * Is this actually walking or running — or a car, or standing still?
 *
 * A GPS trace alone can't tell a jog from a bus ride: both cover ground. What
 * separates them is **cadence**. Human legs top out around 190 steps/min, and a
 * vehicle produces almost none, so speed and cadence together classify motion
 * reliably:
 *
 *   covering ground + no steps → vehicle    (reject the distance, pause)
 *   fast + cadence             → running    (legitimate, even if quick)
 *   still + no steps           → stationary (pause; you're waiting)
 *   slow + cadence             → walking
 *
 * The old rule only called "vehicle" above 25 km/h, which let a car crawling
 * through city traffic at 10–20 km/h count as a walk — the distance piled up
 * with zero steps behind it. The decisive evidence is not the speed, it is the
 * ABSENCE OF CADENCE while the ground moves: legs make steps at every real
 * on-foot speed, so ground covered without steps is never on foot.
 *
 * That evidence is only trustworthy when the step counter is PROVEN — it has
 * actually produced steps this session. A counter that never ticked may just be
 * broken or permission-starved, and pausing a real walk on its silence would be
 * worse than the disease; unproven counters fall back to speed-only rules.
 *
 * Cycling and other wheeled activities (gait 'none') are exempt from cadence
 * entirely — a rider produces no steps at 25 km/h and that is the whole point.
 */

export type MotionKind = 'walking' | 'running' | 'vehicle' | 'stationary' | 'riding';

/** Gait of the live activity: how (and whether) steps relate to distance. */
export type MotionGait = 'walk' | 'run' | 'none';

/** Above this speed with no cadence evidence at all, it isn't human movement. m/s (≈25 km/h). */
export const VEHICLE_SPEED_MS = 7;
/** No credible human gait exceeds this. m/s (≈32 km/h) — Bolt peaked ~12.4. */
export const IMPOSSIBLE_SPEED_MS = 9;
/** No credible bicycle ride exceeds this for long. m/s (≈79 km/h). */
export const IMPOSSIBLE_RIDE_SPEED_MS = 22;
/** Below this you're effectively not moving. m/s (≈1 km/h). */
export const STATIONARY_SPEED_MS = 0.3;
/** Running starts around here for most people. m/s (≈7.2 km/h). */
export const RUN_SPEED_MS = 2;
/** Minimum cadence that counts as "actually stepping". steps/min. */
export const MIN_ACTIVE_CADENCE = 20;
/**
 * With a PROVEN step counter, covering ground faster than this with zero
 * cadence is a vehicle — no matter how slow. m/s (≈4 km/h): a drift below it
 * with no steps is just GPS breathing, and the stationary rule handles it.
 */
export const COASTING_SPEED_MS = 1.1;

export interface MotionSample {
  /** metres per second over the segment */
  speedMs: number;
  /**
   * Steps per minute over the same window, or null when unknown (no step
   * sensor, or a sensor that has never produced a step this session). With
   * cadence unknown we fall back to speed alone rather than guessing someone
   * is in a car.
   */
  cadenceSpm: number | null;
  /** the activity's gait — wheeled activities skip cadence rules entirely */
  gait?: MotionGait;
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
  const gait = s.gait ?? 'walk';

  // ── Wheeled (cycling): cadence means nothing, only speed sanity applies. ──
  if (gait === 'none') {
    if (speed >= IMPOSSIBLE_RIDE_SPEED_MS) {
      return {
        kind: 'vehicle',
        countDistance: false,
        shouldPause: true,
        reason: 'Too fast for a ride — looks like a motor vehicle, so tracking is paused.',
      };
    }
    if (speed < STATIONARY_SPEED_MS) {
      return {
        kind: 'stationary',
        countDistance: false,
        shouldPause: true,
        reason: 'No movement detected — paused until you start again.',
      };
    }
    return { kind: 'riding', countDistance: true, shouldPause: false, reason: 'Riding.' };
  }

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

  if (cadence != null && !stepping) {
    // A proven counter is silent while the ground moves: that is a vehicle at
    // ANY speed above a drift — this is what catches city traffic and buses.
    if (speed >= COASTING_SPEED_MS) {
      return {
        kind: 'vehicle',
        countDistance: false,
        shouldPause: true,
        reason: 'Covering ground with no steps detected — looks like a vehicle, so tracking is paused.',
      };
    }
    // Not stepping and not really moving either.
    return {
      kind: 'stationary',
      countDistance: false,
      shouldPause: true,
      reason: 'No movement detected — paused until you start again.',
    };
  }

  // Cadence unknown (no working step sensor): speed is all we have. Sustained
  // 25 km/h+ is not a human gait even for a runner; the confirmation window
  // upstream keeps a single glitchy segment from pausing anything.
  if (cadence == null && speed >= VEHICLE_SPEED_MS) {
    return {
      kind: 'vehicle',
      countDistance: false,
      shouldPause: true,
      reason: 'Moving too fast to be on foot — looks like a vehicle, so tracking is paused.',
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

// ── Batch verdicts for the background location task ──────────────────────────
//
// The task has no cadence (the step subscription dies with the JS runtime), so
// it judges each BATCH of accepted fixes by its average speed. Coarser than the
// foreground tick, but it is what keeps a killed-app session honest: a walk
// left running through a car ride would otherwise bank the whole drive.

/** m to have covered at vehicle speed before the task dares to pause a session. */
export const BATCH_PAUSE_MIN_DISTANCE_M = 60;
/** On-foot band the task uses to auto-RESUME a paused session. m/s. */
export const BATCH_RESUME_MIN_SPEED_MS = 0.5;
export const BATCH_RESUME_MAX_SPEED_MS = 3.5;

/**
 * Should the background task pause the session over this batch?
 * Requires real distance at vehicle speed — a single glitchy fix can't trip it.
 */
export function batchLooksLikeVehicle(distanceM: number, elapsedMs: number, gait: MotionGait): boolean {
  if (gait === 'none') return segmentSpeedMs(distanceM, elapsedMs) >= IMPOSSIBLE_RIDE_SPEED_MS;
  return (
    distanceM >= BATCH_PAUSE_MIN_DISTANCE_M &&
    segmentSpeedMs(distanceM, elapsedMs) >= VEHICLE_SPEED_MS
  );
}

/**
 * Does this batch look like honest on-foot movement — the evidence the task
 * needs to RESUME a session it (or the app) paused as vehicle/stationary?
 */
export function batchLooksOnFoot(distanceM: number, elapsedMs: number, gait: MotionGait): boolean {
  const speed = segmentSpeedMs(distanceM, elapsedMs);
  if (gait === 'none') return speed >= BATCH_RESUME_MIN_SPEED_MS && speed < IMPOSSIBLE_RIDE_SPEED_MS;
  return speed >= BATCH_RESUME_MIN_SPEED_MS && speed <= BATCH_RESUME_MAX_SPEED_MS;
}

/**
 * How long to stay paused-worthy before actually pausing, so a red light or a
 * momentary GPS glitch doesn't stop the session. Milliseconds.
 */
export const PAUSE_CONFIRM_MS = 25_000;
/** And how long of good motion before resuming. */
export const RESUME_CONFIRM_MS = 5_000;
