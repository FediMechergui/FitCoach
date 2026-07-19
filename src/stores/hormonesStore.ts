import { create } from 'zustand';
import type { HormoneFlag, HormoneStatus } from '@/db/schema';
import { listHormoneFlags, removeHormoneFlag, setHormoneFlag } from '@/repositories/hormonesRepo';

interface HormonesState {
  flags: HormoneFlag[];
  load: () => void;
  set: (key: string, status: HormoneStatus, notes?: string | null) => void;
  remove: (key: string) => void;
}

export const useHormonesStore = create<HormonesState>((set, get) => ({
  flags: [],
  load: () => set({ flags: listHormoneFlags() }),
  set: (key, status, notes) => {
    setHormoneFlag(key, status, notes);
    get().load();
  },
  remove: (key) => {
    removeHormoneFlag(key);
    get().load();
  },
}));
