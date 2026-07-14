import type { AlcoholType } from '@/db/schema';

/**
 * Alcohol model — accurate, standards-based.
 *
 * Pure-alcohol mass:   grams = volume_ml × (ABV/100) × ρ,  ρ(ethanol)=0.789 g/ml
 * Alcohol energy:      7.0 kcal per gram of ethanol
 * Standard drink:      10 g pure alcohol (WHO / most of Europe); US = 14 g
 * Peak BAC (Widmark):  BAC% = grams / (r × weightKg × 10) − β·t
 *                      r ≈ 0.68 (male) / 0.55 (female), β ≈ 0.015 %/hour
 *
 * Reference serving strengths (from the brief):
 *   • Beer   — 33 cl (330 ml) at ~5% ABV
 *   • Wine   — 75 cl bottle at 9–25% ABV (≈12% typical); a glass ≈ 150 ml
 *   • Spirit — liqueurs/spirits ≈ 45% ABV; a shot ≈ 45 ml
 */

export const ETHANOL_DENSITY = 0.789; // g/ml
export const KCAL_PER_G_ALCOHOL = 7;
export const STD_DRINK_G = 10; // WHO standard drink
export const US_STD_DRINK_G = 14;

export interface AlcoholPreset {
  type: AlcoholType;
  label: string;
  icon: string;
  defaultVolumeMl: number;
  defaultAbv: number;
  abvRange: [number, number];
  /** grams of carbohydrate per ml (for non-alcohol calories) */
  carbGPerMl: number;
}

export const ALCOHOL_PRESETS: Record<AlcoholType, AlcoholPreset> = {
  beer: { type: 'beer', label: 'Beer', icon: 'alcohol.beer', defaultVolumeMl: 330, defaultAbv: 5, abvRange: [3, 9], carbGPerMl: 0.036 },
  wine: { type: 'wine', label: 'Wine', icon: 'alcohol.wine', defaultVolumeMl: 150, defaultAbv: 12, abvRange: [9, 25], carbGPerMl: 0.026 },
  spirit: { type: 'spirit', label: 'Spirit / Liqueur', icon: 'alcohol.spirit', defaultVolumeMl: 45, defaultAbv: 45, abvRange: [30, 60], carbGPerMl: 0.0 },
  cocktail: { type: 'cocktail', label: 'Cocktail', icon: 'alcohol.cocktail', defaultVolumeMl: 200, defaultAbv: 12, abvRange: [5, 30], carbGPerMl: 0.09 },
  other: { type: 'other', label: 'Other', icon: 'alcohol.other', defaultVolumeMl: 200, defaultAbv: 10, abvRange: [0, 60], carbGPerMl: 0.03 },
};

export interface AlcoholCalc {
  grams: number;
  standardDrinks: number;
  usStandardDrinks: number;
  alcoholCalories: number;
  carbCalories: number;
  totalCalories: number;
}

export function alcoholGrams(volumeMl: number, abvPct: number): number {
  return volumeMl * (abvPct / 100) * ETHANOL_DENSITY;
}

export function computeDrink(type: AlcoholType, volumeMl: number, abvPct: number): AlcoholCalc {
  const grams = alcoholGrams(volumeMl, abvPct);
  const alcoholCalories = grams * KCAL_PER_G_ALCOHOL;
  const carbG = volumeMl * (ALCOHOL_PRESETS[type]?.carbGPerMl ?? 0.03);
  const carbCalories = carbG * 4;
  return {
    grams: Math.round(grams * 10) / 10,
    standardDrinks: Math.round((grams / STD_DRINK_G) * 10) / 10,
    usStandardDrinks: Math.round((grams / US_STD_DRINK_G) * 10) / 10,
    alcoholCalories: Math.round(alcoholCalories),
    carbCalories: Math.round(carbCalories),
    totalCalories: Math.round(alcoholCalories + carbCalories),
  };
}

/** Widmark distribution ratio by biological sex. */
export function widmarkR(sex: 'male' | 'female'): number {
  return sex === 'female' ? 0.55 : 0.68;
}

/**
 * Estimated peak Blood Alcohol Concentration (% BAC) for a total gram intake,
 * `hoursElapsed` after drinking, using the Widmark equation. A rough estimate:
 * assumes the full amount was absorbed and ignores food/time-of-drinking.
 */
export function estimateBAC(params: {
  totalGrams: number;
  weightKg: number;
  sex: 'male' | 'female';
  hoursElapsed?: number;
}): number {
  const { totalGrams, weightKg, sex, hoursElapsed = 0 } = params;
  if (totalGrams <= 0 || weightKg <= 0) return 0;
  const peak = totalGrams / (widmarkR(sex) * weightKg * 10);
  const bac = Math.max(0, peak - 0.015 * hoursElapsed);
  return Math.round(bac * 1000) / 1000;
}

/** Rough hours for BAC to return to ~0 (β = 0.015 %/hr). */
export function hoursToSober(peakBac: number): number {
  return Math.max(0, Math.round((peakBac / 0.015) * 10) / 10);
}

/**
 * Low-risk weekly guideline in grams. UK CMO ≈ 14 units/week ≈ 112 g; we use a
 * conservative 100 g/week default. Informational only.
 */
export const WEEKLY_LOWRISK_G = 100;

/** A short qualitative label for an estimated BAC. */
export function bacLabel(bac: number): string {
  if (bac <= 0) return 'None';
  if (bac < 0.03) return 'Minimal';
  if (bac < 0.05) return 'Light';
  if (bac < 0.08) return 'Impaired';
  if (bac < 0.15) return 'Over legal limit';
  return 'Heavy';
}

/**
 * Recovery / training impact note. Alcohol suppresses muscle protein synthesis
 * (~20–30% after a heavy session), disrupts deep sleep, and dehydrates — so it
 * blunts recovery and next-day performance.
 */
export function alcoholRecoveryPenaltyPct(gramsLast24h: number): number {
  if (gramsLast24h <= 0) return 0;
  // ~ up to 25% MPS suppression at heavy intake; scaled and capped.
  return Math.min(25, Math.round((gramsLast24h / 40) * 25));
}
