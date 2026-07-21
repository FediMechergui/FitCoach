import { findSupplement, type EvidenceLevel } from '@/data/supplements';

/**
 * Goal-driven supplement protocol.
 *
 * Turns a set of goals into a concrete, time-slotted intake plan built ONLY from
 * the catalogue, with honest evidence ratings and — the important part — a
 * safety layer that flags dose caps, timing conflicts and real interactions.
 *
 * This is educational structure, not medical advice. It never tells you to
 * exceed a tolerable upper intake, and it says plainly when a supplement is not
 * the answer (most notably: nothing here treats nicotine dependence).
 */

export type SupplementGoal =
  | 'athletic_performance'
  | 'sleep_quality'
  | 'quit_smoking'
  | 'stress_recovery'
  | 'general_wellbeing';

export interface GoalDef {
  key: SupplementGoal;
  label: string;
  blurb: string;
  icon: string;
}

export const SUPPLEMENT_GOALS: GoalDef[] = [
  { key: 'athletic_performance', label: 'Athletic performance', blurb: 'Strength, power & training output', icon: 'strength.dumbbell' },
  { key: 'sleep_quality', label: 'Better sleep', blurb: 'Fall asleep faster, sleep deeper', icon: 'sleep.moon' },
  { key: 'quit_smoking', label: 'Reducing smoking', blurb: 'Support while you cut down', icon: 'smoking.smokeFree' },
  { key: 'stress_recovery', label: 'Stress & recovery', blurb: 'Lower stress load, recover better', icon: 'hormone.stress' },
  { key: 'general_wellbeing', label: 'General wellbeing', blurb: 'Fill the common gaps', icon: 'care.heart' },
];

export type Slot = 'morning' | 'preworkout' | 'evening' | 'bed';

export const SLOT_META: Record<Slot, { label: string; when: string }> = {
  morning: { label: 'Morning', when: 'With breakfast' },
  preworkout: { label: 'Pre-workout', when: '30–60 min before training' },
  evening: { label: 'Evening', when: 'With dinner' },
  bed: { label: 'Before bed', when: '30–60 min before sleep' },
};

export interface PlanItem {
  key: string;
  label: string;
  dose: string;
  slot: Slot;
  why: string;
  core: boolean;
  evidenceLevel?: EvidenceLevel;
  goals: SupplementGoal[];
}

export interface SafetyNote {
  severity: 'info' | 'caution' | 'warning';
  text: string;
}

export interface IntakePlan {
  goals: SupplementGoal[];
  slots: Array<{ slot: Slot; label: string; when: string; items: PlanItem[] }>;
  notes: SafetyNote[];
}

interface Rec {
  key: string;
  slot: Slot;
  why: string;
  /** core = well-evidenced for this goal; else optional/experimental */
  core: boolean;
}

const BY_GOAL: Record<SupplementGoal, Rec[]> = {
  athletic_performance: [
    { key: 'creatine', slot: 'morning', core: true, why: 'The single best-evidenced performance supplement — strength, power and lean mass. Daily consistency beats timing.' },
    { key: 'whey', slot: 'morning', core: true, why: 'Only useful to close the gap to your daily protein target — log it as food so the protein counts.' },
    { key: 'caffeine', slot: 'preworkout', core: false, why: 'Reliable boost to output and perceived effort — but it is the main thing that wrecks sleep, so keep it early.' },
    { key: 'citrulline', slot: 'preworkout', core: false, why: 'Small, real bump in training volume and less soreness. Modest.' },
    { key: 'beta-alanine', slot: 'morning', core: false, why: 'Helps efforts lasting 1–4 minutes; works by building up over weeks, not as a pre-workout kick.' },
  ],
  sleep_quality: [
    { key: 'magnesium', slot: 'bed', core: true, why: 'Supports sleep quality and muscle relaxation, most clearly if your intake is low.' },
    { key: 'l-theanine', slot: 'bed', core: false, why: 'Calm without sedation; pairs well if evening wind-down is the problem.' },
    { key: 'melatonin', slot: 'bed', core: false, why: 'Helps you fall asleep faster — a timing signal, not a sedative. Start at the lowest dose.' },
    { key: 'ashwagandha', slot: 'evening', core: false, why: 'Lowers perceived stress and cortisol, which is often what is keeping you awake.' },
  ],
  quit_smoking: [
    { key: 'vitamin-c', slot: 'morning', core: true, why: 'Smoking measurably increases vitamin C turnover — smokers need roughly 35 mg/day more than non-smokers. This closes that specific gap.' },
    { key: 'magnesium', slot: 'evening', core: false, why: 'Supports stress and sleep during withdrawal, when both usually get worse.' },
    { key: 'ashwagandha', slot: 'evening', core: false, why: 'May take the edge off perceived stress while you cut down. It does not reduce nicotine cravings.' },
    { key: 'omega-3', slot: 'morning', core: false, why: 'General cardiovascular support while your recovery is underway.' },
  ],
  stress_recovery: [
    { key: 'ashwagandha', slot: 'evening', core: true, why: 'The best-evidenced option here for lowering perceived stress and cortisol.' },
    { key: 'magnesium', slot: 'bed', core: true, why: 'Commonly low, and low magnesium worsens stress and sleep.' },
    { key: 'l-theanine', slot: 'evening', core: false, why: 'Calm focus during the day, smooths caffeine.' },
    { key: 'omega-3', slot: 'morning', core: false, why: 'Modest support for mood and recovery.' },
  ],
  general_wellbeing: [
    { key: 'vitamin-d', slot: 'morning', core: true, why: 'The most commonly deficient nutrient, especially in winter — affects immunity, mood and bone health.' },
    { key: 'omega-3', slot: 'morning', core: true, why: 'Most diets under-deliver EPA/DHA; supports heart and brain.' },
    { key: 'spirulina', slot: 'morning', core: false, why: 'A modest whole-food top-up of iron, B-vitamins and provitamin A. Small amounts — a supplement to food, not a substitute.' },
    { key: 'shilajit', slot: 'morning', core: false, why: 'Optional and lightly evidenced — only worth it with a third-party heavy-metal-tested product.' },
    { key: 'multivitamin', slot: 'morning', core: false, why: 'Insurance for gaps only. If your diet already covers the basics it adds little.' },
  ],
};

const SLOT_ORDER: Slot[] = ['morning', 'preworkout', 'evening', 'bed'];

export interface PlanContext {
  /** the user smokes / is cutting down (drives the beta-carotene caution) */
  smokes?: boolean;
  /** average daily caffeine from the diary, mg */
  caffeineMgPerDay?: number;
  /** flagged health conditions (catalogue keys), e.g. 'hypothyroidism' */
  conditions?: string[];
}

/** Build a de-duplicated, time-slotted plan plus its safety notes. */
export function buildIntakePlan(goals: SupplementGoal[], ctx: PlanContext = {}): IntakePlan {
  const merged = new Map<string, PlanItem>();

  for (const goal of goals) {
    for (const rec of BY_GOAL[goal] ?? []) {
      const def = findSupplement(rec.key);
      if (!def) continue;
      const existing = merged.get(rec.key);
      if (existing) {
        // Same supplement wanted by two goals — keep it once, note both reasons.
        if (!existing.goals.includes(goal)) existing.goals.push(goal);
        existing.core = existing.core || rec.core;
        if (!existing.why.includes(rec.why)) existing.why += ` ${rec.why}`;
        continue;
      }
      merged.set(rec.key, {
        key: rec.key,
        label: def.label,
        dose: def.defaultDose,
        slot: rec.slot,
        why: rec.why,
        core: rec.core,
        evidenceLevel: def.evidenceLevel,
        goals: [goal],
      });
    }
  }

  const items = [...merged.values()];
  const slots = SLOT_ORDER.map((slot) => ({
    slot,
    label: SLOT_META[slot].label,
    when: SLOT_META[slot].when,
    items: items.filter((i) => i.slot === slot).sort((a, b) => Number(b.core) - Number(a.core)),
  })).filter((s) => s.items.length > 0);

  return { goals, slots, notes: safetyNotes(goals, items, ctx) };
}

/** The safety layer: dose caps, timing conflicts and real interactions. */
function safetyNotes(goals: SupplementGoal[], items: PlanItem[], ctx: PlanContext): SafetyNote[] {
  const notes: SafetyNote[] = [];
  const has = (k: string) => items.some((i) => i.key === k);
  const conditions = ctx.conditions ?? [];

  // Nothing here treats nicotine dependence — say it plainly.
  if (goals.includes('quit_smoking')) {
    notes.push({
      severity: 'warning',
      text: 'No supplement treats nicotine dependence. The things that actually work are nicotine-replacement therapy, prescription options (e.g. varenicline) and behavioural support — talk to a clinician or a quit line. Everything below only helps with the side-effects of smoking and quitting (stress, sleep, vitamin C turnover).',
    });
  }

  // Beta-carotene / vitamin A + smoking: a genuine, trial-backed interaction.
  if (ctx.smokes || goals.includes('quit_smoking')) {
    if (has('spirulina') || has('multivitamin')) {
      notes.push({
        severity: 'caution',
        text: 'Smokers should avoid HIGH-dose beta-carotene / vitamin A supplements — large trials (ATBC, CARET) found increased lung-cancer risk at 20–30 mg/day of beta-carotene. Your spirulina portion supplies roughly 1.4 mg, far below that, and a standard multivitamin is also low — but do not stack extra high-dose beta-carotene or vitamin A products while you smoke.',
      });
    }
  }

  // Caffeine: daily cap + sleep conflict.
  if (has('caffeine')) {
    notes.push({
      severity: 'caution',
      text: `Keep TOTAL daily caffeine (coffee, tea, energy drinks and any pre-workout) under ~400 mg${
        ctx.caffeineMgPerDay ? ` — your diary currently averages about ${Math.round(ctx.caffeineMgPerDay)} mg/day` : ''
      }, and take none within ~8 hours of bedtime.`,
    });
    if (goals.includes('sleep_quality')) {
      notes.push({
        severity: 'warning',
        text: 'You picked both better sleep and caffeine. Caffeine has a ~5–6 hour half-life — if sleep is the priority, cut it off by early afternoon or drop it entirely; otherwise it will undo the evening supplements.',
      });
    }
  }

  // Don't double up magnesium/zinc.
  if (has('magnesium') && has('zma')) {
    notes.push({ severity: 'warning', text: 'Magnesium and ZMA both contain magnesium (and ZMA adds zinc) — taking both risks doubling up. Pick one.' });
  }
  if (has('zinc') && has('zma')) {
    notes.push({ severity: 'warning', text: 'Zinc and ZMA together can push you past the 40 mg/day upper limit for zinc. Pick one.' });
  }

  // Mineral absorption spacing.
  if (has('iron') && (has('calcium') || has('zinc') || has('multivitamin'))) {
    notes.push({ severity: 'info', text: 'Take iron apart from calcium, zinc and coffee/tea (they block absorption) — pair it with vitamin C instead. Only supplement iron if a blood test shows you are low; excess iron is harmful.' });
  }

  // Ashwagandha cautions.
  if (has('ashwagandha')) {
    const thyroid = conditions.some((c) => c.includes('thyroid'));
    notes.push({
      severity: thyroid ? 'warning' : 'caution',
      text: thyroid
        ? 'You have flagged a thyroid condition. Ashwagandha can raise thyroid hormone levels and interact with thyroid medication — do not take it without your clinician\'s go-ahead.'
        : 'Avoid ashwagandha with thyroid medication, in pregnancy, or alongside sedatives. Take a break every few months rather than running it continuously.',
    });
  }

  // Melatonin.
  if (has('melatonin')) {
    notes.push({ severity: 'caution', text: 'Start melatonin at the LOWEST dose (0.5 mg) — higher doses are not more effective and cause morning grogginess. It is best for short-term use or jet lag, not indefinitely.' });
  }

  // Shilajit purity.
  if (has('shilajit')) {
    notes.push({ severity: 'caution', text: 'Only use shilajit with third-party heavy-metal testing — unpurified product can contain lead and arsenic. Skip it if you have haemochromatosis or high iron, as it is iron-bearing.' });
  }

  // Foundations first.
  notes.push({
    severity: 'info',
    text: 'Supplements are the smallest lever. Sleep, protein, total calories, progressive training and not smoking move your results far more — this plan is a top-up on those, not a replacement.',
  });
  notes.push({
    severity: 'info',
    text: 'Educational only, not medical advice. Check with a doctor or pharmacist before starting anything if you take medication, have a health condition, or are pregnant.',
  });

  return notes;
}
