import { create } from 'zustand';
import type { SupplementLog, SupplementStack } from '@/db/schema';
import {
  addToStack,
  deleteSupplementLog,
  getStack,
  logSupplement,
  loggedToday,
  removeFromStack,
  setUnitsPerServing,
  supplementsForDay,
} from '@/repositories/supplementsRepo';

interface SupplementsState {
  stack: SupplementStack[];
  today: SupplementLog[];
  load: () => void;
  /** `units` logs a part portion — e.g. 2 of your usual 6 tablets */
  log: (key: string, dose?: string, units?: number) => void;
  setUnitsPerServing: (key: string, units: number | null) => void;
  removeLog: (id: number) => void;
  addToStack: (key: string, dose?: string) => void;
  removeFromStack: (key: string) => void;
  isLoggedToday: (key: string) => boolean;
}

export const useSupplementsStore = create<SupplementsState>((set, get) => ({
  stack: [],
  today: [],

  load: () => set({ stack: getStack(), today: supplementsForDay() }),

  log: (key, dose, units) => {
    logSupplement(key, { dose, unitsTaken: units ?? null });
    get().load();
  },
  setUnitsPerServing: (key, units) => {
    setUnitsPerServing(key, units);
    get().load();
  },
  removeLog: (id) => {
    deleteSupplementLog(id);
    get().load();
  },
  addToStack: (key, dose) => {
    addToStack(key, dose);
    get().load();
  },
  removeFromStack: (key) => {
    removeFromStack(key);
    get().load();
  },
  isLoggedToday: (key) => loggedToday(key),
}));
