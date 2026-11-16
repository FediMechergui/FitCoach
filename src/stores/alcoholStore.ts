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
  date: string;
  today: AlcoholDay | null;
  impact: AlcoholImpact | null;
  load: (date?: string) => void;
  add: (type: AlcoholType, volumeMl: number, abvPct: number, label?: string, date?: string) => void;
  remove: (id: number) => void;
}

export const useAlcoholStore = create<AlcoholState>((set, get) => ({
  date: todayISO(),
  today: null,
  impact: null,

  load: (date = todayISO()) => set({ date, today: alcoholDay(date), impact: alcoholImpact() }),

  add: (type, volumeMl, abvPct, label, date = todayISO()) => {
    logDrink({ type, volumeMl, abvPct, label, date });
    get().load(date);
  },

  remove: (id) => {
    deleteDrink(id);
    get().load(get().date);
  },
}));
