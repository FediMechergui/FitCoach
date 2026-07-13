import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import {
  exerciseLogs,
  exercises,
  sessions,
  setEntries,
  type SessionType,
} from '@/db/schema';
import { daysAgoISO, startOfWeek, toISODate, todayISO } from '@/lib/date';
import { estimate1RM, type ORMFormula } from '@/lib/oneRepMax';
import { PRIMARY_USER_ID } from './userRepo';

// ── Per-exercise progression (1RM + volume over time) ───────────────────────
export interface ProgressionPoint {
  date: string;
  best1RM: number;
  volume: number;
  topWeight: number;
}

export function exerciseProgression(
  exerciseId: number,
  formula: ORMFormula = 'epley',
  userId: number = PRIMARY_USER_ID
): ProgressionPoint[] {
  const rows = db
    .select({
      startTime: sessions.startTime,
      reps: setEntries.reps,
      weightKg: setEntries.weightKg,
    })
    .from(setEntries)
    .innerJoin(exerciseLogs, eq(setEntries.exerciseLogId, exerciseLogs.id))
    .innerJoin(sessions, eq(exerciseLogs.sessionId, sessions.id))
    .where(
      and(
        eq(exerciseLogs.exerciseId, exerciseId),
        eq(sessions.userId, userId),
        eq(setEntries.completed, true)
      )
    )
    .all();

  const byDay = new Map<string, ProgressionPoint>();
  for (const r of rows) {
    if (!r.weightKg || !r.reps) continue;
    const date = toISODate(new Date(r.startTime));
    const cur = byDay.get(date) ?? { date, best1RM: 0, volume: 0, topWeight: 0 };
    cur.best1RM = Math.max(cur.best1RM, estimate1RM(r.weightKg, r.reps, formula));
    cur.topWeight = Math.max(cur.topWeight, r.weightKg);
    cur.volume += r.weightKg * r.reps;
    byDay.set(date, cur);
  }
  return [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));
}

// ── Personal records timeline ────────────────────────────────────────────────
export interface PRRow {
  date: string;
  exerciseName: string;
  weightKg: number;
  reps: number;
  est1RM: number;
}

export function personalRecords(limit = 50, userId: number = PRIMARY_USER_ID): PRRow[] {
  const rows = db
    .select({
      startTime: sessions.startTime,
      exerciseName: exercises.name,
      reps: setEntries.reps,
      weightKg: setEntries.weightKg,
    })
    .from(setEntries)
    .innerJoin(exerciseLogs, eq(setEntries.exerciseLogId, exerciseLogs.id))
    .innerJoin(sessions, eq(exerciseLogs.sessionId, sessions.id))
    .innerJoin(exercises, eq(exerciseLogs.exerciseId, exercises.id))
    .where(and(eq(sessions.userId, userId), eq(setEntries.isPr, true)))
    .orderBy(desc(sessions.startTime))
    .limit(limit)
    .all();
  return rows
    .filter((r) => r.weightKg && r.reps)
    .map((r) => ({
      date: toISODate(new Date(r.startTime)),
      exerciseName: r.exerciseName,
      weightKg: r.weightKg!,
      reps: r.reps!,
      est1RM: estimate1RM(r.weightKg!, r.reps!),
    }));
}

// ── Weekly volume trend ──────────────────────────────────────────────────────
export interface WeeklyVolume {
  weekStart: string;
  volume: number;
  sessions: number;
}

export function weeklyVolume(weeks = 8, userId: number = PRIMARY_USER_ID): WeeklyVolume[] {
  const since = daysAgoISO(weeks * 7);
  const rows = db
    .select()
    .from(sessions)
    .where(and(eq(sessions.userId, userId)))
    .all()
    .filter((s) => toISODate(new Date(s.startTime)) >= since);

  const map = new Map<string, WeeklyVolume>();
  for (const s of rows) {
    const wk = startOfWeek(toISODate(new Date(s.startTime)));
    const cur = map.get(wk) ?? { weekStart: wk, volume: 0, sessions: 0 };
    cur.volume += s.totalVolume ?? 0;
    cur.sessions += 1;
    map.set(wk, cur);
  }
  return [...map.values()].sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

// ── Training frequency / streak (calendar heatmap) ──────────────────────────
export interface DayActivity {
  date: string;
  count: number;
}

export function trainingCalendar(days = 84, userId: number = PRIMARY_USER_ID): DayActivity[] {
  const since = daysAgoISO(days);
  const rows = db.select().from(sessions).where(eq(sessions.userId, userId)).all();
  const map = new Map<string, number>();
  for (const s of rows) {
    const d = toISODate(new Date(s.startTime));
    if (d >= since) map.set(d, (map.get(d) ?? 0) + 1);
  }
  const out: DayActivity[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = daysAgoISO(i);
    out.push({ date: d, count: map.get(d) ?? 0 });
  }
  return out;
}

/** Current consecutive-day training streak ending today or yesterday. */
export function currentStreak(userId: number = PRIMARY_USER_ID): number {
  const days = trainingCalendar(365, userId);
  const active = new Set(days.filter((d) => d.count > 0).map((d) => d.date));
  let streak = 0;
  // Allow the streak to still count if the user hasn't trained *today* yet.
  let cursor = active.has(todayISO()) ? 0 : 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const d = daysAgoISO(cursor);
    if (active.has(d)) {
      streak++;
      cursor++;
    } else {
      break;
    }
  }
  return streak;
}

// ── Session-type breakdown & muscle balance ─────────────────────────────────
export function sessionTypeCounts(days = 30, userId: number = PRIMARY_USER_ID): Record<string, number> {
  const since = daysAgoISO(days);
  const rows = db.select().from(sessions).where(eq(sessions.userId, userId)).all();
  const counts: Record<string, number> = {};
  for (const s of rows) {
    if (toISODate(new Date(s.startTime)) >= since) {
      counts[s.sessionType] = (counts[s.sessionType] ?? 0) + 1;
    }
  }
  return counts;
}

export function muscleGroupBalance(days = 30, userId: number = PRIMARY_USER_ID): Record<string, number> {
  const since = new Date(daysAgoISO(days)).getTime();
  const rows = db
    .select({
      muscleGroups: exercises.muscleGroups,
      reps: setEntries.reps,
      weightKg: setEntries.weightKg,
      startTime: sessions.startTime,
    })
    .from(setEntries)
    .innerJoin(exerciseLogs, eq(setEntries.exerciseLogId, exerciseLogs.id))
    .innerJoin(exercises, eq(exerciseLogs.exerciseId, exercises.id))
    .innerJoin(sessions, eq(exerciseLogs.sessionId, sessions.id))
    .where(and(eq(sessions.userId, userId), eq(setEntries.completed, true)))
    .all();

  const balance: Record<string, number> = {};
  for (const r of rows) {
    if (r.startTime < since) continue;
    const vol = (r.weightKg ?? 0) * (r.reps ?? 0) || (r.reps ?? 0);
    let groups: string[] = [];
    try {
      groups = r.muscleGroups ? (JSON.parse(r.muscleGroups) as string[]) : [];
    } catch {
      groups = [];
    }
    for (const g of groups) balance[g] = (balance[g] ?? 0) + vol;
  }
  return balance;
}

// ── Days-since-type map (for coach tips) ─────────────────────────────────────
export function daysSinceType(userId: number = PRIMARY_USER_ID): Partial<Record<SessionType, number>> {
  const rows = db
    .select({ sessionType: sessions.sessionType, startTime: sessions.startTime })
    .from(sessions)
    .where(eq(sessions.userId, userId))
    .orderBy(desc(sessions.startTime))
    .all();
  const out: Partial<Record<SessionType, number>> = {};
  const now = Date.now();
  for (const r of rows) {
    if (out[r.sessionType] === undefined) {
      out[r.sessionType] = Math.floor((now - r.startTime) / 86_400_000);
    }
  }
  return out;
}

/** Consecutive training days ending most recently (no rest gap). */
export function consecutiveTrainingDays(userId: number = PRIMARY_USER_ID): number {
  return currentStreak(userId);
}

/** Days since the user's most recent session (any type), or null if none. */
export function daysSinceLastSession(userId: number = PRIMARY_USER_ID): number | null {
  const last = db
    .select({ startTime: sessions.startTime })
    .from(sessions)
    .where(eq(sessions.userId, userId))
    .orderBy(desc(sessions.startTime))
    .limit(1)
    .get();
  if (!last) return null;
  return Math.floor((Date.now() - last.startTime) / 86_400_000);
}

/**
 * Recent volume drops per exercise: compares total volume in the last 7 days
 * vs the prior 7 days. Returns exercises whose volume fell, for coach tips.
 */
export function recentVolumeDrops(userId: number = PRIMARY_USER_ID): Array<{ exercise: string; dropPct: number }> {
  const now = Date.now();
  const wk = 7 * 86_400_000;
  const rows = db
    .select({
      name: exercises.name,
      reps: setEntries.reps,
      weightKg: setEntries.weightKg,
      startTime: sessions.startTime,
    })
    .from(setEntries)
    .innerJoin(exerciseLogs, eq(setEntries.exerciseLogId, exerciseLogs.id))
    .innerJoin(exercises, eq(exerciseLogs.exerciseId, exercises.id))
    .innerJoin(sessions, eq(exerciseLogs.sessionId, sessions.id))
    .where(and(eq(sessions.userId, userId), eq(setEntries.completed, true)))
    .all();

  const recent = new Map<string, number>();
  const prior = new Map<string, number>();
  for (const r of rows) {
    if (!r.weightKg || !r.reps) continue;
    const age = now - r.startTime;
    const vol = r.weightKg * r.reps;
    if (age <= wk) recent.set(r.name, (recent.get(r.name) ?? 0) + vol);
    else if (age <= 2 * wk) prior.set(r.name, (prior.get(r.name) ?? 0) + vol);
  }
  const out: Array<{ exercise: string; dropPct: number }> = [];
  for (const [name, priorVol] of prior) {
    const recentVol = recent.get(name) ?? 0;
    if (priorVol > 0 && recentVol < priorVol) {
      out.push({ exercise: name, dropPct: ((priorVol - recentVol) / priorVol) * 100 });
    }
  }
  return out;
}
