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
  combustedEquivalents,
  combustedShare,
  lifeMinutesLost,
  lostSessionEquivalent,
  moneyCost,
  nicotineMg,
  restingHrElevation,
  totalNicotineMg,
  type SmokingSettings,
} from '@/lib/smoking';
import { productOrDefault } from '@/data/nicotineProducts';
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
  opts: { date?: string; trigger?: string; productKey?: string | null } = {},
  userId: number = PRIMARY_USER_ID
): void {
  db.insert(smokingEntries)
    .values({
      userId,
      date: opts.date ?? todayISO(),
      quantity,
      // null means cigarettes, which is what every pre-v2.28 entry was.
      productKey: opts.productKey ?? null,
      trigger: opts.trigger ?? null,
    })
    .run();
}

export function deleteSmokingEntry(id: number): void {
  db.delete(smokingEntries).where(eq(smokingEntries.id, id)).run();
}

/**
 * Cigarette-equivalents of COMBUSTION for a day — what the health model runs on.
 *
 * Counting a nicotine pouch as a cigarette here would tell someone who had
 * successfully switched that they had done themselves the same damage as
 * smoking, which is both false and the surest way to make them stop bothering.
 * A pouch, patch or vape contributes zero; shisha contributes far MORE than one
 * per session, which is the other half of being honest about it.
 */
export function dayCigarettes(date: string = todayISO(), userId: number = PRIMARY_USER_ID): number {
  const total = combustedEquivalents(
    dayEntries(date, userId).map((r) => ({ productKey: r.productKey, quantity: r.quantity }))
  );
  return Math.round(total * 10) / 10;
}

/** Every unit logged today regardless of product — for nicotine totals. */
export function dayUnits(date: string = todayISO(), userId: number = PRIMARY_USER_ID): number {
  return dayEntries(date, userId).reduce((s, r) => s + r.quantity, 0);
}

/** Nicotine absorbed today across every product, mg. */
export function dayNicotineMg(
  settings: SmokingSettings,
  date: string = todayISO(),
  userId: number = PRIMARY_USER_ID
): number {
  return totalNicotineMg(
    dayEntries(date, userId).map((r) => ({ productKey: r.productKey, quantity: r.quantity })),
    settings
  );
}

/** Share of today's nicotine that came from something burned, 0..1. */
export function daySmokedShare(
  settings: SmokingSettings,
  date: string = todayISO(),
  userId: number = PRIMARY_USER_ID
): number {
  return combustedShare(
    dayEntries(date, userId).map((r) => ({ productKey: r.productKey, quantity: r.quantity })),
    settings
  );
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
  // Weighted by combustion, so trends and averages mean the same thing as the
  // daily figure rather than quietly counting pouches as cigarettes.
  for (const r of rows) {
    map.set(r.date, (map.get(r.date) ?? 0) + r.quantity * productOrDefault(r.productKey).cigaretteEquivalent);
  }
  return map;
}

export function cigarettesSince(sinceISO: string, userId: number = PRIMARY_USER_ID): number {
  let total = 0;
  for (const v of dailyCountMap(sinceISO, userId).values()) total += v;
  return total;
}

/** Raw entries in a window, for the figures that must NOT be combustion-weighted. */
function entriesSince(sinceISO: string, userId: number) {
  return db
    .select()
    .from(smokingEntries)
    .where(and(eq(smokingEntries.userId, userId), gte(smokingEntries.date, sinceISO)))
    .all();
}

/**
 * Nicotine absorbed in a window, from the actual products used.
 *
 * This must not run through the combustion-weighted count: weighting is right
 * for the health figures (smoke is what harms) and wrong for nicotine — a week
 * of pouches would read zero nicotine while a single shisha session would read
 * ten cigarettes' worth, both false.
 */
export function nicotineMgSince(sinceISO: string, settings: SmokingSettings, userId: number = PRIMARY_USER_ID): number {
  return totalNicotineMg(
    entriesSince(sinceISO, userId).map((r) => ({ productKey: r.productKey, quantity: r.quantity })),
    settings
  );
}

/**
 * Money spent on actual cigarettes in a window. Only cigarettes: the pack
 * price is the one price the profile knows, and pricing a pouch or a shisha
 * session off it would be an invented number. Alternatives therefore show no
 * cost rather than a wrong one.
 */
export function cigaretteMoneySince(sinceISO: string, settings: SmokingSettings, userId: number = PRIMARY_USER_ID): number {
  const cigUnits = entriesSince(sinceISO, userId)
    .filter((r) => productOrDefault(r.productKey).key === 'cigarette')
    .reduce((sum, r) => sum + r.quantity, 0);
  return moneyCost(cigUnits, settings);
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
  /*
   * Hours since the last thing that was BURNED — not the last entry. The
   * recovery timeline this feeds (CO normalising at 12 h, circulation at two
   * weeks…) describes what happens when smoke stops, and those benefits arrive
   * for a switcher regardless of the pouches or gum they switched to. Counting
   * a pouch as a reset would pin them at "20 minutes" forever and hide exactly
   * the progress the switch was for.
   */
  const rows = db
    .select()
    .from(smokingEntries)
    .where(eq(smokingEntries.userId, userId))
    .orderBy(desc(smokingEntries.createdAt))
    .limit(50)
    .all();
  const lastSmoked = rows.find((r) => productOrDefault(r.productKey).combusted);
  if (!lastSmoked) {
    // Nothing combusted in the recent window; look once more across everything.
    const any = rows.length
      ? db
          .select()
          .from(smokingEntries)
          .where(eq(smokingEntries.userId, userId))
          .all()
          .filter((r) => productOrDefault(r.productKey).combusted)
          .sort((a, b) => b.createdAt - a.createdAt)[0]
      : undefined;
    if (!any) return Infinity;
    return (Date.now() - any.createdAt) / 3_600_000;
  }
  return (Date.now() - lastSmoked.createdAt) / 3_600_000;
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

  /*
   * Two different counts on purpose. `week` is combustion-weighted (a shisha
   * session counts ~10, a pouch 0) and drives the HEALTH figures — life cost
   * and the CO-driven aerobic penalty are consequences of smoke. Nicotine and
   * money read the actual products instead: weighting them would report zero
   * nicotine for a pouch-only week and price a shisha session as ten
   * cigarettes, both fabrications.
   */
  const today = dayCigarettes(todayISO(), userId);
  const week = cigarettesSince(daysAgoISO(6), userId);
  const avg = avgCigarettesPerDay(7, userId);
  const yearProjectedCigs = avg * 365;
  const weekAgo = daysAgoISO(6);
  const weekMoney = cigaretteMoneySince(weekAgo, settings, userId);

  return {
    today,
    week,
    avgPerDay: avg,
    dailyTarget: profile.dailyTarget ?? null,
    nicotineWeekMg: Math.round(nicotineMgSince(weekAgo, settings, userId)),
    moneyWeek: Math.round(weekMoney * 100) / 100,
    // Projected from the measured cigarette spend, not the weighted count.
    moneyYearProjected: Math.round((weekMoney / 7) * 365),
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
