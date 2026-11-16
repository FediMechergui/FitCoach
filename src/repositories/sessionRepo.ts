import { and, desc, eq, gte, inArray, isNull, isNotNull, lt, lte } from 'drizzle-orm';
import { atomic } from '@/db/atomic';
import { profileFor } from '@/lib/loadProfile';
import { finiteNumber } from '@/lib/validation';
import { db } from '@/db/client';
import {
  weighIns,
  exerciseLogs,
  exercises,
  sessions,
  setEntries,
  type NewSession,
  type Session,
  type SessionType,
  type SetEntry,
  type TrackingType,
} from '@/db/schema';
import { caloriesFromMet, SESSION_TYPE_MET } from '@/lib/met';
import { distributeSessionCalories, paceKindFor, type BurnExercise } from '@/lib/exerciseCalories';
import { estimateActivitySteps } from '@/lib/activitySteps';
import { estimate1RMFromSet } from '@/lib/oneRepMax';
import { getUser, PRIMARY_USER_ID } from './userRepo';
import { addSteps, removeSteps } from './activityRepo';
import { fromISODate, nextDayMs, toISODate } from '@/lib/date';

export interface SetDraft {
  reps?: number | null;
  weightKg?: number | null;
  rpe?: number | null;
  /** taken to momentary failure — implies RPE 10 / 0 reps in reserve */
  toFailure?: boolean;
  durationS?: number | null;
  distanceM?: number | null;
  completed?: boolean;
  /** a GPS-measured set: its slice of the session route, as point indices */
  gpsFrom?: number | null;
  gpsTo?: number | null;
}

export interface ExerciseLogView {
  log: typeof exerciseLogs.$inferSelect;
  exerciseName: string;
  iconKey: string;
  primaryMuscle: string | null;
  trackingType: TrackingType;
  /** barbell / dumbbell / machine / cable / bodyweight — drives how weight is labelled */
  equipmentType: string | null;
  /** the exercise's own MET, for real per-exercise calorie attribution */
  metValue: number | null;
  /** movement pattern — compound vs isolation drives the rest prescription */
  pattern: string | null;
  /** stable natural key — load profiles and library lookups hang off it */
  slug: string | null;
  sets: SetEntry[];
}

export interface SessionDetail {
  session: Session;
  logs: ExerciseLogView[];
}

// ── Lifecycle ────────────────────────────────────────────────────────────────
export function startSession(
  sessionType: SessionType,
  opts: {
    label?: string;
    moodBefore?: number;
    style?: string;
    splitKey?: string;
    splitDay?: string;
  } = {},
  userId: number = PRIMARY_USER_ID
): number {
  const existing = activeSession(userId);
  if (existing) return existing.id;
  const payload: NewSession = {
    userId,
    sessionType,
    label: opts.label ?? null,
    style: opts.style ?? null,
    splitKey: opts.splitKey ?? null,
    splitDay: opts.splitDay ?? null,
    moodBefore: opts.moodBefore ?? null,
    startTime: Date.now(),
  };
  const res = db.insert(sessions).values(payload).run();
  return Number(res.lastInsertRowId);
}

export function addExerciseToSession(sessionId: number, exerciseId: number, orderIndex?: number): number {
  const count = db
    .select()
    .from(exerciseLogs)
    .where(eq(exerciseLogs.sessionId, sessionId))
    .all().length;
  const res = db
    .insert(exerciseLogs)
    .values({ sessionId, exerciseId, orderIndex: orderIndex ?? count })
    .run();
  return Number(res.lastInsertRowId);
}

/**
 * Swap one exercise for another IN PLACE — the replacement keeps the slot in
 * the running order. Removing and re-adding sent it to the bottom of the list,
 * which quietly rewrote the order you had planned to work through.
 */
export function replaceExerciseLog(logId: number, newExerciseId: number): number | null {
  return atomic(() => {
  const row = db.select().from(exerciseLogs).where(eq(exerciseLogs.id, logId)).get();
  if (!row) return null;
  const slot = row.orderIndex;
  const sessionId = row.sessionId;
  removeExerciseLog(logId);
  return addExerciseToSession(sessionId, newExerciseId, slot);
  });
}

/** How many completed sets an exercise log holds — "have I started this one". */
export function completedSetsOf(logId: number): number {
  return db
    .select()
    .from(setEntries)
    .where(and(eq(setEntries.exerciseLogId, logId), eq(setEntries.completed, true)))
    .all().length;
}

export function addSet(exerciseLogId: number, draft: SetDraft): number {
  validateSet(draft, exerciseLogId);
  return atomic(() => {
  const existing = db
    .select()
    .from(setEntries)
    .where(eq(setEntries.exerciseLogId, exerciseLogId))
    .all();
  const res = db
    .insert(setEntries)
    .values({
      exerciseLogId,
      setNumber: Math.max(0, ...existing.map(s => s.setNumber)) + 1,
      reps: draft.reps ?? null,
      weightKg: draft.weightKg ?? null,
      // A set taken to failure IS RPE 10; store both so anything reading only
      // rpe still sees the truth.
      rpe: draft.toFailure ? 10 : draft.rpe ?? null,
      toFailure: draft.toFailure ?? false,
      durationS: draft.durationS ?? null,
      distanceM: draft.distanceM ?? null,
      completed: draft.completed ?? true,
      gpsFrom: draft.gpsFrom ?? null,
      gpsTo: draft.gpsTo ?? null,
    })
    .run();
  refreshLogSession(exerciseLogId);
  return Number(res.lastInsertRowId);
  });
}

export function setExerciseRest(logId: number, seconds: number): void {
  finiteNumber(seconds, 'Rest seconds', 0, 3600);
  db.update(exerciseLogs).set({ restSeconds: seconds }).where(eq(exerciseLogs.id, logId)).run();
}

function validateSet(draft: SetDraft, logId: number): void {
  const exercise = db.select({ slug: exercises.slug }).from(exerciseLogs)
    .innerJoin(exercises, eq(exerciseLogs.exerciseId, exercises.id)).where(eq(exerciseLogs.id, logId)).get();
  const fields = { reps: 10000, weightKg: 1500, durationS: 604800, distanceM: 1000000, rpe: 10 };
  for (const [key, max] of Object.entries(fields)) {
    const value = draft[key as keyof typeof fields];
    if (value != null) finiteNumber(value, key, key === 'weightKg' && profileFor(exercise ?? {}).assistable ? -500 : 0, max);
  }
}

export function updateSet(setId: number, patch: SetDraft): void {
  atomic(() => {
    const row = db.select().from(setEntries).where(eq(setEntries.id, setId)).get();
    if (!row) return;
    validateSet(patch, row.exerciseLogId);
    const values = Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined));
    if (patch.toFailure) values.rpe = 10;
    db.update(setEntries).set(values).where(eq(setEntries.id, setId)).run();
    refreshLogSession(row.exerciseLogId);
  });
}

export function deleteSet(setId: number): void {
  atomic(() => {
    const row = db.select().from(setEntries).where(eq(setEntries.id, setId)).get();
    if (!row) return;
    db.delete(setEntries).where(eq(setEntries.id, setId)).run();
    refreshLogSession(row.exerciseLogId);
  });
}

export type SetRow = typeof setEntries.$inferSelect;

/** Undo preserves row identity and rebuilds all derived history. */
export function restoreSetEntry(row: SetRow): number {
  return atomic(() => {
    db.insert(setEntries).values(row).run();
    refreshLogSession(row.exerciseLogId);
    return row.id;
  });
}

export function removeExerciseLog(logId: number): void {
  atomic(() => {
    const row = db.select().from(exerciseLogs).where(eq(exerciseLogs.id, logId)).get();
    if (!row) return;
    db.delete(setEntries).where(eq(setEntries.exerciseLogId, logId)).run();
    db.delete(exerciseLogs).where(eq(exerciseLogs.id, logId)).run();
    refreshSessionDerived(row.sessionId);
    rebuildExercisePRs(row.exerciseId);
  });
}

/**
 * Move an exercise up or down the running order of its session.
 *
 * `orderIndex` was written once at insert and never touched again, so the order
 * you added exercises in was the order you were stuck with. This swaps the
 * index with its neighbour, then renumbers the whole session 0..n-1 — because
 * exercises deleted earlier leave gaps, and swapping raw values across a gap
 * silently does nothing.
 *
 * Returns false when the move isn't possible (already at the end), so the UI
 * can leave the control disabled rather than pretending something happened.
 */
/**
 * Move an exercise up or down the running order.
 *
 * An exercise you have already logged sets on cannot be moved: its place in
 * the order is history, not a plan. Everything you have not started yet is
 * free to rearrange.
 */
export function moveExerciseLog(logId: number, direction: 'up' | 'down'): boolean {
  const row = db.select().from(exerciseLogs).where(eq(exerciseLogs.id, logId)).get();
  if (!row) return false;
  if (completedSetsOf(logId) > 0) return false;

  const siblings = db
    .select()
    .from(exerciseLogs)
    .where(eq(exerciseLogs.sessionId, row.sessionId))
    .orderBy(exerciseLogs.orderIndex)
    .all();

  const at = siblings.findIndex((s) => s.id === logId);
  const to = direction === 'up' ? at - 1 : at + 1;
  if (at < 0 || to < 0 || to >= siblings.length) return false;

  const reordered = [...siblings];
  [reordered[at], reordered[to]] = [reordered[to], reordered[at]];
  // Renumber densely so a later swap can't fall through a gap left by a delete.
  reordered.forEach((s, i) => {
    if (s.orderIndex !== i) {
      db.update(exerciseLogs).set({ orderIndex: i }).where(eq(exerciseLogs.id, s.id)).run();
    }
  });
  return true;
}

/** Last set logged for an exercise (for the "Repeat last set" quick-button). */
export function lastSetForExercise(exerciseId: number, userId: number = PRIMARY_USER_ID): SetEntry | undefined {
  const logs = db
    .select({ id: exerciseLogs.id })
    .from(exerciseLogs)
    .innerJoin(sessions, eq(exerciseLogs.sessionId, sessions.id))
    .where(and(eq(exerciseLogs.exerciseId, exerciseId), eq(sessions.userId, userId)))
    .all();
  if (logs.length === 0) return undefined;
  const ids = logs.map((l) => l.id);
  return db
    .select()
    .from(setEntries)
    .where(inArray(setEntries.exerciseLogId, ids))
    .orderBy(desc(setEntries.id))
    .limit(1)
    .get();
}

// ── Finalize (check-out) ─────────────────────────────────────────────────────
export interface ActivityDetail {
  distanceM?: number | null;
  pace?: number | null;
  elevationM?: number | null;
  score?: string | null;
  caloriesBurned?: number | null;
  /** the GPS trace, kept with the session so it can be drawn and shared */
  routeJson?: string | null;
}

export interface FinalizeResult {
  session: Session;
  totalVolume: number;
  durationS: number;
  caloriesBurned: number;
  prCount: number;
  /** steps this on-foot activity contributed to the day's count (0 if none) */
  stepsAdded: number;
}

/**
 * When an on-foot activity (run/walk/hike) has distance or duration, fold an
 * approximate step count into that day's total — the way a phone counts a
 * tracked run toward your steps. Calories stay owned by the session, so steps
 * are added with 0 kcal to avoid double-counting the burn.
 */
function contributeSteps(opts: {
  onFoot?: boolean;
  distanceM?: number | null;
  durationS?: number | null;
  dateISO: string;
  userId: number;
  /** the session to record the contribution on, so a delete can undo it */
  sessionId: number;
}): number {
  if (!opts.onFoot) return 0;
  const heightCm = safeHeight(opts.userId);
  const { steps, distanceM } = estimateActivitySteps({
    distanceM: opts.distanceM,
    durationSec: opts.durationS,
    heightCm,
  });
  if (steps <= 0) return 0;
  addSteps(steps, distanceM, 0, opts.dateISO, opts.userId);
  // Remember exactly what we added — deleteSession subtracts these, so a deleted
  // session stops counting toward the day instead of inflating it forever.
  db.update(sessions)
    .set({ stepsAdded: steps, distanceAddedM: distanceM })
    .where(eq(sessions.id, opts.sessionId))
    .run();
  return steps;
}

function safeHeight(userId: number): number {
  try {
    return getUser(userId)?.heightCm ?? 170;
  } catch {
    return 170;
  }
}

/**
 * Finalize a session (check-out, spec §3.1): computes duration, total volume
 * (strength/calisthenics), estimated calories, and auto-detects PRs (best
 * estimated 1RM per exercise vs. the user's prior history).
 */
export function finalizeSession(
  sessionId: number,
  opts: { moodAfter?: number | null; activity?: ActivityDetail; weightKg?: number; notes?: string | null; onFoot?: boolean } = {}
): FinalizeResult {
  return atomic(() => {
    let session = getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    if (session.endTime == null) {
      const endTime = Date.now();
      const durationS = Math.max(0, Math.round((endTime - session.startTime) / 1000));
      const bodyweightKg = finiteNumber(opts.weightKg ?? historicalWeight(session), 'Bodyweight', 10, 500);
      if (opts.activity?.distanceM != null) finiteNumber(opts.activity.distanceM, 'Distance', 0, 1000000);
      if (opts.activity?.caloriesBurned != null) finiteNumber(opts.activity.caloriesBurned, 'Calories', 0, 100000);
      db.update(sessions).set({
        endTime, durationS, bodyweightKg, archivedAt: null,
        calorieOverride: opts.activity?.caloriesBurned ?? null,
        distanceM: opts.activity?.distanceM ?? session.distanceM,
        pace: opts.activity?.pace ?? session.pace,
        elevationM: opts.activity?.elevationM ?? session.elevationM,
        score: opts.activity?.score ?? session.score,
        routeJson: opts.activity?.routeJson ?? session.routeJson,
        moodAfter: opts.moodAfter ?? session.moodAfter,
        notes: opts.notes ?? session.notes,
      }).where(eq(sessions.id, sessionId)).run();
      contributeSteps({ onFoot: opts.onFoot, distanceM: opts.activity?.distanceM,
        durationS, dateISO: toISODate(new Date(session.startTime)), userId: session.userId, sessionId });
    }
    refreshSessionDerived(sessionId);
    const detail = getSessionDetail(sessionId);
    session = detail.session;
    return { session, totalVolume: session.totalVolume ?? 0, durationS: session.durationS ?? 0,
      caloriesBurned: session.caloriesBurned ?? 0, stepsAdded: session.stepsAdded ?? 0,
      prCount: detail.logs.flatMap(l => l.sets).filter(s => s.isPr).length };
  });
}

function historicalWeight(session: Session): number {
  if (session.bodyweightKg != null) return session.bodyweightKg;
  return db.select().from(weighIns).where(and(eq(weighIns.userId, session.userId),
    lte(weighIns.date, toISODate(new Date(session.startTime))))).orderBy(desc(weighIns.date)).limit(1).get()?.weightKg ?? 75;
}

function refreshLogSession(logId: number): void {
  const row = db.select().from(exerciseLogs).where(eq(exerciseLogs.id, logId)).get();
  if (row) refreshSessionDerived(row.sessionId);
}

/** Recalculate completed sessions without changing their time or adding steps again. */
export function refreshSessionDerived(sessionId: number, rebuildPRs = true): void {
  const detail = getSessionDetail(sessionId);
  const { session, logs } = detail;
  if (session.endTime == null) return;
  const weightKg = historicalWeight(session);
  const lifting = session.sessionType === 'strength' || session.sessionType === 'calisthenics';
  const totalVolume = logs.flatMap(l => l.sets).reduce((sum, s) => sum + (s.completed ? (s.weightKg ?? 0) * (s.reps ?? 0) : 0), 0);
  const caloriesBurned = session.calorieOverride ?? distributeSessionCalories({ durationS: session.durationS ?? 0,
    weightKg, fallbackMet: SESSION_TYPE_MET[session.sessionType] ?? 4, exercises: logsToBurn(logs) }).total;
  db.update(sessions).set({ totalVolume: lifting ? Math.round(totalVolume) : null, caloriesBurned,
    bodyweightKg: weightKg }).where(eq(sessions.id, sessionId)).run();
  if (rebuildPRs) for (const id of new Set(logs.map(l => l.log.exerciseId))) rebuildExercisePRs(id);
}

/** Once on upgrade: repair old stale totals and flags without touching raw sets. */
export function repairSessionHistory(): void {
  for (const session of db.select().from(sessions).where(isNotNull(sessions.endTime)).all()) refreshSessionDerived(session.id, false);
  for (const id of new Set(db.select({ id: exerciseLogs.exerciseId }).from(exerciseLogs).all().map(r => r.id))) rebuildExercisePRs(id);
}

/** Backdated edits can change later PRs. Compare only finished sessions in chronological order. */
function rebuildExercisePRs(exerciseId: number): void {
  const rows = db.select({ set: setEntries, start: sessions.startTime, sessionId: sessions.id,
    end: sessions.endTime, userId: sessions.userId, order: exerciseLogs.orderIndex })
    .from(setEntries).innerJoin(exerciseLogs, eq(setEntries.exerciseLogId, exerciseLogs.id))
    .innerJoin(sessions, eq(exerciseLogs.sessionId, sessions.id))
    .where(eq(exerciseLogs.exerciseId, exerciseId)).all()
    .sort((a, b) => a.start - b.start || a.sessionId - b.sessionId || a.order - b.order || a.set.setNumber - b.set.setNumber || a.set.id - b.set.id);
  const best = new Map<number, number>();
  for (const row of rows) {
    const estimate = row.end != null && row.set.completed ? estimate1RMFromSet(row.set) : 0;
    const previous = best.get(row.userId) ?? 0;
    const isPr = estimate > previous + 0.01;
    best.set(row.userId, Math.max(previous, estimate));
    if (row.set.isPr !== isPr) db.update(setEntries).set({ isPr }).where(eq(setEntries.id, row.set.id)).run();
  }
}

/** Recover an old draft only after the current workout has finished. */
export function resumeDraft(sessionId: number): void {
  atomic(() => {
    const session = getSession(sessionId);
    if (!session || session.endTime != null) throw new Error('This session is already finished.');
    const active = activeSession(session.userId);
    if (active && active.id !== sessionId) throw new Error('Finish or cancel your current workout before resuming this draft.');
    if (active?.id === sessionId && session.archivedAt == null) return;
    // A recovered draft restarts its timer; preserve its original time in the notes.
    const original = new Date(session.startTime).toISOString();
    db.update(sessions).set({ archivedAt: null, startTime: Date.now(),
      notes: `${session.notes ?? ''}\nRecovered draft originally started ${original}. Timer restarted on recovery.`.trim()
    }).where(eq(sessions.id, sessionId)).run();
  });
}

/**
 * Log a session retroactively from an explicit start→end time (spec: "I forgot
 * to start the session"). Creates an already-finished session — duration and
 * MET-based calories are derived from the time range, no live timer needed.
 * Optional exercise slugs pre-populate it so the movements are recorded too.
 */
export function logPastSession(
  input: {
    sessionType: SessionType;
    label?: string | null;
    startTime: number; // epoch ms
    endTime: number; // epoch ms
    distanceM?: number | null;
    elevationM?: number | null;
    score?: string | null;
    notes?: string | null;
    exerciseIds?: number[];
    weightKg?: number;
    /** on-foot activity (run/walk/hike) — folds an estimated step count into the day */
    onFoot?: boolean;
  },
  userId: number = PRIMARY_USER_ID
): { session: Session; stepsAdded: number } {
  return atomic(() => {
  finiteNumber(input.startTime, 'Start time', 0, Date.now());
  finiteNumber(input.endTime, 'End time', input.startTime + 1000, Date.now() + 60000);
  if (input.distanceM != null) finiteNumber(input.distanceM, 'Distance', 0, 1000000);
  const durationS = Math.round((input.endTime - input.startTime) / 1000);
  const fallbackMet = SESSION_TYPE_MET[input.sessionType] ?? 4;
  const bodyKg = input.weightKg ?? 75;
  // Value each listed exercise at its own MET (evenly over the elapsed time,
  // since a past session carries no set-level timing); fall back to the
  // session-type MET when nothing was listed.
  const pastBurn = (input.exerciseIds ?? []).length
    ? db
        .select({ metValue: exercises.metValue, trackingType: exercises.trackingType })
        .from(exercises)
        .where(inArray(exercises.id, input.exerciseIds!))
        .all()
    : [];
  const caloriesBurned = distributeSessionCalories({
    durationS,
    weightKg: bodyKg,
    fallbackMet,
    exercises: pastBurn.map((e) => ({ met: e.metValue, trackingType: e.trackingType, sets: [] })),
  }).total;
  const pace =
    input.distanceM && input.distanceM > 0 ? durationS / (input.distanceM / 1000) : null;

  const res = db
    .insert(sessions)
    .values({
      userId,
      sessionType: input.sessionType,
      bodyweightKg: finiteNumber(bodyKg, 'Bodyweight', 10, 500),
      label: input.label ?? null,
      startTime: input.startTime,
      endTime: input.endTime,
      durationS,
      distanceM: input.distanceM ?? null,
      elevationM: input.elevationM ?? null,
      pace,
      score: input.score ?? null,
      caloriesBurned,
      notes: input.notes ?? null,
    })
    .run();
  const id = Number(res.lastInsertRowId);
  for (const exId of input.exerciseIds ?? []) {
    addExerciseToSession(id, exId);
  }
  const stepsAdded = contributeSteps({
    onFoot: input.onFoot,
    distanceM: input.distanceM,
    durationS,
    dateISO: toISODate(new Date(input.startTime)),
    userId,
    sessionId: id,
  });
  return { session: getSession(id)!, stepsAdded };
  });
}

/** Adapt exercise-log views into the shape the calorie distributor expects. */
function logsToBurn(logs: ExerciseLogView[]): BurnExercise[] {
  return logs.map((lv) => ({
    met: lv.metValue,
    trackingType: lv.trackingType,
    slug: lv.slug,
    equipmentType: lv.equipmentType,
    pattern: lv.pattern,
    paceKind: paceKindFor(lv.slug, lv.trackingType),
    sets: lv.sets.map((s) => ({
      reps: s.reps,
      durationS: s.durationS,
      distanceM: s.distanceM,
      completed: s.completed,
      weightKg: s.weightKg,
      rpe: s.rpe,
      toFailure: s.toFailure,
    })),
  }));
}

export interface SessionCalorieBreakdown {
  /** kcal earned resting between sets, and how long that was */
  restCalories: number;
  restSeconds: number;
  workSeconds: number;
  restMet: number;
  /** kcal per exercise-log id */
  byLogId: Record<number, number>;
  total: number;
  basis: 'per-exercise' | 'session-met';
}

/**
 * Recompute the per-exercise calorie split for a session on read, so the real
 * value of each movement is available even for sessions logged before this
 * existed. Uses the session's stored duration and the user's weight at the time
 * (falls back to 75 kg when unknown).
 */
export function sessionCalorieBreakdown(
  detail: SessionDetail,
  bodyKg = 75
): SessionCalorieBreakdown {
  const { session, logs } = detail;
  bodyKg = session.endTime != null ? historicalWeight(session) : bodyKg;
  const durationS = session.durationS ?? 0;
  const fallbackMet = SESSION_TYPE_MET[session.sessionType] ?? 4;
  const dist = distributeSessionCalories({
    durationS,
    weightKg: bodyKg,
    fallbackMet,
    exercises: logsToBurn(logs),
  });
  const recordedTotal = session.calorieOverride ?? dist.total;
  const ratio = dist.total > 0 ? recordedTotal / dist.total : 0;
  const byLogId: Record<number, number> = {};
  logs.forEach((lv, i) => {
    byLogId[lv.log.id] = (dist.perExercise[i] ?? 0) * ratio;
  });
  return {
    byLogId,
    total: recordedTotal,
    basis: dist.basis,
    restCalories: dist.total > 0 ? dist.restCalories * ratio : recordedTotal,
    restSeconds: dist.restSeconds,
    workSeconds: dist.workSeconds,
    restMet: dist.restMet,
  };
}

// ── Queries ──────────────────────────────────────────────────────────────────
export interface SessionExercisePeek {
  id: number;
  name: string;
  iconKey: string;
  primaryMuscle: string | null;
  equipmentType: string | null;
  /** what was actually logged: "4 sets · 320 kg" / "3 sets" / "12 min" */
  detail: string | null;
}

/**
 * Just the exercise list of a finished session — for looking at it in place,
 * without pushing the whole detail screen.
 */
export function sessionExercisePeek(sessionId: number): SessionExercisePeek[] {
  const rows = db
    .select({
      id: exercises.id,
      name: exercises.name,
      iconKey: exercises.iconKey,
      primaryMuscle: exercises.primaryMuscle,
      equipmentType: exercises.equipmentType,
      logId: exerciseLogs.id,
    })
    .from(exerciseLogs)
    .innerJoin(exercises, eq(exerciseLogs.exerciseId, exercises.id))
    .where(eq(exerciseLogs.sessionId, sessionId))
    .orderBy(exerciseLogs.orderIndex)
    .all();

  return rows.map((r) => {
    const sets = db.select().from(setEntries).where(eq(setEntries.exerciseLogId, r.logId)).all();
    const done = sets.filter((s) => s.completed);
    const volume = done.reduce((v, s) => v + (s.weightKg ?? 0) * (s.reps ?? 0), 0);
    const seconds = done.reduce((v, s) => v + (s.durationS ?? 0), 0);
    const parts: string[] = [];
    if (done.length) parts.push(`${done.length} set${done.length === 1 ? '' : 's'}`);
    if (volume > 0) parts.push(`${Math.round(volume).toLocaleString()} kg`);
    if (seconds > 0) parts.push(`${Math.round(seconds / 60)} min`);
    return {
      id: r.id,
      name: r.name,
      iconKey: r.iconKey,
      primaryMuscle: r.primaryMuscle,
      equipmentType: r.equipmentType,
      detail: parts.length ? parts.join(' · ') : null,
    };
  });
}

/** Which warm-up muscles have been ticked in a session. */
export function warmupsDoneOf(session: Pick<Session, 'warmupsDone'>): string[] {
  if (!session.warmupsDone) return [];
  try {
    const v = JSON.parse(session.warmupsDone);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/** Tick or untick a warm-up muscle for a session — persisted, so resuming keeps it. */
export function toggleWarmupDone(sessionId: number, muscle: string): string[] {
  const s = getSession(sessionId);
  if (!s) return [];
  const cur = new Set(warmupsDoneOf(s));
  if (cur.has(muscle)) cur.delete(muscle); else cur.add(muscle);
  const next = [...cur];
  db.update(sessions).set({ warmupsDone: JSON.stringify(next) }).where(eq(sessions.id, sessionId)).run();
  return next;
}

export function getSession(sessionId: number): Session | undefined {
  return db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
}

export function getSessionDetail(sessionId: number): SessionDetail {
  const session = db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
  if (!session) throw new Error(`Session ${sessionId} not found`);
  const logRows = db
    .select({
      log: exerciseLogs,
      exerciseName: exercises.name,
      iconKey: exercises.iconKey,
      primaryMuscle: exercises.primaryMuscle,
      trackingType: exercises.trackingType,
      equipmentType: exercises.equipmentType,
      metValue: exercises.metValue,
      pattern: exercises.pattern,
      slug: exercises.slug,
    })
    .from(exerciseLogs)
    .innerJoin(exercises, eq(exerciseLogs.exerciseId, exercises.id))
    .where(eq(exerciseLogs.sessionId, sessionId))
    .orderBy(exerciseLogs.orderIndex)
    .all();

  const logs: ExerciseLogView[] = logRows.map((r) => ({
    log: r.log,
    exerciseName: r.exerciseName,
    iconKey: r.iconKey,
    primaryMuscle: r.primaryMuscle,
    trackingType: r.trackingType,
    equipmentType: r.equipmentType,
    metValue: r.metValue,
    pattern: r.pattern ?? null,
    slug: r.slug ?? null,
    sets: db
      .select()
      .from(setEntries)
      .where(eq(setEntries.exerciseLogId, r.log.id))
      .orderBy(setEntries.setNumber)
      .all(),
  }));

  return { session, logs };
}

export function listSessions(
  opts: { limit?: number; since?: string; until?: string; type?: SessionType; includeUnfinished?: boolean } = {},
  userId: number = PRIMARY_USER_ID
): Session[] {
  const clauses = [eq(sessions.userId, userId)];
  if (!opts.includeUnfinished) clauses.push(isNotNull(sessions.endTime));
  if (opts.since) clauses.push(gte(sessions.startTime, fromISODate(opts.since).getTime()));
  if (opts.until) clauses.push(lt(sessions.startTime, nextDayMs(opts.until)));
  if (opts.type) clauses.push(eq(sessions.sessionType, opts.type));
  let q = db
    .select()
    .from(sessions)
    .where(and(...clauses))
    .orderBy(desc(sessions.startTime))
    .$dynamic();
  if (opts.limit) q = q.limit(opts.limit);
  return q.all();
}

/** The most recent session that was started but never finalized (endTime null). */
export function activeSession(userId: number = PRIMARY_USER_ID): Session | undefined {
  return db
    .select()
    .from(sessions)
    .where(and(eq(sessions.userId, userId), isNull(sessions.endTime), isNull(sessions.archivedAt)))
    .orderBy(desc(sessions.startTime))
    .limit(1)
    .get();
}

/**
 * Delete a session and everything derived from it: its exercise logs, its sets,
 * and its contribution to the day's step/distance totals.
 *
 * The session's own calories vanish with the row (the energy card sums live from
 * the sessions table), but on-foot activities also push steps into
 * `daily_step_logs`, which used to survive the delete — so a session you removed
 * kept counting toward your day. `steps_added` / `distance_added_m` record what
 * was contributed so it can be subtracted exactly.
 */
export function deleteSession(sessionId: number): void {
  return atomic(() => {
  const session = db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
  const logs = db
    .select({ id: exerciseLogs.id, exerciseId: exerciseLogs.exerciseId })
    .from(exerciseLogs)
    .where(eq(exerciseLogs.sessionId, sessionId))
    .all();
  for (const l of logs) {
    db.delete(setEntries).where(eq(setEntries.exerciseLogId, l.id)).run();
  }
  db.delete(exerciseLogs).where(eq(exerciseLogs.sessionId, sessionId)).run();
  db.delete(sessions).where(eq(sessions.id, sessionId)).run();

  if (session?.stepsAdded) {
    removeSteps(
      session.stepsAdded,
      session.distanceAddedM ?? 0,
      0, // sessions never contributed calories to the daily log
      toISODate(new Date(session.startTime)),
      session.userId
    );
  }
  for (const id of new Set(logs.map(l => l.exerciseId))) rebuildExercisePRs(id);
  });
}

/**
 * The completed sets of an exercise from the most recent FINISHED session
 * before this one — what the training tip compares today against.
 */
export function lastSessionSets(exerciseId: number, excludeSessionId: number | null, userId: number = PRIMARY_USER_ID): SetEntry[] {
  const logs = db
    .select({ id: exerciseLogs.id, sessionId: exerciseLogs.sessionId, start: sessions.startTime, end: sessions.endTime })
    .from(exerciseLogs)
    .innerJoin(sessions, eq(exerciseLogs.sessionId, sessions.id))
    .where(and(eq(exerciseLogs.exerciseId, exerciseId), eq(sessions.userId, userId)))
    .all()
    .filter((l) => l.sessionId !== excludeSessionId && l.end != null)
    .sort((a, b) => b.start - a.start);
  for (const l of logs) {
    const sets = db
      .select()
      .from(setEntries)
      .where(and(eq(setEntries.exerciseLogId, l.id), eq(setEntries.completed, true)))
      .orderBy(setEntries.setNumber)
      .all();
    if (sets.length) return sets;
  }
  return [];
}
