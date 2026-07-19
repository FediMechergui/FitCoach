import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { appendLiveRoutePoints } from '@/repositories/activityRepo';
import type { LatLng } from '@/lib/geo';

/**
 * GPS route tracking for runs / outdoor sessions.
 *
 * Uses expo-location's Android **foreground service**: while a run is tracking,
 * the OS keeps a persistent, non-dismissible notification in the bar and keeps
 * delivering location fixes to the TaskManager task below — even when the app is
 * backgrounded or the screen is off. The task appends each fix to the live route
 * in SQLite (the only channel shared with the headless task context), so the UI
 * can draw the path as a circuit and the distance keeps climbing in the notif.
 *
 * Everything here is best-effort: on a device without GPS, in Expo Go, or if the
 * user denies location, the calls no-op and the walk/run still tracks by steps.
 */

export const ROUTE_TASK = 'fitcoach-route';

interface RouteTaskData {
  locations?: Location.LocationObject[];
}

TaskManager.defineTask(ROUTE_TASK, async ({ data, error }) => {
  if (error) return;
  const locations = (data as RouteTaskData)?.locations;
  if (!locations?.length) return;
  const points: LatLng[] = locations
    .filter((l) => l?.coords && isFinite(l.coords.latitude) && isFinite(l.coords.longitude))
    // Drop very low-accuracy fixes (>50 m) so noise doesn't warp the route.
    .filter((l) => (l.coords.accuracy ?? 999) <= 50)
    .map((l) => [l.coords.latitude, l.coords.longitude] as LatLng);
  if (points.length) {
    try {
      appendLiveRoutePoints(points);
    } catch {
      // never let a bad DB write crash the background task
    }
  }
});

export interface LocationPermissions {
  foreground: boolean;
  background: boolean;
}

export async function requestLocationPermissions(): Promise<LocationPermissions> {
  let foreground = false;
  let background = false;
  try {
    const fg = await Location.requestForegroundPermissionsAsync();
    foreground = fg.granted || fg.status === 'granted';
  } catch {
    foreground = false;
  }
  // Background is a second, separate Android prompt ("Allow all the time").
  if (foreground) {
    try {
      const bg = await Location.requestBackgroundPermissionsAsync();
      background = bg.granted || bg.status === 'granted';
    } catch {
      background = false;
    }
  }
  return { foreground, background };
}

export async function isRouteTrackingActive(): Promise<boolean> {
  try {
    return await Location.hasStartedLocationUpdatesAsync(ROUTE_TASK);
  } catch {
    return false;
  }
}

/**
 * Begin GPS route tracking with a persistent foreground-service notification.
 * Returns true if updates actually started.
 */
export async function startRouteTracking(mode: 'walk' | 'run'): Promise<boolean> {
  try {
    const perms = await requestLocationPermissions();
    if (!perms.foreground) return false;
    if (await isRouteTrackingActive()) return true;

    await Location.startLocationUpdatesAsync(ROUTE_TASK, {
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: 3000,
      distanceInterval: 5, // metres between fixes
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
      activityType: Location.ActivityType.Fitness,
      foregroundService: {
        notificationTitle: `FitCoach — ${mode === 'run' ? 'run' : 'walk'} in progress`,
        notificationBody: 'Tracking your route with GPS. Return to FitCoach to finish.',
        notificationColor: '#4F8CFF',
        killServiceOnDestroy: false,
      },
    });
    return true;
  } catch {
    // GPS unavailable / permission race / Expo Go — fall back to step tracking.
    return false;
  }
}

export async function stopRouteTracking(): Promise<void> {
  try {
    if (await isRouteTrackingActive()) {
      await Location.stopLocationUpdatesAsync(ROUTE_TASK);
    }
  } catch {
    // ignore
  }
}
