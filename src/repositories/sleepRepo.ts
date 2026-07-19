import { and, desc, eq, gte } from 'drizzle-orm';
import { db } from '@/db/client';
import { napLogs, sessions, sleepLogs, type NapLog, type SleepLog } from '@/db/schema';
import { averageSleep, sleepDebt, sleepPerformanceFactor } from '@/lib/sleep';
import { daysAgoISO, lastNDates, toISODate, todayISO } from '@/lib/date';
import { PRIMARY_USER_ID } from './userRepo';

export function logSleep(
  data: { date?: string; hours: number; quality?: number | null; bedtime?: string | null; wakeTime?: string | null; notes?: string | null },
  userId: number = PRIMARY_USER_ID
): void {
  const date = data.date ?? todayISO();
  // One record per night: replace an existing same-date entry.
  db.delete(sleepLogs).where(and(eq(sleepLogs.userId, userId), eq(sleepLogs.date, date))).run();
  db.insert(sleepLogs)
    .values({
      userId,
      date,
      hours: data.hours,
      quality: data.quality ?? null,
      bedtime: data.bedtime ?? null,
      wakeTime: data.wakeTime ?? null,
      notes: data.notes ?? null,
    })
    .run();
}

export function deleteSleep(id: number): void {
  db.delete(sleepLogs).where(eq(sleepLogs.id, id)).run();
}

export function sleepForDate(date: string = todayISO(), userId: number = PRIMARY_USER_ID): SleepLog | undefined {
  return db.select().from(sleepLogs).where(and(eq(sleepLogs.userId, userId), eq(sleepLogs.date, date))).get();
}

export function sleepSince(sinceISO: string, userId: number = PRIMARY_USER_ID): SleepLog[] {
  return db
    .select()
    .from(sleepLogs)
    .where(and(eq(sleepLogs.userId, userId), gte(sleepLogs.date, sinceISO)))
    .orderBy(sleepLogs.date)
    .all();
}

export interface SleepSummary {
  lastNight: number | null;
  avg7d: number | null;
  debt7d: number;
  performanceFactor: number;
  series: Array<{ date: string; hours: number }>;
}

export function sleepSummary(userId: number = PRIMARY_USER_ID): SleepSummary {
  const rows = sleepSince(daysAgoISO(6), userId);
  const byDate = new Map(rows.map((r) => [r.date, r.hours]));
  const series = lastNDates(7).map((d) => ({ date: d, hours: byDate.get(d) ?? 0 }));
  const logged = rows.map((r) => r.hours);
  const avg = averageSleep(logged);
  return {
    lastNight: sleepForDate(todayISO(), userId)?.hours ?? rows[rows.length - 1]?.hours ?? null,
    avg7d: avg,
    debt7d: sleepDebt(logged.length ? logged : []),
    performanceFactor: sleepPerformanceFactor(avg),
    series,
  };
}

// ── Naps (daytime, many per day, separate from night sleep) ──────────────────
export function logNap(
  data: { date?: string; minutes: number; startTime?: string | null; quality?: number | null },
  userId: number = PRIMARY_USER_ID
): void {
  db.insert(napLogs)
    .values({
      userId,
      date: data.date ?? todayISO(),
      minutes: data.minutes,
      startTime: data.startTime ?? null,
      quality: data.quality ?? null,
    })
    .run();
}

export function deleteNap(id: number): void {
  db.delete(napLogs).where(eq(napLogs.id, id)).run();
}

export function napsForDate(date: string = todayISO(), userId: number = PRIMARY_USER_ID): NapLog[] {
  return db
    .select()
    .from(napLogs)
    .where(and(eq(napLogs.userId, userId), eq(napLogs.date, date)))
    .orderBy(desc(napLogs.id))
    .all();
}

/** Total nap minutes for a day — folded into "total rest" alongside night sleep. */
export function napMinutesForDate(date: string = todayISO(), userId: number = PRIMARY_USER_ID): number {
  return napsForDate(date, userId).reduce((sum, n) => sum + n.minutes, 0);
}

export function avgSleepHours(days = 7, userId: number = PRIMARY_USER_ID): number | null {
  const rows = sleepSince(daysAgoISO(days - 1), userId);
  return averageSleep(rows.map((r) => r.hours));
}

/**
 * Correlation: average training session calories on days following a good
 * night's sleep (≥7h) vs. a short night (<6h). Shows the real training payoff
 * of sleep from the user's own logs.
 */
export interface SleepCorrelation {
  goodSleepAvgSessionCal: number | null;
  poorSleepAvgSessionCal: number | null;
  goodNights: number;
  poorNights: number;
}

export function sleepTrainingCorrelation(windowDays = 30, userId: number = PRIMARY_USER_ID): SleepCorrelation {
  const since = daysAgoISO(windowDays - 1);
  const sleeps = sleepSince(since, userId);
  const sleepByDate = new Map(sleeps.map((r) => [r.date, r.hours]));

  const sessRows = db.select().from(sessions).where(eq(sessions.userId, userId)).all();
  const calByDate = new Map<string, number>();
  for (const s of sessRows) {
    const d = toISODate(new Date(s.startTime));
    if (d >= since) calByDate.set(d, (calByDate.get(d) ?? 0) + (s.caloriesBurned ?? 0));
  }

  const good: number[] = [];
  const poor: number[] = [];
  for (const [date, cal] of calByDate) {
    const h = sleepByDate.get(date);
    if (h == null) continue;
    if (h >= 7) good.push(cal);
    else if (h < 6) poor.push(cal);
  }
  const avg = (a: number[]) => (a.length ? Math.round(a.reduce((s, v) => s + v, 0) / a.length) : null);
  return {
    goodSleepAvgSessionCal: avg(good),
    poorSleepAvgSessionCal: avg(poor),
    goodNights: sleeps.filter((s) => s.hours >= 7).length,
    poorNights: sleeps.filter((s) => s.hours < 6).length,
  };
}
