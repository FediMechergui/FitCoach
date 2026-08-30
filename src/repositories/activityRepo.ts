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
import { filterFixes, GAIT_MAX_SPEED_MS, type GpsFix } from '@/lib/gpsFilter';
import {
  batchLooksLikeVehicle,
  batchLooksOnFoot,
  type MotionGait,
} from '@/lib/motionValidation';
import { stepsFromDistance } from '@/lib/pedometer';
import { getUser, PRIMARY_USER_ID } from './userRepo';

// ── Live walk (shared with the background foreground service) ─────────────────
const LIVE_ID = 1;

export function getLiveWalk(): LiveWalk | undefined {
  return db.select().from(liveWalks).where(eq(liveWalks.id, LIVE_ID)).get();
}

export function startLiveWalk(
  data: {
    mode: 'walk' | 'run';
    source: 'pedometer' | 'accelerometer' | 'gps';
    startTime?: number;
    steps?: number;
    gait?: 'walk' | 'run' | 'none';
    activity?: string;
    loadKg?: number | null;
    autoStarted?: boolean;
  },
  userId: number = PRIMARY_USER_ID
): void {
  const row = {
    id: LIVE_ID,
    active: true,
    userId,
    mode: data.mode,
    source: data.source,
    startTime: data.startTime ?? Date.now(),
    steps: data.steps ?? 0,
    distanceM: 0,
    lastLat: null,
    lastLng: null,
    routeJson: null,
    updatedAt: Date.now(),
    bootStepBaseline: null,
    // A new session must never inherit the previous one's pause state.
    paused: false,
    pausedSince: null,
    pausedTotalMs: 0,
    pauseReason: null,
    gait: data.gait ?? data.mode,
    autoStarted: data.autoStarted ?? false,
    activity: data.activity ?? data.mode,
    loadKg: data.loadKg ?? null,
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
  const now = Date.now();
  const gait: MotionGait = row.gait ?? row.mode;
  const route = parseRoute(row.routeJson);
  // The gait's own speed ceiling: a walk rejects city-traffic fixes outright,
  // a ride is allowed its descents. The timestamped segment gate inside also
  // stops a rejected vehicle stretch from being credited as one giant hop.
  const { accepted, distanceM: gained } = filterFixes(route, fixes, {
    maxSpeedMs: GAIT_MAX_SPEED_MS[gait],
    lastTimestamp: row.updatedAt,
  });
  const elapsedMs = Math.max(1, now - (row.updatedAt ?? now));

  /*
   * ── Vehicle judgement, right here in the background task. ──
   *
   * The foreground auto-pause can only run while the app's JS is alive; the
   * "phone in pocket on a bus" case happens exactly when it is not. So the
   * task judges each batch itself and keeps the verdict IN THE ROW, where both
   * runtimes can see it: real distance at vehicle speed pauses the session,
   * and a batch back at on-foot speed lifts the pause. While paused, nothing
   * is appended and nothing is credited — a ride cannot enter the walk.
   */
  if (row.paused) {
    if (accepted.length && batchLooksOnFoot(gained, elapsedMs, gait)) {
      // Moving like a person again — lift the pause and credit this batch.
      const pausedTotalMs =
        (row.pausedTotalMs ?? 0) + (row.pausedSince ? Math.max(0, now - row.pausedSince) : 0);
      commitBatch(row, route, accepted, gained, {
        paused: false,
        pausedSince: null,
        pausedTotalMs,
        pauseReason: null,
      });
      return;
    }
    // Still paused: observe, credit nothing. Stamping updatedAt matters — it
    // marks the stretch as observed so the gap estimator can't re-invent it.
    db.update(liveWalks).set({ updatedAt: now }).where(eq(liveWalks.id, LIVE_ID)).run();
    return;
  }

  if (accepted.length && batchLooksLikeVehicle(gained, elapsedMs, gait)) {
    // Covered real ground at vehicle speed — pause the session and do NOT
    // credit the batch. The row carries the reason for the UI.
    db.update(liveWalks)
      .set({
        paused: true,
        pausedSince: now,
        pauseReason: 'Moving too fast to be on foot — looks like a vehicle, so tracking is paused.',
        updatedAt: now,
      })
      .where(eq(liveWalks.id, LIVE_ID))
      .run();
    return;
  }

  /*
   * Nothing credible arrived — you're indoors, or standing, or turning on the
   * spot. Still stamp `updatedAt`, because it marks the last moment the session
   * was *observed*, not the last moment it moved. Leaving it stale would make
   * the whole stretch look like a blind window when the app comes back, and the
   * gap estimator would credit steps for it from assumed cadence — re-inventing
   * exactly the phantom distance the filter just threw away.
   */
  if (!accepted.length) {
    db.update(liveWalks).set({ updatedAt: now }).where(eq(liveWalks.id, LIVE_ID)).run();
    return;
  }
  commitBatch(row, route, accepted, gained, {});
}

/** Append an accepted batch to the live row (route, distance, implied steps). */
function commitBatch(
  row: LiveWalk,
  route: LatLng[],
  accepted: LatLng[],
  gained: number,
  extra: Partial<Omit<LiveWalk, 'id'>>
): void {
  route.push(...accepted);
  const distance = row.distanceM + gained;
  const tail = route[route.length - 1];
  const gait: MotionGait = row.gait ?? row.mode;

  /*
   * Checkpoint the step count too — this is what makes steps keep climbing while
   * the app is backgrounded OR fully killed.
   *
   * This function runs inside the expo-location TaskManager task, which the
   * Android foreground service keeps alive when our main JS runtime is gone. The
   * hardware step counter can't be read meaningfully from here (expo-sensors'
   * watchStepCount is subscription-relative, so a fresh read is always ~0 — the
   * trap that previously wrote zeros over real counts). GPS distance, however, is
   * measured hardware evidence — and by this point the batch has passed the
   * gait's own speed gates, so the distance really was covered on foot. A ride
   * (gait 'none') derives no steps at all: wheels aren't strides.
   */
  const heightCm = safeUserHeightCm();
  const impliedSteps =
    gait === 'none' ? 0 : stepsFromDistance(distance, heightCm, gait === 'run' ? 'run' : 'walk');

  db.update(liveWalks)
    .set({
      routeJson: JSON.stringify(route),
      distanceM: distance,
      steps: Math.max(row.steps, impliedSteps),
      lastLat: tail?.[0] ?? row.lastLat,
      lastLng: tail?.[1] ?? row.lastLng,
      updatedAt: Date.now(),
      ...extra,
    })
    .where(eq(liveWalks.id, LIVE_ID))
    .run();
}

/**
 * Cut the live route back to `pointCount` points and `distanceM` metres — used
 * when the auto-pause confirms: everything appended during the confirmation
 * window was the vehicle moving, not the walk, so it comes back out. Keeps the
 * invariant that the drawn route's length IS the credited distance.
 */
export function truncateLiveRoute(pointCount: number, distanceM: number): void {
  const row = getLiveWalk();
  if (!row?.active) return;
  const route = parseRoute(row.routeJson);
  if (route.length <= pointCount) return;
  const cut = route.slice(0, Math.max(0, pointCount));
  const tail = cut.length ? cut[cut.length - 1] : null;
  db.update(liveWalks)
    .set({
      routeJson: cut.length ? JSON.stringify(cut) : null,
      distanceM: Math.max(0, distanceM),
      lastLat: tail?.[0] ?? null,
      lastLng: tail?.[1] ?? null,
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
    activity?: string | null;
    loadKg?: number | null;
    activeS?: number | null;
    /** steps to add to the daily log — 0 when the hardware sensor already
     * counts them (the passive sync banks those, so adding again doubled) */
    stepsAdded?: number | null;
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
      activity: data.activity ?? null,
      loadKg: data.loadKg ?? null,
      activeS: data.activeS ?? null,
      stepsAdded: data.stepsAdded ?? data.steps,
    })
    .run();
  // Roll the session into the daily total — credited to the day it STARTED,
  // the same day the energy balance uses and the same day a delete debits, so
  // a walk over midnight can't corrupt two days' totals. Steps the hardware
  // sensor already counts are passed as stepsAdded=0 — the passive sync banks
  // those — while distance and calories always come from the session.
  addSteps(data.stepsAdded ?? data.steps, data.distanceM, data.caloriesBurned, toISODate(new Date(data.startTime)), userId);
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
  removeSteps(row.stepsAdded ?? row.steps, row.distanceM, row.caloriesBurned, toISODate(new Date(row.startTime)), row.userId);
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
