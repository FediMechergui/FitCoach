/**
 * GPS laps — one distance exercise measured by GPS, rep by rep.
 *
 * A session can carry one GPS trace (see services/sessionGps). Before 3.8.0
 * that trace gave the session ONE distance at the end. A track session — six
 * 400 m repeats, a warm-up jog and a cool-down — needs each rep measured on
 * its own: how far, how long, at what pace. A lap is a slice of the session's
 * trace, from the point the rep started to the point it ended, and each
 * finished lap becomes a logged set that remembers its slice.
 *
 * The plan is the "parameters": an optional target distance (the rep ends by
 * itself when it is reached), how many reps, how long to rest between them,
 * and whether the next rep starts on its own when the rest is over. Every one
 * is optional — with nothing set, a lap is simply "start, run, finish".
 *
 * This file is a pure state machine. The same `advanceLaps` is called by the
 * screen every second and by the background location task with each batch of
 * fixes, so reps keep being measured, ended and restarted with the phone in a
 * pocket and the screen off. Finished reps wait in `pending` until the screen
 * turns them into sets — nothing measured is ever lost to a sleeping app.
 */

export interface LapPlan {
  /** metres; the rep ends itself when reached. null = finish by hand */
  targetM: number | null;
  /** how many reps; null = as many as you like */
  reps: number | null;
  /** rest between reps, seconds */
  restS: number;
  /** start the next rep by itself when the rest is over */
  autoNext: boolean;
}

export const DEFAULT_LAP_PLAN: LapPlan = { targetM: null, reps: null, restS: 90, autoNext: true };

/** Distances offered as one tap: track reps, the mile, the road races. */
export const LAP_TARGETS_M = [100, 200, 400, 800, 1000, 1609, 3000, 5000] as const;
export const LAP_REST_PRESETS_S = [0, 30, 60, 90, 120, 180, 300] as const;

export interface FinishedLap {
  repNo: number;
  distanceM: number;
  durationS: number;
  /** route point index where the rep started and ended */
  from: number;
  to: number;
  /** ended by reaching the target rather than by hand */
  auto: boolean;
}

export interface LapState {
  sessionId: number;
  logId: number;
  exerciseId: number;
  exerciseName: string;
  plan: LapPlan;
  phase: 'running' | 'resting' | 'done';
  /** the rep in progress, or the next one while resting (1-based) */
  repNo: number;
  /** where the current rep started */
  startedAt: number;
  startDistanceM: number;
  startIdx: number;
  /** when resting: the moment the next rep may begin */
  restEndsAt: number | null;
  /** finished reps not yet turned into sets */
  pending: FinishedLap[];
  /** reps finished in this plan so far (logged or pending) */
  doneReps: number;
}

export interface LapReading {
  now: number;
  /** cumulative distance of the session trace, metres */
  distanceM: number;
  /** number of points in the session trace */
  routeLen: number;
}

export type LapEvent =
  | { kind: 'rep-done'; lap: FinishedLap; restS: number; last: boolean }
  | { kind: 'rep-start'; repNo: number }
  | { kind: 'plan-done'; reps: number };

/** A fresh lap state for the first rep, starting now. */
export function startLaps(p: {
  sessionId: number;
  logId: number;
  exerciseId: number;
  exerciseName: string;
  plan: LapPlan;
  reading: LapReading;
}): LapState {
  return {
    sessionId: p.sessionId,
    logId: p.logId,
    exerciseId: p.exerciseId,
    exerciseName: p.exerciseName,
    plan: sanitizePlan(p.plan),
    phase: 'running',
    repNo: 1,
    startedAt: p.reading.now,
    startDistanceM: p.reading.distanceM,
    startIdx: Math.max(0, p.reading.routeLen - 1),
    restEndsAt: null,
    pending: [],
    doneReps: 0,
  };
}

export function sanitizePlan(plan: Partial<LapPlan> | null | undefined): LapPlan {
  const t = plan?.targetM;
  const r = plan?.reps;
  const rest = plan?.restS;
  return {
    targetM: typeof t === 'number' && Number.isFinite(t) && t >= 20 && t <= 100_000 ? Math.round(t) : null,
    reps: typeof r === 'number' && Number.isFinite(r) && r >= 1 && r <= 100 ? Math.round(r) : null,
    restS: typeof rest === 'number' && Number.isFinite(rest) && rest >= 0 && rest <= 1800 ? Math.round(rest) : DEFAULT_LAP_PLAN.restS,
    autoNext: plan?.autoNext ?? DEFAULT_LAP_PLAN.autoNext,
  };
}

/** The rep in progress: how far, how long, what pace, how close to the target. */
export function lapProgress(state: LapState, reading: LapReading): {
  distanceM: number;
  elapsedS: number;
  /** seconds per km; null until there is distance to speak of */
  paceSPerKm: number | null;
  /** 0..1 of the target; null when there is no target */
  fraction: number | null;
  restLeftS: number | null;
} {
  if (state.phase !== 'running') {
    const restLeft = state.phase === 'resting' && state.restEndsAt ? Math.max(0, Math.ceil((state.restEndsAt - reading.now) / 1000)) : null;
    return { distanceM: 0, elapsedS: 0, paceSPerKm: null, fraction: null, restLeftS: restLeft };
  }
  const distanceM = Math.max(0, reading.distanceM - state.startDistanceM);
  const elapsedS = Math.max(0, Math.round((reading.now - state.startedAt) / 1000));
  return {
    distanceM,
    elapsedS,
    paceSPerKm: distanceM >= 20 && elapsedS > 0 ? elapsedS / (distanceM / 1000) : null,
    fraction: state.plan.targetM ? Math.min(1, distanceM / state.plan.targetM) : null,
    restLeftS: null,
  };
}

/**
 * Close the rep in progress at this reading. `auto` marks one ended by the
 * target. With a target, the distance is credited as the target when it was
 * reached between fixes — a 400 m rep is a 400 m rep, not the 407 m the next
 * fix happened to land on; the time is scaled to match.
 */
function finishRep(state: LapState, reading: LapReading, auto: boolean): { state: LapState; events: LapEvent[] } {
  const raw = Math.max(0, reading.distanceM - state.startDistanceM);
  const rawS = Math.max(1, Math.round((reading.now - state.startedAt) / 1000));
  const target = state.plan.targetM;
  const overshoot = auto && target && raw > target;
  const lap: FinishedLap = {
    repNo: state.repNo,
    distanceM: Math.round(overshoot ? target! : raw),
    durationS: overshoot ? Math.max(1, Math.round(rawS * (target! / raw))) : rawS,
    from: state.startIdx,
    to: Math.max(state.startIdx, reading.routeLen - 1),
    auto,
  };
  const doneReps = state.doneReps + 1;
  const last = state.plan.reps != null && doneReps >= state.plan.reps;
  const events: LapEvent[] = [{ kind: 'rep-done', lap, restS: last ? 0 : state.plan.restS, last }];
  const base = { ...state, pending: [...state.pending, lap], doneReps };
  if (last) {
    events.push({ kind: 'plan-done', reps: doneReps });
    return { state: { ...base, phase: 'done', restEndsAt: null }, events };
  }
  return {
    state: { ...base, phase: 'resting', repNo: state.repNo + 1, restEndsAt: reading.now + state.plan.restS * 1000 },
    events,
  };
}

function beginRep(state: LapState, reading: LapReading): LapState {
  return {
    ...state,
    phase: 'running',
    startedAt: reading.now,
    startDistanceM: reading.distanceM,
    startIdx: Math.max(0, reading.routeLen - 1),
    restEndsAt: null,
  };
}

/**
 * Move the laps forward to this reading: end a rep that reached its target,
 * start the next one when the rest is over. Idempotent for a reading that
 * changes nothing — safe to call from two places, every second.
 */
export function advanceLaps(state: LapState, reading: LapReading): { state: LapState; events: LapEvent[] } {
  if (state.phase === 'running' && state.plan.targetM) {
    if (reading.distanceM - state.startDistanceM >= state.plan.targetM) return finishRep(state, reading, true);
  }
  if (state.phase === 'resting' && state.plan.autoNext && state.restEndsAt != null && reading.now >= state.restEndsAt) {
    return { state: beginRep(state, reading), events: [{ kind: 'rep-start', repNo: state.repNo }] };
  }
  return { state, events: [] };
}

/** "Finish rep" pressed. Nothing to finish unless a rep is running. */
export function finishRepByHand(state: LapState, reading: LapReading): { state: LapState; events: LapEvent[] } {
  if (state.phase !== 'running') return { state, events: [] };
  return finishRep(state, reading, false);
}

/** "Start rep" pressed while resting, or to go again after a finished plan. */
export function startRepByHand(state: LapState, reading: LapReading): LapState {
  if (state.phase === 'running') return state;
  return beginRep({ ...state, phase: state.phase === 'done' ? 'resting' : state.phase, repNo: state.phase === 'done' ? state.doneReps + 1 : state.repNo, plan: state.phase === 'done' ? { ...state.plan, reps: null } : state.plan }, reading);
}

/** Take the finished reps out to be logged; the state keeps counting. */
export function drainPending(state: LapState): { state: LapState; laps: FinishedLap[] } {
  return { state: { ...state, pending: [] }, laps: state.pending };
}

/** "6 × 400 m · rest 90 s" — the plan in a line. */
export function describePlan(plan: LapPlan): string {
  const dist = plan.targetM ? formatLapDistance(plan.targetM) : 'open distance';
  const reps = plan.reps ? `${plan.reps} × ` : '';
  const rest = plan.restS > 0 ? ` · rest ${plan.restS >= 60 && plan.restS % 60 === 0 ? `${plan.restS / 60} min` : `${plan.restS} s`}` : '';
  return `${reps}${dist}${rest}`;
}

export function formatLapDistance(m: number): string {
  if (m === 1609) return '1 mile';
  return m >= 1000 ? `${(m / 1000).toFixed(m % 1000 === 0 ? 0 : 1)} km` : `${Math.round(m)} m`;
}

/** Notification text for an event, so the screen and the background say the same thing. */
export function lapEventText(e: LapEvent, exerciseName: string, plan: LapPlan): { title: string; body: string } {
  switch (e.kind) {
    case 'rep-done': {
      const pace = e.lap.distanceM >= 20 ? formatPaceS(e.lap.durationS / (e.lap.distanceM / 1000)) : null;
      return {
        title: `Rep ${e.lap.repNo}${plan.reps ? ` of ${plan.reps}` : ''} done · ${formatLapDistance(e.lap.distanceM)} in ${formatClock(e.lap.durationS)}`,
        body: `${exerciseName}${pace ? ` · ${pace} /km` : ''}${e.last ? '' : e.restS > 0 ? ` · rest ${formatClock(e.restS)}` : ' · next rep now'}`,
      };
    }
    case 'rep-start':
      return { title: `Rep ${e.repNo} — go`, body: `${exerciseName}${plan.targetM ? ` · ${formatLapDistance(plan.targetM)}` : ''}` };
    case 'plan-done':
      return { title: `${e.reps} rep${e.reps === 1 ? '' : 's'} done`, body: `${exerciseName} — every rep is saved as a set.` };
  }
}

export function formatClock(totalS: number): string {
  const s = Math.max(0, Math.round(totalS));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`;
}

export function formatPaceS(secPerKm: number): string {
  if (!Number.isFinite(secPerKm) || secPerKm <= 0) return '—';
  const total = Math.round(secPerKm);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}
