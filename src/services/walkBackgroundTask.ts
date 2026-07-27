import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { Pedometer } from 'expo-sensors';
import { Platform } from 'react-native';
import { patchLiveWalk, getLiveWalk } from '@/repositories/activityRepo';

/**
 * Android-focused background step tracking using TaskManager + Location updates.
 *
 * Strategy: We can't run arbitrary JS on a 10-second interval when the app is
 * killed, BUT we CAN piggyback on location updates which fire frequently during
 * a GPS session. For walks without GPS, we use a rapid location update task that
 * triggers our step counter checkpoint logic.
 *
 * Key insight: Android's TYPE_STEP_COUNTER gives us a cumulative count since boot.
 * We store the baseline at session start, then on each background wake we calculate
 * the delta: (current_cumulative - baseline) = session_steps.
 *
 * This task runs in the background even when the app is killed, as long as the
 * location task is registered.
 */

const WALK_STEP_BG_TASK = 'WALK_STEP_BACKGROUND';

// Track the last known cumulative step count to detect changes
let lastCumulativeSteps = 0;

/**
 * Background task that runs on location updates. For Android, this provides
 * the hook we need to read the hardware step counter while backgrounded.
 */
TaskManager.defineTask(WALK_STEP_BG_TASK, async ({ data, error }: any) => {
  if (error) {
    console.error('[BG Task] Error:', error);
    return;
  }

  // Only Android needs this background step tracking logic
  if (Platform.OS !== 'android') {
    return;
  }

  try {
    // Check if there's an active walk session
    const liveWalk = getLiveWalk();
    if (!liveWalk?.active || !liveWalk.startTime) {
      return;
    }

    // Read the hardware step counter's cumulative value since boot
    // This is the key: TYPE_STEP_COUNTER persists at the OS level
    const subscription = Pedometer.watchStepCount((result) => {
      const cumulativeSteps = result.steps;

      // Only update if the count actually changed (avoid redundant DB writes)
      if (cumulativeSteps === lastCumulativeSteps) {
        return;
      }
      lastCumulativeSteps = cumulativeSteps;

      // Calculate session steps: current cumulative - baseline at session start
      const baselineSteps = liveWalk.androidBaselineSteps ?? 0;
      const sessionSteps = Math.max(0, cumulativeSteps - baselineSteps);

      // Store checkpoint in database
      patchLiveWalk({
        steps: sessionSteps,
        updatedAt: Date.now(),
        androidCurrentCumulative: cumulativeSteps,
      });

      // Clean up the subscription immediately after reading
      subscription.remove();
    });

    // Give the sensor a moment to fire, then clean up
    setTimeout(() => {
      try {
        subscription.remove();
      } catch {
        // Already removed
      }
    }, 500);
  } catch (error) {
    console.error('[BG Task] Step counter error:', error);
  }
});

/**
 * Register the background step tracking task. Uses location updates as the
 * trigger mechanism, configured for high-frequency updates (~10 seconds).
 */
export async function registerWalkBackgroundTask(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false; // iOS uses a different strategy
  }

  try {
    // Check if already registered
    const isRegistered = await TaskManager.isTaskRegisteredAsync(WALK_STEP_BG_TASK);
    if (isRegistered) {
      return true;
    }

    // Request background location permission (required for background tasks)
    const { status } = await Location.requestBackgroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn('[BG Task] Background location permission denied');
      return false;
    }

    // Register the task with location updates as trigger
    // This runs even when the app is killed
    await Location.startLocationUpdatesAsync(WALK_STEP_BG_TASK, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 10000, // 10 seconds - this is our target interval
      distanceInterval: 0, // Fire on time interval, not distance
      foregroundService: {
        notificationTitle: 'Step Tracking Active',
        notificationBody: 'Counting your steps in the background',
        notificationColor: '#4CAF50',
      },
      pausesUpdatesAutomatically: false, // Keep running even when stationary
      activityType: Location.ActivityType.Fitness,
      showsBackgroundLocationIndicator: false,
    });

    console.log('[BG Task] Background step tracking registered');
    return true;
  } catch (error) {
    console.error('[BG Task] Failed to register:', error);
    return false;
  }
}

/**
 * Unregister the background step tracking task and clean up resources.
 */
export async function unregisterWalkBackgroundTask(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(WALK_STEP_BG_TASK);
    if (isRegistered) {
      await Location.stopLocationUpdatesAsync(WALK_STEP_BG_TASK);
      console.log('[BG Task] Background step tracking unregistered');
    }
  } catch (error) {
    console.error('[BG Task] Failed to unregister:', error);
  }

  // Reset state
  lastCumulativeSteps = 0;
}

/**
 * Check if the background task is currently active.
 */
export async function isWalkBackgroundTaskActive(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    return await TaskManager.isTaskRegisteredAsync(WALK_STEP_BG_TASK);
  } catch {
    return false;
  }
}

/**
 * Get the current cumulative step count from the hardware sensor.
 * This is the baseline we'll use to calculate session deltas.
 */
export async function getCurrentCumulativeSteps(): Promise<number> {
  return new Promise((resolve) => {
    try {
      const subscription = Pedometer.watchStepCount((result) => {
        subscription.remove();
        resolve(result.steps);
      });

      // Timeout fallback
      setTimeout(() => {
        try {
          subscription.remove();
        } catch {}
        resolve(0);
      }, 1000);
    } catch {
      resolve(0);
    }
  });
}
