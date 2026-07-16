import { and, eq, gte } from 'drizzle-orm';
import { db } from '@/db/client';
import {
  fastingLogs,
  fastingProfiles,
  prayerSettings,
  type FastingProfile,
  type PrayerSettings,
} from '@/db/schema';
import { computePrayerTimes, type PrayerTimes } from '@/lib/prayers';
import { fastingState, resolveWindow, type FastingState } from '@/lib/fasting';
import { daysAgoISO, todayISO } from '@/lib/date';
import { PRIMARY_USER_ID } from './userRepo';

const ROW_ID = 1;

// ── Prayer settings ──────────────────────────────────────────────────────────
export function getPrayerSettings(): PrayerSettings | undefined {
  return db.select().from(prayerSettings).where(eq(prayerSettings.id, ROW_ID)).get();
}

export function upsertPrayerSettings(
  patch: Partial<Omit<PrayerSettings, 'id' | 'userId' | 'createdAt'>>
): PrayerSettings {
  if (getPrayerSettings()) {
    db.update(prayerSettings).set(patch).where(eq(prayerSettings.id, ROW_ID)).run();
  } else {
    db.insert(prayerSettings).values({ id: ROW_ID, userId: PRIMARY_USER_ID, ...patch }).run();
  }
  return getPrayerSettings()!;
}

/** Today's prayer times from stored settings, or null when not configured. */
export function todaysPrayerTimes(date: Date = new Date()): PrayerTimes | null {
  const s = getPrayerSettings();
  if (!s?.enabled || s.latitude == null || s.longitude == null) return null;
  return computePrayerTimes({
    date,
    latitude: s.latitude,
    longitude: s.longitude,
    method: s.method as never,
    asrFactor: (s.asrFactor === 2 ? 2 : 1) as 1 | 2,
  });
}

// ── Fasting ──────────────────────────────────────────────────────────────────
export function getFastingProfile(): FastingProfile | undefined {
  return db.select().from(fastingProfiles).where(eq(fastingProfiles.id, ROW_ID)).get();
}

export function upsertFastingProfile(
  patch: Partial<Omit<FastingProfile, 'id' | 'userId' | 'createdAt'>>
): FastingProfile {
  if (getFastingProfile()) {
    db.update(fastingProfiles).set(patch).where(eq(fastingProfiles.id, ROW_ID)).run();
  } else {
    db.insert(fastingProfiles).values({ id: ROW_ID, userId: PRIMARY_USER_ID, ...patch }).run();
  }
  return getFastingProfile()!;
}

/** Live fasting state (null when the feature is off). Iftar = Maghrib when prayers are set. */
export function currentFastingState(now: Date = new Date()): FastingState | null {
  const p = getFastingProfile();
  if (!p?.enabled) return null;
  const window = resolveWindow(p.mode, {
    prayers: p.mode === 'ramadan' ? todaysPrayerTimes(now) : null,
    manualSuhoor: p.manualSuhoor,
    manualIftar: p.manualIftar,
    eatingStart: p.eatingStart,
    eatingEnd: p.eatingEnd,
  });
  return fastingState(window, now);
}

export function logFastCompleted(date: string = todayISO(), userId: number = PRIMARY_USER_ID): void {
  const existing = db
    .select()
    .from(fastingLogs)
    .where(and(eq(fastingLogs.userId, userId), eq(fastingLogs.date, date)))
    .get();
  if (!existing) {
    db.insert(fastingLogs).values({ userId, date, completed: true }).run();
  }
}

export interface FastingStats {
  streak: number;
  fastedLast30: number;
  loggedToday: boolean;
}

export function fastingStats(userId: number = PRIMARY_USER_ID): FastingStats {
  const rows = db
    .select()
    .from(fastingLogs)
    .where(and(eq(fastingLogs.userId, userId), gte(fastingLogs.date, daysAgoISO(120))))
    .all();
  const dates = new Set(rows.filter((r) => r.completed).map((r) => r.date));
  let streak = 0;
  const start = dates.has(todayISO()) ? 0 : 1; // today may not be finished yet
  for (let i = start; i < 130; i++) {
    if (dates.has(daysAgoISO(i))) streak++;
    else break;
  }
  const last30 = [...dates].filter((d) => d >= daysAgoISO(29)).length;
  return { streak, fastedLast30: last30, loggedToday: dates.has(todayISO()) };
}
