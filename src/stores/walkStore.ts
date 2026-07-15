import { create } from 'zustand';
import { getLiveWalk, saveWalkSession } from '@/repositories/activityRepo';
import {
  startWalkTracking,
  stopWalkTracking,
  type WalkPermissions,
} from '@/services/walkTracking';
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
  permissions: WalkPermissions | null;
  starting: boolean;

  /** Restore an in-progress walk after the app was backgrounded/reopened. */
  resume: () => void;
  start: (mode: 'walk' | 'run') => Promise<void>;
  /** Pull the latest steps/distance/elapsed from the shared live-walk row. */
  refresh: () => void;
  stop: () => { steps: number; distanceM: number; calories: number; durationS: number } | null;
  reset: () => void;
}

export const useWalkStore = create<WalkState>((set, get) => ({
  active: false,
  mode: 'walk',
  source: 'pedometer',
  startedAt: null,
  steps: 0,
  distanceM: 0,
  elapsedS: 0,
  permissions: null,
  starting: false,

  resume: () => {
    const live = getLiveWalk();
    if (live?.active && live.startTime) {
      set({
        active: true,
        mode: live.mode,
        source: live.source,
        startedAt: live.startTime,
        steps: live.steps,
        distanceM: live.distanceM,
        elapsedS: Math.round((Date.now() - live.startTime) / 1000),
      });
    }
  },

  start: async (mode) => {
    if (get().starting || get().active) return;
    set({ starting: true, steps: 0, distanceM: 0, elapsedS: 0 });
    const permissions = await startWalkTracking(mode);
    const live = getLiveWalk();
    set({
      active: true,
      starting: false,
      mode,
      source: live?.source ?? 'pedometer',
      startedAt: live?.startTime ?? Date.now(),
      permissions,
    });
  },

  refresh: () => {
    const s = get();
    if (!s.active || !s.startedAt) return;
    const live = getLiveWalk();
    set({
      steps: live?.steps ?? s.steps,
      distanceM: live?.distanceM ?? s.distanceM,
      elapsedS: Math.round((Date.now() - s.startedAt) / 1000),
    });
  },

  stop: () => {
    const s = get();
    if (!s.active || !s.startedAt) return null;

    // stopWalkTracking is async (tears down the OS service) but we don't need to
    // block the UI on it; grab the current tally synchronously from the row.
    const live = getLiveWalk();
    void stopWalkTracking();

    const weightKg = useUserStore.getState().currentWeightKg ?? 75;
    const steps = live?.steps ?? s.steps;
    const distanceM = live?.distanceM ?? s.distanceM;
    const durationS = Math.max(1, Math.round((Date.now() - s.startedAt) / 1000));
    const calories = walkCalories({ weightKg, distanceM, durationSec: durationS, steps });
    const avgPace = distanceM > 0 ? durationS / (distanceM / 1000) : null;

    saveWalkSession({
      mode: s.mode,
      startTime: s.startedAt,
      endTime: Date.now(),
      steps,
      distanceM,
      durationS,
      caloriesBurned: calories,
      avgPace,
      source: s.source,
    });

    set({ active: false, startedAt: null });
    return { steps, distanceM, calories, durationS };
  },

  reset: () => set({ active: false, startedAt: null, steps: 0, distanceM: 0, elapsedS: 0 }),
}));
