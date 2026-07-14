import { create } from 'zustand';
import type { CycleProfile, PeriodLog } from '@/db/schema';
import type { CycleState } from '@/lib/cycle';
import {
  currentCycle,
  getCycleProfile,
  listPeriods,
  logPeriodStart,
  refineCycleAverages,
  setPeriodEnd,
  upsertCycleProfile,
} from '@/repositories/cycleRepo';

interface CycleStoreState {
  profile: CycleProfile | null;
  enabled: boolean;
  state: CycleState | null;
  periods: PeriodLog[];

  load: () => void;
  enable: (patch?: Partial<Omit<CycleProfile, 'id' | 'userId' | 'createdAt'>>) => void;
  updateProfile: (patch: Partial<Omit<CycleProfile, 'id' | 'userId' | 'createdAt'>>) => void;
  disable: () => void;
  logStart: (startDate: string, opts?: { flow?: 'light' | 'medium' | 'heavy'; symptoms?: string[] }) => void;
  endPeriod: (id: number, endDate: string) => void;
}

export const useCycleStore = create<CycleStoreState>((set, get) => ({
  profile: null,
  enabled: false,
  state: null,
  periods: [],

  load: () => {
    const profile = getCycleProfile();
    set({
      profile: profile ?? null,
      enabled: !!profile?.enabled,
      state: profile?.enabled ? currentCycle() : null,
      periods: listPeriods(),
    });
  },

  enable: (patch) => {
    upsertCycleProfile({ enabled: true, ...patch });
    get().load();
  },

  updateProfile: (patch) => {
    upsertCycleProfile(patch);
    get().load();
  },

  disable: () => {
    upsertCycleProfile({ enabled: false });
    get().load();
  },

  logStart: (startDate, opts) => {
    logPeriodStart(startDate, opts);
    refineCycleAverages();
    get().load();
  },

  endPeriod: (id, endDate) => {
    setPeriodEnd(id, endDate);
    get().load();
  },
}));
