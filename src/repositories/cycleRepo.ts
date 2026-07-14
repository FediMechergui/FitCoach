import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { cycleProfiles, periodLogs, type CycleProfile, type PeriodLog } from '@/db/schema';
import { computeCycle, type CycleState } from '@/lib/cycle';
import { todayISO } from '@/lib/date';
import { PRIMARY_USER_ID } from './userRepo';

export function getCycleProfile(userId: number = PRIMARY_USER_ID): CycleProfile | undefined {
  return db
    .select()
    .from(cycleProfiles)
    .where(eq(cycleProfiles.userId, userId))
    .orderBy(desc(cycleProfiles.id))
    .limit(1)
    .get();
}

export function isCycleEnabled(userId: number = PRIMARY_USER_ID): boolean {
  return !!getCycleProfile(userId)?.enabled;
}

export function upsertCycleProfile(
  patch: Partial<Omit<CycleProfile, 'id' | 'userId' | 'createdAt'>>,
  userId: number = PRIMARY_USER_ID
): CycleProfile {
  const existing = getCycleProfile(userId);
  if (existing) {
    db.update(cycleProfiles).set(patch).where(eq(cycleProfiles.id, existing.id)).run();
  } else {
    db.insert(cycleProfiles).values({ userId, ...patch }).run();
  }
  return getCycleProfile(userId)!;
}

// ── Period logs ──────────────────────────────────────────────────────────────
export function logPeriodStart(
  startDate: string,
  opts: { flow?: 'light' | 'medium' | 'heavy'; symptoms?: string[]; notes?: string } = {},
  userId: number = PRIMARY_USER_ID
): void {
  db.insert(periodLogs)
    .values({
      userId,
      startDate,
      flow: opts.flow ?? null,
      symptoms: opts.symptoms ? JSON.stringify(opts.symptoms) : null,
      notes: opts.notes ?? null,
    })
    .run();
  // Keep the profile's lastPeriodStart current for predictions.
  upsertCycleProfile({ lastPeriodStart: startDate }, userId);
}

export function setPeriodEnd(id: number, endDate: string): void {
  db.update(periodLogs).set({ endDate }).where(eq(periodLogs.id, id)).run();
}

export function deletePeriodLog(id: number): void {
  db.delete(periodLogs).where(eq(periodLogs.id, id)).run();
}

export function listPeriods(limit = 24, userId: number = PRIMARY_USER_ID): PeriodLog[] {
  return db
    .select()
    .from(periodLogs)
    .where(eq(periodLogs.userId, userId))
    .orderBy(desc(periodLogs.startDate))
    .limit(limit)
    .all();
}

/** Current cycle state from the profile, or null if not set up / no last period. */
export function currentCycle(userId: number = PRIMARY_USER_ID): CycleState | null {
  const p = getCycleProfile(userId);
  if (!p?.enabled || !p.lastPeriodStart) return null;
  return computeCycle({
    lastPeriodStart: p.lastPeriodStart,
    cycleLength: p.avgCycleLength,
    periodLength: p.avgPeriodLength,
    today: todayISO(),
  });
}

/** Recompute avg cycle length from the last few recorded period starts. */
export function refineCycleAverages(userId: number = PRIMARY_USER_ID): void {
  const periods = listPeriods(6, userId);
  if (periods.length < 2) return;
  const starts = periods.map((p) => new Date(p.startDate).getTime()).sort((a, b) => a - b);
  const gaps: number[] = [];
  for (let i = 1; i < starts.length; i++) {
    gaps.push(Math.round((starts[i] - starts[i - 1]) / 86_400_000));
  }
  const valid = gaps.filter((g) => g >= 21 && g <= 40);
  if (valid.length) {
    const avg = Math.round(valid.reduce((s, g) => s + g, 0) / valid.length);
    upsertCycleProfile({ avgCycleLength: avg }, userId);
  }
}
