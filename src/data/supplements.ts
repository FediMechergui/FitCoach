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
 * Supplements normally carry no energy, so none of this touches the
 * calorie/macro engine — except the few with a real `macros` field (fish oil),
 * which log a linked diary row so their calories count like food's.
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
  /**
   * Real energy per serving, for the few supplements that carry any — fish oil
   * is a gram of fat per softgel. Logged as a linked diary row so it flows
   * through the same calorie engine as food, and deleting the supplement log
   * removes its calories with it. Most pills have none and omit this.
   */
  macros?: { calories: number; proteinG?: number; carbsG?: number; fatG?: number };
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

  // ── The user's actual products (GSN), values transcribed from their labels ──
  {
    key: 'gsn-multivitamin', label: 'MultiVitamins – GSN', category: 'micronutrient', icon: 'supp.pill',
    defaultDose: '1 capsule', unitsPerServing: 1, unitLabel: 'capsule',
    timing: 'With a meal',
    // Label states 300% AJR across the board (D is 300% of the old 5 µg NRV).
    micros: {
      vitaminA_ug: 2400, vitaminB6_mg: 4.2, vitaminB12_ug: 7.5, vitaminC_mg: 240,
      vitaminD_ug: 15, vitaminE_mg: 36, vitaminK_ug: 225, biotin_ug: 150,
      riboflavin_mg: 4.2, thiamin_mg: 3.3, pantothenic_mg: 18, folate_ug: 600,
      niacin_mg: 48, chromium_ug: 120, copper_mg: 3, iodine_ug: 450,
      iron_mg: 42, manganese_mg: 6, zinc_mg: 30,
    },
    evidenceLevel: 'moderate',
    evidence:
      'A deliberately high-dosed multi — everything on the label is 300% of the reference intake. Three lines deserve attention rather than applause. Iron 42 mg: close to the 45 mg daily upper limit, and a man who is not deficient has no use for it — unabsorbed iron is not free. Vitamin A 2400 µg: 80% of the 3000 µg upper limit from one capsule, so go easy on liver in the same week. Zinc 30 mg: fine alone, but see the standalone zinc below — the two together on the same day total 60 mg, well above the 40 mg upper limit, and chronic zinc excess depletes copper. The app tracks uppers on the Micros screen and will flag the day red when that happens. One capsule a day, never doubled.',
  },
  {
    key: 'gsn-zinc', label: 'Zinc Bisglycinate – GSN', category: 'micronutrient', icon: 'supp.mineral',
    defaultDose: '1 capsule (30 mg)', unitsPerServing: 1, unitLabel: 'capsule',
    timing: 'With food; not the same day as the multi',
    micros: { zinc_mg: 30 },
    evidenceLevel: 'moderate',
    evidence:
      'Zinc genuinely matters for testosterone — but only in the direction of correcting a deficiency; extra zinc on top of enough does nothing further. Bisglycinate is a well-absorbed form and 30 mg is a solid corrective dose. THE WARNING THAT MATTERS: the GSN multi already contains 30 mg of zinc. Taken together every day that is 60 mg — far past the 40 mg upper limit — and chronic high zinc quietly causes copper deficiency (anaemia, nerve symptoms). Alternate them, or reserve this for days you skip the multi. The Micros screen tracks the total and flags the excess.',
  },
  {
    key: 'gsn-mag-b', label: 'MAG+ B-Complex – GSN', category: 'micronutrient', icon: 'supp.mineral',
    defaultDose: '1 capsule', unitsPerServing: 1, unitLabel: 'capsule',
    timing: 'Evening — magnesium suits the end of the day',
    micros: { magnesium_mg: 415, thiamin_mg: 1.1, vitaminB6_mg: 1.4, folate_ug: 200, vitaminB12_ug: 2.5 },
    evidenceLevel: 'moderate',
    evidence:
      'Magnesium bisglycinate 415 mg with a modest B-complex at ~100% reference doses. Magnesium has decent evidence for sleep quality and muscle function, and bisglycinate is the form least likely to upset the gut — though 415 mg is slightly past the 350 mg guideline for supplemental magnesium, which for this form usually means nothing worse than loose stools if you are sensitive. The B-vitamins overlap with the multi; that is harmless (B excess is excreted) but is also why the fatigue claims on the label add little if the multi is already covering them.',
  },
  {
    key: 'gsn-fish-oil', label: 'Fish Oil Omega 3 – GSN', category: 'micronutrient', icon: 'supp.oil',
    defaultDose: '1 softgel (1000 mg)', unitsPerServing: 1, unitLabel: 'softgel',
    timing: 'With a meal containing fat',
    // EPA 180 + DHA 120 = 300 mg long-chain omega-3 per softgel.
    micros: { omega3_mg: 300 },
    // The one product here with real energy: a gram of fat is a gram of fat.
    macros: { calories: 10, fatG: 1 },
    evidenceLevel: 'moderate',
    evidence:
      'A standard 30/20 fish oil: each 1000 mg softgel carries 180 mg EPA + 120 mg DHA — 300 mg of the omega-3s that matter, which is what the app records (the other 700 mg is carrier fats). Omega-3 has solid evidence for triglycerides and modest evidence for joint and mood outcomes; most trials showing effects use 1–3 g of EPA+DHA daily, so one softgel is a maintenance dose and three softgels would match the low end of the trials. Its 10 kcal of fat per softgel is logged into your diary automatically and removed if you delete the log — small, but the app does not pretend fat is free. Prefer a brand with an oxidation (TOTOX) figure; rancid fish oil is worse than none.',
  },
  {
    // Labelled the way it's sold here (and across France/North Africa):
    // "Spiruline". Same organism — Arthrospira platensis — just the French name.
    // The catalogue `key` stays 'spirulina' forever: logs store it, so renaming
    // the key would orphan every entry already in the diary.
    key: 'spirulina', label: 'Spiruline', category: 'micronutrient', icon: 'supp.leaf',
    defaultDose: '6 tablets (3 g)', unitsPerServing: 6, unitLabel: 'tablet',
    timing: 'With a meal; not late (mildly energising)',
    // Per-100 g composition × 0.03 for a 3 g portion (the dose most trials use).
    //   Ca 120 → 3.6 · Fe 28.5 → 0.86 · Mg 195 → 5.9 · P 118 → 3.5 · K 1360 → 40.8
    //   Cu 6.1 → 0.18 · B1 2.38 → 0.071 · B2 3.67 → 0.11 · B3 12.8 → 0.38
    // Vitamin A: spirulina's activity is provitamin-A (beta-carotene), not retinol.
    // 140 mg/100 g → 4200 µg per 3 g portion → ÷12 (µg beta-carotene per µg RAE)
    // ≈ 350 µg RAE. Stored as RAE so it can't trigger false retinol-toxicity flags.
    // Vitamin B12 is deliberately ABSENT — see the evidence note. Spirulina's
    // B12 is a pseudo-vitamin the body cannot use, and listing it here would
    // let the Micros screen tell someone they were covered when they were not.
    micros: {
      calcium_mg: 3.6, iron_mg: 0.855, magnesium_mg: 5.85, phosphorus_mg: 3.54, potassium_mg: 40.8,
      copper_mg: 0.183, vitaminA_ug: 350, thiamin_mg: 0.0714, riboflavin_mg: 0.11, niacin_mg: 0.384,
    },
    evidenceLevel: 'limited',
    evidence:
      'Spiruline (spirulina) is a cyanobacterium — Arthrospira platensis — rather than a true algae, grown in alkaline water and dried. Roughly 60–70% protein by dry weight, though at a 3 g dose that is only ~2 g of protein, which is why it is a micronutrient supplement here and not a protein source. Its blue pigment, phycocyanin, is the antioxidant most of the research is interested in.\n\n' +
      'What the evidence actually supports: meta-analyses of small trials find modest reductions in total cholesterol, LDL and triglycerides, and small reductions in blood pressure. There is some positive but limited trial data in allergic rhinitis, and in anaemia in older adults. Effects on endurance and exercise-induced oxidative stress come from a handful of very small studies. Nothing here is dramatic, and most trials use 1–8 g/day — this portion is set to 3 g, the commonest trial dose, rather than the token 1 g many labels suggest.\n\n' +
      'THE B12 TRAP — the single most important thing to know. Labels routinely advertise spirulina as rich in vitamin B12. It is not. Almost all of it is pseudo-B12 (corrinoid analogues) that humans cannot absorb or use, and which can interfere with the assays used to measure real B12. Vegans and vegetarians who rely on spirulina for B12 can develop a genuine deficiency while believing they are covered. FitCoach therefore records NO B12 from spirulina at all. If you do not eat animal products, take an actual B12 supplement.\n\n' +
      'Safety: buy only from a brand doing third-party testing. Spirulina grown in open or uncontrolled water can be co-harvested with other cyanobacteria and carry microcystins — liver toxins — as well as heavy metals and BMAA. Must be avoided entirely in phenylketonuria (PKU): it is high in phenylalanine. Caution with autoimmune conditions, since it stimulates parts of the immune system, and with any anticoagulant, and stop before surgery.',
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
    evidence:
      'Shilajit (mumijo, salajeet) is a tar-like resin that seeps from rock faces in the Himalaya, Altai and Caucasus over centuries as plant matter compresses. Its active fraction is fulvic acid, along with dibenzo-alpha-pyrones and trace minerals. Purified resin or extract is the only form worth considering — see safety below.\n\n' +
      'What the evidence actually supports, stated plainly: less than most sellers imply. The testosterone claim traces largely to ONE 90-day randomised trial in men aged 45–55 taking 250 mg twice daily, which found higher total and free testosterone against placebo. That is a single, small, industry-linked study, and it has not been replicated at the scale that would make it a settled finding. A small trial suggested better preservation of muscle strength after fatiguing exercise at 500 mg/day over 8 weeks. Fatigue and chronic-fatigue benefits are mostly animal work plus uncontrolled human reports. The Alzheimer\'s and cognition claims rest on test-tube findings that fulvic acid interferes with tau protein aggregation — that is a mechanism, not a result in people.\n\n' +
      'Typical dose in the research is 250–500 mg/day of a purified extract, which is where this portion sits.\n\n' +
      'SAFETY — the part that matters more than the benefits. Raw, unpurified shilajit is genuinely hazardous: it can carry lead, arsenic and mercury, plus mycotoxins and free radicals, and there are documented lead-poisoning cases from Ayurvedic preparations. Traditional practice purifies it (shodhana) for exactly this reason. Buy only a product with third-party heavy-metal testing you can actually read. It is also iron-rich, so avoid it with haemochromatosis or a high ferritin reading; it may raise uric acid, so be careful with gout; and it should be avoided in pregnancy and breastfeeding, and by anyone with sickle-cell disease.\n\n' +
      'FitCoach deliberately adds NO vitamins or minerals from shilajit to your daily totals. Its mineral content varies enormously by source and batch, and there is no honest number to use — a plausible-looking figure would be worse than a blank.',
  },
  {
    // A specific branded product the user takes; values transcribed from its
    // own label (per 2-capsule serving, 20 servings per pot).
    key: 'herbz-testobooster', label: 'Herbz TestoBooster', category: 'ergogenic', icon: 'supp.leaf',
    defaultDose: '2 capsules', unitsPerServing: 2, unitLabel: 'capsule',
    timing: 'Morning with food; ginseng late in the day can disturb sleep',
    // The C and Mg are real micronutrients and count toward daily totals.
    // Moringa and ginseng carry no vitamin/mineral values on the label, so
    // nothing is invented for them.
    micros: { vitaminC_mg: 80, magnesium_mg: 70 },
    evidenceLevel: 'limited',
    evidence:
      'What is actually in a serving, against what the research uses: Moringa 150 mg — moringa is a genuinely nutrient-dense leaf, but studies use it as a food powder in GRAMS, and its testosterone claims come from rodent work; 150 mg is a token amount. Ginseng 70 mg — Panax ginseng has moderate human evidence for fatigue and erectile function, but the classic trials use ~200 mg of standardised extract to 1–3 g of root daily; this is a third of even the low end, and the label does not say which ginseng or what extract. Vitamin C 80 mg — a genuine, useful top-up (about 100% of the reference intake); no effect on testosterone. Magnesium 70 mg — about a fifth of the daily reference; magnesium relates to testosterone mainly when you are deficient and training hard, and the studies showing that used several times this dose.\n\n' +
      'Said plainly: nothing in this formula, at these doses, has good evidence for raising testosterone in a healthy man. It is best understood as a small vitamin C and magnesium supplement with herbal garnish — those two are counted toward your daily micronutrients, honestly. It is also notable for what it leaves out: zinc and vitamin D, the two nutrients with the strongest deficiency-to-testosterone link, are not in it.\n\n' +
      'What actually moves testosterone, all of it tracked by this app: sleeping 7–9 hours, training hard (especially the legs), keeping body fat in a healthy range, eating enough fat, and not drinking heavily. If a blood test says you are genuinely low, that is a doctor conversation, not a capsule one.\n\n' +
      'Safety: ginseng can interact with anticoagulants and diabetes medication, and can disturb sleep taken late. Avoid in pregnancy. Nothing here is dangerous at these doses for a healthy adult.',
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
