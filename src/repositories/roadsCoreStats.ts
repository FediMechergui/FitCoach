import { and, eq, gte, isNotNull } from 'drizzle-orm';
import { db } from '@/db/client';
import { exerciseLogs, exercises, pointPurchases, sessions, setEntries, walkSessions } from '@/db/schema';
import { outdoorSettings } from './outdoorRepo';
import { getUser, PRIMARY_USER_ID } from './userRepo';

/**
 * What the two 3.8.0 badge categories measure — Roads & Stories, and Phase,
 * Focus & Core — read straight from the record: GPS reps are sets with a
 * slice of route, runs and rides are walk_sessions with their activity, the
 * sit-up family is the logged sets on those exercises. Nothing is counted
 * that the database does not already hold.
 */
export interface RoadsCoreStats {
  gpsLapSets: number;
  gpsLapSessions: number;
  longestRunKm: number;
  /** best average pace (s/km) on a run of 5 km or more; 0 when there is none */
  fastest5kPaceS: number;
  /** walks, runs, hikes and rides started before 7 a.m. */
  earlyStarts: number;
  rideKmTotal: number;
  realMapOn: boolean;
  focusChosen: boolean;
  /** finished lifting sessions in the last 90 days, while a focus is set */
  focusLiftingSessions: number;
  /** finished lifting sessions in the last 28 days while on a cut / a bulk */
  cutLifting28d: number;
  bulkLifting28d: number;
  situpVariations: number;
  declineReps: number;
  twistReps: number;
  bestSitupSession: number;
  storyThemesBought: number;
  soukItems: number;
}

export const ZERO_ROADS_CORE: RoadsCoreStats = {
  gpsLapSets: 0,
  gpsLapSessions: 0,
  longestRunKm: 0,
  fastest5kPaceS: 0,
  earlyStarts: 0,
  rideKmTotal: 0,
  realMapOn: false,
  focusChosen: false,
  focusLiftingSessions: 0,
  cutLifting28d: 0,
  bulkLifting28d: 0,
  situpVariations: 0,
  declineReps: 0,
  twistReps: 0,
  bestSitupSession: 0,
  storyThemesBought: 0,
  soukItems: 0,
};

/** The sit-up family: sit-ups, crunches, jackknives and V-ups. */
export const SITUP_SLUG = /sit-up|crunch|jackknife|v-up/;

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export function roadsCoreStats(userId: number = PRIMARY_USER_ID): RoadsCoreStats {
  const out: RoadsCoreStats = { ...ZERO_ROADS_CORE };

  // ── GPS reps ──
  safe(() => {
    const rows = db
      .select({ sessionId: exerciseLogs.sessionId })
      .from(setEntries)
      .innerJoin(exerciseLogs, eq(setEntries.exerciseLogId, exerciseLogs.id))
      .innerJoin(sessions, eq(exerciseLogs.sessionId, sessions.id))
      .where(and(eq(sessions.userId, userId), isNotNull(setEntries.gpsFrom), eq(setEntries.completed, true)))
      .all();
    out.gpsLapSets = rows.length;
    out.gpsLapSessions = new Set(rows.map((r) => r.sessionId)).size;
  }, undefined);

  // ── Runs, rides, early starts ──
  safe(() => {
    const walks = db.select().from(walkSessions).where(eq(walkSessions.userId, userId)).all();
    for (const w of walks) {
      const activity = w.activity ?? w.mode;
      const km = (w.distanceM ?? 0) / 1000;
      const isRun = activity === 'run' || activity === 'trail-run';
      if (isRun && km > out.longestRunKm) out.longestRunKm = Math.round(km * 100) / 100;
      if (isRun && km >= 5 && w.avgPace && w.avgPace > 0 && (out.fastest5kPaceS === 0 || w.avgPace < out.fastest5kPaceS)) {
        out.fastest5kPaceS = Math.round(w.avgPace);
      }
      if (activity === 'cycle') out.rideKmTotal += km;
      if (new Date(w.startTime).getHours() < 7) out.earlyStarts += 1;
    }
    out.rideKmTotal = Math.round(out.rideKmTotal * 10) / 10;
  }, undefined);

  out.realMapOn = safe(() => outdoorSettings().realMap === 'on', false);

  // ── Phase & focus ──
  safe(() => {
    const user = getUser(userId);
    out.focusChosen = !!user?.trainingFocus;
    const lifting = (since: number) =>
      db
        .select({ t: sessions.sessionType })
        .from(sessions)
        .where(and(eq(sessions.userId, userId), isNotNull(sessions.endTime), gte(sessions.startTime, since)))
        .all()
        .filter((r) => r.t === 'strength' || r.t === 'calisthenics').length;
    const now = Date.now();
    if (out.focusChosen) out.focusLiftingSessions = lifting(now - 90 * 86_400_000);
    const last28 = lifting(now - 28 * 86_400_000);
    if (user?.goal === 'lose_fat') out.cutLifting28d = last28;
    if (user?.goal === 'build_muscle') out.bulkLifting28d = last28;
  }, undefined);

  // ── The sit-up family ──
  safe(() => {
    const rows = db
      .select({ slug: exercises.slug, reps: setEntries.reps, sessionId: exerciseLogs.sessionId })
      .from(setEntries)
      .innerJoin(exerciseLogs, eq(setEntries.exerciseLogId, exerciseLogs.id))
      .innerJoin(exercises, eq(exerciseLogs.exerciseId, exercises.id))
      .innerJoin(sessions, eq(exerciseLogs.sessionId, sessions.id))
      .where(and(eq(sessions.userId, userId), eq(setEntries.completed, true)))
      .all()
      .filter((r) => SITUP_SLUG.test(r.slug ?? '') || /twist/.test(r.slug ?? ''));
    const variations = new Set<string>();
    const perSession = new Map<number, number>();
    for (const r of rows) {
      const slug = r.slug ?? '';
      const reps = r.reps ?? 0;
      if (SITUP_SLUG.test(slug)) {
        variations.add(slug);
        perSession.set(r.sessionId, (perSession.get(r.sessionId) ?? 0) + reps);
      }
      if (slug.startsWith('decline-')) out.declineReps += reps;
      if (/twist/.test(slug)) out.twistReps += reps;
    }
    out.situpVariations = variations.size;
    for (const v of perSession.values()) if (v > out.bestSitupSession) out.bestSitupSession = v;
  }, undefined);

  // ── The souk ──
  safe(() => {
    const keys = db.select({ k: pointPurchases.itemKey }).from(pointPurchases).where(eq(pointPurchases.userId, userId)).all().map((r) => r.k);
    out.soukItems = keys.length;
    out.storyThemesBought = keys.filter((k) => k.startsWith('story:')).length;
  }, undefined);

  return out;
}
