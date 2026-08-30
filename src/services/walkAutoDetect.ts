import { AppState, type AppStateStatus } from 'react-native';
import { Pedometer } from 'expo-sensors';
import {
  AUTO_STOP_PAUSED_MS,
  evaluateAutoStart,
  trimSamples,
  type StepSample,
} from '@/lib/walkAutoDetect';
import { kvGet, kvSet } from '@/repositories/kvRepo';
import { activeSession } from '@/repositories/sessionRepo';
import { useWalkStore } from '@/stores/walkStore';
import { getLiveSnapshot } from './walkTracking';

/**
 * The always-on walk watcher — the service half of lib/walkAutoDetect.
 *
 * Listens to the hardware step counter whenever the app is running and starts
 * a walk session by itself once a sustained human cadence proves you're
 * actually walking. The step counter is the one sensor a vehicle can't fool:
 * sitting in a car, stopped at a light or riding over potholes produces no
 * gait, so nothing triggers — which is exactly the point.
 *
 * Honest limits, stated plainly: Android tears the step LISTENER down when the
 * app leaves the foreground, and without a session there is no foreground
 * service to keep JS alive — so detection works while the app is open or only
 * briefly backgrounded. Once a walk IS started (by you or by this watcher),
 * the session's own foreground service takes over and survives screen-off and
 * app-kill. Steps taken with the app closed still land in the daily total
 * through the passive sync (services/backgroundSteps).
 *
 * Auto-started sessions also END themselves: after five minutes with no
 * movement (parked on a couch, or in a car) the session finishes, and if it
 * never amounted to a real walk it is discarded instead of saved.
 */

const KV_ENABLED = 'auto-walk-detect';

export function autoDetectEnabled(): boolean {
  return kvGet<boolean>(KV_ENABLED) ?? true;
}

export function setAutoDetectEnabled(on: boolean): void {
  kvSet(KV_ENABLED, on);
  if (on) void startWalkWatcher();
  else stopWalkWatcher();
}

type Sub = { remove: () => void };
let watchSub: Sub | null = null;
let appStateSub: Sub | null = null;
let stopPoll: ReturnType<typeof setInterval> | null = null;
let samples: StepSample[] = [];
/** service-side view of how long an auto session has been paused */
let autoPausedSince: number | null = null;

function sessionRunning(): boolean {
  if (useWalkStore.getState().active) return true;
  if (getLiveSnapshot()?.active) return true;
  try {
    if (activeSession()) return true;
  } catch {
    // repo unavailable (e.g. before DB init) — treat as no session
  }
  return false;
}

function onSteps(cumulative: number): void {
  const now = Date.now();
  samples.push({ at: now, cumulative });
  samples = trimSamples(samples, now);

  if (sessionRunning()) return;
  const verdict = evaluateAutoStart(samples, now);
  if (!verdict.start) return;

  samples = [];
  // Backdated to when the streak began and seeded with the steps already
  // taken, so the detector's lag costs nothing.
  useWalkStore.getState().start('walk', {
    autoStarted: true,
    startedAt: verdict.sinceMs ?? now,
    seedSteps: verdict.steps,
  });
}

/** Auto-started sessions end themselves after a long stillness. */
function pollAutoStop(): void {
  const snap = getLiveSnapshot();
  if (!snap?.active || !snap.autoStarted) {
    autoPausedSince = null;
    return;
  }
  if (!snap.paused) {
    autoPausedSince = null;
    return;
  }
  autoPausedSince ??= Date.now();
  if (Date.now() - autoPausedSince >= AUTO_STOP_PAUSED_MS) {
    autoPausedSince = null;
    useWalkStore.getState().stop({ autoEnded: true });
  }
}

/**
 * Start watching for walks. Safe to call repeatedly; no-ops when the toggle is
 * off or motion permission is denied (it asks once — automatic detection is
 * the feature the permission exists for).
 */
export async function startWalkWatcher(): Promise<void> {
  if (!autoDetectEnabled()) return;
  if (watchSub) return;

  let granted = false;
  try {
    const have = await Pedometer.getPermissionsAsync();
    granted = have.granted || have.status === 'granted';
    if (!granted) {
      const asked = await Pedometer.requestPermissionsAsync();
      granted = asked.granted || asked.status === 'granted';
    }
  } catch {
    granted = false;
  }
  if (!granted) return;
  try {
    if (!(await Pedometer.isAvailableAsync())) return;
  } catch {
    return;
  }

  samples = [];
  try {
    watchSub = Pedometer.watchStepCount((r) => onSteps(r.steps));
  } catch {
    watchSub = null;
    return;
  }
  if (!stopPoll) stopPoll = setInterval(pollAutoStop, 30_000);
  if (!appStateSub) {
    // The OS drops the listener while backgrounded; re-arm on return (the
    // subscription-relative counter resets, so the buffer starts fresh too).
    appStateSub = AppState.addEventListener('change', (st: AppStateStatus) => {
      if (st === 'active' && autoDetectEnabled()) {
        stopWatchOnly();
        void startWalkWatcher();
      }
    });
  }
}

function stopWatchOnly(): void {
  watchSub?.remove();
  watchSub = null;
  samples = [];
}

export function stopWalkWatcher(): void {
  stopWatchOnly();
  if (stopPoll) {
    clearInterval(stopPoll);
    stopPoll = null;
  }
  autoPausedSince = null;
}
