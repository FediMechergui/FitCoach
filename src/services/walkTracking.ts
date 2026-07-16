import { Accelerometer, Pedometer } from 'expo-sensors';
import {
  endLiveWalk,
  getLiveWalk,
  patchLiveWalk,
  startLiveWalk,
} from '@/repositories/activityRepo';
import { StepDetector, distanceFromSteps } from '@/lib/pedometer';
import { useUserStore } from '@/stores/userStore';
import {
  dismissOngoingNotification,
  requestNotificationPermission,
  showOngoingNotification,
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
  dirty: false,
};

export interface WalkPermissions {
  motion: boolean;
  notifications: boolean;
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
  return { motion, notifications };
}

async function isPedometerAvailable(): Promise<boolean> {
  try {
    return await Pedometer.isAvailableAsync();
  } catch {
    return false;
  }
}

/** Current live numbers — memory first (fresh), DB as fallback after restarts. */
export function getLiveSnapshot(): { active: boolean; mode: 'walk' | 'run'; source: Source; startTime: number; steps: number } | null {
  if (mem.active) {
    return { active: true, mode: mem.mode, source: mem.source, startTime: mem.startTime, steps: mem.baseSteps + mem.steps };
  }
  const row = getLiveWalk();
  if (row?.active && row.startTime) {
    return { active: true, mode: row.mode, source: row.source, startTime: row.startTime, steps: row.steps };
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

  // Crash-safe backup: persist at most every 3 s, and only when changed.
  flushTimer = setInterval(() => {
    if (mem.dirty && mem.active) {
      patchLiveWalk({ steps: mem.baseSteps + mem.steps });
      mem.dirty = false;
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
  const source: Source = hardware ? 'pedometer' : 'accelerometer';

  startLiveWalk({ mode, source });
  mem.active = true;
  mem.mode = mode;
  mem.source = source;
  mem.startTime = Date.now();
  mem.baseSteps = 0;
  mem.steps = 0;
  mem.dirty = false;

  attachSensors(hardware);

  void showOngoingNotification(
    'walk',
    `FitCoach — ${mode === 'run' ? 'run' : 'walk'} in progress`,
    hardware
      ? 'Steps keep counting, even with the screen off. Return to finish.'
      : 'Counting with the accelerometer — keep the app open for accuracy.'
  );

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

  const hardware = row.source === 'pedometer' && (await isPedometerAvailable());
  mem.active = true;
  mem.mode = row.mode;
  mem.source = row.source;
  mem.startTime = row.startTime;
  mem.baseSteps = row.steps;
  mem.steps = 0;
  mem.dirty = false;

  attachSensors(hardware);

  void showOngoingNotification(
    'walk',
    `FitCoach — ${row.mode === 'run' ? 'run' : 'walk'} in progress`,
    'Session resumed — return to FitCoach to finish.'
  );
}

export interface WalkResult {
  mode: 'walk' | 'run';
  steps: number;
  distanceM: number;
  durationS: number;
  startTime: number;
  source: Source;
}

/** Stop tracking and return the final tally (does not persist a WalkSession). */
export function stopWalkTracking(): WalkResult | null {
  const snapshot = getLiveSnapshot();
  detachSensors();
  endLiveWalk();
  void dismissOngoingNotification('walk');
  mem.active = false;

  if (!snapshot) return null;

  const heightCm = useUserStore.getState().user?.heightCm ?? 175;
  const steps = snapshot.steps;
  const distanceM = distanceFromSteps(steps, heightCm, snapshot.mode);

  return {
    mode: snapshot.mode,
    steps,
    distanceM: Math.round(distanceM),
    durationS: Math.max(1, Math.round((Date.now() - snapshot.startTime) / 1000)),
    startTime: snapshot.startTime,
    source: snapshot.source,
  };
}

/** Startup hygiene: clear a stale notification if no session survived a crash. */
export async function cleanupOrphanWalk(): Promise<void> {
  const live = getLiveWalk();
  if (!live?.active) {
    await dismissOngoingNotification('walk');
  }
}
