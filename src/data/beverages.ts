import type { BeverageType } from '@/db/schema';

/**
 * Per-serving beverage defaults for the water & caffeine trackers (spec §3.5).
 * Caffeine (mg) figures are editable defaults; volume is the typical serving.
 */
export interface BeveragePreset {
  type: BeverageType;
  label: string;
  icon: string;
  defaultVolumeMl: number;
  caffeinePerServingMg: number;
  /** counts toward the daily water/hydration goal ring */
  hydrating: boolean;
}

export const BEVERAGE_PRESETS: Record<BeverageType, BeveragePreset> = {
  water: {
    type: 'water',
    label: 'Water',
    icon: 'nutrition.water',
    defaultVolumeMl: 250,
    caffeinePerServingMg: 0,
    hydrating: true,
  },
  coffee: {
    type: 'coffee',
    label: 'Coffee',
    icon: 'nutrition.coffee',
    defaultVolumeMl: 240,
    caffeinePerServingMg: 95,
    hydrating: true,
  },
  tea: {
    type: 'tea',
    label: 'Tea',
    icon: 'nutrition.tea',
    defaultVolumeMl: 240,
    caffeinePerServingMg: 47,
    hydrating: true,
  },
  energy_drink: {
    type: 'energy_drink',
    label: 'Energy Drink',
    icon: 'nutrition.energy',
    defaultVolumeMl: 250,
    caffeinePerServingMg: 80,
    hydrating: false,
  },
  soda: {
    type: 'soda',
    label: 'Soda',
    icon: 'nutrition.soda',
    defaultVolumeMl: 330,
    caffeinePerServingMg: 34,
    hydrating: false,
  },
  other: {
    type: 'other',
    label: 'Other',
    icon: 'nutrition.water',
    defaultVolumeMl: 250,
    caffeinePerServingMg: 0,
    hydrating: false,
  },
};

/** Quick-add water buttons (ml). */
export const WATER_QUICK_ADD = [250, 500, 750];

/** WHO/EFSA-style soft daily caffeine guideline (mg). Informational only. */
export const CAFFEINE_SOFT_LIMIT_MG = 400;
