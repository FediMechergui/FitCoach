import { getWalkSession } from './activityRepo';
import { getSessionDetail } from './sessionRepo';
import { parseRoute, type LatLng } from '@/lib/geo';
import { activityFor } from '@/lib/outdoorActivities';
import { metaFor } from '@/constants/sessionTypes';
import { formatLapDistance } from '@/lib/gpsLaps';
import type { RouteSegment } from '@/components/RealRouteMap';

/**
 * A finished route, ready to be drawn and shared — from either place one is
 * kept: a walk/run/hike/ride (walk_sessions) or a training session that ran
 * GPS (sessions.route_json, 3.8.0), with its GPS laps picked out.
 */
export interface ShareableRoute {
  kind: 'walk' | 'session';
  id: number;
  title: string;
  startTime: number;
  route: LatLng[];
  distanceM: number;
  /** moving time, seconds */
  durationS: number;
  paceSPerKm: number | null;
  calories: number | null;
  steps: number | null;
  segments: RouteSegment[];
  /** "6 × 400 m" when the session was GPS laps */
  extra: string | null;
}

function partOfDay(ts: number): string {
  const h = new Date(ts).getHours();
  if (h < 5) return 'Night';
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  if (h < 21) return 'Evening';
  return 'Night';
}

export function shareableWalk(id: number): ShareableRoute | null {
  const w = getWalkSession(id);
  if (!w) return null;
  const activity = activityFor(w.activity ?? w.mode);
  // Moving time is what the pace was measured on; recover it from the pace.
  const moving = w.avgPace && w.distanceM > 0 ? Math.round(w.avgPace * (w.distanceM / 1000)) : w.durationS;
  return {
    kind: 'walk',
    id,
    title: `${partOfDay(w.startTime)} ${activity.label.toLowerCase()}`,
    startTime: w.startTime,
    route: parseRoute(w.routeJson),
    distanceM: w.distanceM,
    durationS: Math.max(1, Math.min(moving, w.durationS || moving)),
    paceSPerKm: w.avgPace ?? (w.distanceM > 0 && w.durationS > 0 ? w.durationS / (w.distanceM / 1000) : null),
    calories: Math.round(w.caloriesBurned),
    steps: activity.gait === 'none' ? null : w.steps,
    segments: [],
    extra: null,
  };
}

export function shareableSession(id: number): ShareableRoute | null {
  let detail;
  try {
    detail = getSessionDetail(id);
  } catch {
    return null;
  }
  const s = detail.session;
  const route = parseRoute(s.routeJson);
  const segments: RouteSegment[] = [];
  const lapLines: string[] = [];
  for (const lv of detail.logs) {
    const laps = lv.sets.filter((x) => x.gpsFrom != null && x.gpsTo != null && x.gpsTo > x.gpsFrom!);
    for (const x of laps) segments.push({ from: x.gpsFrom!, to: x.gpsTo!, label: lv.exerciseName });
    if (laps.length > 1) {
      const dists = laps.map((x) => Math.round(x.distanceM ?? 0));
      const same = dists.every((d) => Math.abs(d - dists[0]) <= Math.max(10, dists[0] * 0.03));
      lapLines.push(same ? `${laps.length} × ${formatLapDistance(dists[0])}` : `${laps.length} GPS reps`);
    }
  }
  const distanceM = s.distanceM ?? 0;
  const durationS = s.durationS ?? 0;
  return {
    kind: 'session',
    id,
    title: s.label ?? `${partOfDay(s.startTime)} ${metaFor(s.sessionType).label.toLowerCase()}`,
    startTime: s.startTime,
    route,
    distanceM,
    durationS: Math.max(1, durationS),
    paceSPerKm: s.pace ?? (distanceM > 0 && durationS > 0 ? durationS / (distanceM / 1000) : null),
    calories: s.caloriesBurned != null ? Math.round(s.caloriesBurned) : null,
    steps: s.stepsAdded ?? null,
    segments,
    extra: lapLines.length ? lapLines.join(' · ') : null,
  };
}
