import { create } from 'zustand';
import type { AlcoholType } from '@/db/schema';
import {
  alcoholDay,
  alcoholImpact,
  deleteDrink,
  logDrink,
  type AlcoholDay,
  type AlcoholImpact,
} from '@/repositories/alcoholRepo';
import { todayISO } from '@/lib/date';

interface AlcoholState {
  today: AlcoholDay | null;
  impact: AlcoholImpact | null;
  load: () => void;
  add: (type: AlcoholType, volumeMl: number, abvPct: number, label?: string) => void;
  remove: (id: number) => void;
}

export const useAlcoholStore = create<AlcoholState>((set, get) => ({
  today: null,
  impact: null,

  load: () => set({ today: alcoholDay(todayISO()), impact: alcoholImpact() }),

  add: (type, volumeMl, abvPct, label) => {
    logDrink({ type, volumeMl, abvPct, label });
    get().load();
  },

  remove: (id) => {
    deleteDrink(id);
    get().load();
  },
}));
