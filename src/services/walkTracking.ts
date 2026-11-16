import { AppState } from 'react-native';
import { Accelerometer, Pedometer } from 'expo-sensors';
import {
  endLiveWalk,
  liveTrackingGate,
  getDailySteps,
  getLiveRoute,
  getLiveRouteDistanceM,
  getLiveWalk,
  patchLiveWalk,
  startLiveWalk,
} from '@/repositories/activityRepo';
import { StepDetector, distanceFromSteps, DAILY_STEP_GOAL } from '@/lib/pedometer';
import { kvGet, kvSetStrict } from '@/repositories/kvRepo';
import { excludedTime, restoreWalkClock, type SavedWalkPause, type TimeInterval } from '@/lib/walkClock';
import { stepCreditAllowed } from '@/lib/trackingGate';
import {
  classifyMotion,
  classifyRide,
  MotionWindow,
  PAUSE_CONFIRM_MS,
  RESUME_CONFIRM_MS,
  type MotionKind,
} from '@/lib/motionValidation';
import { outdoorSettings } from '@/repositories/outdoorRepo';
import { runOutdoorTick } from './outdoorAlerts';
import { activityFor } from '@/lib/outdoorActivities';
import { progressBarWithPct } from '@/lib/progressBar';
import { hasHardwareStepCounter, startStepMonitoring, startStepService, stopStepService, startMotionRecognition, stopMotionRecognition, readMotion, nativeDailySteps } from '../../modules/step-counter';
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

/** Walk/run tracking with observed sensor counts, optional GPS and persisted vehicle filtering.
 * Android may stop background work; force-stop cannot be recovered as measured activity.
 */

type Sub = { remove: () => void };
let pedoSub: Sub | null = null;
let accelSub: Sub | null = null;
let detector: StepDetector | null = null;
let flushTimer: ReturnType<typeof setInterval> | null = null;
let lastNotifiedSteps = -1;
let lastNotifiedDistanceM = -1;

type Source = 'pedometer' | 'accelerometer' | 'gps';

/** In-memory live session — the single source of truth while tracking. */
/** Speed and cadence over the last ~20 s, not one jittery second (lib/motionValidation). */
const motionWindow = new MotionWindow();

const mem = {
  active: false,
  gpsRequested: true,
  mode: 'walk' as 'walk' | 'run',
  /** the outdoor activity key (walk, run, hike, cycle…) */
  activity: 'walk',
  /** false for a ride: a bike has no steps, so no step source is attached at all */
  countSteps: true,
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
  pauseIntervals: [] as TimeInterval[],
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
  const gate = mem.usingGps ? liveTrackingGate() : null;
  const union = excludedTime(mem.startTime, Date.now(), [...mem.pauseIntervals, ...(gate?.excludedIntervals ?? []),
    ...(mem.pausedSince == null ? [] : [[mem.pausedSince,Date.now()] as TimeInterval])]);
  return Math.max(0, Date.now() - mem.startTime - Math.max(union, paused, gate?.excludedMs ?? 0));
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
  let motion: boolean;
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
  activity: string;
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
      activity: mem.activity,
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
  // A training session's GPS trace shares the live row; it is not a walk.
  if (row?.active && row.startTime && row.activity !== 'session') {
    const gate = liveTrackingGate();
    const clock = restoreWalkClock(row.startTime, Date.now(), row.updatedAt ?? row.startTime,
      kvGet<SavedWalkPause>('tracking.pause'), gate.last?.at, gate.excludedMs, gate.excludedIntervals);
    return {
      active: true,
      mode: row.mode,
      activity: row.activity ?? row.mode,
      source: row.source,
      startTime: row.startTime,
      steps: row.steps,
      route: getLiveRoute(),
      gpsDistanceM: getLiveRouteDistanceM(),
      activeSec: clock.activeSec,
      paused: clock.since != null,
      pauseReason: clock.since != null ? 'Tracking paused before the app restarted.' : '',
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
  // Hardware subscriptions deliver observed batches. Never extrapolate a blind window
  // or re-import a whole-session hardware total that could include vehicle movement.
  const row = getLiveWalk();
  if (row && row.steps > total()) mem.baseSteps += row.steps - total();
  const observed = nativeDailySteps();
  const baseline = kvGet<{startTime:number; value:number}>('tracking.observedBaseline');
  if (mem.hardware && observed && baseline?.startTime === mem.startTime) {
    const measured = Math.max(0, observed.observedTotal - baseline.value);
    if (measured > total()) { mem.baseSteps += measured - total(); mem.dirty = true; }
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
  const gate = liveTrackingGate();
  if (mem.countSteps && gate.vehicle) {
    if (!mem.paused) { mem.paused = true; mem.pausedSince = now; }
    mem.motion = 'vehicle';
    mem.pauseReason = 'Likely vehicle travel. Distance and steps are excluded until walking resumes.';
    return;
  }
  const steps = total();
  const distanceM = mem.usingGps ? getLiveRouteDistanceM() : 0;
  motionWindow.push({ at: now, steps, distanceM });

  // Auto-pause can be switched off (Profile → Outdoor & GPS): then nothing is
  // ever paused, and moving time is simply the clock.
  if (!outdoorSettings().autoPause) {
    if (mem.paused) {
      mem.resumeCandidateSince = now - RESUME_CONFIRM_MS;
      confirmResume(now);
    }
    mem.motion = 'walking';
    return;
  }

  const w = motionWindow.read();
  if (!w) return; // not enough history yet to judge anything

  const riding = !mem.countSteps;
  // Without GPS there's no speed to reason about, so only steps can tell us
  // anything — and a phone on a bus produces no steps either way.
  if (!mem.usingGps && !riding) {
    if (w.cadenceSpm > 0) {
      confirmResume(now);
      mem.motion = 'walking';
    }
    return;
  }

  const verdict = riding
    ? classifyRide(w.speedMs)
    : classifyMotion({ speedMs: gate.last && now - (gate.last.at ?? 0) < 20000 ? gate.speedMs : w.speedMs, cadenceSpm: mem.hardware || w.cadenceSpm > 0 ? w.cadenceSpm : null });
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
    if (mem.pausedSince) {
      mem.pausedTotalMs += now - mem.pausedSince;
      mem.pauseIntervals.push([mem.pausedSince,now]);
    }
    mem.paused = false;
    mem.pausedSince = null;
    mem.pauseReason = '';
    mem.resumeCandidateSince = null;
    void pushWalkNotification(total());
  }
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

  // A ride counts no steps: pedalling and a phone bouncing in a jersey pocket
  // would otherwise be credited as a walk.
  if (!mem.countSteps) return;

  let previousRaw = 0;
  if (useHardware) {
    // Cumulative since subscription — and because the OS counter keeps ticking
    // while we're backgrounded, the batched total lands the moment JS resumes.
    pedoSub = Pedometer.watchStepCount((result) => {
      const delta = Math.max(0, result.steps - previousRaw);
      previousRaw = result.steps;
      if (stepCreditAllowed(liveTrackingGate()) && mem.motion !== 'vehicle') mem.steps += delta;
      mem.dirty = true;
    });
  } else {
    detector = new StepDetector();
    Accelerometer.setUpdateInterval(40); // 25 Hz
    accelSub = Accelerometer.addListener(({ x, y, z, timestamp }) => {
      /*
       * The sensor's OWN timestamp, not the moment JavaScript got round to the
       * sample. When the JS thread is busy (a long route redrawing, a big
       * screen mounting) samples are delivered in bunches: stamped with
       * Date.now() a bunch lands a few milliseconds apart, real strides fall
       * inside the refractory window and are dropped, and the rhythm test
       * breaks on the uneven spacing — the count stalls and then lurches. The
       * event timestamp (seconds) keeps the true spacing however late it
       * arrives. One clock per detector: it is used for every sample or none.
       */
      const ts = typeof timestamp === 'number' && timestamp > 0 ? timestamp * 1000 : Date.now();
      // onSample returns a count, not a flag: the sample that proves the rhythm
      // banks the whole warm-up run at once, so `+= 1` would lose those strides.
      const credited = detector!.onSample(x, y, z, ts);
      if (credited > 0 && stepCreditAllowed(liveTrackingGate()) && mem.motion !== 'vehicle') {
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
    void readMotion().then(m => {
      if (!mem.active || !mem.countSteps || !m || Date.now() - m.at > 45000) return;
      if (m.kind === 'vehicle' && m.confidence >= 75) {
        mem.motion = 'vehicle'; mem.pauseReason = 'Likely vehicle travel. Steps are excluded.';
        if (!mem.paused) { mem.paused = true; mem.pausedSince = Date.now(); }
      } else if (m.confidence >= 75 && ['walking', 'running', 'on_foot'].includes(m.kind)) {
        confirmResume(Date.now());
        if (!mem.paused) mem.motion = m.kind === 'running' ? 'running' : 'walking';
      }
    });
    kvSetStrict('tracking.pause', { startTime: mem.startTime, total: mem.pausedTotalMs, since: mem.pausedSince, observedAt: mem.lastObservedAt, intervals: mem.pauseIntervals });
    // Splits: announced here while the app runs, by the location task otherwise.
    if (mem.usingGps) runOutdoorTick({ foreground: AppState.currentState === 'active' });

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

  let dayBefore: number;
  try {
    dayBefore = getDailySteps()?.stepCount ?? 0;
  } catch {
    dayBefore = 0;
  }
  const dayTotal = Math.max(dayBefore, sessionSteps);

  const bar = progressBarWithPct(dayTotal / DAILY_STEP_GOAL);
  const icon = mem.paused ? '⏸' : !mem.countSteps ? '🚴' : mem.mode === 'run' ? '🏃' : '🚶';
  const title = mem.countSteps
    ? `${icon} ${sessionSteps.toLocaleString()} steps · ${(distanceM / 1000).toFixed(2)} km`
    : `${icon} ${(distanceM / 1000).toFixed(2)} km`;
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

  // GPS is optional; no unobserved steps are inferred from a since-boot baseline.
  const gps = mem.gpsRequested && await startRouteTracking(mode, activityFor(mem.activity).label.toLowerCase());
  if (!stillMine()) return;
  mem.usingGps = gps;

  // A ride needs GPS and nothing else: no motion permission, no step counter.
  if (!mem.countSteps) {
    livePermissions = { motion: false, notifications: await requestNotificationPermission(), gps, hardware: false };
    mem.source = 'gps';
    patchLiveWalk({ source: 'gps' });
    void pushWalkNotification(total());
    return;
  }

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

  if (perms.motion) {
    startStepMonitoring();
    const observed = nativeDailySteps();
    if (observed) kvSetStrict('tracking.observedBaseline', {startTime:mem.startTime,value:observed.observedTotal - total()});
    await startMotionRecognition();
    if (!gps) startStepService();
  }
  perms.gps = gps;
  perms.hardware = hardware;
  livePermissions = perms;

  const source: Source = hardware ? 'pedometer' : gps ? 'gps' : 'accelerometer';
  mem.source = source;
  patchLiveWalk({ source });
  void pushWalkNotification(total());
}

export async function startWalkTracking(mode: 'walk' | 'run', activityKey?: string, useGps = true): Promise<WalkPermissions> {
  // ── Synchronous part: the session is live before this function returns, so the
  // UI can switch to the tracking view with zero delay. ──
  livePermissions = null;
  const activity = activityFor(activityKey ?? mode);
  startLiveWalk({ mode, source: activity.gait === 'none' ? 'gps' : 'accelerometer', activity: activity.key });
  mem.active = true;
  mem.gpsRequested = useGps;
  kvSetStrict('tracking.gpsRequested', useGps);
  mem.mode = mode;
  mem.activity = activity.key;
  mem.countSteps = activity.gait !== 'none';
  motionWindow.reset();
  mem.source = activity.gait === 'none' ? 'gps' : 'accelerometer';
  mem.hardware = false;
  mem.startTime = getLiveWalk()!.startTime!;
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
  mem.pauseIntervals = [];
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
  if (!row?.active || !row.startTime || row.activity === 'session') return;

  const activity = activityFor(row.activity ?? row.mode);
  const countSteps = activity.gait !== 'none';
  /*
   * Whether the hardware counter can be used is a question for the permission,
   * not for what the row happened to say. A session backgrounded while the
   * "Physical activity" dialog was still open was saved as 'accelerometer' and,
   * on return, stayed on the accelerometer for good — which stops counting the
   * moment the screen goes off. Ask the permission itself.
   */
  let motionGranted: boolean;
  try {
    const perm = await Pedometer.getPermissionsAsync();
    motionGranted = perm.granted || perm.status === 'granted';
  } catch {
    motionGranted = row.source !== 'accelerometer';
  }
  const hardware = countSteps && motionGranted && ((await isPedometerAvailable()) || hasHardwareStepCounter());
  const gpsLive = await isRouteTrackingActive();
  mem.active = true;
  mem.gpsRequested = kvGet<boolean>('tracking.gpsRequested') ?? true;
  mem.mode = row.mode;
  mem.activity = activity.key;
  mem.countSteps = countSteps;
  motionWindow.reset();
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

  const gate = liveTrackingGate();
  const restoredClock = restoreWalkClock(row.startTime, Date.now(), row.updatedAt ?? row.startTime,
    kvGet<SavedWalkPause>('tracking.pause'), gate.last?.at, gate.excludedMs, gate.excludedIntervals);
  mem.pausedTotalMs = restoredClock.total;
  mem.pauseIntervals = restoredClock.intervals;
  mem.pausedSince = restoredClock.since;
  mem.paused = restoredClock.since != null;
  if (motionGranted) { startStepMonitoring(); await startMotionRecognition(); if (!gpsLive) startStepService(); }
  // If the GPS service died, restart only when it was requested.
  if (mem.gpsRequested && !gpsLive) {
    mem.usingGps = await startRouteTracking(row.mode, activity.label.toLowerCase());
  }
  if (hardware && row.source === 'accelerometer') {
    mem.source = 'pedometer';
    patchLiveWalk({ source: 'pedometer' });
  }

  attachSensors();
  // Reconcile only sensor observations; do not estimate missing strides.
  await reconcileSteps();

  void pushWalkNotification(total(), { create: true });
}

export interface WalkResult {
  mode: 'walk' | 'run';
  activity: string;
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
  stopStepService();
  void stopMotionRecognition();
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
  motionWindow.reset();

  if (!snapshot) return null;

  const heightCm = useUserStore.getState().user?.heightCm ?? 175;
  const riding = activityFor(snapshot.activity).gait === 'none';
  const steps = riding ? 0 : snapshot.steps;
  // GPS distance is truth; fall back to step-estimated distance (never for a ride).
  const distanceM =
    snapshot.gpsDistanceM > 0 ? snapshot.gpsDistanceM : riding ? 0 : distanceFromSteps(steps, heightCm, snapshot.mode);

  return {
    mode: snapshot.mode,
    activity: snapshot.activity,
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
    stopStepService();
    await stopMotionRecognition();
    await dismissOngoingNotification('walk');
    // A GPS foreground service with no live session behind it — shut it down.
    if (await isRouteTrackingActive()) await stopRouteTracking();
  }
}
