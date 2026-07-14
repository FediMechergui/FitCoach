import { and, desc, eq, gte } from 'drizzle-orm';
import { db } from '@/db/client';
import {
  habitEntries,
  habitProfiles,
  sessions,
  sleepLogs,
  type HabitProfile,
} from '@/db/schema';
import { findHabit, projectedYearHours, type HabitImpact } from '@/lib/habits';
import { daysAgoISO, lastNDates, toISODate, todayISO } from '@/lib/date';
import { PRIMARY_USER_ID } from './userRepo';

// ── Profiles ─────────────────────────────────────────────────────────────────
export function listHabitProfiles(userId: number = PRIMARY_USER_ID): HabitProfile[] {
  return db
    .select()
    .from(habitProfiles)
    .where(and(eq(habitProfiles.userId, userId), eq(habitProfiles.enabled, true)))
    .all();
}

export function getHabitProfile(habitKey: string, userId: number = PRIMARY_USER_ID): HabitProfile | undefined {
  return db
    .select()
    .from(habitProfiles)
    .where(and(eq(habitProfiles.userId, userId), eq(habitProfiles.habitKey, habitKey)))
    .get();
}

export function enableHabit(
  habitKey: string,
  patch: Partial<Omit<HabitProfile, 'id' | 'userId' | 'habitKey' | 'createdAt'>> = {},
  userId: number = PRIMARY_USER_ID
): HabitProfile {
  const def = findHabit(habitKey);
  const existing = getHabitProfile(habitKey, userId);
  const payload = {
    label: patch.label ?? def?.label ?? habitKey,
    kind: patch.kind ?? def?.kind ?? 'count',
    enabled: true,
    dailyTarget: patch.dailyTarget ?? def?.defaultDailyTarget ?? null,
    baselinePerDay: patch.baselinePerDay ?? null,
    minutesPerOccurrence: patch.minutesPerOccurrence ?? def?.defaultMinutesPerOccurrence ?? null,
  };
  if (existing) {
    db.update(habitProfiles).set(payload).where(eq(habitProfiles.id, existing.id)).run();
  } else {
    db.insert(habitProfiles).values({ userId, habitKey, ...payload }).run();
  }
  return getHabitProfile(habitKey, userId)!;
}

export function disableHabit(habitKey: string, userId: number = PRIMARY_USER_ID): void {
  const existing = getHabitProfile(habitKey, userId);
  if (existing) db.update(habitProfiles).set({ enabled: false }).where(eq(habitProfiles.id, existing.id)).run();
}

// ── Entries ──────────────────────────────────────────────────────────────────
export function logHabit(
  habitKey: string,
  input: { quantity?: number; minutes?: number; trigger?: string; date?: string } = {},
  userId: number = PRIMARY_USER_ID
): void {
  const hour = new Date().getHours();
  db.insert(habitEntries)
    .values({
      userId,
      habitKey,
      date: input.date ?? todayISO(),
      quantity: input.quantity ?? 1,
      minutes: input.minutes ?? 0,
      trigger: input.trigger ?? null,
      lateNight: hour >= 23 || hour < 5,
    })
    .run();
}

export function undoLastHabit(habitKey: string, userId: number = PRIMARY_USER_ID): void {
  const last = db
    .select()
    .from(habitEntries)
    .where(and(eq(habitEntries.userId, userId), eq(habitEntries.habitKey, habitKey), eq(habitEntries.date, todayISO())))
    .orderBy(desc(habitEntries.createdAt))
    .limit(1)
    .get();
  if (last) db.delete(habitEntries).where(eq(habitEntries.id, last.id)).run();
}

function entriesSince(habitKey: string, sinceISO: string, userId: number) {
  return db
    .select()
    .from(habitEntries)
    .where(
      and(
        eq(habitEntries.userId, userId),
        eq(habitEntries.habitKey, habitKey),
        gte(habitEntries.date, sinceISO)
      )
    )
    .all();
}

export function habitImpact(habitKey: string, userId: number = PRIMARY_USER_ID): HabitImpact | null {
  const profile = getHabitProfile(habitKey, userId);
  if (!profile?.enabled) return null;
  const mpo = profile.minutesPerOccurrence ?? 0;

  const today = todayISO();
  const week = daysAgoISO(6);
  const allTime = '0000-00-00';

  const rowsToday = entriesSince(habitKey, today, userId);
  const todayCount = rowsToday.reduce((s, r) => s + r.quantity, 0);
  const todayMinutes = rowsToday.reduce(
    (s, r) => s + (profile.kind === 'duration' ? r.minutes : r.quantity * mpo),
    0
  );

  const wk = entriesSince(habitKey, week, userId);
  const weekCount = wk.reduce((s, r) => s + r.quantity, 0);
  const weekMinutes = wk.reduce((s, r) => s + (profile.kind === 'duration' ? r.minutes : r.quantity * mpo), 0);
  const lateNightCount = wk.filter((r) => r.lateNight).length;

  // Free days in the last 7.
  const byDay = new Set(entriesSince(habitKey, week, userId).map((r) => r.date));
  const freeDays7d = lastNDates(7).filter((d) => !byDay.has(d)).length;

  // Free streak (consecutive days with no entry, ending today).
  const anyHistory = entriesSince(habitKey, allTime, userId);
  const everSet = new Set(anyHistory.map((r) => r.date));
  let freeStreak = 0;
  if (anyHistory.length > 0) {
    for (let i = 0; i < 400; i++) {
      if (everSet.has(daysAgoISO(i))) break;
      freeStreak++;
    }
  }
  // Best free streak across history.
  const sortedDays = [...new Set(anyHistory.map((r) => r.date))].sort();
  let bestFreeStreak = 0;
  if (sortedDays.length >= 2) {
    for (let i = 1; i < sortedDays.length; i++) {
      const gap = Math.round((new Date(sortedDays[i]).getTime() - new Date(sortedDays[i - 1]).getTime()) / 86_400_000) - 1;
      bestFreeStreak = Math.max(bestFreeStreak, gap);
    }
  }
  bestFreeStreak = Math.max(bestFreeStreak, freeStreak);

  const avgPerDay =
    profile.kind === 'duration'
      ? Math.round((weekMinutes / 7) * 10) / 10
      : Math.round((weekCount / 7) * 10) / 10;

  return {
    todayMinutes: Math.round(todayMinutes),
    weekMinutes: Math.round(weekMinutes),
    todayCount,
    weekCount,
    avgPerDay,
    yearHoursProjected: projectedYearHours(weekMinutes),
    freeDays7d,
    freeStreak,
    bestFreeStreak,
    lateNightShare: wk.length ? lateNightCount / wk.length : 0,
    dailyTarget: profile.dailyTarget ?? null,
    overTarget: profile.dailyTarget != null && (profile.kind === 'duration' ? todayMinutes : todayCount) > profile.dailyTarget,
  };
}

export interface HabitCorrelation {
  windowDays: number;
  daysWithHabit: number;
  daysWithout: number;
  avgSleepWithHabit: number | null;
  avgSleepWithout: number | null;
  avgSessionCalWithHabit: number | null;
  avgSessionCalWithout: number | null;
}

/** Compare the user's own sleep and training on days with vs without the habit. */
export function habitCorrelation(
  habitKey: string,
  windowDays = 30,
  userId: number = PRIMARY_USER_ID
): HabitCorrelation | null {
  const profile = getHabitProfile(habitKey, userId);
  if (!profile?.enabled) return null;
  const since = daysAgoISO(windowDays - 1);

  const habitDays = new Set(entriesSince(habitKey, since, userId).map((r) => r.date));

  const sleeps = db
    .select()
    .from(sleepLogs)
    .where(and(eq(sleepLogs.userId, userId), gte(sleepLogs.date, since)))
    .all();
  const sleepByDay = new Map(sleeps.map((s) => [s.date, s.hours]));

  const sessRows = db.select().from(sessions).where(eq(sessions.userId, userId)).all();
  const calByDay = new Map<string, number>();
  for (const s of sessRows) {
    const d = toISODate(new Date(s.startTime));
    if (d >= since) calByDay.set(d, (calByDay.get(d) ?? 0) + (s.caloriesBurned ?? 0));
  }

  const dates = lastNDates(windowDays);
  const sw: number[] = [], swo: number[] = [], cw: number[] = [], cwo: number[] = [];
  let daysWith = 0, daysWithout = 0;
  for (const d of dates) {
    const has = habitDays.has(d);
    if (has) daysWith++; else daysWithout++;
    const sl = sleepByDay.get(d);
    if (sl != null) (has ? sw : swo).push(sl);
    if (calByDay.has(d)) (has ? cw : cwo).push(calByDay.get(d)!);
  }
  const avg = (a: number[]) => (a.length ? Math.round((a.reduce((s, v) => s + v, 0) / a.length) * 10) / 10 : null);

  return {
    windowDays,
    daysWithHabit: daysWith,
    daysWithout,
    avgSleepWithHabit: avg(sw),
    avgSleepWithout: avg(swo),
    avgSessionCalWithHabit: cw.length ? Math.round(cw.reduce((s, v) => s + v, 0) / cw.length) : null,
    avgSessionCalWithout: cwo.length ? Math.round(cwo.reduce((s, v) => s + v, 0) / cwo.length) : null,
  };
}

export function habitDailySeries(habitKey: string, days = 21, userId: number = PRIMARY_USER_ID) {
  const profile = getHabitProfile(habitKey, userId);
  const mpo = profile?.minutesPerOccurrence ?? 0;
  const kind = profile?.kind ?? 'count';
  const rows = entriesSince(habitKey, daysAgoISO(days - 1), userId);
  const byDay = new Map<string, number>();
  for (const r of rows) {
    const val = kind === 'duration' ? r.minutes : r.quantity;
    byDay.set(r.date, (byDay.get(r.date) ?? 0) + val);
  }
  return lastNDates(days).map((d) => ({ date: d, value: Math.round((byDay.get(d) ?? 0) * 10) / 10 }));
}
