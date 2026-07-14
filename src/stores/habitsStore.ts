import { create } from 'zustand';
import type { HabitProfile } from '@/db/schema';
import {
  disableHabit,
  enableHabit,
  habitImpact,
  listHabitProfiles,
  logHabit,
  undoLastHabit,
} from '@/repositories/habitsRepo';
import type { HabitImpact } from '@/lib/habits';

interface HabitsState {
  profiles: HabitProfile[];
  impacts: Record<string, HabitImpact | null>;
  load: () => void;
  enable: (habitKey: string, patch?: Parameters<typeof enableHabit>[1]) => void;
  disable: (habitKey: string) => void;
  add: (habitKey: string, input?: { quantity?: number; minutes?: number; trigger?: string }) => void;
  undo: (habitKey: string) => void;
}

export const useHabitsStore = create<HabitsState>((set, get) => ({
  profiles: [],
  impacts: {},

  load: () => {
    const profiles = listHabitProfiles();
    const impacts: Record<string, HabitImpact | null> = {};
    for (const p of profiles) impacts[p.habitKey] = habitImpact(p.habitKey);
    set({ profiles, impacts });
  },

  enable: (habitKey, patch) => {
    enableHabit(habitKey, patch);
    get().load();
  },

  disable: (habitKey) => {
    disableHabit(habitKey);
    get().load();
  },

  add: (habitKey, input) => {
    logHabit(habitKey, input);
    get().load();
  },

  undo: (habitKey) => {
    undoLastHabit(habitKey);
    get().load();
  },
}));
