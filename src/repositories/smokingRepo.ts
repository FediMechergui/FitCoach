import { and, desc, eq, gte } from 'drizzle-orm';
import { db } from '@/db/client';
import {
  sessions,
  smokingEntries,
  smokingProfiles,
  type SmokingEntry,
  type SmokingProfile,
} from '@/db/schema';
import { dailyStepLogs } from '@/db/schema';
import { daysAgoISO, todayISO, toISODate, lastNDates } from '@/lib/date';
import {
  aerobicPenaltyPct,
  lifeMinutesLost,
  lostSessionEquivalent,
  moneyCost,
  nicotineMg,
  restingHrElevation,
  type SmokingSettings,
} from '@/lib/smoking';
import { PRIMARY_USER_ID } from './userRepo';

// ── Profile ──────────────────────────────────────────────────────────────────
export function getSmokingProfile(userId: number = PRIMARY_USER_ID): SmokingProfile | undefined {
  return db
    .select()
    .from(smokingProfiles)
    .where(eq(smokingProfiles.userId, userId))
    .orderBy(desc(smokingProfiles.id))
    .limit(1)
    .get();
}

export function isSmokingEnabled(userId: number = PRIMARY_USER_ID): boolean {
  return !!getSmokingProfile(userId)?.enabled;
}

export function upsertSmokingProfile(
  patch: Partial<Omit<SmokingProfile, 'id' | 'userId' | 'createdAt'>>,
  userId: number = PRIMARY_USER_ID
): SmokingProfile {
  const existing = getSmokingProfile(userId);
  if (existing) {
    db.update(smokingProfiles).set(patch).where(eq(smokingProfiles.id, existing.id)).run();
  } else {
    db.insert(smokingProfiles).values({ userId, ...patch }).run();
  }
  return getSmokingProfile(userId)!;
}

export function settingsFromProfile(p: SmokingProfile): SmokingSettings {
  return {
    cigarettesPerPack: p.cigarettesPerPack,
    pricePerPack: p.pricePerPack,
    currency: p.currency,
    nicotineMgPerCig: p.nicotineMgPerCig,
    baselinePerDay: p.baselinePerDay,
    mode: p.mode,
  };
}

// ── Entries ──────────────────────────────────────────────────────────────────
export function logCigarettes(
  quantity: number,
  opts: { date?: string; trigger?: string } = {},
  userId: number = PRIMARY_USER_ID
): void {
  db.insert(smokingEntries)
    .values({ userId, date: opts.date ?? todayISO(), quantity, trigger: opts.trigger ?? null })
    .run();
}

export function deleteSmokingEntry(id: number): void {
  db.delete(smokingEntries).where(eq(smokingEntries.id, id)).run();
}

export function dayCigarettes(date: string = todayISO(), userId: number = PRIMARY_USER_ID): number {
  const rows = db
    .select()
    .from(smokingEntries)
    .where(and(eq(smokingEntries.userId, userId), eq(smokingEntries.date, date)))
    .all();
  return rows.reduce((s, r) => s + r.quantity, 0);
}

export function dayEntries(date: string = todayISO(), userId: number = PRIMARY_USER_ID): SmokingEntry[] {
  return db
    .select()
    .from(smokingEntries)
    .where(and(eq(smokingEntries.userId, userId), eq(smokingEntries.date, date)))
    .orderBy(desc(smokingEntries.createdAt))
    .all();
}

/** Undo the most recent cigarette entry for a day (for the "−" quick button). */
export function undoLastCigarette(date: string = todayISO(), userId: number = PRIMARY_USER_ID): void {
  const last = db
    .select()
    .from(smokingEntries)
    .where(and(eq(smokingEntries.userId, userId), eq(smokingEntries.date, date)))
    .orderBy(desc(smokingEntries.createdAt))
    .limit(1)
    .get();
  if (last) {
    if (last.quantity > 1) {
      db.update(smokingEntries).set({ quantity: last.quantity - 1 }).where(eq(smokingEntries.id, last.id)).run();
    } else {
      db.delete(smokingEntries).where(eq(smokingEntries.id, last.id)).run();
    }
  }
}

function dailyCountMap(sinceISO: string, userId: number): Map<string, number> {
  const rows = db
    .select()
    .from(smokingEntries)
    .where(and(eq(smokingEntries.userId, userId), gte(smokingEntries.date, sinceISO)))
    .all();
  const map = new Map<string, number>();
  for (const r of rows) map.set(r.date, (map.get(r.date) ?? 0) + r.quantity);
  return map;
}

export function cigarettesSince(sinceISO: string, userId: number = PRIMARY_USER_ID): number {
  let total = 0;
  for (const v of dailyCountMap(sinceISO, userId).values()) total += v;
  return total;
}

/** Average cigarettes/day over the last N days (counts all days in window). */
export function avgCigarettesPerDay(days = 7, userId: number = PRIMARY_USER_ID): number {
  const since = daysAgoISO(days - 1);
  const total = cigarettesSince(since, userId);
  return Math.round((total / days) * 10) / 10;
}

/** Daily series (oldest first) for charts. */
export function dailySeries(days = 30, userId: number = PRIMARY_USER_ID): Array<{ date: string; count: number }> {
  const map = dailyCountMap(daysAgoISO(days - 1), userId);
  return lastNDates(days).map((d) => ({ date: d, count: map.get(d) ?? 0 }));
}

/** Hours since the most recent cigarette (Infinity if none ever logged). */
export function smokeFreeHours(userId: number = PRIMARY_USER_ID): number {
  const last = db
    .select()
    .from(smokingEntries)
    .where(eq(smokingEntries.userId, userId))
    .orderBy(desc(smokingEntries.createdAt))
    .limit(1)
    .get();
  if (!last) return Infinity;
  return (Date.now() - last.createdAt) / 3_600_000;
}

/**
 * Consecutive smoke-free days ending today. Returns 0 for a brand-new profile
 * with no history (a streak needs a baseline of prior logging to be meaningful).
 */
export function smokeFreeStreak(userId: number = PRIMARY_USER_ID): number {
  const hasHistory = db
    .select()
    .from(smokingEntries)
    .where(eq(smokingEntries.userId, userId))
    .limit(1)
    .get();
  if (!hasHistory) return 0;

  let streak = 0;
  for (let i = 0; i < 400; i++) {
    if (dayCigarettes(daysAgoISO(i), userId) > 0) break;
    streak++;
  }
  return streak;
}

// ── Impact summary ───────────────────────────────────────────────────────────
export interface SmokingImpact {
  today: number;
  week: number;
  avgPerDay: number;
  dailyTarget: number | null;
  nicotineWeekMg: number;
  moneyWeek: number;
  moneyYearProjected: number;
  currency: string;
  lifeMinutesWeek: number;
  lifeHoursYearProjected: number;
  aerobicPenaltyPct: number;
  restingHrElevationBpm: number;
  smokeFreeHours: number;
  smokeFreeStreak: number;
}

export function smokingImpact(userId: number = PRIMARY_USER_ID): SmokingImpact | null {
  const profile = getSmokingProfile(userId);
  if (!profile?.enabled) return null;
  const settings = settingsFromProfile(profile);

  const today = dayCigarettes(todayISO(), userId);
  const week = cigarettesSince(daysAgoISO(6), userId);
  const avg = avgCigarettesPerDay(7, userId);
  const yearProjectedCigs = avg * 365;

  return {
    today,
    week,
    avgPerDay: avg,
    dailyTarget: profile.dailyTarget ?? null,
    nicotineWeekMg: Math.round(nicotineMg(week, settings)),
    moneyWeek: Math.round(moneyCost(week, settings) * 100) / 100,
    moneyYearProjected: Math.round(moneyCost(yearProjectedCigs, settings)),
    currency: settings.currency,
    lifeMinutesWeek: lifeMinutesLost(week),
    lifeHoursYearProjected: Math.round(lifeMinutesLost(yearProjectedCigs) / 60),
    aerobicPenaltyPct: aerobicPenaltyPct(avg),
    restingHrElevationBpm: restingHrElevation(avg),
    smokeFreeHours: smokeFreeHours(userId),
    smokeFreeStreak: smokeFreeStreak(userId),
  };
}

// ── Correlation with the user's own fitness data ─────────────────────────────
export interface SmokingCorrelation {
  windowDays: number;
  smokeDays: number;
  cleanDays: number;
  avgStepsSmokeDays: number | null;
  avgStepsCleanDays: number | null;
  avgSessionCalSmokeDays: number | null;
  avgSessionCalCleanDays: number | null;
  lostSessionEquivalent: number;
  sessionsInWindow: number;
}

/**
 * Compares the user's real activity on days they smoked vs smoke-free days over
 * a window. This is observational correlation from their own logs — the honest
 * signal for "how exactly is it affecting me". Returns nulls where a bucket has
 * no data so the UI can present it responsibly.
 */
export function smokingCorrelation(windowDays = 30, userId: number = PRIMARY_USER_ID): SmokingCorrelation | null {
  const profile = getSmokingProfile(userId);
  if (!profile?.enabled) return null;

  const since = daysAgoISO(windowDays - 1);
  const cigByDay = dailyCountMap(since, userId);

  // Steps per day.
  const stepRows = db
    .select()
    .from(dailyStepLogs)
    .where(and(eq(dailyStepLogs.userId, userId), gte(dailyStepLogs.date, since)))
    .all();
  const stepsByDay = new Map<string, number>();
  for (const r of stepRows) stepsByDay.set(r.date, r.stepCount);

  // Session calories per day.
  const sessRows = db
    .select({ startTime: sessions.startTime, cal: sessions.caloriesBurned })
    .from(sessions)
    .where(eq(sessions.userId, userId))
    .all();
  const sessCalByDay = new Map<string, number>();
  let sessionsInWindow = 0;
  for (const s of sessRows) {
    const d = toISODate(new Date(s.startTime));
    if (d >= since) {
      sessCalByDay.set(d, (sessCalByDay.get(d) ?? 0) + (s.cal ?? 0));
      sessionsInWindow++;
    }
  }

  const dates = lastNDates(windowDays);
  const smokeStepVals: number[] = [];
  const cleanStepVals: number[] = [];
  const smokeCalVals: number[] = [];
  const cleanCalVals: number[] = [];
  let smokeDays = 0;
  let cleanDays = 0;

  for (const d of dates) {
    const smoked = (cigByDay.get(d) ?? 0) > 0;
    if (smoked) smokeDays++;
    else cleanDays++;
    const steps = stepsByDay.get(d);
    if (steps !== undefined) (smoked ? smokeStepVals : cleanStepVals).push(steps);
    if (sessCalByDay.has(d)) (smoked ? smokeCalVals : cleanCalVals).push(sessCalByDay.get(d)!);
  }

  const avg = (arr: number[]) => (arr.length ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : null);

  return {
    windowDays,
    smokeDays,
    cleanDays,
    avgStepsSmokeDays: avg(smokeStepVals),
    avgStepsCleanDays: avg(cleanStepVals),
    avgSessionCalSmokeDays: avg(smokeCalVals),
    avgSessionCalCleanDays: avg(cleanCalVals),
    lostSessionEquivalent: lostSessionEquivalent(avgCigarettesPerDay(windowDays, userId), sessionsInWindow),
    sessionsInWindow,
  };
}
