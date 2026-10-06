import { create } from 'zustand';
import { saveWalkSession } from '@/repositories/activityRepo';
import {
  getLiveSnapshot,
  getWalkPermissions,
  reconcileSteps,
  resumeWalkTracking,
  startWalkTracking,
  stopWalkTracking,
  type WalkPermissions,
} from '@/services/walkTracking';
import { distanceFromSteps } from '@/lib/pedometer';
import type { LatLng } from '@/lib/geo';
import { activityFor, outdoorCalories } from '@/lib/outdoorActivities';
import { useUserStore } from './userStore';

export interface WalkStopResult {
  /** the saved walk_sessions row */
  walkId: number;
  activity: string;
  steps: number;
  distanceM: number;
  calories: number;
  durationS: number;
  activeS: number;
  /** seconds per km over moving time; null without distance */
  avgPace: number | null;
}

interface WalkState {
  active: boolean;
  mode: 'walk' | 'run';
  /** the outdoor activity key (walk, run, hike, cycle…) */
  activity: string;
  /** a carried pack, kg — part of the calorie sum for a hike or a ruck */
  loadKg: number;
  source: 'pedometer' | 'accelerometer' | 'gps';
  startedAt: number | null;
  steps: number;
  distanceM: number;
  elapsedS: number;
  route: LatLng[];
  usingGps: boolean;
  permissions: WalkPermissions | null;
  starting: boolean;
  /** auto-paused (vehicle / standing still) */
  paused: boolean;
  pauseReason: string;
  /** moving seconds, excluding paused time */
  activeS: number;

  /** Reattach to a walk that survived a background/app restart. */
  resume: () => void;
  start: (mode: 'walk' | 'run', activity?: string, loadKg?: number) => void;
  /** Pull the latest numbers from the in-memory tracker (cheap; no DB read). */
  refresh: () => void;
  /** Reconcile against the hardware step counter (catches up background steps), then refresh. */
  reconcile: () => Promise<void>;
  stop: () => WalkStopResult | null;
  reset: () => void;
}

function heightCm(): number {
  return useUserStore.getState().user?.heightCm ?? 175;
}

/**
 * Steps per minute over the moving time so far — null until there is enough of
 * a sample to mean anything. Feeds the step-length estimate so a brisk walk is
 * not measured with a strolling stride.
 */
function liveCadence(steps: number, activeSec: number): number | null {
  return activeSec > 60 && steps > 30 ? steps / (activeSec / 60) : null;
}

export const useWalkStore = create<WalkState>((set, get) => ({
  active: false,
  mode: 'walk',
  activity: 'walk',
  loadKg: 0,
  source: 'pedometer',
  startedAt: null,
  steps: 0,
  distanceM: 0,
  elapsedS: 0,
  route: [],
  usingGps: false,
  permissions: null,
  starting: false,
  paused: false,
  pauseReason: '',
  activeS: 0,

  resume: () => {
    const snap = getLiveSnapshot();
    if (snap?.active) {
      void resumeWalkTracking();
      const usingGps = snap.gpsDistanceM > 0 || snap.route.length > 0;
      set({
        active: true,
        mode: snap.mode,
        activity: snap.activity,
        source: snap.source,
        startedAt: snap.startTime,
        steps: snap.steps,
        distanceM: usingGps ? snap.gpsDistanceM : distanceFromSteps(snap.steps, heightCm(), snap.mode),
        route: snap.route,
        usingGps,
        elapsedS: Math.round((Date.now() - snap.startTime) / 1000),
      });
    }
  },

  start: (mode, activity, loadKg) => {
    if (get().starting || get().active) return;
    const key = activityFor(activity ?? mode).key;
    set({ starting: true, steps: 0, distanceM: 0, elapsedS: 0, route: [], activity: key, loadKg: loadKg && loadKg > 0 ? loadKg : 0 });

    // `startWalkTracking` brings the session up synchronously and finishes the
    // slow parts (permission dialogs, hardware counter, GPS) in the background,
    // so the UI can switch to the tracking view with no delay.
    void startWalkTracking(mode, key);

    const snap = getLiveSnapshot();
    set({
      active: true,
      starting: false,
      mode,
      source: snap?.source ?? 'accelerometer',
      startedAt: snap?.startTime ?? Date.now(),
      // Both fill in via refresh() once the async setup resolves.
      usingGps: false,
      permissions: null,
    });
  },

  refresh: () => {
    const s = get();
    if (!s.active || !s.startedAt) return;
    const snap = getLiveSnapshot();
    const steps = snap?.steps ?? s.steps;
    const usingGps = !!snap && (snap.gpsDistanceM > 0 || snap.route.length > 0);
    set({
      steps,
      // Cadence from what has actually been counted so far, so a brisk walk
      // is not measured with a strolling step length.
      distanceM: usingGps
        ? snap!.gpsDistanceM
        : distanceFromSteps(steps, heightCm(), s.mode, liveCadence(steps, snap?.activeSec ?? s.activeS)),
      route: snap?.route ?? s.route,
      usingGps: usingGps || s.usingGps,
      source: snap?.source ?? s.source,
      // Populated once the background permission/GPS handshake finishes.
      permissions: getWalkPermissions() ?? s.permissions,
      paused: snap?.paused ?? s.paused,
      pauseReason: snap?.pauseReason ?? s.pauseReason,
      activeS: snap?.activeSec ?? s.activeS,
      elapsedS: Math.round((Date.now() - s.startedAt) / 1000),
    });
  },

  reconcile: async () => {
    if (!get().active) return;
    await reconcileSteps();
    get().refresh();
  },

  stop: () => {
    const s = get();
    if (!s.active || !s.startedAt) return null;

    const result = stopWalkTracking();
    set({ active: false, startedAt: null });
    if (!result) return null;

    const weightKg = useUserStore.getState().currentWeightKg ?? 75;
    // The same sum the screen showed while you moved (lib/outdoorActivities):
    // moving time only, the activity's floor, the pack, the ride's own curve.
    const calories = outdoorCalories({
      activity: activityFor(result.activity),
      weightKg,
      distanceM: result.distanceM,
      durationSec: result.durationS,
      activeSec: result.activeSec,
      steps: result.steps,
      loadKg: s.loadKg,
    });
    // Moving pace — wall-clock would make a paused session look slower than it ran.
    const avgPace = result.distanceM > 0 ? result.activeSec / (result.distanceM / 1000) : null;

    const walkId = saveWalkSession({
      mode: result.mode,
      activity: result.activity,
      startTime: result.startTime,
      endTime: Date.now(),
      steps: result.steps,
      distanceM: result.distanceM,
      durationS: result.durationS,
      caloriesBurned: calories,
      avgPace,
      source: result.source,
      routeJson: result.route.length > 1 ? JSON.stringify(result.route) : null,
    });

    return {
      walkId,
      activity: result.activity,
      steps: result.steps,
      distanceM: result.distanceM,
      calories,
      durationS: result.durationS,
      activeS: result.activeSec,
      avgPace,
    };
  },

  reset: () => set({ active: false, startedAt: null, steps: 0, distanceM: 0, elapsedS: 0, route: [], usingGps: false }),
}));
