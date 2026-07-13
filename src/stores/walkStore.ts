import { create } from 'zustand';
import { saveWalkSession } from '@/repositories/activityRepo';
import { distanceFromSteps } from '@/lib/pedometer';
import { walkCalories } from '@/lib/met';
import { useUserStore } from './userStore';

interface WalkState {
  active: boolean;
  mode: 'walk' | 'run';
  startedAt: number | null;
  baseSteps: number; // steps counted before this tick set
  steps: number;
  elapsedS: number;
  source: 'pedometer' | 'accelerometer' | 'gps';

  start: (mode: 'walk' | 'run', source: 'pedometer' | 'accelerometer') => void;
  setSteps: (steps: number) => void;
  addStep: (n?: number) => void;
  tick: (elapsedS: number) => void;
  stop: () => { steps: number; distanceM: number; calories: number; durationS: number } | null;
  reset: () => void;
}

export const useWalkStore = create<WalkState>((set, get) => ({
  active: false,
  mode: 'walk',
  startedAt: null,
  baseSteps: 0,
  steps: 0,
  elapsedS: 0,
  source: 'pedometer',

  start: (mode, source) =>
    set({ active: true, mode, source, startedAt: Date.now(), steps: 0, baseSteps: 0, elapsedS: 0 }),

  setSteps: (steps) => set({ steps: Math.max(0, steps) }),
  addStep: (n = 1) => set((s) => ({ steps: s.steps + n })),
  tick: (elapsedS) => set({ elapsedS }),

  stop: () => {
    const s = get();
    if (!s.active || !s.startedAt) return null;
    const user = useUserStore.getState().user;
    const heightCm = user?.heightCm ?? 175;
    const weightKg = useUserStore.getState().currentWeightKg ?? 75;
    const distanceM = distanceFromSteps(s.steps, heightCm, s.mode);
    const durationS = Math.max(1, Math.round((Date.now() - s.startedAt) / 1000));
    const calories = walkCalories({ weightKg, distanceM, durationSec: durationS, steps: s.steps });
    const avgPace = distanceM > 0 ? durationS / (distanceM / 1000) : null;

    saveWalkSession({
      mode: s.mode,
      startTime: s.startedAt,
      endTime: Date.now(),
      steps: s.steps,
      distanceM,
      durationS,
      caloriesBurned: calories,
      avgPace,
      source: s.source,
    });

    set({ active: false, startedAt: null });
    return { steps: s.steps, distanceM, calories, durationS };
  },

  reset: () => set({ active: false, startedAt: null, steps: 0, baseSteps: 0, elapsedS: 0 }),
}));
