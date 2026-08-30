import { AppState } from 'react-native';
import { Accelerometer, Pedometer } from 'expo-sensors';
import {
  endLiveWalk,
  getDailySteps,
  getLiveRoute,
  getLiveRouteDistanceM,
  getLiveWalk,
  patchLiveWalk,
  startLiveWalk,
  truncateLiveRoute,
} from '@/repositories/activityRepo';
import { StepDetector, distanceFromSteps, DAILY_STEP_GOAL } from '@/lib/pedometer';
import { recoverGapSteps, MIN_GAP_SEC } from '@/lib/walkRecovery';
import {
  classifyMotion,
  segmentSpeedMs,
  PAUSE_CONFIRM_MS,
  RESUME_CONFIRM_MS,
  type MotionGait,
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
  /** route length + credited distance when the pause candidacy began, so the
   * confirmation window's vehicle points can be cut back OUT of the route */
  pauseCandidateRouteLen: 0,
  pauseCandidateDistanceM: 0,
  /** first moment motion looked plausible again */
  resumeCandidateSince: null as number | null,
  /** last classification, for status text */
  motion: 'walking' as MotionKind,
  // Previous tick's readings, to derive speed and cadence per interval.
  lastTickAt: 0,
  lastTickSteps: 0,
  lastTickDistanceM: 0,
  /** rolling {at, steps} samples — cadence over ~24 s, not one noisy 3 s tick */
  stepWindow: [] as Array<{ at: number; steps: number }>,
  /** the hardware counter has produced at least one real step this session */
  counterProven: false,
  /** what the session is: which activity, its gait, the pack carried */
  gait: 'walk' as MotionGait,
  activity: 'walk',
  loadKg: 0,
  /** started by the auto-detector — it may end and discard itself */
  autoStarted: false,
  /** last time the native since-boot counter was read (throttle) */
  lastNativeReadAt: 0,
};

/**
 * Cadence needs the step LISTENER, and Android tears that listener down when
 * the activity leaves the foreground — even though our JS keeps running under
 * the location service. So with the screen off, subscription deltas flatline
 * at zero and would read as "no cadence: vehicle!" on a perfectly real walk.
 * Track foreground-ness; while backgrounded, cadence comes from the native
 * since-boot counter instead (see pumpBackgroundSteps), or reads as unknown.
 */
let appActive = AppState.currentState === 'active';
AppState.addEventListener('change', (st) => {
  appActive = st === 'active';
});

/**
 * While backgrounded, poll the native module's absolute counter so real steps
 * keep flowing into the session (and into cadence) with the screen off. The
 * value is applied through the same floor-only baseline arithmetic as resume
 * recovery, so it can never double-count with the subscription's own catch-up.
 */
async function pumpBackgroundSteps(): Promise<void> {
  const now = Date.now();
  if (now - mem.lastNativeReadAt < 5_000) return;
  mem.lastNativeReadAt = now;
  await reconcileFromHardwareBaseline();
}

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
  /** which outdoor activity this session is (walk/run/hike/ruck/…) */
  activity: string;
  gait: MotionGait;
  loadKg: number;
  autoStarted: boolean;
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
      activity: mem.activity,
      gait: mem.gait,
      loadKg: mem.loadKg,
      autoStarted: mem.autoStarted,
    };
  }
  const row = getLiveWalk();
  if (row?.active && row.startTime) {
    // The row carries the pause ledger now, so even before reattaching the
    // moving time is honest — a bus ride mid-walk stays excluded.
    const pausedMs =
      (row.pausedTotalMs ?? 0) + (row.paused && row.pausedSince ? Math.max(0, Date.now() - row.pausedSince) : 0);
    return {
      active: true,
      mode: row.mode,
      source: row.source,
      startTime: row.startTime,
      steps: row.steps,
      route: getLiveRoute(),
      gpsDistanceM: getLiveRouteDistanceM(),
      activeSec: Math.max(0, Math.round((Date.now() - row.startTime - pausedMs) / 1000)),
      paused: !!row.paused,
      pauseReason: row.pauseReason ?? '',
      motion: 'walking',
      activity: row.activity ?? row.mode,
      gait: (row.gait ?? row.mode) as MotionGait,
      loadKg: row.loadKg ?? 0,
      autoStarted: !!row.autoStarted,
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
  // baseline is meaningless now, so drop it — in the ROW too, or a later
  // resume would resurrect the stale value and trust bad arithmetic.
  if (exact < 0) {
    mem.bootBaseline = null;
    patchLiveWalk({ bootStepBaseline: null });
    return;
  }
  if (exact > total()) {
    mem.baseSteps = exact - mem.steps;
    mem.counterProven = true;
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
/** How far back the rolling cadence looks. One vibration step in 24 s reads
 * as 2.5 spm — far below MIN_ACTIVE_CADENCE — so a pothole can't fake a gait. */
const CADENCE_WINDOW_MS = 24_000;

/** Cadence over the rolling window, or null when steps can't be observed. */
function rollingCadence(now: number, steps: number): number | null {
  mem.stepWindow.push({ at: now, steps });
  while (mem.stepWindow.length > 1 && mem.stepWindow[0].at < now - CADENCE_WINDOW_MS) {
    mem.stepWindow.shift();
  }
  const first = mem.stepWindow[0];
  const spanMs = now - first.at;
  if (spanMs < 6_000) return null;

  // Backgrounded with no native counter: the step listener is torn down by the
  // OS, so a zero here means "blind", not "still". Cadence is unknown.
  const observable = appActive || mem.bootBaseline != null;
  if (!observable) return null;
  // A counter that has never ticked may be broken or permission-starved —
  // don't let its silence testify that you're in a vehicle.
  if (!mem.counterProven && !appActive) return null;
  if (!mem.hardware && !mem.counterProven) return null;

  return ((steps - first.steps) / spanMs) * 60_000;
}

function evaluateMotion(): void {
  const now = Date.now();

  // While backgrounded, keep real steps flowing from the native counter so
  // cadence (and the session count) stays live with the screen off.
  if (!appActive && mem.bootBaseline != null) void pumpBackgroundSteps();

  // The background task shares pause state through the row: adopt its verdicts.
  const row = getLiveWalk();
  if (row?.active) {
    if (row.paused && !mem.paused) {
      // The task paused us (vehicle while we were blind) — adopt it.
      mem.paused = true;
      mem.pausedSince = row.pausedSince ?? now;
      mem.pausedTotalMs = row.pausedTotalMs ?? mem.pausedTotalMs;
      mem.pauseReason = row.pauseReason ?? 'Tracking paused.';
      mem.motion = 'vehicle';
      mem.pauseCandidateSince = null;
      void pushWalkNotification(total());
    } else if (!row.paused && mem.paused && (row.pausedTotalMs ?? 0) > mem.pausedTotalMs) {
      // The task saw on-foot movement and lifted the pause, closing the ledger.
      mem.paused = false;
      mem.pausedSince = null;
      mem.pausedTotalMs = row.pausedTotalMs ?? mem.pausedTotalMs;
      mem.pauseReason = '';
      mem.resumeCandidateSince = null;
      void pushWalkNotification(total());
    }
  }

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
  if (stepDelta > 0 && mem.hardware) mem.counterProven = true;

  mem.lastTickAt = now;
  mem.lastTickSteps = steps;
  mem.lastTickDistanceM = distanceM;

  const cadenceSpm = rollingCadence(now, steps);
  const speedMs = mem.usingGps ? segmentSpeedMs(distDelta, elapsedMs) : 0;
  if (!mem.usingGps && stepDelta > 0) {
    // Stepping without GPS — plainly active, nothing to judge.
    confirmResume(now, true);
    mem.motion = 'walking';
    return;
  }

  const verdict = classifyMotion({
    speedMs,
    cadenceSpm: mem.counterProven ? cadenceSpm : null,
    gait: mem.gait,
  });
  mem.motion = verdict.kind;

  if (verdict.shouldPause) {
    mem.resumeCandidateSince = null;
    if (!mem.paused) {
      if (mem.pauseCandidateSince == null) {
        mem.pauseCandidateSince = now;
        // Remember where the route stood: if this confirms, everything
        // appended during the window was the vehicle moving, and comes out.
        mem.pauseCandidateRouteLen = mem.usingGps ? getLiveRoute().length : 0;
        mem.pauseCandidateDistanceM = distanceM;
      }
      if (now - mem.pauseCandidateSince >= PAUSE_CONFIRM_MS) {
        mem.paused = true;
        mem.pausedSince = now;
        mem.pauseReason = verdict.reason;
        mem.pauseCandidateSince = null;
        // Cut the confirmation window's points back out of the route, so the
        // drawn path and the credited distance never include the ride.
        if (mem.usingGps) {
          truncateLiveRoute(mem.pauseCandidateRouteLen, mem.pauseCandidateDistanceM);
          mem.lastTickDistanceM = mem.pauseCandidateDistanceM;
        }
        // Publish to the row: the background task stops appending immediately.
        patchLiveWalk({
          paused: true,
          pausedSince: mem.pausedSince,
          pausedTotalMs: mem.pausedTotalMs,
          pauseReason: mem.pauseReason,
        });
        void pushWalkNotification(total());
      }
    }
  } else {
    mem.pauseCandidateSince = null;
    // Resuming from a VEHICLE pause needs proof of gait, not just the absence
    // of bad evidence — a bus braking to walking speed must not resume you.
    const gaitProof =
      mem.gait === 'none' ||
      verdict.kind === 'riding' ||
      !mem.counterProven ||
      (cadenceSpm != null && cadenceSpm >= 20);
    confirmResume(now, gaitProof);
  }
}

function confirmResume(now: number, gaitProof: boolean): void {
  if (!mem.paused) return;
  if (!gaitProof) {
    mem.resumeCandidateSince = null;
    return;
  }
  mem.resumeCandidateSince ??= now;
  if (now - mem.resumeCandidateSince >= RESUME_CONFIRM_MS) {
    if (mem.pausedSince) mem.pausedTotalMs += now - mem.pausedSince;
    mem.paused = false;
    mem.pausedSince = null;
    mem.pauseReason = '';
    mem.resumeCandidateSince = null;
    patchLiveWalk({
      paused: false,
      pausedSince: null,
      pausedTotalMs: mem.pausedTotalMs,
      pauseReason: null,
    });
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

  /*
   * Only a REAL blind window may be recovered. This used to run on every live
   * tick, flooring steps up from GPS distance once a second — which invented a
   * phantom cadence that then testified to the vehicle classifier that you
   * were stepping. While we're alive and watching, measured steps are the
   * only steps; recovery exists for the stretch we genuinely didn't see.
   */
  if (gapMs < MIN_GAP_SEC * 1000) {
    mem.lastObservedAt = now;
    return;
  }
  // Paused when we went dark → the missed stretch was a vehicle or a bench,
  // not a walk. Estimating "steps you probably took" would invent the ride.
  if (mem.paused) {
    mem.lastObservedAt = now;
    return;
  }
  const gpsDistanceM = mem.usingGps ? getLiveRouteDistanceM() : 0;

  // A hardware counter self-catches-up; only GPS evidence may adjust it.
  if (mem.hardware && !(gpsDistanceM > 0)) {
    mem.lastObservedAt = now;
    return;
  }

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

  // 1. GPS first — it's required for both walks and runs, and its foreground
  //    service is what keeps recording once the screen goes off or we're killed.
  const gps = await startRouteTracking(mode);
  if (!stillMine()) {
    // The user finished before the handshake landed — don't leave the
    // location service (and its permanent notification) running orphaned.
    if (gps && !mem.active) void stopRouteTracking();
    return;
  }
  mem.usingGps = gps;

  // 2. Motion permission, then the hardware step counter.
  const perms = await requestWalkPermissions();
  if (!stillMine()) return;

  // 3. Bank the hardware counter's absolute since-boot reading — AFTER the
  //    permission, because reading it needs ACTIVITY_RECOGNITION on Android 10+
  //    and asking first meant the first-ever session silently got no baseline.
  //    This sensor keeps counting while the CPU sleeps and while our process is
  //    dead, so the baseline is what makes an app-kill recoverable exactly.
  let baseline = await getStepsSinceBoot();
  if (!stillMine()) return;
  if (baseline == null) {
    // One retry — some sensor hubs only report on their next batch flush.
    await new Promise((r) => setTimeout(r, 4000));
    if (!stillMine()) return;
    baseline = await getStepsSinceBoot();
  }
  if (!stillMine()) return;
  if (baseline != null && mem.bootBaseline == null) {
    // The session may have been running a while: the baseline for START is the
    // current reading minus what's already been counted.
    const b = Math.max(0, baseline - total());
    mem.bootBaseline = b;
    patchLiveWalk({ bootStepBaseline: b });
  }

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

export interface StartWalkOptions {
  /** which outdoor activity this is (walk/run/hike/ruck/…); default = mode */
  activity?: string;
  /** the activity's gait; cycling ('none') is exempt from cadence rules */
  gait?: MotionGait;
  /** carried pack/vest weight, kg */
  loadKg?: number;
  /** started by the auto-detector (may auto-stop and self-discard) */
  autoStarted?: boolean;
  /** backdate the start — the auto-detector knows when the streak began */
  startedAt?: number;
  /** steps already taken by detection time */
  seedSteps?: number;
}

export async function startWalkTracking(
  mode: 'walk' | 'run',
  opts: StartWalkOptions = {}
): Promise<WalkPermissions> {
  // ── Synchronous part: the session is live before this function returns, so the
  // UI can switch to the tracking view with zero delay. ──
  livePermissions = null;
  const startedAt = opts.startedAt ?? Date.now();
  const seedSteps = Math.max(0, opts.seedSteps ?? 0);
  startLiveWalk({
    mode,
    source: 'accelerometer',
    startTime: startedAt,
    steps: seedSteps,
    gait: opts.gait ?? mode,
    activity: opts.activity ?? mode,
    loadKg: opts.loadKg ?? null,
    autoStarted: opts.autoStarted ?? false,
  });
  mem.active = true;
  mem.mode = mode;
  mem.source = 'accelerometer';
  mem.hardware = false;
  mem.startTime = startedAt;
  mem.baseSteps = seedSteps;
  mem.steps = 0;
  mem.gait = opts.gait ?? mode;
  mem.activity = opts.activity ?? mode;
  mem.loadKg = opts.loadKg ?? 0;
  mem.autoStarted = opts.autoStarted ?? false;
  mem.counterProven = seedSteps > 0;
  mem.stepWindow = [];
  mem.lastNativeReadAt = 0;
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
  mem.pauseCandidateRouteLen = 0;
  mem.pauseCandidateDistanceM = 0;
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

  // Honest capability check: sensor availability AND the permission still
  // granted (Android auto-resets permissions on unused apps; a dead
  // subscription would silently freeze the count forever).
  let motionGranted = false;
  try {
    const p = await Pedometer.getPermissionsAsync();
    motionGranted = p.granted || p.status === 'granted';
  } catch {
    motionGranted = false;
  }
  const hardware = motionGranted && (await isPedometerAvailable());
  const gpsLive = await isRouteTrackingActive();
  mem.active = true;
  mem.mode = row.mode;
  mem.source = hardware ? row.source : row.source === 'gps' ? 'gps' : 'accelerometer';
  mem.hardware = hardware;
  mem.startTime = row.startTime;
  mem.baseSteps = row.steps;
  mem.steps = 0;
  mem.usingGps = gpsLive || parseRouteLength(row.routeJson) > 0;
  mem.dirty = false;
  // The persisted row's `updatedAt` is when we last observed the session, so the
  // window between then and now is what was missed while the app was gone.
  mem.lastObservedAt = row.updatedAt ?? row.startTime;
  mem.estimated = false;
  // Restoring this is what makes a killed session recoverable exactly.
  mem.bootBaseline = row.bootStepBaseline ?? null;
  // The pause ledger survives with the row — a bus ride stays excluded even
  // across an app kill, instead of snapping back to "all of it was moving".
  mem.paused = !!row.paused;
  mem.pauseReason = row.pauseReason ?? '';
  mem.pausedTotalMs = row.pausedTotalMs ?? 0;
  mem.pausedSince = row.paused ? (row.pausedSince ?? Date.now()) : null;
  mem.pauseCandidateSince = null;
  mem.resumeCandidateSince = null;
  mem.motion = mem.paused ? 'vehicle' : 'walking';
  mem.gait = (row.gait ?? row.mode) as MotionGait;
  mem.activity = row.activity ?? row.mode;
  mem.loadKg = row.loadKg ?? 0;
  mem.autoStarted = !!row.autoStarted;
  mem.counterProven = false;
  mem.stepWindow = [];
  mem.lastNativeReadAt = 0;
  mem.lastTickAt = 0;
  mem.lastTickSteps = 0;
  mem.lastTickDistanceM = 0;
  mem.pauseCandidateRouteLen = 0;
  mem.pauseCandidateDistanceM = 0;
  lastNotifiedSteps = -1;
  lastNotifiedDistanceM = -1;

  // Every walk wants GPS (it's what survives screen-off and app-kill). If the
  // service died — reboot, OS kill — restart it regardless of step source.
  if (!gpsLive) {
    const gps = await startRouteTracking(row.mode);
    mem.usingGps = mem.usingGps || gps;
  }
  livePermissions = {
    motion: motionGranted,
    notifications: true,
    gps: mem.usingGps,
    hardware,
  };

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
  /** which outdoor activity this was (walk/run/hike/ruck/…) */
  activity: string;
  gait: MotionGait;
  loadKg: number;
  autoStarted: boolean;
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
  mem.pauseReason = '';
  mem.stepWindow = [];
  mem.counterProven = false;
  mem.autoStarted = false;

  if (!snapshot) return null;

  const heightCm = useUserStore.getState().user?.heightCm ?? 175;
  const steps = snapshot.steps;
  /*
   * GPS is the truth when it genuinely tracked: a real route with real length.
   * A single stray fix used to latch "GPS mode" with ~0 m and the whole walk
   * saved as nothing while thousands of steps sat right there — so a starved
   * trace (under 2 points, or implying under 40% of what the steps measured)
   * falls back to the step estimate instead of overruling it.
   */
  const stepDistanceM =
    snapshot.gait === 'none' ? 0 : distanceFromSteps(steps, heightCm, snapshot.mode);
  const gpsTrustworthy =
    snapshot.gpsDistanceM > 0 &&
    snapshot.route.length >= 2 &&
    (stepDistanceM <= 0 || snapshot.gpsDistanceM >= 0.4 * stepDistanceM);
  const distanceM = gpsTrustworthy ? snapshot.gpsDistanceM : stepDistanceM;

  return {
    mode: snapshot.mode,
    steps,
    distanceM: Math.round(distanceM),
    durationS: Math.max(1, Math.round((Date.now() - snapshot.startTime) / 1000)),
    activeSec: Math.max(1, snapshot.activeSec),
    startTime: snapshot.startTime,
    source: snapshot.source,
    route: snapshot.route,
    activity: snapshot.activity,
    gait: snapshot.gait,
    loadKg: snapshot.loadKg,
    autoStarted: snapshot.autoStarted,
  };
}

/** Route length without the full parse dance (cheap null-safe helper). */
function parseRouteLength(routeJson: string | null): number {
  if (!routeJson) return 0;
  try {
    const v = JSON.parse(routeJson);
    return Array.isArray(v) ? v.length : 0;
  } catch {
    return 0;
  }
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
