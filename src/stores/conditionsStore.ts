import { create } from 'zustand';
import type { HealthCondition } from '@/db/schema';
import { addCondition, listConditions, removeCondition } from '@/repositories/conditionsRepo';

interface ConditionsState {
  conditions: HealthCondition[];
  load: () => void;
  add: (key: string, notes?: string) => void;
  remove: (key: string) => void;
}

export const useConditionsStore = create<ConditionsState>((set, get) => ({
  conditions: [],
  load: () => set({ conditions: listConditions() }),
  add: (key, notes) => {
    addCondition(key, notes);
    get().load();
  },
  remove: (key) => {
    removeCondition(key);
    get().load();
  },
}));
