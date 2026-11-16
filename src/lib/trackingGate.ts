import { haversine, type LatLng } from './geo';
import { filterFixes, type GpsFix } from './gpsFilter';

export interface MotionEvidence { kind: string; confidence: number; at: number }
export interface TrackingGate {
  last?: GpsFix;
  vehicle: boolean;
  candidateAt?: number;
  recoveryAt?: number;
  breakNext: boolean;
  excludedMs: number;
  excludedIntervals?: [number, number][];
  speedMs: number;
}
export const newTrackingGate = (): TrackingGate => ({ vehicle: false, breakNext: false, excludedMs: 0, excludedIntervals: [], speedMs: 0 });
export const stepCreditAllowed = (state: TrackingGate): boolean => !state.vehicle && state.candidateAt == null;

/** Uses raw, timestamped fixes BEFORE distance filtering. Persist across headless callbacks. */
export function gateRoute(route: LatLng[], fixes: GpsFix[], previous: TrackingGate,
  evidence: MotionEvidence | null, riding = false): { state: TrackingGate; accepted: LatLng[]; distanceM: number } {
  const state = { ...previous, excludedIntervals: (previous.excludedIntervals ?? []).map(x => [...x] as [number,number]) };
  const exclude = (from: number, to: number) => {
    if (to <= from) return;
    state.excludedMs += to-from;
    const tail = state.excludedIntervals[state.excludedIntervals.length-1];
    if (tail && from <= tail[1]) tail[1] = Math.max(tail[1],to);
    else state.excludedIntervals.push([from,to]);
  };
  const accepted: LatLng[] = [];
  let distanceM = 0;
  for (const fix of fixes) {
    if (!Number.isFinite(fix.at) || !Number.isFinite(fix.lat) || !Number.isFinite(fix.lng)
      || Math.abs(fix.lat) > 90 || Math.abs(fix.lng) > 180 || (fix.accuracy ?? 15) > 50) continue;
    const at = fix.at!;
    const last = state.last;
    if (last?.at != null && at <= last.at) continue;
    const dt = last?.at != null ? at - last.at : 0;
    // A long outage has unknown motion: never connect it with a straight line.
    if (dt > 60_000) { state.breakNext = true; exclude(at-dt,at); }
    const positional = last && dt > 0 ? haversine([last.lat, last.lng], [fix.lat, fix.lng]) / (dt / 1000) : 0;
    const speed = fix.speed != null && fix.speed >= 0 ? fix.speed : positional;
    // A position teleport with a slow receiver speed is a bad fix, not vehicle evidence.
    if (last && dt > 0 && dt < 60_000 && fix.speed != null && fix.speed >= 0
      && positional > Math.max(riding ? 45 : 15, fix.speed * 3)
      && haversine([last.lat,last.lng],[fix.lat,fix.lng]) > Math.max(last.accuracy ?? 15,fix.accuracy ?? 15) * 2 + 10) {
      state.breakNext = true; state.last = fix; continue;
    }
    state.speedMs = speed;
    const fresh = evidence && Math.abs(at - evidence.at) < 45_000 && evidence.confidence >= 75;
    const onFoot = fresh && ['walking', 'running', 'on_foot'].includes(evidence.kind);
    const suspect = riding ? speed >= 30 : (fresh && evidence.kind === 'vehicle') || speed >= 12 || (speed >= 6 && !onFoot);
    // Hold suspicious segments immediately; require continued evidence for the vehicle banner.
    if (suspect) {
      state.candidateAt ??= at;
      if (at - state.candidateAt >= 8_000 || (fresh && evidence.kind === 'vehicle')) state.vehicle = true;
      state.breakNext = true;
      state.recoveryAt = undefined;
      if (dt <= 60_000) exclude(at-dt,at);
      state.last = fix;
      continue;
    }
    state.candidateAt = undefined;
    if (state.vehicle) {
      const plausible = onFoot || (speed > 0.3 && speed < 3.5);
      if (plausible) state.recoveryAt ??= at; else state.recoveryAt = undefined;
      if (state.recoveryAt == null || at - state.recoveryAt < 8_000) {
        if (dt <= 60_000) exclude(at-dt,at);
        state.last = fix;
        continue;
      }
      state.vehicle = false;
      state.recoveryAt = undefined;
    }
    const tail = [...route.slice(-5), ...accepted.slice(-5)];
    const split = state.breakNext;
    const result = filterFixes(split ? [] : tail, [fix], { maxSpeedMs: riding ? 30 : 12 });
    if (result.accepted.length) {
      if (split) result.accepted[0][2] = 1;
      accepted.push(...result.accepted);
      distanceM += split ? 0 : result.distanceM;
      state.breakNext = false;
    }
    state.last = fix;
  }
  return { state, accepted, distanceM };
}
