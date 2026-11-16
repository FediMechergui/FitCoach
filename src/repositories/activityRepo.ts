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
import type { GpsFix } from '@/lib/gpsFilter';
import { gateRoute, newTrackingGate, type TrackingGate, type MotionEvidence } from '@/lib/trackingGate';
import { kvGet, kvSetStrict } from './kvRepo';
import { atomic } from '@/db/atomic';
import { stepsFromDistance } from '@/lib/pedometer';
import { getUser, PRIMARY_USER_ID } from './userRepo';

// ── Live walk (shared with the background foreground service) ─────────────────
const LIVE_ID = 1;

export function getLiveWalk(): LiveWalk | undefined {
  return db.select().from(liveWalks).where(eq(liveWalks.id, LIVE_ID)).get();
}

export function startLiveWalk(
  data: { mode: 'walk' | 'run'; source: 'pedometer' | 'accelerometer' | 'gps'; activity?: string | null },
  userId: number = PRIMARY_USER_ID
): void {
  const row = {
    id: LIVE_ID,
    active: true,
    userId,
    mode: data.mode,
    source: data.source,
    activity: data.activity ?? null,
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
export function appendLiveRoutePoints(fixes: GpsFix[], evidence: MotionEvidence | null = null): void {
  atomic(() => {
    const row = getLiveWalk();
    if (!row?.active) return;
    const route = parseRoute(row.routeJson);
    const key = `tracking.gate.${row.startTime}`;
    const gate = kvGet<TrackingGate>(key) ?? newTrackingGate();
    const { accepted, distanceM, state } = gateRoute(route, fixes, gate, evidence, row.activity === 'cycle');
    kvSetStrict(key, state);
    if (!accepted.length) return;
    route.push(...accepted);
    const tail = route[route.length - 1];
    db.update(liveWalks).set({ routeJson: JSON.stringify(route), distanceM: row.distanceM + distanceM,
      lastLat: tail[0], lastLng: tail[1], updatedAt: Date.now() }).where(eq(liveWalks.id, LIVE_ID)).run();
  });
}

export function liveTrackingGate(): TrackingGate {
  const row = getLiveWalk();
  return row ? kvGet<TrackingGate>(`tracking.gate.${row.startTime}`) ?? newTrackingGate() : newTrackingGate();
}

/** Height for step maths, read from the DB (the store isn't hydrated in a headless task). */
function safeUserHeightCm(): number {
  try {
    return getUser(PRIMARY_USER_ID)?.heightCm ?? 175;
  } catch {
    return 175;
  }
}

/*
 * The live route is read every second by the screens and the tracker. Parsing
 * an hour of fixes every second — twice, once for the path and once to measure
 * it — kept the JavaScript thread busy enough that the accelerometer's samples
 * arrived in bunches (see lib/pedometer). The parse is now cached against the
 * stored text: unchanged JSON hands back the SAME array, which also lets the
 * map skip its redraw. The distance needs no parse at all: the row keeps it,
 * added fix by fix from exactly the accepted points.
 */
let cachedJson: string | null = null;
let cachedRoute: LatLng[] = [];

/** The live route so far (for drawing the circuit while tracking). */
export function getLiveRoute(): LatLng[] {
  const json = getLiveWalk()?.routeJson ?? null;
  if (json === cachedJson) return cachedRoute;
  cachedJson = json;
  cachedRoute = parseRoute(json);
  return cachedRoute;
}

/** Total GPS path distance of the live route (metres). */
export function getLiveRouteDistanceM(): number {
  const row = getLiveWalk();
  if (!row?.routeJson) return 0;
  // The stored total IS the path length of the stored points (appendLiveRoutePoints
  // adds exactly what it accepts). Fall back to measuring if it was never written.
  return row.distanceM > 0 ? row.distanceM : routeDistanceM(getLiveRoute());
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
    /** the outdoor activity key (walk, run, hike, cycle…) */
    activity?: string | null;
  },
  userId: number = PRIMARY_USER_ID
): number {
  return atomic(() => {
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
    })
    .run();
  // Roll the session's steps into today's passive step total too.
  // On the day it started — a walk past midnight belongs to the evening it began.
  addSteps(data.steps, data.distanceM, data.caloriesBurned, toISODate(new Date(data.startTime)), userId);
  return Number(res.lastInsertRowId);
  });
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
  atomic(() => {
  const row = getWalkSession(id);
  db.delete(walkSessions).where(eq(walkSessions.id, id)).run();
  if (!row) return;
  removeSteps(row.steps, row.distanceM, row.caloriesBurned, toISODate(new Date(row.startTime)), row.userId);
  });
}

// ── Daily passive step counter ───────────────────────────────────────────────
export function getDailySteps(date: string = todayISO(), userId: number = PRIMARY_USER_ID): DailyStepLog | undefined {
  return db
    .select()
    .from(dailyStepLogs)
    .where(and(eq(dailyStepLogs.userId, userId), eq(dailyStepLogs.date, date)))
    .get();
}

type StepTotals = { manual: number[]; sensor: number[] };
function changeTotals(date: string, userId: number, values: number[], kind: 'sensor' | 'add' | 'remove'): void {
  atomic(() => {
    const key = `steps.totals.${userId}.${date}`;
    const existing = getDailySteps(date, userId);
    const state = kvGet<StepTotals>(key) ?? { manual: [existing?.stepCount ?? 0, existing?.distanceM ?? 0, existing?.caloriesBurned ?? 0], sensor: [0,0,0] };
    values = values.map(v => { if (!Number.isFinite(v) || v < 0) throw new Error('Invalid activity total'); return v; });
    if (kind === 'sensor') state.sensor = state.sensor.map((v,i) => Math.max(v,values[i]));
    else state.manual = state.manual.map((v,i) => Math.max(0,v + (kind === 'add' ? values[i] : -values[i])));
    // Session estimates and the all-day sensor overlap. Use the larger supported count,
    // never add both. A deleted workout does not erase independently observed steps.
    const totals = state.manual.map((v,i) => Math.max(v,state.sensor[i]));
    const row = {stepCount:Math.round(totals[0]),distanceM:totals[1],caloriesBurned:totals[2]};
    kvSetStrict(key,state);
    if (existing) db.update(dailyStepLogs).set(row).where(eq(dailyStepLogs.id,existing.id)).run();
    else db.insert(dailyStepLogs).values({userId,date,...row}).run();
  });
}
export function setDailySteps(date: string, stepCount: number, distanceM: number, caloriesBurned: number, userId = PRIMARY_USER_ID): void {
  changeTotals(date,userId,[stepCount,distanceM,caloriesBurned],'sensor');
}
export function addSteps(steps: number, distanceM: number, caloriesBurned: number, date = todayISO(), userId = PRIMARY_USER_ID): void {
  if (steps > 0) changeTotals(date,userId,[steps,distanceM,caloriesBurned],'add');
}
export function removeSteps(steps: number, distanceM: number, caloriesBurned: number, date = todayISO(), userId = PRIMARY_USER_ID): void {
  if (steps > 0) changeTotals(date,userId,[steps,distanceM,caloriesBurned],'remove');
}

export function stepHistorySince(sinceISO: string, userId: number = PRIMARY_USER_ID): DailyStepLog[] {
  return db
    .select()
    .from(dailyStepLogs)
    .where(and(eq(dailyStepLogs.userId, userId), gte(dailyStepLogs.date, sinceISO)))
    .orderBy(dailyStepLogs.date)
    .all();
}
