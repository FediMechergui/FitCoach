/**
 * Automatic walk detection — noticing you're walking without a button press.
 *
 * The whole trick is choosing the right sensor. GPS and the accelerometer both
 * "move" in a car; the one thing that doesn't is the hardware step counter:
 * it's gated by the sensor hub's own gait model, so sitting in a vehicle,
 * riding over potholes or holding the phone in traffic produces essentially no
 * steps. Cadence sustained over minutes is therefore the discriminator the
 * user actually wants — a walk starts when the LEGS say so, and a car ride,
 * sitting down or standing at a stop can't fake it.
 *
 * The rules, all of which must hold over the detection window:
 *   • enough steps overall (a stroll to the fridge doesn't count),
 *   • sustained long enough (one flight of stairs doesn't count),
 *   • at a human walking cadence (sensor glitches that dump hundreds of
 *     "steps" at once read as impossible cadence and are ignored),
 *   • still active in the most recent slice (walked-then-sat doesn't trigger
 *     a session for the sitting).
 *
 * When a walk IS detected, the session is backdated to when the streak began
 * and seeded with the steps already taken — the detector's lag costs nothing.
 *
 * Pure functions only; the service (services/walkAutoDetect.ts) feeds samples
 * in and acts on the verdicts, and scripts/verify-engines.ts tests these.
 */

/** One reading of the cumulative step count. */
export interface StepSample {
  /** epoch ms */
  at: number;
  /** cumulative steps since the watcher subscribed */
  cumulative: number;
}

/** How far back the detector looks. */
export const AUTO_START_WINDOW_MS = 150_000;
/** Steps within the window needed to call it a walk. */
export const AUTO_START_MIN_STEPS = 130;
/** The streak must span at least this long. ms. */
export const AUTO_START_MIN_SPAN_MS = 60_000;
/** Mean cadence over the streak must be a human walk/jog. steps/min. */
export const AUTO_START_MIN_CADENCE = 60;
export const AUTO_START_MAX_CADENCE = 220;
/** The most recent slice must still be active (no walked-then-sat trigger). */
export const AUTO_START_RECENT_MS = 45_000;
export const AUTO_START_RECENT_MIN_STEPS = 30;

/** Auto-started sessions end themselves after this long paused/still. ms. */
export const AUTO_STOP_PAUSED_MS = 5 * 60_000;
/** …and are silently discarded (not saved) below both of these. */
export const AUTO_DISCARD_MAX_STEPS = 150;
export const AUTO_DISCARD_MAX_ACTIVE_S = 120;

export interface AutoStartVerdict {
  start: boolean;
  /** when the detected walk actually began (epoch ms) — backdate to this */
  sinceMs: number | null;
  /** steps already taken by detection time — seed the session with them */
  steps: number;
  /** mean cadence over the streak, for logging/UI */
  cadenceSpm: number;
}

const NO_START: AutoStartVerdict = { start: false, sinceMs: null, steps: 0, cadenceSpm: 0 };

/**
 * Keep only what the detector needs: everything inside the window, plus ONE
 * older sample as the anchor that tells us the cumulative count at window edge.
 */
export function trimSamples(samples: StepSample[], nowMs: number): StepSample[] {
  const cutoff = nowMs - AUTO_START_WINDOW_MS;
  const firstInside = samples.findIndex((s) => s.at >= cutoff);
  if (firstInside <= 0) return firstInside === 0 ? samples.slice() : samples.slice(-1);
  return samples.slice(firstInside - 1);
}

/** Steps accumulated between two cumulative readings, never negative. */
function delta(later: StepSample, earlier: StepSample): number {
  return Math.max(0, later.cumulative - earlier.cumulative);
}

/**
 * Should a walk session auto-start right now, given the recent step samples?
 * Samples must be in chronological order with non-decreasing cumulatives
 * (a counter reset mid-buffer should clear the buffer instead).
 */
export function evaluateAutoStart(samples: StepSample[], nowMs: number): AutoStartVerdict {
  if (samples.length < 2) return NO_START;
  const windowStart = nowMs - AUTO_START_WINDOW_MS;

  // The streak: from the first sample inside the window (or the anchor just
  // before it) to the latest.
  const inWindow = samples.filter((s) => s.at >= windowStart);
  if (inWindow.length < 2) return NO_START;
  const first = inWindow[0];
  const last = inWindow[inWindow.length - 1];

  const spanMs = last.at - first.at;
  if (spanMs < AUTO_START_MIN_SPAN_MS) return NO_START;

  const steps = delta(last, first);
  if (steps < AUTO_START_MIN_STEPS) return NO_START;

  const cadenceSpm = (steps / spanMs) * 60_000;
  if (cadenceSpm < AUTO_START_MIN_CADENCE || cadenceSpm > AUTO_START_MAX_CADENCE) return NO_START;

  // Still walking NOW? The tail slice must carry real steps of its own.
  const recentStart = nowMs - AUTO_START_RECENT_MS;
  let recentAnchor = first;
  for (const s of inWindow) {
    if (s.at <= recentStart) recentAnchor = s;
    else break;
  }
  if (delta(last, recentAnchor) < AUTO_START_RECENT_MIN_STEPS) return NO_START;

  return { start: true, sinceMs: first.at, steps, cadenceSpm };
}

/**
 * Should an auto-started session end itself? True after it has been paused
 * (stationary or in a vehicle) continuously for AUTO_STOP_PAUSED_MS.
 */
export function shouldAutoStop(pausedSinceMs: number | null, nowMs: number): boolean {
  return pausedSinceMs != null && nowMs - pausedSinceMs >= AUTO_STOP_PAUSED_MS;
}

/**
 * Is an ending auto-session too small to keep? A false trigger (pacing around
 * the kitchen) is discarded silently; a real short walk is still worth saving.
 */
export function shouldDiscardAutoSession(steps: number, activeSec: number): boolean {
  return steps < AUTO_DISCARD_MAX_STEPS && activeSec < AUTO_DISCARD_MAX_ACTIVE_S;
}
