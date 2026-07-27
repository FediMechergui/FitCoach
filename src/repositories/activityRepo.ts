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
import { todayISO } from '@/lib/date';
import { haversine, parseRoute, routeDistanceM, type LatLng } from '@/lib/geo';
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
 * Append GPS points to the live route and recompute total GPS distance. Called
 * from the background location task — reads the current route from the DB (the
 * only channel shared with the headless task context), appends, writes back.
 */
export function appendLiveRoutePoints(points: LatLng[]): void {
  const row = getLiveWalk();
  if (!row?.active) return;
  const route = parseRoute(row.routeJson);
  let distance = row.distanceM;
  let last: LatLng | null = route.length ? route[route.length - 1] : null;
  for (const p of points) {
    if (last) {
      const seg = haversine(last, p);
      // Ignore GPS jitter (<2 m) so a stationary phone doesn't inflate distance.
      if (seg < 2) continue;
      distance += seg;
    }
    route.push(p);
    last = p;
  }
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

export function deleteWalkSession(id: number): void {
  db.delete(walkSessions).where(eq(walkSessions.id, id)).run();
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

export function stepHistorySince(sinceISO: string, userId: number = PRIMARY_USER_ID): DailyStepLog[] {
  return db
    .select()
    .from(dailyStepLogs)
    .where(and(eq(dailyStepLogs.userId, userId), gte(dailyStepLogs.date, sinceISO)))
    .orderBy(dailyStepLogs.date)
    .all();
}
