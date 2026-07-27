import { Accelerometer, Pedometer } from 'expo-sensors';
import {
  endLiveWalk,
  getLiveRoute,
  getLiveRouteDistanceM,
  getLiveWalk,
  patchLiveWalk,
  startLiveWalk,
} from '@/repositories/activityRepo';
import { StepDetector, distanceFromSteps, DAILY_STEP_GOAL } from '@/lib/pedometer';
import { recoverGapSteps, MIN_GAP_SEC } from '@/lib/walkRecovery';
import { progressBarWithPct } from '@/lib/progressBar';
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
import {
  getCurrentCumulativeSteps,
  registerWalkBackgroundTask,
  unregisterWalkBackgroundTask,
} from './walkBackgroundTask';
import { Platform } from 'react-native';

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
  /**
   * When we last actually observed the session. The flush timer refreshes this
   * every few seconds while JS is running; once the screen goes off or the app
   * is killed it goes stale, and the difference on return IS the blind window we
   * need to recover. Seeded from the persisted row after a restart.
   */
  lastObservedAt: 0,
  /** true once any part of the count came from a cadence estimate */
  estimated: false,
  /**
   * Android only: The device's cumulative step count at session start.
   * TYPE_STEP_COUNTER gives a cumulative count since boot, so we store this
   * baseline to calculate session steps as (current - baseline).
   */
  androidBaselineSteps: 0,
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
  if (!mem.active) return;

  // Always try to close a blind window first — this is what actually recovers
  // steps on Android after the screen was off or the app was killed.
  catchUpFromGap();

  if (!mem.hardware || reconciling || stepCountSupported === false) return;
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

/**
 * Close the gap between the last moment we observed the session and now.
 *
 * Two very different cases, and conflating them would double-count:
 *  • **GPS run** — the foreground service kept tracing while we were away, so
 *    the route distance is evidence. We raise the count to what that distance
 *    implies (a floor, never additive, so this is safe to call repeatedly).
 *  • **No hardware counter** (accelerometer-only) — the steps are genuinely
 *    lost, so we estimate the window from the session's own cadence. Applied
 *    once per gap (we immediately mark the window observed).
 *
 * When a hardware counter IS running we deliberately do nothing: `watchStepCount`
 * delivers the batched background total by itself on resume, and adding an
 * estimate on top would inflate the count.
 */
function catchUpFromGap(): void {
  const now = Date.now();
  if (!mem.lastObservedAt) {
    mem.lastObservedAt = now;
    return;
  }
  const gapMs = now - mem.lastObservedAt;
  const gpsDistanceM = mem.usingGps ? getLiveRouteDistanceM() : 0;

  // A hardware counter self-catches-up; only GPS evidence may adjust it.
  if (mem.hardware && !(gpsDistanceM > 0)) {
    mem.lastObservedAt = now;
    return;
  }
  if (gapMs < MIN_GAP_SEC * 1000 && !(gpsDistanceM > 0)) return;

  const heightCm = useUserStore.getState().user?.heightCm ?? 175;
  const rec = recoverGapSteps({
    mode: mem.mode,
    observedSteps: total(),
    observedMs: Math.max(1, mem.lastObservedAt - mem.startTime),
    gapMs,
    gpsDistanceM,
    heightCm,
  });

  if (rec.steps > 0) {
    mem.baseSteps += rec.steps;
    mem.dirty = true;
    if (rec.estimated) mem.estimated = true;
  }
  mem.lastObservedAt = now;
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

  // Persist + refresh the live notification every 3 s. `lastObservedAt` is
  // stamped on every tick: while JS runs it stays current, and the moment the
  // app is suspended it stops advancing — which is exactly how we detect the
  // blind window later (see catchUpFromGap).
  flushTimer = setInterval(() => {
    if (!mem.active) return;
    mem.lastObservedAt = Date.now();
    if (mem.dirty) {
      const t = total();
      patchLiveWalk({ steps: t });
      mem.dirty = false;
      if (t !== lastNotifiedSteps) {
        lastNotifiedSteps = t;
        void pushWalkNotification(t);
      }
    }
  }, 3000);
}

/** Live sticky notification: steps, distance, elapsed and a progress bar. */
async function pushWalkNotification(steps: number, opts: { create?: boolean } = {}): Promise<void> {
  const heightCm = useUserStore.getState().user?.heightCm ?? 175;
  const distanceM = mem.usingGps ? getLiveRouteDistanceM() : distanceFromSteps(steps, heightCm, mem.mode);
  const elapsedMin = Math.max(0, Math.round((Date.now() - mem.startTime) / 60_000));
  const bar = progressBarWithPct(steps / DAILY_STEP_GOAL);
  const title = `${mem.mode === 'run' ? '🏃' : '🚶'} ${steps.toLocaleString()} steps · ${(distanceM / 1000).toFixed(2)} km`;
  const body =
    `${bar} of ${DAILY_STEP_GOAL.toLocaleString()}\n` +
    `${elapsedMin} min${mem.estimated ? ' · includes an estimate for time in the background' : ''} · tap to finish`;
  if (opts.create) await showOngoingNotification('walk', title, body);
  else await updateOngoingNotification('walk', title, body);
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
  // Start immediately, request permissions in background
  const perms: WalkPermissions = { motion: false, notifications: false, gps: false };
  let hardware = false;

  // Check permissions without requesting (non-blocking)
  Promise.all([
    requestWalkPermissions().then(p => Object.assign(perms, p)),
    isPedometerAvailable().then(h => { hardware = h && perms.motion; })
  ]).catch(err => console.warn('[Walk] Permission check failed:', err));

  // Runs use GPS to trace the route and measure distance; the foreground service
  // keeps a persistent notification and keeps recording even with the app closed.
  let gps = false;
  if (mode === 'run') {
    // GPS setup happens async to not block start
    startRouteTracking(mode)
      .then(started => { 
        gps = started;
        if (started) {
          mem.source = 'gps';
          mem.usingGps = true;
          patchLiveWalk({ source: 'gps' });
        }
      })
      .catch(err => console.warn('[Walk] GPS tracking failed:', err));
  }

  const source: Source = 'pedometer'; // Default, will update if GPS starts
  
  // Android: Capture the device's cumulative step count as our baseline
  let androidBaselineSteps = 0;
  if (Platform.OS === 'android') {
    // Non-blocking baseline capture with timeout
    getCurrentCumulativeSteps()
      .then(baseline => {
        androidBaselineSteps = baseline;
        patchLiveWalk({ androidBaselineSteps: baseline });
      })
      .catch(err => console.warn('[Walk] Failed to get baseline steps:', err));
  }

  startLiveWalk({ mode, source, androidBaselineSteps: 0 });
  mem.active = true;
  mem.mode = mode;
  mem.source = source;
  mem.hardware = hardware;
  mem.startTime = Date.now();
  mem.baseSteps = 0;
  mem.steps = 0;
  mem.usingGps = gps;
  mem.dirty = false;
  mem.lastObservedAt = mem.startTime;
  mem.estimated = false;
  mem.androidBaselineSteps = androidBaselineSteps;
  lastNotifiedSteps = -1;

  attachSensors();

  // Register Android background step tracking (non-blocking)
  // This runs alongside the existing GPS tracking and foreground sensors
  if (Platform.OS === 'android') {
    registerWalkBackgroundTask()
      .then(registered => {
        if (!registered) {
          console.warn('[Walk] Background task registration failed, continuing with foreground-only tracking');
        } else {
          console.log('[Walk] Background task registered successfully');
        }
      })
      .catch(err => console.warn('[Walk] Background task registration error:', err));
  }

  // Sticky notification with a live progress bar, for walks and runs alike. (A
  // GPS run also carries the location foreground-service notification, which
  // Android requires for background location — this one is the live counter.)
  void pushWalkNotification(0, { create: true });

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
  // The persisted row's `updatedAt` is when we last observed the session, so the
  // window between then and now is what was missed while the app was gone.
  mem.lastObservedAt = row.updatedAt ?? row.startTime;
  mem.estimated = false;
  mem.androidBaselineSteps = row.androidBaselineSteps ?? 0;
  lastNotifiedSteps = -1;

  // Android: Reconcile using the background task's checkpoint
  // The background task has been writing steps to the DB even while the app was killed
  if (hardware && Platform.OS === 'android' && row.androidBaselineSteps) {
    // Get current cumulative count from hardware sensor
    const currentCumulative = await getCurrentCumulativeSteps();
    
    // Calculate session steps: current - baseline
    const sessionSteps = Math.max(0, currentCumulative - row.androidBaselineSteps);
    
    // Use the checkpoint from the background task if it's higher (it ran more recently)
    // This handles the case where the background task recorded steps after the app was killed
    const checkpointSteps = row.steps;
    const reconciledSteps = Math.max(sessionSteps, checkpointSteps);
    
    // Update memory with the reconciled count
    mem.baseSteps = reconciledSteps;
    mem.steps = 0;
    mem.dirty = true;
    
    console.log(
      `[Walk Resume] Android reconciliation: baseline=${row.androidBaselineSteps}, ` +
      `current=${currentCumulative}, calculated=${sessionSteps}, ` +
      `checkpoint=${checkpointSteps}, final=${reconciledSteps}`
    );
    
    // Re-register the background task to continue checkpointing
    const registered = await registerWalkBackgroundTask();
    if (!registered) {
      console.warn('[Walk Resume] Background task registration failed');
    }
  }

  // If it was a GPS run and the foreground service died (rare), restart it.
  if (mem.usingGps && !gpsLive) {
    await startRouteTracking(row.mode);
  }

  attachSensors();
  // Recover the blind window (GPS evidence, or a cadence estimate), then let the
  // hardware counter's own catch-up land on top.
  await reconcileSteps();

  void pushWalkNotification(total(), { create: true });
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
  
  // Unregister Android background task
  if (Platform.OS === 'android') {
    void unregisterWalkBackgroundTask();
  }
  
  endLiveWalk();
  void dismissOngoingNotification('walk');
  mem.active = false;
  mem.usingGps = false;
  mem.lastObservedAt = 0;
  mem.estimated = false;
  mem.androidBaselineSteps = 0;

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
