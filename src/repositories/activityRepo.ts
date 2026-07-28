import { and, desc, eq, gte } from 'drizzle-orm';
import { db } from '@/db/client';
import {
  dailyStepLogs,
  liveWalks,
  walkSessions,
  type DailyStepLog,
  type LiveWalk,
  type WalkSession,
} from '@/db/schema';
import { todayISO, toISODate } from '@/lib/date';
import { parseRoute, routeDistanceM, type LatLng } from '@/lib/geo';
import { filterFixes, type GpsFix } from '@/lib/gpsFilter';
import { stepsFromDistance } from '@/lib/pedometer';
import { getUser, PRIMARY_USER_ID } from './userRepo';

// ── Live walk (shared with the background foreground service) ─────────────────
const LIVE_ID = 1;

export function getLiveWalk(): LiveWalk | undefined {
  return db.select().from(liveWalks).where(eq(liveWalks.id, LIVE_ID)).get();
}

export function startLiveWalk(
  data: { mode: 'walk' | 'run'; source: 'pedometer' | 'accelerometer' | 'gps' },
  userId: number = PRIMARY_USER_ID
): void {
  const row = {
    id: LIVE_ID,
    active: true,
    userId,
    mode: data.mode,
    source: data.source,
    startTime: Date.now(),
    steps: 0,
    distanceM: 0,
    lastLat: null,
    lastLng: null,
    routeJson: null,
    updatedAt: Date.now(),
  };
  if (getLiveWalk()) {
    db.update(liveWalks).set(row).where(eq(liveWalks.id, LIVE_ID)).run();
  } else {
    db.insert(liveWalks).values(row).run();
  }
}

export function patchLiveWalk(patch: Partial<Omit<LiveWalk, 'id'>>): void {
  if (!getLiveWalk()) return;
  db.update(liveWalks).set({ ...patch, updatedAt: Date.now() }).where(eq(liveWalks.id, LIVE_ID)).run();
}

export function endLiveWalk(): void {
  if (getLiveWalk()) {
    db.update(liveWalks).set({ active: false }).where(eq(liveWalks.id, LIVE_ID)).run();
  }
}

/**
 * Append GPS fixes to the live route and recompute total GPS distance. Called
 * from the background location task — reads the current route from the DB (the
 * only channel shared with the headless task context), appends, writes back.
 *
 * Every fix passes through `filterFixes` first, which discards the two kinds of
 * phantom movement a receiver invents: the wandering low-accuracy fixes of an
 * indoor/enclosed space, and the scatter produced by turning on the spot. Only
 * fixes that survive are stored, so the route's path length and the recorded
 * distance can never disagree.
 */
export function appendLiveRoutePoints(fixes: GpsFix[]): void {
  const row = getLiveWalk();
  if (!row?.active) return;
  const route = parseRoute(row.routeJson);
  const { accepted, distanceM: gained } = filterFixes(route, fixes);

  /*
   * Nothing credible arrived — you're indoors, or standing, or turning on the
   * spot. Still stamp `updatedAt`, because it marks the last moment the session
   * was *observed*, not the last moment it moved. Leaving it stale would make
   * the whole stretch look like a blind window when the app comes back, and the
   * gap estimator would credit steps for it from assumed cadence — re-inventing
   * exactly the phantom distance the filter just threw away.
   */
  if (!accepted.length) {
    db.update(liveWalks).set({ updatedAt: Date.now() }).where(eq(liveWalks.id, LIVE_ID)).run();
    return;
  }
  route.push(...accepted);
  const distance = row.distanceM + gained;
  const tail = route[route.length - 1];

  /*
   * Checkpoint the step count too — this is what makes steps keep climbing while
   * the app is backgrounded OR fully killed.
   *
   * This function runs inside the expo-location TaskManager task, which the
   * Android foreground service keeps alive when our main JS runtime is gone. The
   * hardware step counter can't be read meaningfully from here (expo-sensors'
   * watchStepCount is subscription-relative, so a fresh read is always ~0 — the
   * trap that previously wrote zeros over real counts). GPS distance, however, is
   * measured hardware evidence, so we derive steps from it and only ever raise
   * the stored count. Monotonic: the pedometer's own total wins when it's higher.
   */
  const heightCm = safeUserHeightCm();
  const impliedSteps = stepsFromDistance(distance, heightCm, row.mode);

  db.update(liveWalks)
    .set({
      routeJson: JSON.stringify(route),
      distanceM: distance,
      steps: Math.max(row.steps, impliedSteps),
      lastLat: tail?.[0] ?? row.lastLat,
      lastLng: tail?.[1] ?? row.lastLng,
      updatedAt: Date.now(),
    })
    .where(eq(liveWalks.id, LIVE_ID))
    .run();
}

/** Height for step maths, read from the DB (the store isn't hydrated in a headless task). */
function safeUserHeightCm(): number {
  try {
    return getUser(PRIMARY_USER_ID)?.heightCm ?? 175;
  } catch {
    return 175;
  }
}

/** The live route so far (for drawing the circuit while tracking). */
export function getLiveRoute(): LatLng[] {
  return parseRoute(getLiveWalk()?.routeJson);
}

/** Total GPS path distance of the live route (metres). */
export function getLiveRouteDistanceM(): number {
  return routeDistanceM(getLiveRoute());
}

// ── Walk / Run sessions ──────────────────────────────────────────────────────
export function saveWalkSession(
  data: {
    mode: 'walk' | 'run';
    startTime: number;
    endTime: number;
    steps: number;
    distanceM: number;
    durationS: number;
    caloriesBurned: number;
    avgPace?: number | null;
    source: 'pedometer' | 'accelerometer' | 'gps';
    routeJson?: string | null;
  },
  userId: number = PRIMARY_USER_ID
): number {
  const res = db
    .insert(walkSessions)
    .values({
      userId,
      mode: data.mode,
      startTime: data.startTime,
      endTime: data.endTime,
      steps: data.steps,
      distanceM: data.distanceM,
      durationS: data.durationS,
      caloriesBurned: data.caloriesBurned,
      avgPace: data.avgPace ?? null,
      source: data.source,
      routeJson: data.routeJson ?? null,
    })
    .run();
  // Roll the session's steps into today's passive step total too.
  addSteps(data.steps, data.distanceM, data.caloriesBurned, todayISO(), userId);
  return Number(res.lastInsertRowId);
}

export function listWalkSessions(limit = 30, userId: number = PRIMARY_USER_ID): WalkSession[] {
  return db
    .select()
    .from(walkSessions)
    .where(eq(walkSessions.userId, userId))
    .orderBy(desc(walkSessions.startTime))
    .limit(limit)
    .all();
}

export function getWalkSession(id: number): WalkSession | undefined {
  return db.select().from(walkSessions).where(eq(walkSessions.id, id)).get();
}

/**
 * Delete a walk/run AND undo its contribution to the day's totals.
 *
 * `saveWalkSession` rolls its steps, distance and calories into `daily_step_logs`,
 * so deleting the row alone left those totals permanently inflated — a deleted
 * session kept "counting". This subtracts exactly what was added, on the day it
 * was added to.
 */
export function deleteWalkSession(id: number): void {
  const row = getWalkSession(id);
  db.delete(walkSessions).where(eq(walkSessions.id, id)).run();
  if (!row) return;
  removeSteps(row.steps, row.distanceM, row.caloriesBurned, toISODate(new Date(row.startTime)), row.userId);
}

// ── Daily passive step counter ───────────────────────────────────────────────
export function getDailySteps(date: string = todayISO(), userId: number = PRIMARY_USER_ID): DailyStepLog | undefined {
  return db
    .select()
    .from(dailyStepLogs)
    .where(and(eq(dailyStepLogs.userId, userId), eq(dailyStepLogs.date, date)))
    .get();
}

/** Set today's absolute step count (e.g. from the hardware pedometer snapshot). */
export function setDailySteps(
  date: string,
  stepCount: number,
  distanceM: number,
  caloriesBurned: number,
  userId: number = PRIMARY_USER_ID
): void {
  const existing = getDailySteps(date, userId);
  if (existing) {
    db.update(dailyStepLogs)
      .set({ stepCount, distanceM, caloriesBurned })
      .where(eq(dailyStepLogs.id, existing.id))
      .run();
  } else {
    db.insert(dailyStepLogs).values({ userId, date, stepCount, distanceM, caloriesBurned }).run();
  }
}

/** Increment today's step total (e.g. from a completed walk session). */
export function addSteps(
  steps: number,
  distanceM: number,
  caloriesBurned: number,
  date: string = todayISO(),
  userId: number = PRIMARY_USER_ID
): void {
  const existing = getDailySteps(date, userId);
  if (existing) {
    db.update(dailyStepLogs)
      .set({
        stepCount: existing.stepCount + steps,
        distanceM: existing.distanceM + distanceM,
        caloriesBurned: existing.caloriesBurned + caloriesBurned,
      })
      .where(eq(dailyStepLogs.id, existing.id))
      .run();
  } else {
    db.insert(dailyStepLogs).values({ userId, date, stepCount: steps, distanceM, caloriesBurned }).run();
  }
}

/**
 * Subtract a contribution from a day's totals — the inverse of `addSteps`, used
 * when a session or walk is deleted. Clamped at zero: a rounding difference or a
 * double-delete must never leave a negative step count.
 */
export function removeSteps(
  steps: number,
  distanceM: number,
  caloriesBurned: number,
  date: string = todayISO(),
  userId: number = PRIMARY_USER_ID
): void {
  const existing = getDailySteps(date, userId);
  if (!existing) return;
  db.update(dailyStepLogs)
    .set({
      stepCount: Math.max(0, existing.stepCount - Math.max(0, Math.round(steps))),
      distanceM: Math.max(0, existing.distanceM - Math.max(0, distanceM)),
      caloriesBurned: Math.max(0, existing.caloriesBurned - Math.max(0, caloriesBurned)),
    })
    .where(eq(dailyStepLogs.id, existing.id))
    .run();
}

export function stepHistorySince(sinceISO: string, userId: number = PRIMARY_USER_ID): DailyStepLog[] {
  return db
    .select()
    .from(dailyStepLogs)
    .where(and(eq(dailyStepLogs.userId, userId), gte(dailyStepLogs.date, sinceISO)))
    .orderBy(dailyStepLogs.date)
    .all();
}
