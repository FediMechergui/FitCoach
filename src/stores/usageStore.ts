import { create } from 'zustand';
import { recordAppOpen, usageStreak, type UsageStreak } from '@/repositories/usageRepo';

interface UsageState {
  streak: UsageStreak | null;
  /** Record today's open (once per launch) and refresh the streak. */
  record: () => void;
  load: () => void;
}

export const useUsageStore = create<UsageState>((set) => ({
  streak: null,
  record: () => {
    recordAppOpen();
    set({ streak: usageStreak() });
  },
  load: () => set({ streak: usageStreak() }),
}));
