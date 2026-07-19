import { Accelerometer, Pedometer } from 'expo-sensors';
import {
  endLiveWalk,
  getLiveRoute,
  getLiveRouteDistanceM,
  getLiveWalk,
  patchLiveWalk,
  startLiveWalk,
} from '@/repositories/activityRepo';
import { StepDetector, distanceFromSteps } from '@/lib/pedometer';
import type { LatLng } from '@/lib/geo';
import { useUserStore } from '@/stores/userStore';
import {
  isRouteTrackingActive,
  startRouteTracking,
  stopRouteTracking,
} from './locationTracking';
import {
  dismissOngoingNotification,
  requestNotificationPermission,
  showOngoingNotification,
  updateOngoingNotification,
} from './sessionNotifications';

/**
 * Walk/run tracking.
 *
 * Step source of truth (the fix for the "laggy / forgetful after backgrounding"
 * bug): the hardware step counter, read as an ABSOLUTE total since the session
 * start via `Pedometer.getStepCountAsync(startTime, now)`. That counter runs at
 * the OS level and keeps ticking with the app backgrounded or the screen off, so
 * re-reading it on resume recovers every step taken while we were asleep — the
 * old `watchStepCount` subscription only reported steps since it was (re)created,
 * silently dropping background steps. We reconcile against this absolute count on
 * every UI tick and whenever the app returns to the foreground.
 *
 * When there is no hardware counter we fall back to the accelerometer detector
 * (foreground-only by nature; the UI says so). Runs additionally trace a GPS
 * route via a foreground service (see locationTracking.ts).
 */

type Sub = { remove: () => void };
let accelSub: Sub | null = null;
let detector: StepDetector | null = null;
let flushTimer: ReturnType<typeof setInterval> | null = null;
let lastNotifiedSteps = -1;
let reconciling = false;

type Source = 'pedometer' | 'accelerometer' | 'gps';

/** In-memory live session — the single source of truth while tracking. */
const mem = {
  active: false,
  mode: 'walk' as 'walk' | 'run',
  source: 'pedometer' as Source,
  /** a hardware step counter is available → use the absolute-count reconcile */
  hardware: false,
  startTime: 0,
  /** authoritative total step count for the session */
  steps: 0,
  /** GPS route tracking is live for this session */
  usingGps: false,
  dirty: false,
};

export interface WalkPermissions {
  motion: boolean;
  notifications: boolean;
  /** GPS route tracking is live (runs) */
  gps: boolean;
}

export async function requestWalkPermissions(): Promise<WalkPermissions> {
  let motion = false;
  try {
    const p = await Pedometer.requestPermissionsAsync();
    motion = p.granted || p.status === 'granted';
  } catch {
    motion = false;
  }
  const notifications = await requestNotificationPermission();
  return { motion, notifications, gps: false };
}

async function isPedometerAvailable(): Promise<boolean> {
  try {
    return await Pedometer.isAvailableAsync();
  } catch {
    return false;
  }
}

export interface WalkSnapshot {
  active: boolean;
  mode: 'walk' | 'run';
  source: Source;
  startTime: number;
  steps: number;
  /** GPS path so far (empty for pedometer-only sessions) */
  route: LatLng[];
  /** GPS-measured distance (m); 0 when there's no route yet */
  gpsDistanceM: number;
}

/** Current live numbers — memory first (fresh), DB as fallback after restarts. */
export function getLiveSnapshot(): WalkSnapshot | null {
  if (mem.active) {
    return {
      active: true,
      mode: mem.mode,
      source: mem.source,
      startTime: mem.startTime,
      steps: mem.steps,
      route: mem.usingGps ? getLiveRoute() : [],
      gpsDistanceM: mem.usingGps ? getLiveRouteDistanceM() : 0,
    };
  }
  const row = getLiveWalk();
  if (row?.active && row.startTime) {
    return {
      active: true,
      mode: row.mode,
      source: row.source,
      startTime: row.startTime,
      steps: row.steps,
      route: getLiveRoute(),
      gpsDistanceM: getLiveRouteDistanceM(),
    };
  }
  return null;
}

/**
 * Reconcile the in-memory step count against the hardware counter's ABSOLUTE
 * total since the session start. This is what makes background/screen-off steps
 * "catch up" instead of being lost. Only ever increases the count. No-op for
 * accelerometer sessions (their count comes from the live detector).
 */
export async function reconcileSteps(): Promise<void> {
  if (!mem.active || !mem.hardware || reconciling) return;
  reconciling = true;
  try {
    const res = await Pedometer.getStepCountAsync(new Date(mem.startTime), new Date());
    const s = res?.steps;
    if (typeof s === 'number' && isFinite(s) && s > mem.steps) {
      mem.steps = s;
      mem.dirty = true;
    }
  } catch {
    // getStepCountAsync can throw on devices without history — keep last count.
  } finally {
    reconciling = false;
  }
}

function attachSensors(): void {
  if (!mem.hardware) {
    detector = new StepDetector();
    Accelerometer.setUpdateInterval(40); // 25 Hz
    accelSub = Accelerometer.addListener(({ x, y, z }) => {
      if (detector!.onSample(x, y, z, Date.now())) {
        mem.steps += 1;
        mem.dirty = true;
      }
    });
  }

  // Persist + reconcile + refresh the live notification every 3 s. Reconciling
  // here (not only from the UI) keeps the count and notification advancing even
  // when no screen is polling, as long as the process is alive.
  flushTimer = setInterval(() => {
    if (!mem.active) return;
    const run = async () => {
      if (mem.hardware) await reconcileSteps();
      if (mem.dirty) {
        patchLiveWalk({ steps: mem.steps });
        mem.dirty = false;
        if (!mem.usingGps && mem.steps !== lastNotifiedSteps) {
          lastNotifiedSteps = mem.steps;
          void updateOngoingNotification(
            'walk',
            `FitCoach — ${mem.mode === 'run' ? 'run' : 'walk'} in progress`,
            `${mem.steps.toLocaleString()} steps · tap to return and finish`
          );
        }
      }
    };
    void run();
  }, 3000);
}

function detachSensors(): void {
  accelSub?.remove();
  accelSub = null;
  detector = null;
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
}

export async function startWalkTracking(mode: 'walk' | 'run'): Promise<WalkPermissions> {
  const perms = await requestWalkPermissions();
  const hardware = perms.motion && (await isPedometerAvailable());

  // Runs use GPS to trace the route and measure distance; the foreground service
  // keeps a persistent notification and keeps recording even with the app closed.
  let gps = false;
  if (mode === 'run') {
    gps = await startRouteTracking(mode);
  }
  const source: Source = gps ? 'gps' : hardware ? 'pedometer' : 'accelerometer';
  perms.gps = gps;

  startLiveWalk({ mode, source });
  mem.active = true;
  mem.mode = mode;
  mem.source = source;
  mem.hardware = hardware;
  mem.startTime = Date.now();
  mem.steps = 0;
  mem.usingGps = gps;
  mem.dirty = false;
  lastNotifiedSteps = -1;

  attachSensors();
  if (hardware) void reconcileSteps();

  // GPS runs already have the location foreground-service notification; only add
  // our own sticky (with the live step count) for pedometer/accelerometer walks.
  if (!gps) {
    void showOngoingNotification(
      'walk',
      `FitCoach — ${mode === 'run' ? 'run' : 'walk'} in progress`,
      hardware
        ? 'Steps keep counting, even with the screen off. Return to finish.'
        : 'Counting with the accelerometer — keep the app open for accuracy.'
    );
  }

  return perms;
}

/**
 * Reconnect to a live walk after the app was backgrounded or restarted. The DB
 * row carries the session start; re-reading the hardware counter from that start
 * recovers every step taken while we were away.
 */
export async function resumeWalkTracking(): Promise<void> {
  if (mem.active) {
    // Already attached — just catch up any steps taken while we were away.
    if (mem.hardware) await reconcileSteps();
    return;
  }
  const row = getLiveWalk();
  if (!row?.active || !row.startTime) return;

  const hardware = row.source !== 'accelerometer' && (await isPedometerAvailable());
  const gpsLive = await isRouteTrackingActive();
  mem.active = true;
  mem.mode = row.mode;
  mem.source = row.source;
  mem.hardware = hardware;
  mem.startTime = row.startTime;
  mem.steps = row.steps;
  mem.usingGps = row.source === 'gps' || gpsLive;
  mem.dirty = false;
  lastNotifiedSteps = -1;

  // If it was a GPS run and the foreground service died (rare), restart it.
  if (mem.usingGps && !gpsLive) {
    await startRouteTracking(row.mode);
  }

  attachSensors();
  if (hardware) await reconcileSteps();

  if (!mem.usingGps) {
    void showOngoingNotification(
      'walk',
      `FitCoach — ${row.mode === 'run' ? 'run' : 'walk'} in progress`,
      'Session resumed — return to FitCoach to finish.'
    );
  }
}

export interface WalkResult {
  mode: 'walk' | 'run';
  steps: number;
  distanceM: number;
  durationS: number;
  startTime: number;
  source: Source;
  route: LatLng[];
}

/** Stop tracking and return the final tally (does not persist a WalkSession). */
export function stopWalkTracking(): WalkResult | null {
  const snapshot = getLiveSnapshot();
  detachSensors();
  void stopRouteTracking();
  endLiveWalk();
  void dismissOngoingNotification('walk');
  mem.active = false;
  mem.usingGps = false;

  if (!snapshot) return null;

  const heightCm = useUserStore.getState().user?.heightCm ?? 175;
  const steps = snapshot.steps;
  // GPS distance is truth for runs; fall back to step-estimated distance otherwise.
  const distanceM =
    snapshot.gpsDistanceM > 0 ? snapshot.gpsDistanceM : distanceFromSteps(steps, heightCm, snapshot.mode);

  return {
    mode: snapshot.mode,
    steps,
    distanceM: Math.round(distanceM),
    durationS: Math.max(1, Math.round((Date.now() - snapshot.startTime) / 1000)),
    startTime: snapshot.startTime,
    source: snapshot.source,
    route: snapshot.route,
  };
}

/** Startup hygiene: clear a stale notification/GPS service if none survived a crash. */
export async function cleanupOrphanWalk(): Promise<void> {
  const live = getLiveWalk();
  if (!live?.active) {
    await dismissOngoingNotification('walk');
    // A GPS foreground service with no live session behind it — shut it down.
    if (await isRouteTrackingActive()) await stopRouteTracking();
  }
}
