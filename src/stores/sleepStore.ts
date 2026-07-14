import { create } from 'zustand';
import { logSleep, sleepForDate, sleepSummary, type SleepSummary } from '@/repositories/sleepRepo';
import { todayISO } from '@/lib/date';
import { minutesToHours, rangeMinutes } from '@/lib/time';

interface SleepState {
  summary: SleepSummary | null;
  lastNight: number | null;
  load: () => void;
  log: (hours: number, quality?: number | null, extra?: { bedtime?: string; wakeTime?: string; notes?: string }) => void;
  logRange: (bedtime: string, wakeTime: string, quality?: number | null) => number | null;
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

  logRange: (bedtime, wakeTime, quality) => {
    const mins = rangeMinutes(bedtime, wakeTime);
    if (mins == null) return null;
    const hours = minutesToHours(mins);
    logSleep({ hours, quality: quality ?? null, bedtime, wakeTime });
    get().load();
    return hours;
  },
}));
