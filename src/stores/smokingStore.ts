import { create } from 'zustand';
import type { SmokingProfile } from '@/db/schema';
import {
  dayCigarettes,
  getSmokingProfile,
  logCigarettes,
  smokingImpact,
  undoLastCigarette,
  upsertSmokingProfile,
  type SmokingImpact,
} from '@/repositories/smokingRepo';
import { todayISO } from '@/lib/date';

interface SmokingState {
  profile: SmokingProfile | null;
  enabled: boolean;
  today: number;
  impact: SmokingImpact | null;

  load: () => void;
  refresh: () => void;
  enable: (patch?: Partial<Omit<SmokingProfile, 'id' | 'userId' | 'createdAt'>>) => void;
  updateProfile: (patch: Partial<Omit<SmokingProfile, 'id' | 'userId' | 'createdAt'>>) => void;
  disable: () => void;
  add: (n?: number, trigger?: string) => void;
  undo: () => void;
}

export const useSmokingStore = create<SmokingState>((set, get) => ({
  profile: null,
  enabled: false,
  today: 0,
  impact: null,

  load: () => {
    const profile = getSmokingProfile();
    set({
      profile: profile ?? null,
      enabled: !!profile?.enabled,
      today: dayCigarettes(todayISO()),
      impact: profile?.enabled ? smokingImpact() : null,
    });
  },

  refresh: () => {
    set({ today: dayCigarettes(todayISO()), impact: get().enabled ? smokingImpact() : null });
  },

  enable: (patch) => {
    const profile = upsertSmokingProfile({ enabled: true, ...patch });
    set({ profile, enabled: true });
    get().refresh();
  },

  updateProfile: (patch) => {
    const profile = upsertSmokingProfile(patch);
    set({ profile, enabled: !!profile.enabled });
    get().refresh();
  },

  disable: () => {
    const profile = upsertSmokingProfile({ enabled: false });
    set({ profile, enabled: false, impact: null });
  },

  add: (n = 1, trigger) => {
    logCigarettes(n, { trigger });
    get().refresh();
  },

  undo: () => {
    undoLastCigarette();
    get().refresh();
  },
}));
