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
 * Walk/run tracking — pedometer-first, no GPS.
 *
 * Design (tuned for smoothness):
 *  • Steps live in an in-memory counter; the UI polls memory, not the database.
 *    SQLite is only a crash-safe backup, flushed at most every 3 seconds — the
 *    per-step DB writes that made the old version laggy are gone.
 *  • Hardware pedometer (TYPE_STEP_COUNTER) is the primary source. It keeps
 *    counting at the OS level with the screen off, delivering the batched total
 *    when the app resumes — so background steps catch up automatically.
 *  • Accelerometer fallback runs at 25 Hz (was 50) — plenty for a 2–3 Hz step
 *    cadence at half the CPU. Foreground-only by nature; the UI says so.
 *  • A sticky notification marks the session as live and is dismissed on stop.
 */

type Sub = { remove: () => void };
let pedoSub: Sub | null = null;
let accelSub: Sub | null = null;
let detector: StepDetector | null = null;
let flushTimer: ReturnType<typeof setInterval> | null = null;
let lastNotifiedSteps = -1;

type Source = 'pedometer' | 'accelerometer' | 'gps';

/** In-memory live session — the single source of truth while tracking. */
const mem = {
  active: false,
  mode: 'walk' as 'walk' | 'run',
  source: 'pedometer' as Source,
  startTime: 0,
  /** steps carried over from before a process restart (resume) */
  baseSteps: 0,
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
      steps: mem.baseSteps + mem.steps,
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

function attachSensors(hardware: boolean): void {
  if (hardware) {
    // watchStepCount reports cumulative steps since subscription — batched by
    // the hardware even while the CPU sleeps, so it catches up on resume.
    pedoSub = Pedometer.watchStepCount((result) => {
      mem.steps = result.steps;
      mem.dirty = true;
    });
  } else {
    detector = new StepDetector();
    Accelerometer.setUpdateInterval(40); // 25 Hz
    accelSub = Accelerometer.addListener(({ x, y, z }) => {
      if (detector!.onSample(x, y, z, Date.now())) {
        mem.steps += 1;
        mem.dirty = true;
      }
    });
  }

  // Crash-safe backup: persist at most every 3 s, and only when changed. Also
  // push the live step count into the sticky notification so the user watches it
  // climb from the notification bar (non-GPS sessions — GPS runs use the
  // foreground-service notification instead).
  flushTimer = setInterval(() => {
    if (mem.dirty && mem.active) {
      const total = mem.baseSteps + mem.steps;
      patchLiveWalk({ steps: total });
      mem.dirty = false;
      if (!mem.usingGps && total !== lastNotifiedSteps) {
        lastNotifiedSteps = total;
        void updateOngoingNotification(
          'walk',
          `FitCoach — ${mem.mode === 'run' ? 'run' : 'walk'} in progress`,
          `${total.toLocaleString()} steps · tap to return and finish`
        );
      }
    }
  }, 3000);
}

function detachSensors(): void {
  pedoSub?.remove();
  pedoSub = null;
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
  mem.startTime = Date.now();
  mem.baseSteps = 0;
  mem.steps = 0;
  mem.usingGps = gps;
  mem.dirty = false;
  lastNotifiedSteps = -1;

  // Steps are still counted alongside GPS (useful cadence/step info on a run).
  attachSensors(hardware);

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
 * Reconnect to a live walk after the app was killed/restarted mid-session.
 * The DB row carries the steps so far; the hardware counter resumes from a new
 * subscription, so its readings are added on top of the persisted base.
 */
export async function resumeWalkTracking(): Promise<void> {
  if (mem.active) return; // already attached in this process
  const row = getLiveWalk();
  if (!row?.active || !row.startTime) return;

  const hardware = row.source !== 'accelerometer' && (await isPedometerAvailable());
  const gpsLive = await isRouteTrackingActive();
  mem.active = true;
  mem.mode = row.mode;
  mem.source = row.source;
  mem.startTime = row.startTime;
  mem.baseSteps = row.steps;
  mem.steps = 0;
  mem.usingGps = row.source === 'gps' || gpsLive;
  mem.dirty = false;

  // If it was a GPS run and the foreground service died (rare), restart it.
  if (mem.usingGps && !gpsLive) {
    await startRouteTracking(row.mode);
  }

  lastNotifiedSteps = -1;
  attachSensors(hardware);

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
