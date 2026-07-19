import { create } from 'zustand';
import {
  deleteNap,
  logNap,
  logSleep,
  napMinutesForDate,
  napsForDate,
  sleepForDate,
  sleepSummary,
  type SleepSummary,
} from '@/repositories/sleepRepo';
import type { NapLog } from '@/db/schema';
import { todayISO } from '@/lib/date';
import { minutesToHours, rangeMinutes } from '@/lib/time';

interface SleepState {
  summary: SleepSummary | null;
  lastNight: number | null;
  naps: NapLog[];
  napMinutesToday: number;
  load: () => void;
  log: (hours: number, quality?: number | null, extra?: { bedtime?: string; wakeTime?: string; notes?: string }) => void;
  logRange: (bedtime: string, wakeTime: string, quality?: number | null) => number | null;
  addNap: (minutes: number, opts?: { startTime?: string; quality?: number | null }) => void;
  removeNap: (id: number) => void;
}

export const useSleepStore = create<SleepState>((set, get) => ({
  summary: null,
  lastNight: null,
  naps: [],
  napMinutesToday: 0,

  load: () => {
    set({
      summary: sleepSummary(),
      lastNight: sleepForDate(todayISO())?.hours ?? null,
      naps: napsForDate(todayISO()),
      napMinutesToday: napMinutesForDate(todayISO()),
    });
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

  addNap: (minutes, opts) => {
    if (!minutes || minutes <= 0) return;
    logNap({ minutes, startTime: opts?.startTime ?? null, quality: opts?.quality ?? null });
    get().load();
  },

  removeNap: (id) => {
    deleteNap(id);
    get().load();
  },
}));
