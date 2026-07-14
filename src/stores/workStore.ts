import { create } from 'zustand';
import { logWork, workForDate, workSummary, type WorkSummary } from '@/repositories/workRepo';
import { todayISO } from '@/lib/date';
import type { WorkLog } from '@/db/schema';

interface WorkState {
  summary: WorkSummary | null;
  today: WorkLog | null;
  load: () => void;
  log: (input: Parameters<typeof logWork>[0]) => void;
}

export const useWorkStore = create<WorkState>((set, get) => ({
  summary: null,
  today: null,
  load: () => set({ summary: workSummary(), today: workForDate(todayISO()) ?? null }),
  log: (input) => {
    logWork(input);
    get().load();
  },
}));
