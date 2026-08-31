import { Accelerometer, Pedometer } from 'expo-sensors';
import {
  endLiveWalk,
  getDailySteps,
  getLiveRoute,
  getLiveRouteDistanceM,
  getLiveWalk,
  patchLiveWalk,
  startLiveWalk,
} from '@/repositories/activityRepo';
import { StepDetector, distanceFromSteps, DAILY_STEP_GOAL } from '@/lib/pedometer';
import { recoverGapSteps, MIN_GAP_SEC } from '@/lib/walkRecovery';
import {
  classifyMotion,
  segmentSpeedMs,
  PAUSE_CONFIRM_MS,
  RESUME_CONFIRM_MS,
  type MotionKind,
} from '@/lib/motionValidation';
import { progressBarWithPct } from '@/lib/progressBar';
import { getStepsSinceBoot, hasHardwareStepCounter } from '../../modules/step-counter';
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
 * Steps come from the device's hardware step-counter sensor, through two
 * complementary channels, plus GPS as independent evidence:
 *
 *  1. **Live counting** — `Pedometer.watchStepCount` (TYPE_STEP_COUNTER on
 *     Android, CMPedometer on iOS) reports steps since the subscription. The
 *     sensor keeps ticking while backgrounded, so the batched total lands the
 *     moment JS resumes.
 *  2. **Exact recovery** — our native `step-counter` module reads the sensor's
 *     *absolute* since-boot value, which survives the CPU sleeping and our
 *     process being killed. Banking that at session start means session steps
 *     are always (current − baseline), no matter what happened in between. This
 *     is the only way to be exact after an app kill; expo-sensors can't do it
 *     (`watchStepCount` is subscription-relative and `getStepCountAsync` is
 *     iOS-only), which is why the module exists. It's loaded optionally, so a
 *     build without it degrades to the other channels instead of breaking.
 *  3. **GPS** — a location foreground service runs for walks *and* runs. It
 *     survives screen-off and app-kill, giving measured distance from which
 *     steps are checkpointed into the DB even while we're dead.
 *
 * The accelerometer detector is only a stopgap for the first moments of a
 * session, or a device with no step sensor at all; it cannot run in the
 * background. All recovery paths raise the count as a floor, never lower it, so
 * they're safe to apply repeatedly and can't double-count.
 */

type Sub = { remove: () => void };
let pedoSub: Sub | null = null;
let accelSub: Sub | null = null;
let detector: StepDetector | null = null;
let flushTimer: ReturnType<typeof setInterval> | null = null;
let lastNotifiedSteps = -1;
let lastNotifiedDistanceM = -1;
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
   * Hardware step counter's absolute since-boot value at session start (null if
   * unavailable). Lets us recompute exact session steps after an app kill.
   */
  bootBaseline: null as number | null,

  // ── Auto-pause (vehicle / standing still) ──
  /** tracking is suspended because you're in a vehicle or not moving */
  paused: false,
  /** why, for the UI and the notification */
  pauseReason: '',
  /** total time spent paused, excluded from pace and calories */
  pausedTotalMs: 0,
  /** when the current pause began (null when running) */
  pausedSince: null as number | null,
  /** first moment the motion looked pause-worthy — confirms over a window */
  pauseCandidateSince: null as number | null,
  /** first moment motion looked plausible again */
  resumeCandidateSince: null as number | null,
  /** last classification, for status text */
  motion: 'walking' as MotionKind,
  // Previous tick's readings, to derive speed and cadence per interval.
  lastTickAt: 0,
  lastTickSteps: 0,
  lastTickDistanceM: 0,
};

/** Moving time in ms — wall clock minus everything spent paused. */
function activeMs(): number {
  if (!mem.startTime) return 0;
  const paused = mem.pausedTotalMs + (mem.pausedSince ? Date.now() - mem.pausedSince : 0);
  return Math.max(0, Date.now() - mem.startTime - paused);
}

function total(): number {
  return mem.baseSteps + mem.steps;
}

export interface WalkPermissions {
  motion: boolean;
  notifications: boolean;
  /** GPS route tracking is live — required for BOTH walks and runs */
  gps: boolean;
  /** the hardware step counter (not the accelerometer) is the live step source */
  hardware: boolean;
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
  return { motion, notifications, gps: false, hardware: false };
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
  /** moving time in seconds — excludes paused / in-vehicle stretches */
  activeSec: number;
  /** auto-paused because you're in a vehicle or standing still */
  paused: boolean;
  pauseReason: string;
  motion: MotionKind;
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
      activeSec: Math.round(activeMs() / 1000),
      paused: mem.paused,
      pauseReason: mem.pauseReason,
      motion: mem.motion,
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
      // Not yet reattached, so we can't know paused time — assume all of it moving.
      activeSec: Math.max(0, Math.round((Date.now() - row.startTime) / 1000)),
      paused: false,
      pauseReason: '',
      motion: 'walking',
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

  // Best evidence first: the hardware counter's absolute since-boot value minus
  // our session baseline is the EXACT number of steps taken since we started,
  // regardless of the screen being off or the app having been killed. Applied as
  // a floor, so it's idempotent and can never lower the count.
  await reconcileFromHardwareBaseline();

  // Then close any remaining blind window (GPS evidence, else a cadence estimate).
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
/**
 * Exact recovery from the hardware step counter.
 *
 * `getStepsSinceBoot()` reads the sensor's absolute value through the native
 * module. Session steps are simply (now − baseline). Raised as a floor only, so
 * calling this repeatedly is harmless, and on an APK without the native module
 * it quietly no-ops (the helper returns null).
 */
async function reconcileFromHardwareBaseline(): Promise<void> {
  if (mem.bootBaseline == null) return;
  const now = await getStepsSinceBoot();
  if (now == null || !mem.active) return;
  const exact = now - mem.bootBaseline;
  // A device reboot mid-session resets the sensor; a negative delta means the
  // baseline is meaningless now, so drop it rather than trust bad arithmetic.
  if (exact < 0) {
    mem.bootBaseline = null;
    return;
  }
  if (exact > total()) {
    mem.baseSteps = exact - mem.steps;
    mem.dirty = true;
  }
}

/**
 * Decide whether we're genuinely walking/running, and auto-pause if not.
 *
 * Runs on each flush tick. Speed comes from the GPS distance travelled since the
 * last tick and cadence from the step delta over the same window, which together
 * separate a real run from a bus ride (see lib/motionValidation). Pausing and
 * resuming each need to hold for a confirmation window so a red light or a single
 * bad GPS fix doesn't toggle the session.
 */
function evaluateMotion(): void {
  const now = Date.now();
  if (!mem.lastTickAt) {
    mem.lastTickAt = now;
    mem.lastTickSteps = total();
    mem.lastTickDistanceM = mem.usingGps ? getLiveRouteDistanceM() : 0;
    return;
  }

  const elapsedMs = now - mem.lastTickAt;
  if (elapsedMs < 1000) return;

  const steps = total();
  const distanceM = mem.usingGps ? getLiveRouteDistanceM() : 0;
  const stepDelta = Math.max(0, steps - mem.lastTickSteps);
  const distDelta = Math.max(0, distanceM - mem.lastTickDistanceM);

  mem.lastTickAt = now;
  mem.lastTickSteps = steps;
  mem.lastTickDistanceM = distanceM;

  // Without GPS there's no speed to reason about, so only step activity can tell
  // us anything — and a phone in a pocket on a bus produces no steps either way.
  const cadenceSpm = elapsedMs > 0 ? (stepDelta / elapsedMs) * 60_000 : 0;
  const speedMs = mem.usingGps ? segmentSpeedMs(distDelta, elapsedMs) : 0;
  if (!mem.usingGps && stepDelta > 0) {
    // Stepping without GPS — plainly active, nothing to judge.
    confirmResume(now);
    mem.motion = 'walking';
    return;
  }

  const verdict = classifyMotion({ speedMs, cadenceSpm: mem.hardware || stepDelta > 0 ? cadenceSpm : null });
  mem.motion = verdict.kind;

  if (verdict.shouldPause) {
    mem.resumeCandidateSince = null;
    if (!mem.paused) {
      mem.pauseCandidateSince ??= now;
      if (now - mem.pauseCandidateSince >= PAUSE_CONFIRM_MS) {
        mem.paused = true;
        mem.pausedSince = now;
        mem.pauseReason = verdict.reason;
        mem.pauseCandidateSince = null;
        void pushWalkNotification(total());
      }
    }
  } else {
    mem.pauseCandidateSince = null;
    confirmResume(now);
  }
}

function confirmResume(now: number): void {
  if (!mem.paused) return;
  mem.resumeCandidateSince ??= now;
  if (now - mem.resumeCandidateSince >= RESUME_CONFIRM_MS) {
    if (mem.pausedSince) mem.pausedTotalMs += now - mem.pausedSince;
    mem.paused = false;
    mem.pausedSince = null;
    mem.pauseReason = '';
    mem.resumeCandidateSince = null;
    void pushWalkNotification(total());
  }
}

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
      // onSample returns a count, not a flag: the sample that proves the rhythm
      // banks the whole warm-up run at once, so `+= 1` would lose those strides.
      const credited = detector!.onSample(x, y, z, Date.now());
      if (credited > 0) {
        mem.steps += credited;
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

    // Auto-pause check (vehicle / standing still) before anything is credited.
    evaluateMotion();

    const t = total();
    const distanceNow = mem.usingGps ? Math.round(getLiveRouteDistanceM()) : 0;
    if (mem.dirty) {
      patchLiveWalk({ steps: t });
      mem.dirty = false;
    }
    // Refresh on steps OR distance changing, so a GPS-only stretch (e.g. cycling,
    // or a phone in a bag) still animates the bar rather than looking frozen.
    if (t !== lastNotifiedSteps || distanceNow !== lastNotifiedDistanceM) {
      lastNotifiedSteps = t;
      lastNotifiedDistanceM = distanceNow;
      void pushWalkNotification(t);
    }
  }, 3000);
}

/**
 * Live sticky notification: steps, distance, moving time and a progress bar.
 *
 * The bar tracks progress toward the DAILY step goal using today's TOTAL —
 * everything already logged today plus this session — so starting a walk doesn't
 * reset a bar you'd already filled to 60%. The day's stored count doesn't include
 * the live session yet (that's folded in when the session is saved), so they add
 * cleanly with no double-count.
 */
async function pushWalkNotification(sessionSteps: number, opts: { create?: boolean } = {}): Promise<void> {
  const heightCm = useUserStore.getState().user?.heightCm ?? 175;
  const distanceM = mem.usingGps ? getLiveRouteDistanceM() : distanceFromSteps(sessionSteps, heightCm, mem.mode);
  const movingMin = Math.max(0, Math.round(activeMs() / 60_000));

  let dayBefore = 0;
  try {
    dayBefore = getDailySteps()?.stepCount ?? 0;
  } catch {
    dayBefore = 0;
  }
  const dayTotal = dayBefore + sessionSteps;

  const bar = progressBarWithPct(dayTotal / DAILY_STEP_GOAL);
  const icon = mem.paused ? '⏸' : mem.mode === 'run' ? '🏃' : '🚶';
  const title = `${icon} ${sessionSteps.toLocaleString()} steps · ${(distanceM / 1000).toFixed(2)} km`;
  const body =
    `${bar} ${dayTotal.toLocaleString()} / ${DAILY_STEP_GOAL.toLocaleString()} today\n` +
    (mem.paused
      ? `Paused — ${mem.pauseReason}`
      : `${movingMin} min moving${mem.estimated ? ' · includes a background estimate' : ''} · tap to finish`);
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
  const stillMine = () => mem.active && mem.startTime === startedFor;

  // 0. Bank the hardware counter's absolute since-boot reading. This sensor keeps
  //    counting while the CPU sleeps and while our process is dead, so this
  //    baseline is what lets us recover an EXACT count after an app kill.
  const baseline = await getStepsSinceBoot();
  if (!stillMine()) return;
  if (baseline != null) {
    mem.bootBaseline = baseline;
    patchLiveWalk({ bootStepBaseline: baseline });
  }

  // 1. GPS first — it's required for both walks and runs, and its foreground
  //    service is what keeps recording once the screen goes off or we're killed.
  const gps = await startRouteTracking(mode);
  if (!stillMine()) return;
  mem.usingGps = gps;

  // 2. Motion permission, then the hardware step counter.
  const perms = await requestWalkPermissions();
  if (!stillMine()) return;

  // Either channel to the step-counter sensor counts as "hardware": expo-sensors'
  // pedometer for live counting, or our native module's absolute reading.
  const hardware = perms.motion && ((await isPedometerAvailable()) || hasHardwareStepCounter());
  if (!stillMine()) return;

  // Upgrade the step source to the hardware counter. This is the real link to
  // the device's step-counter sensor, and unlike the accelerometer it keeps
  // accumulating while we're backgrounded — the batched total lands on resume.
  if (hardware && !mem.hardware) attachStepSource(true);

  perms.gps = gps;
  perms.hardware = hardware;
  livePermissions = perms;

  const source: Source = hardware ? 'pedometer' : gps ? 'gps' : 'accelerometer';
  mem.source = source;
  patchLiveWalk({ source });
  void pushWalkNotification(total());
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
  mem.bootBaseline = null;
  mem.paused = false;
  mem.pauseReason = '';
  mem.pausedTotalMs = 0;
  mem.pausedSince = null;
  mem.pauseCandidateSince = null;
  mem.resumeCandidateSince = null;
  mem.motion = 'walking';
  mem.lastTickAt = 0;
  mem.lastTickSteps = 0;
  mem.lastTickDistanceM = 0;
  lastNotifiedSteps = -1;
  lastNotifiedDistanceM = -1;

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
  return { motion: false, notifications: false, gps: false, hardware: false };
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
  // Restoring this is what makes a killed session recoverable exactly.
  mem.bootBaseline = row.bootStepBaseline ?? null;
  mem.paused = false;
  mem.pauseReason = '';
  mem.pausedTotalMs = 0;
  mem.pausedSince = null;
  mem.pauseCandidateSince = null;
  mem.resumeCandidateSince = null;
  mem.motion = 'walking';
  mem.lastTickAt = 0;
  mem.lastTickSteps = 0;
  mem.lastTickDistanceM = 0;
  lastNotifiedSteps = -1;
  lastNotifiedDistanceM = -1;

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
  /** moving seconds, excluding auto-paused (vehicle / stationary) time */
  activeSec: number;
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
  mem.bootBaseline = null;
  mem.paused = false;
  mem.pausedSince = null;
  mem.pausedTotalMs = 0;

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
    activeSec: Math.max(1, snapshot.activeSec),
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
