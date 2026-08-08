/**
 * Nicotine products, so the tracker covers what people actually use instead of
 * assuming everything is a cigarette.
 *
 * ── The distinction the whole model turns on ──
 * **Combustion.** Almost all of smoking's damage comes from inhaling the
 * products of burning: tar, and carbon monoxide that binds haemoglobin and
 * throttles oxygen delivery. Nicotine is what makes it addictive; smoke is what
 * makes it lethal. A pouch, a patch and a vape deliver nicotine without setting
 * anything on fire, which is why they sit in a completely different risk class
 * from a cigarette — and why FitCoach only applies its life-cost and aerobic
 * penalties to the things you actually burn.
 *
 * That is not the same as calling them safe, and this file does not. Nicotine
 * itself raises heart rate and blood pressure, is powerfully addictive, and is
 * genuinely harmful in adolescence and pregnancy. Oral products bring their own
 * gum and dental problems. Every entry says what its own trade-off is.
 *
 * `relativeHarm` is a coarse ordering for framing, not a measurement — nobody
 * has a per-unit harm number for a nicotine pouch, and this file will not
 * pretend otherwise. It is used only to sort and colour, never to compute a
 * health figure.
 */

export type NicotineForm =
  | 'cigarette'
  | 'rolled'
  | 'cigar'
  | 'shisha'
  | 'heated'
  | 'vape'
  | 'snus'
  | 'pouch'
  | 'gum'
  | 'lozenge'
  | 'patch';

export interface NicotineProduct {
  key: string;
  label: string;
  form: NicotineForm;
  /** what one logged unit is */
  unitLabel: string;
  /** nicotine typically ABSORBED per unit, mg */
  nicotineMg: number;
  /** does using it involve burning something and inhaling the smoke? */
  combusted: boolean;
  /**
   * How many cigarettes' worth of *combustion* damage one unit carries. Only
   * meaningful for combusted products; zero for everything else, which is the
   * point rather than an oversight.
   */
  cigaretteEquivalent: number;
  /** a licensed stop-smoking medicine rather than a recreational product */
  isNrt?: boolean;
  icon: string;
  note: string;
}

export const NICOTINE_PRODUCTS: NicotineProduct[] = [
  // ── Combusted — the ones that carry the real damage ──
  {
    key: 'cigarette', label: 'Cigarette', form: 'cigarette', unitLabel: 'cigarette',
    nicotineMg: 1.1, combusted: true, cigaretteEquivalent: 1, icon: 'smoking.cigarette',
    note: 'The reference point for everything else here. Tar and carbon monoxide, not nicotine, are what cause the damage.',
  },
  {
    key: 'rollup', label: 'Roll-Up', form: 'rolled', unitLabel: 'roll-up',
    nicotineMg: 1.2, combusted: true, cigaretteEquivalent: 1, icon: 'smoking.cigarette',
    note: 'No filter, or a weak one. Hand-rolled tobacco is not the gentler option it is often assumed to be — if anything the exposure per cigarette is a little higher.',
  },
  {
    key: 'cigar', label: 'Cigar', form: 'cigar', unitLabel: 'cigar',
    nicotineMg: 10, combusted: true, cigaretteEquivalent: 4, icon: 'smoking.cigarette',
    note: 'Far more tobacco than a cigarette and a long burn. Even without deliberate inhaling there is real exposure to the mouth, throat and oesophagus.',
  },
  {
    key: 'shisha', label: 'Shisha / Hookah', form: 'shisha', unitLabel: 'session',
    nicotineMg: 3, combusted: true, cigaretteEquivalent: 10, icon: 'smoking.cigarette',
    note: 'The most underestimated item on this list. A session runs 30–60 minutes and the water cools the smoke without filtering it — the smoke volume inhaled is many times a single cigarette, and burning charcoal adds a large carbon-monoxide load on top.',
  },
  {
    key: 'heated', label: 'Heated Tobacco (IQOS-style)', form: 'heated', unitLabel: 'stick',
    nicotineMg: 1.1, combusted: true, cigaretteEquivalent: 0.5, icon: 'smoking.cigarette',
    note: 'Heats tobacco instead of burning it, so some harmful compounds fall substantially — but it is still tobacco aerosol, the reduction is smaller than the marketing implies, and long-term data is thin. Counted here as partially combusted.',
  },

  // ── Not combusted — nicotine without the smoke ──
  {
    key: 'vape', label: 'Vape / E-Cigarette', form: 'vape', unitLabel: 'session',
    nicotineMg: 2, combusted: false, cigaretteEquivalent: 0, icon: 'smoking.vape',
    note: 'No combustion, so no tar and no carbon monoxide — UK health bodies put it at a small fraction of smoking\'s risk, and it is an effective quitting aid. Not harmless: long-term data is limited, and nicotine dependence carries over completely. Buy regulated product; the serious lung injuries reported were traced to illicit THC oils, not nicotine liquid.',
  },
  {
    key: 'snus', label: 'Snus', form: 'snus', unitLabel: 'portion',
    nicotineMg: 3.5, combusted: false, cigaretteEquivalent: 0, icon: 'smoking.pouch',
    note: 'Moist tobacco under the lip. Sweden\'s experience is the strongest real-world evidence that it displaces smoking and that the population harm is far lower — but it is still tobacco, it causes gum recession and lesions, and dependence is if anything stronger because it can be used all day indoors.',
  },
  {
    key: 'pouch', label: 'Nicotine Pouch (tobacco-free)', form: 'pouch', unitLabel: 'pouch',
    nicotineMg: 4, combusted: false, cigaretteEquivalent: 0, icon: 'smoking.pouch',
    note: 'Nicotine without tobacco leaf, so no tobacco-specific carcinogens. Newer than snus, with correspondingly less long-term data. Strengths vary enormously — some are far stronger than a cigarette — and gum irritation is common.',
  },

  // ── Licensed stop-smoking medicines ──
  {
    key: 'nrt-gum', label: 'Nicotine Gum', form: 'gum', unitLabel: 'piece',
    nicotineMg: 2, combusted: false, cigaretteEquivalent: 0, isNrt: true, icon: 'smoking.nrt',
    note: 'Licensed replacement therapy. Chew slowly until it tingles then park it against your cheek — chewing it like ordinary gum swallows the nicotine and causes hiccups and nausea instead of working.',
  },
  {
    key: 'nrt-lozenge', label: 'Nicotine Lozenge', form: 'lozenge', unitLabel: 'lozenge',
    nicotineMg: 2, combusted: false, cigaretteEquivalent: 0, isNrt: true, icon: 'smoking.nrt',
    note: 'Licensed replacement therapy. Let it dissolve; do not chew or swallow it.',
  },
  {
    key: 'nrt-patch', label: 'Nicotine Patch', form: 'patch', unitLabel: 'patch',
    nicotineMg: 15, combusted: false, cigaretteEquivalent: 0, isNrt: true, icon: 'smoking.nrt',
    note: 'Steady background nicotine across the day, which takes the edge off the constant craving. The evidence is strongest for a patch COMBINED with a fast-acting form — gum or lozenge — for the sudden urges the patch cannot cover.',
  },
];

export const findNicotineProduct = (key: string | null | undefined): NicotineProduct | undefined =>
  NICOTINE_PRODUCTS.find((p) => p.key === key);

/** Entries logged before products existed are cigarettes — that's what was tracked. */
export const DEFAULT_PRODUCT_KEY = 'cigarette';

export function productOrDefault(key: string | null | undefined): NicotineProduct {
  return findNicotineProduct(key) ?? NICOTINE_PRODUCTS[0];
}

/** Grouped for the picker, worst-first so the ordering itself carries information. */
export const NICOTINE_GROUPS: Array<{ label: string; blurb: string; keys: string[] }> = [
  {
    label: 'Smoked',
    blurb: 'Burning is what does the damage — tar and carbon monoxide.',
    keys: ['cigarette', 'rollup', 'cigar', 'shisha', 'heated'],
  },
  {
    label: 'Smoke-free alternatives',
    blurb: 'Nicotine without combustion. Much lower risk than smoking, not zero.',
    keys: ['vape', 'snus', 'pouch'],
  },
  {
    label: 'Stop-smoking medicines',
    blurb: 'Licensed, dosed and designed to be tapered off.',
    keys: ['nrt-gum', 'nrt-lozenge', 'nrt-patch'],
  },
];
