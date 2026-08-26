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
import { useNutritionStore } from './nutritionStore';
import { todayISO } from '@/lib/date';

/**
 * The nutrition section works on ONE diary date — the day the Nutrition tab is
 * showing. Supplements follow it, so stepping back a day to add the food you
 * forgot also steps the pills back with it.
 */
const diaryDate = (): string => useNutritionStore.getState().date;

interface SupplementsState {
  stack: SupplementStack[];
  /** the logs for the day being shown — not necessarily today */
  today: SupplementLog[];
  /** the diary date these logs belong to */
  date: string;
  load: () => void;
  /** move the whole nutrition section — diary, micros and pills — to another day */
  setDate: (date: string) => void;
  /** `units` logs a part portion — e.g. 2 of your usual 6 tablets */
  log: (key: string, dose?: string, units?: number) => void;
  setUnitsPerServing: (key: string, units: number | null) => void;
  removeLog: (id: number) => void;
  addToStack: (key: string, dose?: string) => void;
  removeFromStack: (key: string) => void;
  /** already logged on the day being shown */
  isLoggedToday: (key: string) => boolean;
}

export const useSupplementsStore = create<SupplementsState>((set, get) => ({
  stack: [],
  today: [],
  date: todayISO(),

  load: () => {
    const date = diaryDate();
    set({ date, stack: getStack(), today: supplementsForDay(date) });
  },

  setDate: (date) => {
    // The Nutrition tab owns the date; setting it there keeps the diary, the
    // micronutrient totals and the pills on the same day.
    useNutritionStore.getState().setDate(date);
    get().load();
  },

  log: (key, dose, units) => {
    logSupplement(key, { dose, unitsTaken: units ?? null, date: diaryDate() });
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
  isLoggedToday: (key) => loggedToday(key, get().date),
}));
