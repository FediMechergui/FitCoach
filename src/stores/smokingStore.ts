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
import { dayNicotineMg, daySmokedShare, settingsFromProfile } from '@/repositories/smokingRepo';
import { DEFAULT_SMOKING_SETTINGS } from '@/lib/smoking';
import { todayISO } from '@/lib/date';

/** Today's nicotine picture, across cigarettes and every alternative. */
function nicotineSnapshot(profile: SmokingProfile | null | undefined) {
  const settings = profile ? settingsFromProfile(profile) : DEFAULT_SMOKING_SETTINGS;
  return {
    nicotineToday: dayNicotineMg(settings, todayISO()),
    smokedShare: daySmokedShare(settings, todayISO()),
  };
}

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
  /** `productKey` logs an alternative — snus, pouch, vape, NRT. null = cigarette */
  add: (n?: number, trigger?: string, productKey?: string | null) => void;
  /** nicotine absorbed today across every product, mg */
  nicotineToday: number;
  /** share of today's nicotine that came from something burned, 0..1 */
  smokedShare: number;
  undo: () => void;
}

export const useSmokingStore = create<SmokingState>((set, get) => ({
  profile: null,
  enabled: false,
  today: 0,
  impact: null,
  nicotineToday: 0,
  smokedShare: 0,

  load: () => {
    const profile = getSmokingProfile();
    set({
      profile: profile ?? null,
      enabled: !!profile?.enabled,
      today: dayCigarettes(todayISO()),
      impact: profile?.enabled ? smokingImpact() : null,
      ...nicotineSnapshot(profile),
    });
  },

  refresh: () => {
    set({
      today: dayCigarettes(todayISO()),
      impact: get().enabled ? smokingImpact() : null,
      ...nicotineSnapshot(get().profile),
    });
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

  add: (n = 1, trigger, productKey) => {
    logCigarettes(n, { trigger, productKey: productKey ?? null });
    get().refresh();
  },

  undo: () => {
    undoLastCigarette();
    get().refresh();
  },
}));
