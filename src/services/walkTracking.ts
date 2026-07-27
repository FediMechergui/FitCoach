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

/**
 * Attach the step source. Safe to call again to *switch* source mid-session
 * (we start on the accelerometer for instant feedback, then upgrade to the
 * hardware counter once permission resolves): whatever has been counted so far
 * is folded into `baseSteps` first, so switching never loses or double-counts.
 */
function attachStepSource(useHardware: boolean): void {
  // Fold the current subscription's tally into the base before swapping.
  if (pedoSub || accelSub) {
    mem.baseSteps = total();
    mem.steps = 0;
    pedoSub?.remove();
    pedoSub = null;
    accelSub?.remove();
    accelSub = null;
    detector = null;
  }
  mem.hardware = useHardware;

  if (useHardware) {
    // Cumulative since subscription — and because the OS counter keeps ticking
    // while we're backgrounded, the batched total lands the moment JS resumes.
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
}

function attachSensors(): void {
  attachStepSource(mem.hardware);

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

/**
 * Latest resolved permissions/capabilities for the live session. The UI polls
 * this instead of awaiting `startWalkTracking`, so tapping Start feels instant
 * while the permission dialogs and GPS handshake finish in the background.
 */
let livePermissions: WalkPermissions | null = null;
export function getWalkPermissions(): WalkPermissions | null {
  return livePermissions;
}

/**
 * Bring the session up to full capability without blocking the UI.
 *
 * Order matters: motion permission must be granted *before* subscribing to the
 * hardware counter, or the subscription silently yields nothing. So we start on
 * the accelerometer for instant feedback, then upgrade to the hardware counter
 * once permission actually lands. GPS runs for walks as well as runs — the
 * location foreground service is the only mechanism that genuinely survives the
 * screen going off and the app being killed.
 */
async function configureSession(mode: 'walk' | 'run'): Promise<void> {
  const startedFor = mem.startTime;
  const perms = await requestWalkPermissions();
  // Bail out if the session ended (or a new one began) while we were awaiting.
  if (!mem.active || mem.startTime !== startedFor) return;

  const hardware = perms.motion && (await isPedometerAvailable());
  if (!mem.active || mem.startTime !== startedFor) return;

  // Upgrade to the hardware counter — keeps counting with the screen off.
  if (hardware && !mem.hardware) attachStepSource(true);

  // GPS for BOTH walking and running: real distance, and a foreground service
  // that keeps recording while the app is away.
  const gps = await startRouteTracking(mode);
  if (!mem.active || mem.startTime !== startedFor) return;

  perms.gps = gps;
  livePermissions = perms;
  mem.usingGps = gps;
  const source: Source = gps ? 'gps' : hardware ? 'pedometer' : 'accelerometer';
  mem.source = source;
  patchLiveWalk({ source });
}

export async function startWalkTracking(mode: 'walk' | 'run'): Promise<WalkPermissions> {
  // ── Synchronous part: the session is live before this function returns, so the
  // UI can switch to the tracking view with zero delay. ──
  livePermissions = null;
  startLiveWalk({ mode, source: 'accelerometer' });
  mem.active = true;
  mem.mode = mode;
  mem.source = 'accelerometer';
  mem.hardware = false;
  mem.startTime = Date.now();
  mem.baseSteps = 0;
  mem.steps = 0;
  mem.usingGps = false;
  mem.dirty = false;
  mem.lastObservedAt = mem.startTime;
  mem.estimated = false;
  lastNotifiedSteps = -1;

  // Count from the very first step with the accelerometer, then upgrade.
  attachSensors();

  // ── Async part: permissions, hardware counter, GPS. Deliberately not awaited. ──
  void configureSession(mode).catch(() => {
    // Tracking continues on the accelerometer; nothing to escalate.
  });

  // Sticky notification with a live progress bar, for walks and runs alike. (The
  // GPS foreground service adds its own OS-required notification; this one is
  // the live counter.)
  void pushWalkNotification(0, { create: true });

  // Capabilities aren't known yet — the UI polls getWalkPermissions() for them.
  return { motion: false, notifications: false, gps: false };
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
  lastNotifiedSteps = -1;

  // If the GPS service died (rare), restart it.
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
  endLiveWalk();
  void dismissOngoingNotification('walk');
  livePermissions = null;
  mem.active = false;
  mem.usingGps = false;
  mem.lastObservedAt = 0;
  mem.estimated = false;

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
