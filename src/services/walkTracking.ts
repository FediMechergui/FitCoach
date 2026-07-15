import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Accelerometer, Pedometer } from 'expo-sensors';
import {
  endLiveWalk,
  getLiveWalk,
  patchLiveWalk,
  startLiveWalk,
} from '@/repositories/activityRepo';
import { StepDetector, distanceFromSteps } from '@/lib/pedometer';
import { useUserStore } from '@/stores/userStore';

/**
 * Background-capable walk/run tracking.
 *
 * The core problem: Expo pauses the JS runtime (and therefore Pedometer /
 * Accelerometer listeners) once the app is backgrounded, so counting stops when
 * the screen turns off. The fix is a **foreground service**: expo-location's
 * `startLocationUpdatesAsync({ foregroundService })` keeps a persistent
 * notification and delivers location updates to a TaskManager task *even when
 * the app is backgrounded or the screen is off*.
 *
 * Distance is accumulated from GPS in that background task (reliable in the
 * background). Steps come from the hardware pedometer while the app is in the
 * foreground and are back-filled from distance × stride length otherwise, so the
 * step count never freezes. Everything is persisted to the `live_walks` row so
 * the UI (which only runs in the foreground) can poll it and nothing is lost.
 */

export const WALK_LOCATION_TASK = 'fitcoach-walk-location';

// ── Background location task (runs even when the app is backgrounded) ─────────
TaskManager.defineTask(WALK_LOCATION_TASK, async ({ data, error }) => {
  if (error) return;
  const locations = (data as { locations?: Location.LocationObject[] } | undefined)?.locations;
  if (!locations || locations.length === 0) return;

  const live = getLiveWalk();
  if (!live || !live.active) return;

  let distanceM = live.distanceM;
  let lastLat = live.lastLat;
  let lastLng = live.lastLng;

  for (const loc of locations) {
    const { latitude, longitude, accuracy } = loc.coords;
    // Ignore very inaccurate fixes to avoid GPS jitter inflating distance.
    if (accuracy != null && accuracy > 30) {
      lastLat = latitude;
      lastLng = longitude;
      continue;
    }
    if (lastLat != null && lastLng != null) {
      const step = haversineMeters(lastLat, lastLng, latitude, longitude);
      // Reject tiny jitter and impossible jumps.
      if (step >= 1 && step < 200) distanceM += step;
    }
    lastLat = latitude;
    lastLng = longitude;
  }

  // Back-fill steps from distance if the pedometer hasn't updated in background.
  const heightCm = 175; // background context has no store; a fair default
  const impliedSteps = distanceFromSteps(1, heightCm, live.mode) > 0
    ? Math.round(distanceM / distanceFromSteps(1, heightCm, live.mode))
    : live.steps;
  const steps = Math.max(live.steps, impliedSteps);

  patchLiveWalk({ distanceM: Math.round(distanceM), lastLat, lastLng, steps });
});

// ── Foreground pedometer / accelerometer subscription ────────────────────────
type Sub = { remove: () => void };
let pedoSub: Sub | null = null;
let accelSub: Sub | null = null;
let detector: StepDetector | null = null;

export interface WalkPermissions {
  motion: boolean; // pedometer / activity recognition
  location: boolean; // foreground
  background: boolean; // background location (enables screen-off tracking)
}

/** Request every permission a fully-backgrounded walk needs. */
export async function requestWalkPermissions(): Promise<WalkPermissions> {
  let motion = false;
  try {
    const p = await Pedometer.requestPermissionsAsync();
    motion = p.granted || p.status === 'granted';
  } catch {
    motion = false;
  }

  let location = false;
  let background = false;
  try {
    const fg = await Location.requestForegroundPermissionsAsync();
    location = fg.granted;
    if (location) {
      // Background permission is what lets the foreground service keep tracking
      // with the screen off. Requesting it is best-effort — the OS may require
      // the user to pick "Allow all the time" in settings.
      const bg = await Location.requestBackgroundPermissionsAsync();
      background = bg.granted;
    }
  } catch {
    // location unavailable — foreground-only pedometer tracking still works
  }

  return { motion, location, background };
}

async function isPedometerAvailable(): Promise<boolean> {
  try {
    return await Pedometer.isAvailableAsync();
  } catch {
    return false;
  }
}

/**
 * Start tracking. Requests permissions, starts the foreground-service location
 * updates (if permitted) and the pedometer/accelerometer step source.
 */
export async function startWalkTracking(mode: 'walk' | 'run'): Promise<WalkPermissions> {
  const perms = await requestWalkPermissions();
  const hardware = perms.motion && (await isPedometerAvailable());
  const source: 'pedometer' | 'accelerometer' | 'gps' = hardware
    ? 'pedometer'
    : perms.location
      ? 'gps'
      : 'accelerometer';

  startLiveWalk({ mode, source });

  // Step source (foreground).
  if (hardware) {
    pedoSub = Pedometer.watchStepCount((result) => {
      const live = getLiveWalk();
      if (live?.active) patchLiveWalk({ steps: result.steps });
    });
  } else {
    detector = new StepDetector();
    Accelerometer.setUpdateInterval(20);
    accelSub = Accelerometer.addListener(({ x, y, z }) => {
      if (detector?.onSample(x, y, z, Date.now())) {
        const live = getLiveWalk();
        if (live?.active) patchLiveWalk({ steps: live.steps + 1 });
      }
    });
  }

  // Background distance via the foreground-service location task.
  if (perms.location) {
    try {
      const already = await Location.hasStartedLocationUpdatesAsync(WALK_LOCATION_TASK).catch(() => false);
      if (already) await Location.stopLocationUpdatesAsync(WALK_LOCATION_TASK).catch(() => {});
      await Location.startLocationUpdatesAsync(WALK_LOCATION_TASK, {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 2000,
        distanceInterval: 5,
        pausesUpdatesAutomatically: false,
        activityType: Location.ActivityType.Fitness,
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: `FitCoach — tracking your ${mode}`,
          notificationBody: 'Steps and distance are being recorded, even with the screen off.',
          notificationColor: '#4F8CFF',
          killServiceOnDestroy: false,
        },
      });
    } catch {
      // If the foreground service can't start, foreground-only tracking remains.
    }
  }

  return perms;
}

export interface WalkResult {
  mode: 'walk' | 'run';
  steps: number;
  distanceM: number;
  durationS: number;
  startTime: number;
  source: 'pedometer' | 'accelerometer' | 'gps';
}

/** Stop tracking and return the final tally (does not persist a WalkSession). */
export async function stopWalkTracking(): Promise<WalkResult | null> {
  const live = getLiveWalk();

  // Tear down the step source.
  pedoSub?.remove();
  pedoSub = null;
  accelSub?.remove();
  accelSub = null;
  detector = null;

  // Stop the foreground service.
  try {
    const started = await Location.hasStartedLocationUpdatesAsync(WALK_LOCATION_TASK).catch(() => false);
    if (started) await Location.stopLocationUpdatesAsync(WALK_LOCATION_TASK);
  } catch {
    // ignore
  }

  endLiveWalk();
  if (!live || !live.startTime) return null;

  // Reconcile steps with distance one last time (covers deep-background gaps).
  const heightCm = useUserStore.getState().user?.heightCm ?? 175;
  const strideM = distanceFromSteps(1, heightCm, live.mode) || 0.75;
  const steps = Math.max(live.steps, live.distanceM > 0 ? Math.round(live.distanceM / strideM) : live.steps);
  const distanceM = live.distanceM > 0 ? live.distanceM : distanceFromSteps(live.steps, heightCm, live.mode);

  return {
    mode: live.mode,
    steps,
    distanceM: Math.round(distanceM),
    durationS: Math.max(1, Math.round((Date.now() - live.startTime) / 1000)),
    startTime: live.startTime,
    source: live.source,
  };
}

/** On app launch, stop any orphaned foreground service from a crash/kill. */
export async function cleanupOrphanWalk(): Promise<void> {
  const live = getLiveWalk();
  if (live?.active) return; // a real session may be resuming
  try {
    const started = await Location.hasStartedLocationUpdatesAsync(WALK_LOCATION_TASK).catch(() => false);
    if (started) await Location.stopLocationUpdatesAsync(WALK_LOCATION_TASK);
  } catch {
    // ignore
  }
}

// Haversine great-circle distance in metres.
function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}
