import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { Pedometer } from 'expo-sensors';
import { setDailySteps } from '@/repositories/activityRepo';
import { distanceFromSteps } from '@/lib/pedometer';
import { walkCalories } from '@/lib/met';
import { todayISO } from '@/lib/date';
import { getUser, latestWeight } from '@/repositories/userRepo';

/**
 * Passive all-day step counter (spec §3.4). Registers a background-fetch task
 * that periodically snapshots the hardware pedometer for the current day and
 * writes it to daily_step_logs, so the step-goal ring stays current even when
 * no explicit "Walk" session is running.
 */
export const DAILY_STEPS_TASK = 'fitcoach-daily-steps';

TaskManager.defineTask(DAILY_STEPS_TASK, async () => {
  try {
    const available = await Pedometer.isAvailableAsync();
    if (!available) return BackgroundFetch.BackgroundFetchResult.NoData;
    await syncTodaySteps();
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/** Read today's hardware step count and persist it to the daily log. */
export async function syncTodaySteps(): Promise<number> {
  const available = await Pedometer.isAvailableAsync().catch(() => false);
  if (!available) return 0;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const result = await Pedometer.getStepCountAsync(start, new Date()).catch(() => null);
  const steps = result?.steps ?? 0;
  if (steps <= 0) return 0;

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
