import { create } from 'zustand';
import { logSleep, sleepForDate, sleepSummary, type SleepSummary } from '@/repositories/sleepRepo';
import { todayISO } from '@/lib/date';

interface SleepState {
  summary: SleepSummary | null;
  lastNight: number | null;
  load: () => void;
  log: (hours: number, quality?: number | null, extra?: { bedtime?: string; wakeTime?: string; notes?: string }) => void;
}

export const useSleepStore = create<SleepState>((set, get) => ({
  summary: null,
  lastNight: null,

  load: () => {
    set({ summary: sleepSummary(), lastNight: sleepForDate(todayISO())?.hours ?? null });
  },

  log: (hours, quality, extra) => {
    logSleep({ hours, quality: quality ?? null, ...extra });
    get().load();
  },
}));
