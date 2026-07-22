import type { MicroProfile } from '@/lib/micros';

/**
 * Supplement catalogue.
 *
 * Two kinds:
 *  • 'micronutrient' — vitamins/minerals in pill form (magnesium, D, zinc…).
 *    Their `micros` count toward the same daily micronutrient totals as food,
 *    so the Micros screen shows food + pills combined.
 *  • 'ergogenic' — performance / wellness supplements (creatine, ashwagandha…)
 *    that aren't RDI micronutrients. These are tracked for dose & consistency
 *    with HONEST evidence notes — strong, moderate or limited — never hype.
 *
 * None of this touches the calorie/macro engine.
 */

export type SupplementCategory = 'micronutrient' | 'ergogenic';
export type EvidenceLevel = 'strong' | 'moderate' | 'limited' | 'mixed';

export interface SupplementDef {
  key: string;
  label: string;
  category: SupplementCategory;
  icon: string;
  defaultDose: string;
  /**
   * How many physical units make ONE serving, and what to call them. Capsule
   * products are counted in pills (what you actually swallow), with the mass
   * shown only as context — e.g. spirulina is "3 capsules (1 g)".
   */
  unitsPerServing?: number;
  unitLabel?: 'capsule' | 'tablet' | 'softgel' | 'scoop';
  /** per-dose micronutrient contribution (micronutrient pills only) */
  micros?: Partial<MicroProfile>;
  timing?: string;
  evidenceLevel?: EvidenceLevel; // ergogenics
  evidence?: string;
}

/** "3 capsules" / "2 tablets" — the count you actually take, for logging. */
export function servingUnits(def: SupplementDef): string | null {
  if (!def.unitsPerServing || !def.unitLabel) return null;
  const n = def.unitsPerServing;
  return `${n} ${def.unitLabel}${n === 1 ? '' : 's'}`;
}

export const EVIDENCE_LABEL: Record<EvidenceLevel, string> = {
  strong: 'Strong evidence',
  moderate: 'Moderate evidence',
  limited: 'Limited evidence',
  mixed: 'Mixed evidence',
};

export const EVIDENCE_COLOR: Record<EvidenceLevel, string> = {
  strong: '#33D9A6',
  moderate: '#4F8CFF',
  limited: '#FFB454',
  mixed: '#9AA6B2',
};

export const SUPPLEMENTS: SupplementDef[] = [
  // ── Micronutrient pills (feed the micro totals) ────────────────────────────
  {
    key: 'multivitamin', label: 'Multivitamin', category: 'micronutrient', icon: 'supp.pill',
    defaultDose: '1 tablet', timing: 'With a meal',
    micros: {
      vitaminA_ug: 800, vitaminC_mg: 80, vitaminD_ug: 5, vitaminE_mg: 12, vitaminK_ug: 30,
      thiamin_mg: 1.1, riboflavin_mg: 1.4, niacin_mg: 16, vitaminB6_mg: 1.4, folate_ug: 200,
      vitaminB12_ug: 2.5, biotin_ug: 50, pantothenic_mg: 6, magnesium_mg: 100, zinc_mg: 10,
      iron_mg: 5, iodine_ug: 150, selenium_ug: 55, copper_mg: 0.9,
    },
  },
  { key: 'vitamin-d', label: 'Vitamin D3', category: 'micronutrient', icon: 'supp.sun', defaultDose: '2000 IU (50 µg)', timing: 'With a fatty meal', micros: { vitaminD_ug: 50 } },
  { key: 'magnesium', label: 'Magnesium', category: 'micronutrient', icon: 'supp.mineral', defaultDose: '400 mg', timing: 'Evening', micros: { magnesium_mg: 400 } },
  { key: 'zinc', label: 'Zinc', category: 'micronutrient', icon: 'supp.mineral', defaultDose: '15 mg', timing: 'With food (not with iron/calcium)', micros: { zinc_mg: 15 } },
  { key: 'iron', label: 'Iron', category: 'micronutrient', icon: 'supp.mineral', defaultDose: '18 mg', timing: 'With vitamin C, away from coffee/tea', micros: { iron_mg: 18 } },
  { key: 'vitamin-c', label: 'Vitamin C', category: 'micronutrient', icon: 'supp.pill', defaultDose: '500 mg', micros: { vitaminC_mg: 500 } },
  { key: 'vitamin-b12', label: 'Vitamin B12', category: 'micronutrient', icon: 'supp.pill', defaultDose: '500 µg', timing: 'Important on a vegan diet', micros: { vitaminB12_ug: 500 } },
  { key: 'omega-3', label: 'Omega-3 Fish Oil', category: 'micronutrient', icon: 'supp.oil', defaultDose: '1000 mg EPA+DHA', timing: 'With a meal', micros: { omega3_mg: 1000, vitaminD_ug: 2 } },
  { key: 'calcium', label: 'Calcium', category: 'micronutrient', icon: 'supp.mineral', defaultDose: '500 mg', timing: 'Split doses; with food', micros: { calcium_mg: 500 } },
  { key: 'folate', label: 'Folic Acid', category: 'micronutrient', icon: 'supp.pill', defaultDose: '400 µg', timing: 'Important pre/early pregnancy', micros: { folate_ug: 400 } },
  {
    key: 'spirulina', label: 'Spirulina', category: 'micronutrient', icon: 'supp.leaf',
    defaultDose: '3 capsules (1 g)', unitsPerServing: 3, unitLabel: 'capsule',
    timing: 'With a meal; not late (mildly energising)',
    // Per-100 g composition ÷ 100 for the 1 g (1000 mg) portion.
    //   Ca 120 → 1.2 · Fe 28.5 → 0.29 · Mg 195 → 1.95 · P 118 → 1.18 · K 1360 → 13.6
    //   B1 2.38 → 0.024 · B2 3.67 → 0.037 · B3 12.8 → 0.128
    // Vitamin A: spirulina's activity is provitamin-A (beta-carotene), not retinol.
    // 140 mg/100 g → 1400 µg per 1 g portion → ÷12 (µg beta-carotene per µg RAE)
    // ≈ 117 µg RAE. Stored as RAE so it can't trigger false retinol-toxicity flags.
    micros: {
      calcium_mg: 1.2, iron_mg: 0.285, magnesium_mg: 1.95, phosphorus_mg: 1.18, potassium_mg: 13.6,
      vitaminA_ug: 117, thiamin_mg: 0.024, riboflavin_mg: 0.037, niacin_mg: 0.128,
    },
    evidenceLevel: 'limited',
    evidence: 'A nutrient-dense algae — a genuine source of iron, B-vitamins and provitamin-A carotenoids, but at a 1 g dose the amounts are small next to food. Claims beyond "a modest nutrient top-up" are not well supported. Buy from a tested brand: poorly sourced algae can carry heavy metals or microcystins.',
  },

  // ── Ergogenic / wellness (tracked; honest evidence) ────────────────────────
  {
    key: 'creatine', label: 'Creatine Monohydrate', category: 'ergogenic', icon: 'supp.scoop',
    defaultDose: '5 g/day', timing: 'Any time, daily and consistent',
    evidenceLevel: 'strong',
    evidence: 'The most researched, most effective sports supplement there is. Reliably increases strength, power and lean-mass gains over training. Daily consistency matters more than timing; no loading phase needed. Safe long-term in healthy adults.',
  },
  {
    key: 'caffeine', label: 'Caffeine (pill/pre-workout)', category: 'ergogenic', icon: 'supp.bolt',
    defaultDose: '3–6 mg/kg', timing: '30–60 min pre-workout',
    evidenceLevel: 'strong',
    evidence: 'Strong evidence for endurance, power and reduced perceived effort. Keep total daily caffeine under ~400 mg and avoid late in the day so it doesn\'t wreck your sleep (which the app also tracks).',
  },
  {
    key: 'beta-alanine', label: 'Beta-Alanine', category: 'ergogenic', icon: 'supp.scoop',
    defaultDose: '3.2–6.4 g/day', timing: 'Daily; split doses reduce tingles',
    evidenceLevel: 'moderate',
    evidence: 'Moderate evidence for high-intensity efforts lasting 1–4 minutes. Works by raising muscle carnosine over weeks — like creatine, it\'s a consistency play, not a pre-workout kick.',
  },
  {
    key: 'citrulline', label: 'L-Citrulline / Malate', category: 'ergogenic', icon: 'supp.scoop',
    defaultDose: '6–8 g', timing: '~60 min pre-workout',
    evidenceLevel: 'moderate',
    evidence: 'Moderate evidence for a small boost in training volume and reduced soreness via improved blood flow. Real but modest.',
  },
  {
    key: 'whey', label: 'Whey / Protein Powder', category: 'ergogenic', icon: 'supp.scoop',
    defaultDose: '1 scoop (~25 g protein)', timing: 'Anytime to hit your protein target',
    evidenceLevel: 'strong',
    evidence: 'A convenient protein source, not magic — it helps only insofar as it fills your daily protein target (log it as a food to count the protein). Whole-food protein works just as well.',
  },
  {
    key: 'ashwagandha', label: 'Ashwagandha', category: 'ergogenic', icon: 'supp.leaf',
    defaultDose: '2 capsules (400 mg extract)', unitsPerServing: 2, unitLabel: 'capsule',
    timing: 'Daily; evening suits sleep/stress goals',
    evidenceLevel: 'moderate',
    evidence: 'Moderate evidence that it lowers perceived stress and cortisol and may improve sleep. Your portion (400 mg of extract, 2 capsules) sits inside the 300–600 mg/day range used in most trials. Some small studies show minor strength/recovery benefits, but that evidence is weaker and mixed. Not a stimulant. Avoid with thyroid medication or in pregnancy without medical advice.',
  },
  {
    key: 'shilajit', label: 'Shilajit', category: 'ergogenic', icon: 'supp.mineral',
    defaultDose: '1 capsule (250–500 mg)', unitsPerServing: 1, unitLabel: 'capsule',
    timing: 'Daily, morning with food',
    evidenceLevel: 'limited',
    evidence: 'Limited evidence — small trials suggest reduced fatigue and modest testosterone/recovery effects, but studies are few and often small or industry-funded. Purity is the real issue: unpurified shilajit can contain heavy metals (lead, arsenic) and mycotoxins, so only use a brand with third-party heavy-metal testing. No reliable micronutrient breakdown exists — mineral content varies hugely by source — so FitCoach deliberately does not add it to your vitamin/mineral totals rather than invent numbers.',
  },
  {
    key: 'l-theanine', label: 'L-Theanine', category: 'ergogenic', icon: 'supp.leaf',
    defaultDose: '100–200 mg', timing: 'With caffeine, or for calm focus',
    evidenceLevel: 'moderate',
    evidence: 'Moderate evidence it smooths caffeine\'s jitters and supports calm focus. Commonly paired 1:1–2:1 with caffeine.',
  },
  {
    key: 'melatonin', label: 'Melatonin', category: 'ergogenic', icon: 'supp.moon',
    defaultDose: '0.5–3 mg', timing: '30–60 min before bed',
    evidenceLevel: 'moderate',
    evidence: 'Moderate evidence for helping you fall asleep faster and for jet lag. Lower doses often work as well as high ones. It\'s a timing signal, not a sedative — pair with good sleep habits (which the app tracks).',
  },
  {
    key: 'collagen', label: 'Collagen', category: 'ergogenic', icon: 'supp.scoop',
    defaultDose: '10–15 g', timing: 'With vitamin C, ~60 min pre-training',
    evidenceLevel: 'limited',
    evidence: 'Limited but growing evidence for tendon/joint and skin support. As a muscle-protein source it\'s low quality (missing tryptophan) — don\'t count it toward your protein target.',
  },
  {
    key: 'zma', label: 'ZMA (Zinc-Magnesium-B6)', category: 'ergogenic', icon: 'supp.mineral',
    defaultDose: '1 serving', timing: 'Before bed, empty stomach',
    evidenceLevel: 'limited',
    evidence: 'Useful if you\'re actually deficient in zinc or magnesium (it corrects that). Evidence for boosting testosterone or performance in non-deficient people is weak. Its zinc/magnesium do count toward your micro totals.',
    micros: { zinc_mg: 30, magnesium_mg: 450, vitaminB6_mg: 10.5 },
  },
  {
    key: 'probiotics', label: 'Probiotics', category: 'ergogenic', icon: 'supp.leaf',
    defaultDose: '1 capsule', timing: 'Consistent daily',
    evidenceLevel: 'mixed',
    evidence: 'Mixed and strain-specific evidence for gut and immune support. Benefits (if any) depend heavily on the specific strains and the individual.',
  },
];

export function findSupplement(key: string): SupplementDef | undefined {
  return SUPPLEMENTS.find((s) => s.key === key);
}
