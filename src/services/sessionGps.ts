/**
 * GPS distance for ordinary sessions — hiking, cycling, a wander, a paddle,
 * and since 3.8.0 the GPS laps of any distance exercise inside a session.
 *
 * Walks and runs get GPS through walkTracking. Everything else (an Outdoor,
 * Cardio or Sport session, or a track workout logged rep by rep) uses the
 * same proven mechanism — expo-location's foreground service writing fixes
 * into the live route row.
 *
 * Constraints that stay:
 *  • Only one GPS trace can run at a time (one live-route row, one location
 *    task). A walk/run already tracking wins; this refuses rather than
 *    corrupting either trace.
 *  • Distance is measured, but steps are NOT inferred here. Cycling and paddling
 *    cover ground without stepping, so the caller decides whether the activity is
 *    on foot (see the "On foot" toggle and lib/activitySteps).
 *
 * What changed in 3.8.0: the trace belongs to the SESSION, recorded in a
 * marker (repositories/outdoorRepo), not to the screen. Leaving the session
 * screen used to forget that GPS was on — the trace kept running, the screen
 * said "off", refused to start a new one, and the distance was lost at the end.
 */
import {
  endLiveWalk,
  getLiveRoute,
  getLiveRouteDistanceM,
  getLiveWalk,
  startLiveWalk,
} from '@/repositories/activityRepo';
import { isRouteTrackingActive, startRouteTracking, stopRouteTracking } from './locationTracking';
import { saveLapState, sessionGpsMarker, setSessionGpsMarker } from '@/repositories/outdoorRepo';
import type { LatLng } from '@/lib/geo';

export interface SessionGpsResult {
  distanceM: number;
  route: LatLng[];
}

/** True when a walk/run (not this session) is using the GPS trace. */
export function isGpsBusyWithWalk(sessionId?: number | null): boolean {
  const row = getLiveWalk();
  if (!row?.active) return false;
  const m = sessionGpsMarker();
  return !(m && sessionId != null && m.sessionId === sessionId);
}

/** Is this session's trace running right now? Survives leaving the screen and restarts. */
export function isSessionGpsOn(sessionId: number | null | undefined): boolean {
  if (sessionId == null) return false;
  const m = sessionGpsMarker();
  return !!m && m.sessionId === sessionId && !!getLiveWalk()?.active;
}

/**
 * Start tracing a session's route. Returns false when GPS is unavailable, denied,
 * or already in use by a live walk/run.
 */
export async function startSessionGps(sessionId: number): Promise<boolean> {
  if (isSessionGpsOn(sessionId)) return true;
  if (isGpsBusyWithWalk(sessionId)) return false;
  // The live row doubles as the route sink; 'walk' keeps its step maths sane for
  // on-foot activities, and it's ignored entirely for wheeled ones.
  startLiveWalk({ mode: 'walk', source: 'gps', activity: 'session' });
  setSessionGpsMarker({ sessionId, startedAt: Date.now() });
  const started = await startRouteTracking('walk', 'session');
  if (!started) {
    endLiveWalk();
    setSessionGpsMarker(null);
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

/** Stop tracing and hand back the final distance and path. Clears any laps. */
export async function stopSessionGps(): Promise<SessionGpsResult> {
  const distanceM = Math.round(sessionGpsDistanceM());
  const route = sessionGpsRoute();
  await stopRouteTracking();
  endLiveWalk();
  setSessionGpsMarker(null);
  saveLapState(null);
  return { distanceM, route };
}

/**
 * Startup hygiene for a session trace whose session is gone (discarded, or
 * finished by a crash): stop the service so it cannot run for days.
 */
export async function cleanupOrphanSessionGps(activeSessionId: number | null): Promise<void> {
  const m = sessionGpsMarker();
  if (!m) return;
  if (activeSessionId !== m.sessionId) await stopSessionGps();
}
