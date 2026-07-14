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
} from '@/db/schema';
import { caloriesFromMet, SESSION_TYPE_MET } from '@/lib/met';
import { estimate1RM } from '@/lib/oneRepMax';
import { PRIMARY_USER_ID } from './userRepo';

export interface SetDraft {
  reps?: number | null;
  weightKg?: number | null;
  rpe?: number | null;
  completed?: boolean;
}

export interface ExerciseLogView {
  log: typeof exerciseLogs.$inferSelect;
  exerciseName: string;
  iconKey: string;
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
      rpe: draft.rpe ?? null,
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
      rpe: patch.rpe ?? null,
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
}

/**
 * Finalize a session (check-out, spec §3.1): computes duration, total volume
 * (strength/calisthenics), estimated calories, and auto-detects PRs (best
 * estimated 1RM per exercise vs. the user's prior history).
 */
export function finalizeSession(
  sessionId: number,
  opts: { moodAfter?: number | null; activity?: ActivityDetail; weightKg?: number; notes?: string | null } = {}
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

  // Calorie estimate: MET-based, using the session-type default MET.
  const bodyKg = opts.weightKg ?? 75;
  const providedCals = opts.activity?.caloriesBurned ?? null;
  const met = SESSION_TYPE_MET[session.sessionType] ?? 4;
  const caloriesBurned = providedCals ?? caloriesFromMet(met, bodyKg, durationS);

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

  return {
    session: db.select().from(sessions).where(eq(sessions.id, sessionId)).get()!,
    totalVolume: Math.round(totalVolume),
    durationS,
    caloriesBurned,
    prCount,
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
      const e = estimate1RM(s.weightKg, s.reps);
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
    .select({ reps: setEntries.reps, weightKg: setEntries.weightKg })
    .from(setEntries)
    .innerJoin(exerciseLogs, eq(setEntries.exerciseLogId, exerciseLogs.id))
    .where(and(eq(exerciseLogs.exerciseId, exerciseId), eq(setEntries.completed, true)))
    .all();
  let best = 0;
  for (const r of rows) {
    if (r.weightKg && r.reps) {
      const e = estimate1RM(r.weightKg, r.reps);
      if (e > best) best = e;
    }
  }
  return best;
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

export function deleteSession(sessionId: number): void {
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
}
