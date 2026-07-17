import { create } from 'zustand';
import type { SupplementLog, SupplementStack } from '@/db/schema';
import {
  addToStack,
  deleteSupplementLog,
  getStack,
  logSupplement,
  loggedToday,
  removeFromStack,
  supplementsForDay,
} from '@/repositories/supplementsRepo';

interface SupplementsState {
  stack: SupplementStack[];
  today: SupplementLog[];
  load: () => void;
  log: (key: string, dose?: string) => void;
  removeLog: (id: number) => void;
  addToStack: (key: string, dose?: string) => void;
  removeFromStack: (key: string) => void;
  isLoggedToday: (key: string) => boolean;
}

export const useSupplementsStore = create<SupplementsState>((set, get) => ({
  stack: [],
  today: [],

  load: () => set({ stack: getStack(), today: supplementsForDay() }),

  log: (key, dose) => {
    logSupplement(key, { dose });
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
