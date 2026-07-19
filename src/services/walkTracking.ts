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
 * Real-time step source: `Pedometer.watchStepCount` (TYPE_STEP_COUNTER on
 * Android, CMPedometer on iOS). It reports the cumulative step count since the
 * subscription, and because the hardware counter keeps ticking while the app is
 * backgrounded or the screen is off, the listener delivers the batched total the
 * moment it resumes — so background steps catch up. This is the source that
 * actually works on Android.
 *
 * `getStepCountAsync` is used ONLY as a best-effort *upward* correction: on iOS
 * it can read the exact count over a date range; on Android it is unavailable
 * and throws, so we swallow the error and rely entirely on the watch counter.
 * (An earlier version made getStepCountAsync the sole source, which silently
 * broke step counting on Android — never do that again.)
 *
 * With no hardware counter we fall back to the accelerometer detector
 * (foreground-only). Runs additionally trace a GPS route via a foreground
 * service (see locationTracking.ts).
 */

type Sub = { remove: () => void };
let pedoSub: Sub | null = null;
let accelSub: Sub | null = null;
let detector: StepDetector | null = null;
let flushTimer: ReturnType<typeof setInterval> | null = null;
let lastNotifiedSteps = -1;
let reconciling = false;
/** null = untested, false = unavailable (Android) so we stop calling it. */
let stepCountSupported: boolean | null = null;

type Source = 'pedometer' | 'accelerometer' | 'gps';

/** In-memory live session — the single source of truth while tracking. */
const mem = {
  active: false,
  mode: 'walk' as 'walk' | 'run',
  source: 'pedometer' as Source,
  /** a hardware step counter is in use (watchStepCount) */
  hardware: false,
  startTime: 0,
  /** steps carried over from before this subscription (resume / getStepCount catch-up) */
  baseSteps: 0,
  /** steps reported by the current watch subscription / accelerometer detector */
  steps: 0,
  /** GPS route tracking is live for this session */
  usingGps: false,
  dirty: false,
};

function total(): number {
  return mem.baseSteps + mem.steps;
}

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
      steps: total(),
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
 * Best-effort upward correction against the hardware counter's absolute total
 * since the session start. Works on iOS; on Android `getStepCountAsync` throws
 * and this quietly no-ops (watchStepCount remains the source). Never decreases
 * the count.
 */
export async function reconcileSteps(): Promise<void> {
  if (!mem.active || !mem.hardware || reconciling || stepCountSupported === false) return;
  reconciling = true;
  try {
    const res = await Pedometer.getStepCountAsync(new Date(mem.startTime), new Date());
    stepCountSupported = true;
    const hw = res?.steps;
    if (typeof hw === 'number' && isFinite(hw) && hw > total()) {
      // Fold the extra into baseSteps so the watch subscription keeps adding on top.
      mem.baseSteps = hw - mem.steps;
      mem.dirty = true;
    }
  } catch {
    // Unavailable on Android (getStepCountAsync is iOS-only) — stop trying;
    // watchStepCount remains the live source.
    stepCountSupported = false;
  } finally {
    reconciling = false;
  }
}

function attachSensors(): void {
  if (mem.hardware) {
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

  // Persist + refresh the live notification every 3 s (and only when changed).
  flushTimer = setInterval(() => {
    if (mem.dirty && mem.active) {
      const t = total();
      patchLiveWalk({ steps: t });
      mem.dirty = false;
      if (!mem.usingGps && t !== lastNotifiedSteps) {
        lastNotifiedSteps = t;
        void updateOngoingNotification(
          'walk',
          `FitCoach — ${mem.mode === 'run' ? 'run' : 'walk'} in progress`,
          `${t.toLocaleString()} steps · tap to return and finish`
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
  mem.hardware = hardware;
  mem.startTime = Date.now();
  mem.baseSteps = 0;
  mem.steps = 0;
  mem.usingGps = gps;
  mem.dirty = false;
  lastNotifiedSteps = -1;

  attachSensors();

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
 * row carries the steps so far; a fresh watch subscription resumes counting on
 * top of that persisted base.
 */
export async function resumeWalkTracking(): Promise<void> {
  if (mem.active) {
    if (mem.hardware) void reconcileSteps();
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
  mem.baseSteps = row.steps;
  mem.steps = 0;
  mem.usingGps = row.source === 'gps' || gpsLive;
  mem.dirty = false;
  lastNotifiedSteps = -1;

  // If it was a GPS run and the foreground service died (rare), restart it.
  if (mem.usingGps && !gpsLive) {
    await startRouteTracking(row.mode);
  }

  attachSensors();
  if (hardware) void reconcileSteps();

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
