import { and, desc, eq, gte, inArray, isNull, lte } from 'drizzle-orm';
import { db } from '@/db/client';
import {
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
import { distributeSessionCalories, type BurnExercise } from '@/lib/exerciseCalories';
import { estimateActivitySteps } from '@/lib/activitySteps';
import { estimate1RMFromSet } from '@/lib/oneRepMax';
import { getUser, PRIMARY_USER_ID } from './userRepo';
import { addSteps, removeSteps } from './activityRepo';
import { toISODate } from '@/lib/date';

export interface SetDraft {
  reps?: number | null;
  weightKg?: number | null;
  rpe?: number | null;
  /** taken to momentary failure — implies RPE 10 / 0 reps in reserve */
  toFailure?: boolean;
  durationS?: number | null;
  distanceM?: number | null;
  completed?: boolean;
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

export function addExerciseToSession(sessionId: number, exerciseId: number): number {
  const count = db
    .select()
    .from(exerciseLogs)
    .where(eq(exerciseLogs.sessionId, sessionId))
    .all().length;
  const res = db
    .insert(exerciseLogs)
    .values({ sessionId, exerciseId, orderIndex: count })
    .run();
  return Number(res.lastInsertRowId);
}

export function addSet(exerciseLogId: number, draft: SetDraft): number {
  const existing = db
    .select()
    .from(setEntries)
    .where(eq(setEntries.exerciseLogId, exerciseLogId))
    .all();
  const res = db
    .insert(setEntries)
    .values({
      exerciseLogId,
      setNumber: existing.length + 1,
      reps: draft.reps ?? null,
      weightKg: draft.weightKg ?? null,
      // A set taken to failure IS RPE 10; store both so anything reading only
      // rpe still sees the truth.
      rpe: draft.toFailure ? 10 : draft.rpe ?? null,
      toFailure: draft.toFailure ?? false,
      durationS: draft.durationS ?? null,
      distanceM: draft.distanceM ?? null,
      completed: draft.completed ?? true,
    })
    .run();
  return Number(res.lastInsertRowId);
}

export function updateSet(setId: number, patch: SetDraft): void {
  db.update(setEntries)
    .set({
      reps: patch.reps ?? null,
      weightKg: patch.weightKg ?? null,
      rpe: patch.toFailure ? 10 : patch.rpe ?? null,
      toFailure: patch.toFailure ?? false,
      durationS: patch.durationS ?? null,
      distanceM: patch.distanceM ?? null,
      ...(patch.completed !== undefined ? { completed: patch.completed } : {}),
    })
    .where(eq(setEntries.id, setId))
    .run();
}

export function deleteSet(setId: number): void {
  db.delete(setEntries).where(eq(setEntries.id, setId)).run();
}

export function removeExerciseLog(logId: number): void {
  db.delete(setEntries).where(eq(setEntries.exerciseLogId, logId)).run();
  db.delete(exerciseLogs).where(eq(exerciseLogs.id, logId)).run();
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
export function moveExerciseLog(logId: number, direction: 'up' | 'down'): boolean {
  const row = db.select().from(exerciseLogs).where(eq(exerciseLogs.id, logId)).get();
  if (!row) return false;

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
  const session = db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
  if (!session) throw new Error(`Session ${sessionId} not found`);

  const endTime = Date.now();
  const durationS = Math.max(0, Math.round((endTime - session.startTime) / 1000));

  const detail = getSessionDetail(sessionId);
  let totalVolume = 0;
  let prCount = 0;

  const isLifting = session.sessionType === 'strength' || session.sessionType === 'calisthenics';
  if (isLifting) {
    for (const lv of detail.logs) {
      for (const s of lv.sets) {
        if (s.completed && s.weightKg && s.reps) totalVolume += s.weightKg * s.reps;
      }
      prCount += detectAndFlagPRs(lv, sessionId);
    }
  }

  // Calorie estimate. When there are logged exercises we attribute the burn per
  // movement using each one's real MET; otherwise fall back to the session-type
  // MET. A caller-provided figure (e.g. a GPS run) always wins.
  const bodyKg = opts.weightKg ?? 75;
  const providedCals = opts.activity?.caloriesBurned ?? null;
  const fallbackMet = SESSION_TYPE_MET[session.sessionType] ?? 4;
  const caloriesBurned =
    providedCals ??
    distributeSessionCalories({
      durationS,
      weightKg: bodyKg,
      fallbackMet,
      exercises: logsToBurn(detail.logs),
    }).total;

  db.update(sessions)
    .set({
      endTime,
      durationS,
      totalVolume: isLifting ? Math.round(totalVolume) : null,
      distanceM: opts.activity?.distanceM ?? null,
      pace: opts.activity?.pace ?? null,
      elevationM: opts.activity?.elevationM ?? null,
      score: opts.activity?.score ?? null,
      caloriesBurned,
      moodAfter: opts.moodAfter ?? session.moodAfter ?? null,
      notes: opts.notes ?? session.notes ?? null,
    })
    .where(eq(sessions.id, sessionId))
    .run();

  const stepsAdded = contributeSteps({
    onFoot: opts.onFoot,
    distanceM: opts.activity?.distanceM ?? null,
    durationS,
    dateISO: toISODate(new Date(session.startTime)),
    userId: session.userId,
    sessionId,
  });

  return {
    session: db.select().from(sessions).where(eq(sessions.id, sessionId)).get()!,
    totalVolume: Math.round(totalVolume),
    durationS,
    caloriesBurned,
    prCount,
    stepsAdded,
  };
}

/**
 * Flag PRs: for each set in this exercise log, mark it a PR if its estimated
 * 1RM exceeds the best estimated 1RM this user previously achieved on the same
 * exercise (before this session).
 */
function detectAndFlagPRs(lv: ExerciseLogView, sessionId: number): number {
  const exerciseId = lv.log.exerciseId;
  const priorBest = bestPrior1RM(exerciseId, sessionId);
  let running = priorBest;
  let count = 0;
  for (const s of lv.sets) {
    if (s.completed && s.weightKg && s.reps) {
      const e = estimate1RMFromSet(s);
      if (e > running + 0.01) {
        db.update(setEntries).set({ isPr: true }).where(eq(setEntries.id, s.id)).run();
        running = e;
        count++;
      }
    }
  }
  return count;
}

function bestPrior1RM(exerciseId: number, excludeSessionId: number): number {
  const rows = db
    .select({
      reps: setEntries.reps,
      weightKg: setEntries.weightKg,
      rpe: setEntries.rpe,
      toFailure: setEntries.toFailure,
    })
    .from(setEntries)
    .innerJoin(exerciseLogs, eq(setEntries.exerciseLogId, exerciseLogs.id))
    .where(and(eq(exerciseLogs.exerciseId, exerciseId), eq(setEntries.completed, true)))
    .all();
  let best = 0;
  for (const r of rows) {
    const e = estimate1RMFromSet(r);
    if (e > best) best = e;
  }
  return best;
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
  const durationS = Math.max(1, Math.round((input.endTime - input.startTime) / 1000));
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
}

/** Adapt exercise-log views into the shape the calorie distributor expects. */
function logsToBurn(logs: ExerciseLogView[]): BurnExercise[] {
  return logs.map((lv) => ({
    met: lv.metValue,
    trackingType: lv.trackingType,
    sets: lv.sets.map((s) => ({
      reps: s.reps,
      durationS: s.durationS,
      distanceM: s.distanceM,
      completed: s.completed,
    })),
  }));
}

export interface SessionCalorieBreakdown {
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
  const durationS = session.durationS ?? 0;
  const fallbackMet = SESSION_TYPE_MET[session.sessionType] ?? 4;
  const dist = distributeSessionCalories({
    durationS,
    weightKg: bodyKg,
    fallbackMet,
    exercises: logsToBurn(logs),
  });
  const byLogId: Record<number, number> = {};
  logs.forEach((lv, i) => {
    byLogId[lv.log.id] = dist.perExercise[i] ?? 0;
  });
  return { byLogId, total: dist.total, basis: dist.basis };
}

// ── Queries ──────────────────────────────────────────────────────────────────
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
  opts: { limit?: number; since?: string; until?: string; type?: SessionType } = {},
  userId: number = PRIMARY_USER_ID
): Session[] {
  const clauses = [eq(sessions.userId, userId)];
  if (opts.since) clauses.push(gte(sessions.startTime, new Date(opts.since).getTime()));
  if (opts.until) clauses.push(lte(sessions.startTime, new Date(opts.until).getTime() + 86_400_000));
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
    .where(and(eq(sessions.userId, userId), isNull(sessions.endTime)))
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
  const session = db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
  const logs = db
    .select({ id: exerciseLogs.id })
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
}
