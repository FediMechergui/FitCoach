import { kvDelete, kvGet, kvSet } from './kvRepo';
import { sanitizeOutdoorSettings, splitIndex, type OutdoorSettings } from '@/lib/outdoorSettings';
import { advanceLaps, sanitizePlan, type LapEvent, type LapPlan, type LapReading, type LapState } from '@/lib/gpsLaps';

/**
 * Outdoor state that must outlive a screen — and be readable by the background
 * location task, which has the database and nothing else. Everything here is
 * small JSON in the key-value store.
 *
 *  • settings — the GPS "parameters" (lib/outdoorSettings)
 *  • the session GPS marker — which training session owns the running trace.
 *    The session screen used to keep "GPS is on" in component state: leave the
 *    screen and come back and it said "off" while the trace was still running,
 *    refused to start ("a walk is already tracking"), and the distance was
 *    thrown away at the end. Now the screen asks here.
 *  • lap state — the interval engine for GPS laps (lib/gpsLaps)
 *  • split progress — which split was last announced, per trace
 *  • per-exercise lap plans — the last plan used on an exercise, offered again
 */

const KV_SETTINGS = 'outdoor.settings';
const KV_SESSION_GPS = 'outdoor.sessionGps';
const KV_LAPS = 'outdoor.laps';
const KV_SPLIT = 'outdoor.split';
const KV_LAP_PLAN = 'outdoor.lapPlan.';

export function outdoorSettings(): OutdoorSettings {
  try {
    return sanitizeOutdoorSettings(kvGet<unknown>(KV_SETTINGS));
  } catch {
    return sanitizeOutdoorSettings(null);
  }
}

export function setOutdoorSettings(patch: Partial<OutdoorSettings>): OutdoorSettings {
  const next = sanitizeOutdoorSettings({ ...outdoorSettings(), ...patch });
  kvSet(KV_SETTINGS, next);
  return next;
}

// ── which session owns the GPS trace ─────────────────────────────────────────
export interface SessionGpsMarker {
  sessionId: number;
  startedAt: number;
}

export function sessionGpsMarker(): SessionGpsMarker | null {
  const m = kvGet<SessionGpsMarker>(KV_SESSION_GPS);
  return m && typeof m.sessionId === 'number' ? m : null;
}

export function setSessionGpsMarker(m: SessionGpsMarker | null): void {
  if (m) kvSet(KV_SESSION_GPS, m);
  else kvDelete(KV_SESSION_GPS);
}

// ── laps ─────────────────────────────────────────────────────────────────────
export function lapState(): LapState | null {
  const s = kvGet<LapState>(KV_LAPS);
  return s && typeof s.logId === 'number' && s.plan ? s : null;
}

export function saveLapState(s: LapState | null): void {
  if (s) kvSet(KV_LAPS, s);
  else kvDelete(KV_LAPS);
}

/**
 * Advance the laps to a reading and persist the result. Returns what happened,
 * for whoever is listening (a notification in the background, a toast on
 * screen). Read-modify-write in one call, so the two callers cannot interleave
 * a stale state over a fresh one between the read and the write.
 */
export function tickLaps(reading: LapReading): LapEvent[] {
  const s = lapState();
  if (!s) return [];
  const { state, events } = advanceLaps(s, reading);
  if (events.length) saveLapState(state);
  return events;
}

export function lastLapPlan(exerciseId: number): LapPlan | null {
  const p = kvGet<LapPlan>(`${KV_LAP_PLAN}${exerciseId}`);
  return p ? sanitizePlan(p) : null;
}

export function rememberLapPlan(exerciseId: number, plan: LapPlan): void {
  kvSet(`${KV_LAP_PLAN}${exerciseId}`, sanitizePlan(plan));
}

// ── splits ───────────────────────────────────────────────────────────────────
interface SplitProgress {
  /** start time of the trace it belongs to — a new trace starts at zero */
  traceStart: number;
  last: number;
  lastAt: number;
  lastDistanceM: number;
}

/**
 * A split was crossed if the trace's distance reached the next multiple of
 * the split length. Returns the split reached and how long it took, or null.
 * One announcement per split, however many times this is called.
 */
export function crossedSplit(
  traceStart: number,
  distanceM: number,
  now: number
): { index: number; splitS: number; splitM: number } | null {
  const st = outdoorSettings();
  if (!st.splitAlerts) return null;
  const prev = kvGet<SplitProgress>(KV_SPLIT);
  const cur: SplitProgress =
    prev && prev.traceStart === traceStart ? prev : { traceStart, last: 0, lastAt: traceStart, lastDistanceM: 0 };
  const idx = splitIndex(distanceM, st.splitM);
  if (idx <= cur.last) {
    if (cur !== prev) kvSet(KV_SPLIT, cur);
    return null;
  }
  const splitS = Math.max(1, Math.round((now - cur.lastAt) / 1000) / Math.max(1, idx - cur.last));
  kvSet(KV_SPLIT, { traceStart, last: idx, lastAt: now, lastDistanceM: distanceM });
  return { index: idx, splitS, splitM: st.splitM };
}
