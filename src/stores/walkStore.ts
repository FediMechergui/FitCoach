import { create } from 'zustand';
import { saveWalkSession } from '@/repositories/activityRepo';
import {
  getLiveSnapshot,
  resumeWalkTracking,
  startWalkTracking,
  stopWalkTracking,
  type WalkPermissions,
} from '@/services/walkTracking';
import { distanceFromSteps } from '@/lib/pedometer';
import type { LatLng } from '@/lib/geo';
import { walkCalories } from '@/lib/met';
import { useUserStore } from './userStore';

interface WalkState {
  active: boolean;
  mode: 'walk' | 'run';
  source: 'pedometer' | 'accelerometer' | 'gps';
  startedAt: number | null;
  steps: number;
  distanceM: number;
  elapsedS: number;
  route: LatLng[];
  usingGps: boolean;
  permissions: WalkPermissions | null;
  starting: boolean;

  /** Reattach to a walk that survived a background/app restart. */
  resume: () => void;
  start: (mode: 'walk' | 'run') => Promise<void>;
  /** Pull the latest numbers from the in-memory tracker (cheap; no DB read). */
  refresh: () => void;
  stop: () => { steps: number; distanceM: number; calories: number; durationS: number } | null;
  reset: () => void;
}

function heightCm(): number {
  return useUserStore.getState().user?.heightCm ?? 175;
}

export const useWalkStore = create<WalkState>((set, get) => ({
  active: false,
  mode: 'walk',
  source: 'pedometer',
  startedAt: null,
  steps: 0,
  distanceM: 0,
  elapsedS: 0,
  route: [],
  usingGps: false,
  permissions: null,
  starting: false,

  resume: () => {
    const snap = getLiveSnapshot();
    if (snap?.active) {
      void resumeWalkTracking();
      const usingGps = snap.gpsDistanceM > 0 || snap.route.length > 0;
      set({
        active: true,
        mode: snap.mode,
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

  start: async (mode) => {
    if (get().starting || get().active) return;
    set({ starting: true, steps: 0, distanceM: 0, elapsedS: 0, route: [] });
    const permissions = await startWalkTracking(mode);
    const snap = getLiveSnapshot();
    set({
      active: true,
      starting: false,
      mode,
      source: snap?.source ?? 'pedometer',
      startedAt: snap?.startTime ?? Date.now(),
      usingGps: permissions.gps,
      permissions,
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
      distanceM: usingGps ? snap!.gpsDistanceM : distanceFromSteps(steps, heightCm(), s.mode),
      route: snap?.route ?? s.route,
      usingGps: usingGps || s.usingGps,
      elapsedS: Math.round((Date.now() - s.startedAt) / 1000),
    });
  },

  stop: () => {
    const s = get();
    if (!s.active || !s.startedAt) return null;

    const result = stopWalkTracking();
    set({ active: false, startedAt: null });
    if (!result) return null;

    const weightKg = useUserStore.getState().currentWeightKg ?? 75;
    const calories = walkCalories({
      weightKg,
      distanceM: result.distanceM,
      durationSec: result.durationS,
      steps: result.steps,
    });
    const avgPace = result.distanceM > 0 ? result.durationS / (result.distanceM / 1000) : null;

    saveWalkSession({
      mode: result.mode,
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

    return { steps: result.steps, distanceM: result.distanceM, calories, durationS: result.durationS };
  },

  reset: () => set({ active: false, startedAt: null, steps: 0, distanceM: 0, elapsedS: 0, route: [], usingGps: false }),
}));
