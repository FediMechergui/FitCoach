/**
 * Micronutrient engine — vitamins, minerals and a couple of extras, with
 * Reference Daily Intake (RDI) targets so intake can be shown as % of need.
 *
 * Values follow US/EU DRIs for adults 19–50 (sex-specific where they differ).
 * This layer is purely ADDITIVE to the macro/calorie engine — it never touches
 * calories, protein, carbs or fat. Foods without known micro data contribute
 * nothing here, and the UI is explicit that totals reflect "foods & supplements
 * with known data", so nothing is fabricated.
 */

export const MICRO_KEYS = [
  // Vitamins
  'vitaminA_ug', 'vitaminC_mg', 'vitaminD_ug', 'vitaminE_mg', 'vitaminK_ug',
  'thiamin_mg', 'riboflavin_mg', 'niacin_mg', 'pantothenic_mg', 'vitaminB6_mg',
  'biotin_ug', 'folate_ug', 'vitaminB12_ug',
  // Minerals
  'calcium_mg', 'iron_mg', 'magnesium_mg', 'phosphorus_mg', 'potassium_mg',
  'sodium_mg', 'zinc_mg', 'copper_mg', 'manganese_mg', 'selenium_ug', 'iodine_ug',
  // Other
  'omega3_mg',
] as const;

export type MicroKey = (typeof MICRO_KEYS)[number];
export type MicroProfile = Record<MicroKey, number>;

export type MicroGroup = 'vitamin' | 'mineral' | 'other';

export interface MicroDef {
  key: MicroKey;
  label: string;
  unit: 'mg' | 'µg' | 'g';
  group: MicroGroup;
  rdi: { m: number; f: number };
  /** tolerable upper intake (for flagging excess, e.g. sodium) */
  upper?: number;
}

export const MICRO_DEFS: MicroDef[] = [
  { key: 'vitaminA_ug', label: 'Vitamin A', unit: 'µg', group: 'vitamin', rdi: { m: 900, f: 700 }, upper: 3000 },
  { key: 'vitaminC_mg', label: 'Vitamin C', unit: 'mg', group: 'vitamin', rdi: { m: 90, f: 75 }, upper: 2000 },
  { key: 'vitaminD_ug', label: 'Vitamin D', unit: 'µg', group: 'vitamin', rdi: { m: 15, f: 15 }, upper: 100 },
  { key: 'vitaminE_mg', label: 'Vitamin E', unit: 'mg', group: 'vitamin', rdi: { m: 15, f: 15 }, upper: 1000 },
  { key: 'vitaminK_ug', label: 'Vitamin K', unit: 'µg', group: 'vitamin', rdi: { m: 120, f: 90 } },
  { key: 'thiamin_mg', label: 'Thiamin (B1)', unit: 'mg', group: 'vitamin', rdi: { m: 1.2, f: 1.1 } },
  { key: 'riboflavin_mg', label: 'Riboflavin (B2)', unit: 'mg', group: 'vitamin', rdi: { m: 1.3, f: 1.1 } },
  { key: 'niacin_mg', label: 'Niacin (B3)', unit: 'mg', group: 'vitamin', rdi: { m: 16, f: 14 }, upper: 35 },
  { key: 'pantothenic_mg', label: 'Pantothenic (B5)', unit: 'mg', group: 'vitamin', rdi: { m: 5, f: 5 } },
  { key: 'vitaminB6_mg', label: 'Vitamin B6', unit: 'mg', group: 'vitamin', rdi: { m: 1.3, f: 1.3 }, upper: 100 },
  { key: 'biotin_ug', label: 'Biotin (B7)', unit: 'µg', group: 'vitamin', rdi: { m: 30, f: 30 } },
  { key: 'folate_ug', label: 'Folate (B9)', unit: 'µg', group: 'vitamin', rdi: { m: 400, f: 400 }, upper: 1000 },
  { key: 'vitaminB12_ug', label: 'Vitamin B12', unit: 'µg', group: 'vitamin', rdi: { m: 2.4, f: 2.4 } },
  { key: 'calcium_mg', label: 'Calcium', unit: 'mg', group: 'mineral', rdi: { m: 1000, f: 1000 }, upper: 2500 },
  { key: 'iron_mg', label: 'Iron', unit: 'mg', group: 'mineral', rdi: { m: 8, f: 18 }, upper: 45 },
  { key: 'magnesium_mg', label: 'Magnesium', unit: 'mg', group: 'mineral', rdi: { m: 400, f: 310 } },
  { key: 'phosphorus_mg', label: 'Phosphorus', unit: 'mg', group: 'mineral', rdi: { m: 700, f: 700 } },
  { key: 'potassium_mg', label: 'Potassium', unit: 'mg', group: 'mineral', rdi: { m: 3400, f: 2600 } },
  { key: 'sodium_mg', label: 'Sodium', unit: 'mg', group: 'mineral', rdi: { m: 1500, f: 1500 }, upper: 2300 },
  { key: 'zinc_mg', label: 'Zinc', unit: 'mg', group: 'mineral', rdi: { m: 11, f: 8 }, upper: 40 },
  { key: 'copper_mg', label: 'Copper', unit: 'mg', group: 'mineral', rdi: { m: 0.9, f: 0.9 }, upper: 10 },
  { key: 'manganese_mg', label: 'Manganese', unit: 'mg', group: 'mineral', rdi: { m: 2.3, f: 1.8 }, upper: 11 },
  { key: 'selenium_ug', label: 'Selenium', unit: 'µg', group: 'mineral', rdi: { m: 55, f: 55 }, upper: 400 },
  { key: 'iodine_ug', label: 'Iodine', unit: 'µg', group: 'mineral', rdi: { m: 150, f: 150 }, upper: 1100 },
  { key: 'omega3_mg', label: 'Omega-3 (ALA)', unit: 'mg', group: 'other', rdi: { m: 1600, f: 1100 } },
];

export function microDef(key: MicroKey): MicroDef {
  return MICRO_DEFS.find((d) => d.key === key)!;
}

export function rdiFor(key: MicroKey, sex: 'male' | 'female'): number {
  const d = microDef(key);
  return sex === 'female' ? d.rdi.f : d.rdi.m;
}

/** Sum any number of partial profiles into a full zero-filled profile. */
export function sumMicros(profiles: Array<Partial<MicroProfile>>): MicroProfile {
  const out = {} as MicroProfile;
  for (const k of MICRO_KEYS) out[k] = 0;
  for (const p of profiles) {
    for (const k of MICRO_KEYS) {
      const v = p[k];
      if (typeof v === 'number' && isFinite(v)) out[k] += v;
    }
  }
  return out;
}

/** Scale a profile (e.g. by servings). Only present keys are scaled. */
export function scaleMicros(p: Partial<MicroProfile>, factor: number): Partial<MicroProfile> {
  const out: Partial<MicroProfile> = {};
  for (const k of MICRO_KEYS) {
    const v = p[k];
    if (typeof v === 'number' && isFinite(v)) out[k] = Math.round(v * factor * 1000) / 1000;
  }
  return out;
}

export function percentRdi(total: number, key: MicroKey, sex: 'male' | 'female'): number {
  const rdi = rdiFor(key, sex);
  if (rdi <= 0) return 0;
  return Math.round((total / rdi) * 100);
}

export type MicroStatus = 'low' | 'ok' | 'high' | 'over';

export function microStatus(total: number, key: MicroKey, sex: 'male' | 'female'): MicroStatus {
  const def = microDef(key);
  if (def.upper && total > def.upper) return 'over';
  const pct = percentRdi(total, key, sex);
  if (pct < 50) return 'low';
  if (pct > 150 && def.upper) return 'high';
  return 'ok';
}

/** Nutrients meaningfully below target — for the "gaps" nudge. */
export function microGaps(
  totals: MicroProfile,
  sex: 'male' | 'female',
  threshold = 50
): Array<{ key: MicroKey; pct: number }> {
  return MICRO_KEYS
    .filter((k) => k !== 'sodium_mg') // sodium: too much is the problem, not too little
    .map((k) => ({ key: k, pct: percentRdi(totals[k], k, sex) }))
    .filter((g) => g.pct < threshold)
    .sort((a, b) => a.pct - b.pct);
}

/** Format a micro amount with its unit. */
export function formatMicro(key: MicroKey, value: number): string {
  const def = microDef(key);
  const v = value >= 100 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${v} ${def.unit}`;
}
