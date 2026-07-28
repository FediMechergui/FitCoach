/**
 * GPS distance for ordinary sessions — hiking, cycling, a wander, a paddle.
 *
 * Walks and runs get GPS through walkTracking. Everything else (an Outdoor,
 * Cardio or Sport session) previously had no way to measure distance except
 * typing it in. This exposes the same proven mechanism — expo-location's
 * foreground service writing fixes into the live route row — to any session.
 *
 * Two deliberate constraints:
 *  • Only one GPS trace can run at a time, because there is a single live-route
 *    row and a single location task. A walk/run already tracking wins; this
 *    refuses rather than corrupting either trace.
 *  • Distance is measured, but steps are NOT inferred here. Cycling and paddling
 *    cover ground without stepping, so the caller decides whether the activity is
 *    on foot (see the "On foot" toggle and lib/activitySteps).
 */
import {
  endLiveWalk,
  getLiveRoute,
  getLiveRouteDistanceM,
  getLiveWalk,
  startLiveWalk,
} from '@/repositories/activityRepo';
import { isRouteTrackingActive, startRouteTracking, stopRouteTracking } from './locationTracking';
import type { LatLng } from '@/lib/geo';

export interface SessionGpsResult {
  distanceM: number;
  route: LatLng[];
}

/** True when a walk/run is already using the GPS trace, so a session can't. */
export function isGpsBusyWithWalk(): boolean {
  const row = getLiveWalk();
  return !!row?.active;
}

/**
 * Start tracing a session's route. Returns false when GPS is unavailable, denied,
 * or already in use by a live walk/run.
 */
export async function startSessionGps(): Promise<boolean> {
  if (isGpsBusyWithWalk()) return false;
  // The live row doubles as the route sink; 'walk' keeps its step maths sane for
  // on-foot activities, and it's ignored entirely for wheeled ones.
  startLiveWalk({ mode: 'walk', source: 'gps' });
  const started = await startRouteTracking('walk');
  if (!started) {
    endLiveWalk();
    return false;
  }
  return true;
}

/** Live distance so far (metres) — 0 when nothing is being traced. */
export function sessionGpsDistanceM(): number {
  return getLiveWalk()?.active ? getLiveRouteDistanceM() : 0;
}

/** Live route so far, for drawing the path. */
export function sessionGpsRoute(): LatLng[] {
  return getLiveWalk()?.active ? getLiveRoute() : [];
}

export async function isSessionGpsActive(): Promise<boolean> {
  return (await isRouteTrackingActive()) && !!getLiveWalk()?.active;
}

/** Stop tracing and hand back the final distance and path. */
export async function stopSessionGps(): Promise<SessionGpsResult> {
  const distanceM = Math.round(sessionGpsDistanceM());
  const route = sessionGpsRoute();
  await stopRouteTracking();
  endLiveWalk();
  return { distanceM, route };
}
