import { AppState, type AppStateStatus } from 'react-native';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { Pedometer } from 'expo-sensors';
import { getDailySteps, setDailySteps } from '@/repositories/activityRepo';
import { kvGet, kvSet } from '@/repositories/kvRepo';
import { distanceFromSteps } from '@/lib/pedometer';
import { walkCalories } from '@/lib/met';
import { todayISO } from '@/lib/date';
import { getUser, latestWeight } from '@/repositories/userRepo';
import { getStepsSinceBoot } from '../../modules/step-counter';

/**
 * Passive all-day step counter (spec §3.4) — the part of "always on" that
 * never needs a session: the hardware counter ticks by itself, and this
 * module banks its reading into daily_step_logs so the step ring stays
 * current even when no explicit walk is running.
 *
 * Two readers, by platform reality:
 *  • iOS — `Pedometer.getStepCountAsync(start, end)` answers directly.
 *  • Android — that API throws (it is iOS-only), which silently killed this
 *    feature for every Android user: the task fired every 30 minutes and
 *    wrote nothing, so the ring only ever moved during explicit sessions.
 *    The native step-counter module reads the sensor's absolute since-boot
 *    value instead; an anchor persisted in app_kv turns it into a daily
 *    count that survives reboots (reboot resets the sensor to ~0 — the
 *    anchor banks what the day had and re-bases).
 *
 * The daily value only ever RAISES the stored total (a session may already
 * have contributed on top of what the sensor saw), so no path here can erase
 * a walk you finished.
 */
export const DAILY_STEPS_TASK = 'fitcoach-daily-steps';

/** Persisted sensor anchor for the current day. */
interface StepAnchor {
  date: string;
  /** sensor reading at the start of the day (after any reboot re-base) */
  base: number;
  /** last reading seen — a smaller new reading means the device rebooted */
  last: number;
  /** steps banked before a mid-day reboot reset the sensor */
  banked: number;
}

const KV_ANCHOR = 'daily-steps-anchor';

/** Today's steps according to the hardware counter, via the persisted anchor. */
async function sensorDailySteps(): Promise<number | null> {
  const reading = await getStepsSinceBoot();
  if (reading == null) return null;
  const today = todayISO();
  let a = kvGet<StepAnchor>(KV_ANCHOR);
  if (!a || a.date !== today) {
    // New day: whatever the sensor holds now is the day's zero.
    a = { date: today, base: reading, last: reading, banked: 0 };
  } else if (reading < a.last) {
    // Reboot: the counter restarted. Bank what the day already had; steps
    // counted since boot all happened today (the boot was today).
    a = { date: today, base: 0, last: reading, banked: a.banked + Math.max(0, a.last - a.base) };
  } else {
    a = { ...a, last: reading };
  }
  kvSet(KV_ANCHOR, a);
  return a.banked + Math.max(0, a.last - a.base);
}

TaskManager.defineTask(DAILY_STEPS_TASK, async () => {
  try {
    const wrote = await syncTodaySteps();
    return wrote > 0
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/** Read today's hardware step count and persist it to the daily log. */
export async function syncTodaySteps(): Promise<number> {
  // iOS path: the range API answers directly.
  let steps = 0;
  const available = await Pedometer.isAvailableAsync().catch(() => false);
  if (available) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const result = await Pedometer.getStepCountAsync(start, new Date()).catch(() => null);
    steps = result?.steps ?? 0;
  }
  // Android path: the range API throws there — read the absolute counter.
  if (steps <= 0) {
    steps = (await sensorDailySteps()) ?? 0;
  }
  if (steps <= 0) return 0;

  // Floor-only: never erase what sessions already contributed on top.
  const existing = getDailySteps()?.stepCount ?? 0;
  if (steps <= existing) return 0;

  const user = getUser();
  const heightCm = user?.heightCm ?? 175;
  const weightKg = latestWeight()?.weightKg ?? 75;
  const distanceM = distanceFromSteps(steps, heightCm, 'walk');
  const calories = walkCalories({ weightKg, distanceM, durationSec: 0, steps });
  setDailySteps(todayISO(), steps, distanceM, calories);
  return steps;
}

export async function registerBackgroundSteps(): Promise<void> {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    if (
      status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
      status === BackgroundFetch.BackgroundFetchStatus.Denied
    ) {
      return;
    }
    const already = await TaskManager.isTaskRegisteredAsync(DAILY_STEPS_TASK);
    if (!already) {
      await BackgroundFetch.registerTaskAsync(DAILY_STEPS_TASK, {
        minimumInterval: 60 * 30, // 30 min
        stopOnTerminate: false,
        startOnBoot: true,
      });
    }
  } catch {
    // Background fetch may be unavailable (e.g. Expo Go / emulator) — non-fatal.
  }
}

let foregroundSyncSub: { remove: () => void } | null = null;

/**
 * Keep the ring live while the app is open too: sync at startup and every
 * return to the foreground, not just on the 30-minute background cadence.
 */
export function initStepSync(): void {
  void syncTodaySteps().catch(() => {});
  if (!foregroundSyncSub) {
    foregroundSyncSub = AppState.addEventListener('change', (st: AppStateStatus) => {
      if (st === 'active') void syncTodaySteps().catch(() => {});
    });
  }
}
