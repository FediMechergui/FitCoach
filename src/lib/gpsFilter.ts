import { haversine, type LatLng } from './geo';
import { IMPOSSIBLE_SPEED_MS, IMPOSSIBLE_RIDE_SPEED_MS, STATIONARY_SPEED_MS, type MotionGait } from './motionValidation';

/**
 * Deciding which GPS fixes are real movement — and which are the receiver lying.
 *
 * Two situations produce distance that never happened, and both were reported
 * from real use:
 *
 *  1. **A small closed space.** Indoors, or in a courtyard or stairwell, the
 *     satellites are blocked and the receiver falls back to cell/Wi-Fi
 *     trilateration. It keeps emitting fixes, but they wander by tens of metres
 *     with an honest `accuracy` of 30–60 m attached. Summing those hops looks
 *     exactly like a walk: a phone on a desk can "cover" a kilometre overnight.
 *
 *  2. **Turning on the spot.** The antenna moves a body-width when you spin, and
 *     the multipath picture changes completely, so consecutive fixes scatter
 *     around you. The path length grows while you go nowhere.
 *
 * Three independent gates, cheapest first — a fix must clear all three:
 *
 *  · **Accuracy.** A fix can't prove a movement smaller than its own error bar.
 *    The minimum credible segment scales with the reported accuracy, and fixes
 *    too vague to mean anything are dropped outright.
 *  · **Doppler speed.** `coords.speed` is measured from carrier phase shift, not
 *    from differencing positions, so it stays near zero while you spin or pace —
 *    exactly when position differencing is at its worst. It's the single most
 *    honest "am I actually going somewhere" signal the receiver gives us.
 *  · **Confinement.** Keep a short window of accepted points. If they all fit
 *    inside a small circle and the path wanders rather than progresses, you're
 *    circling a room, not travelling — so hold the anchor and credit nothing
 *    until you genuinely leave.
 *
 * Rejected fixes are dropped from the route entirely, not just from the
 * distance, so the stored path length always equals the credited distance and
 * the drawn map stays a route rather than a scribble.
 *
 * Everything here is a pure function of its inputs so it can be tested without
 * a device (scripts/verify-engines.ts).
 */

/** Fixes vaguer than this say nothing useful about position. metres. */
export const MAX_ACCURACY_M = 30;
/** Assumed accuracy when the receiver doesn't report one. metres. */
export const ASSUMED_ACCURACY_M = 15;
/** A segment must beat this fraction of the fix's own error to count. */
export const ACCURACY_SLACK = 0.75;
/** Absolute floor for a credible segment, whatever the accuracy claims. metres. */
export const MIN_SEGMENT_M = 4;
/**
 * How many recent points the confinement test looks at. Short on purpose: the
 * window has to flush the last of the real outdoor points before it can notice
 * you've stopped, and every fix it waits for is phantom distance banked. Five is
 * the smallest window where "wandering" is still distinguishable from "walking".
 */
export const CONFINEMENT_WINDOW = 5;
/** If every point in the window fits in this radius, you haven't gone anywhere. metres. */
export const CONFINEMENT_RADIUS_M = 15;
/** net displacement ÷ path length. Below this the path wanders instead of progressing. */
export const STRAIGHTNESS_MIN = 0.35;

export interface GpsFix {
  lat: number;
  lng: number;
  /** horizontal accuracy in metres, as reported by the receiver */
  accuracy?: number | null;
  /** Doppler ground speed in m/s; negative or null means "not reported" */
  speed?: number | null;
  /** epoch ms of the fix; lets the filter judge implied segment speed */
  timestamp?: number | null;
}

export type RejectReason =
  | 'invalid'
  | 'accuracy'
  | 'jitter'
  | 'stationary'
  | 'impossible'
  | 'confined'
  /** faster than the session's own gait allows — a vehicle, not this activity */
  | 'vehicle';

export interface GpsFilterResult {
  /** points to append to the stored route, in order */
  accepted: LatLng[];
  /** metres to add to the session distance — always the accepted path length */
  distanceM: number;
  /** how many fixes were thrown away, by reason */
  rejected: Record<RejectReason, number>;
  /** true when the tail of the window looks like pacing/spinning in one spot */
  confined: boolean;
}

const emptyRejects = (): Record<RejectReason, number> => ({
  invalid: 0,
  accuracy: 0,
  jitter: 0,
  stationary: 0,
  impossible: 0,
  confined: 0,
  vehicle: 0,
});

/**
 * The fastest ground speed each gait can honestly produce, m/s. Used for both
 * the Doppler gate and the implied-segment-speed gate. A walk session tops out
 * at a solid jog (a car in city traffic sits well above it), a run keeps the
 * physiological ceiling, and a ride allows fast descents.
 */
export const GAIT_MAX_SPEED_MS: Record<MotionGait, number> = {
  walk: 4,
  run: IMPOSSIBLE_SPEED_MS,
  none: IMPOSSIBLE_RIDE_SPEED_MS,
};

/**
 * After this many consecutive too-fast segments, the anchor jumps to the
 * current fix WITHOUT crediting the gap. This is what keeps a vehicle stretch
 * from being banked as one giant hop the moment the vehicle slows down — and
 * what lets crediting resume cleanly when you get out and walk.
 */
export const REANCHOR_AFTER = 2;

/** Radius of the smallest circle centred on the mean that holds every point. */
export function spreadRadiusM(points: LatLng[]): number {
  if (points.length < 2) return 0;
  let lat = 0;
  let lng = 0;
  for (const p of points) {
    lat += p[0];
    lng += p[1];
  }
  const centre: LatLng = [lat / points.length, lng / points.length];
  let max = 0;
  for (const p of points) {
    const d = haversine(centre, p);
    if (d > max) max = d;
  }
  return max;
}

/** Sum of consecutive segment lengths. */
export function pathLengthM(points: LatLng[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += haversine(points[i - 1], points[i]);
  return total;
}

/**
 * How directed a path is: 0 = ends where it started, 1 = a straight line.
 * A street walk sits near 1 even around corners; circling a room sits near 0.
 */
export function straightness(points: LatLng[]): number {
  if (points.length < 2) return 1;
  const path = pathLengthM(points);
  if (path <= 0) return 1;
  return haversine(points[0], points[points.length - 1]) / path;
}

/**
 * Are these recent points a person going somewhere, or a person in one place?
 * Both conditions are required: a tight cluster alone could be a slow crawl up a
 * hill, and a low straightness alone could be a switchback trail.
 */
export function isConfined(window: LatLng[]): boolean {
  if (window.length < CONFINEMENT_WINDOW) return false;
  const recent = window.slice(-CONFINEMENT_WINDOW);
  return spreadRadiusM(recent) <= CONFINEMENT_RADIUS_M && straightness(recent) < STRAIGHTNESS_MIN;
}

/**
 * Filter a batch of fixes against the tail of the route already stored.
 *
 * `tail` is the last few accepted points (pass at least CONFINEMENT_WINDOW of
 * them; passing the whole route is fine, only the tail is read). The returned
 * `distanceM` is exactly the path length of `accepted` measured from the last
 * tail point, so callers can append and add without recomputing.
 */
export interface GpsFilterOptions {
  /**
   * Ceiling for BOTH the Doppler gate and the implied segment speed, m/s.
   * Defaults to the on-foot physiological limit; pass the session gait's value
   * from GAIT_MAX_SPEED_MS so a walk rejects city-traffic speeds and a ride
   * doesn't reject its own descents.
   */
  maxSpeedMs?: number;
  /** epoch ms of the last already-stored fix, for the first segment's speed */
  lastTimestamp?: number | null;
}

export function filterFixes(tail: LatLng[], fixes: GpsFix[], opts: GpsFilterOptions = {}): GpsFilterResult {
  const maxSpeedMs = opts.maxSpeedMs ?? IMPOSSIBLE_SPEED_MS;
  const rejected = emptyRejects();
  const accepted: LatLng[] = [];
  let distanceM = 0;
  let window = tail.slice(-CONFINEMENT_WINDOW);
  let last: LatLng | null = tail.length ? tail[tail.length - 1] : null;
  let lastTs: number | null = opts.lastTimestamp ?? null;
  let confined = false;
  /** consecutive segments rejected for speed — drives the re-anchor */
  let fastStreak = 0;

  for (const fix of fixes) {
    if (!Number.isFinite(fix.lat) || !Number.isFinite(fix.lng)) {
      rejected.invalid += 1;
      continue;
    }

    // ── Gate 1: is the fix precise enough to mean anything? ──
    const reported = typeof fix.accuracy === 'number' && Number.isFinite(fix.accuracy) && fix.accuracy > 0
      ? fix.accuracy
      : null;
    const accuracy = reported ?? ASSUMED_ACCURACY_M;
    if (accuracy > MAX_ACCURACY_M) {
      rejected.accuracy += 1;
      continue;
    }

    /*
     * ── Gate 2: what does the receiver's own speedometer say? ──
     *
     * CAREFUL with zero. Android's Location.getSpeed() returns 0.0 when the
     * receiver has no Doppler solution at all — `hasSpeed()` is the flag that
     * says whether the number means anything, and it does not survive the
     * bridge. iOS uses -1 for the same "unknown". So a reported 0 is very
     * often "I don't know", not "you are standing still", and treating it as
     * standing still rejected almost every real fix on those devices: the
     * route stayed empty, distance came out short, and every pace read slow.
     *
     * Only a strictly POSITIVE speed is evidence. Zero and negative mean
     * unknown, and the accuracy, minimum-segment and confinement gates below
     * are what catch genuine standing-still — which is what they are for.
     */
    const speed = typeof fix.speed === 'number' && Number.isFinite(fix.speed) && fix.speed > 0
      ? fix.speed
      : null;
    const ts = typeof fix.timestamp === 'number' && Number.isFinite(fix.timestamp) && fix.timestamp > 0
      ? fix.timestamp
      : null;
    if (speed != null && speed >= IMPOSSIBLE_SPEED_MS) {
      rejected.impossible += 1;
      continue;
    }
    // Faster than this session's own gait can go: honest movement, wrong kind.
    // A car through town sits at 3–7 m/s — plainly not part of a walk.
    if (speed != null && speed >= maxSpeedMs) {
      rejected.vehicle += 1;
      continue;
    }
    // Doppler says you're standing still, so any apparent displacement is noise.
    // Only trust this when the receiver actually reported a speed.
    if (speed != null && speed < STATIONARY_SPEED_MS) {
      rejected.stationary += 1;
      continue;
    }

    const p: LatLng = [fix.lat, fix.lng];

    // The very first point of a session anchors the route; nothing to measure.
    if (!last) {
      accepted.push(p);
      window = [...window, p].slice(-CONFINEMENT_WINDOW);
      last = p;
      lastTs = ts;
      continue;
    }

    // ── Gate 3a: did we move further than the error bar? ──
    const seg = haversine(last, p);
    const gate = Math.max(MIN_SEGMENT_M, accuracy * ACCURACY_SLACK);
    if (seg < gate) {
      rejected.jitter += 1;
      lastTs = ts ?? lastTs;
      continue;
    }

    /*
     * ── Gate 3c: could this gait have covered the gap in the time it took? ──
     *
     * The Doppler gates judge each fix in isolation, and that left a hole: a
     * car cruising above the ceiling has all its fixes rejected — correctly —
     * but the moment it slowed below the ceiling, one accepted fix credited
     * the WHOLE ride since the last accepted point as a single giant segment.
     * Timestamps close it: distance ÷ elapsed across the gap is the speed the
     * gait would have needed, and a walk cannot have covered 900 m in 90 s.
     *
     * After a couple of consecutive too-fast segments the anchor jumps to the
     * current fix without crediting anything, so the route re-anchors where
     * you actually are and honest crediting resumes as soon as you're on foot.
     */
    if (ts != null && lastTs != null && ts > lastTs) {
      const impliedMs = seg / ((ts - lastTs) / 1000);
      if (impliedMs >= maxSpeedMs) {
        rejected.vehicle += 1;
        fastStreak += 1;
        if (fastStreak >= REANCHOR_AFTER) {
          last = p;
          lastTs = ts;
          window = [p];
          fastStreak = 0;
        }
        continue;
      }
    }
    fastStreak = 0;

    // ── Gate 3b: does the recent path go anywhere? ──
    const candidate = [...window, p].slice(-CONFINEMENT_WINDOW);
    if (isConfined(candidate)) {
      // Hold the anchor: don't move `last`, don't store the point, credit
      // nothing. As soon as a fix lands genuinely far away the window stops
      // being tight and normal crediting resumes on its own.
      rejected.confined += 1;
      confined = true;
      continue;
    }

    accepted.push(p);
    distanceM += seg;
    window = candidate;
    last = p;
    lastTs = ts ?? lastTs;
    confined = false;
  }

  return { accepted, distanceM, rejected, confined };
}

/** Total fixes discarded, for logging/telemetry. */
export function totalRejected(r: Record<RejectReason, number>): number {
  return Object.values(r).reduce((a, b) => a + b, 0);
}
