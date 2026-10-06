import type { Goal } from './calories';

/**
 * Phase and focus — what the eating is doing, and what the lifting is FOR.
 *
 * The phase is the goal the calorie targets already follow, under the names
 * people use in a gym: a bulk is the surplus (build muscle), a cut is the
 * deficit (lose fat). Choosing one changes the calorie target exactly as the
 * goal picker always has — it is the same setting, not a second one that
 * could disagree with it.
 *
 * The focus is new: grow the muscle (hypertrophy), get strong, last longer,
 * hold on to what you have through a cut (preserve), or deliberately carry
 * less of it (reduce). "Atrophy" is what happens to muscle that is not
 * asked for anything; nobody needs a programme for that. Someone who wants
 * SMALLER muscles — a fighter making a weight class, a runner who wants
 * lighter legs — still needs to train, just differently, and keep their
 * health while they do. That is what `reduce` is.
 *
 * Pure: the tip is computed from what was logged last time and the estimated
 * one-rep max, so it changes as the numbers do.
 */

export type TrainingFocus = 'hypertrophy' | 'strength' | 'endurance' | 'preserve' | 'reduce';
export type Phase = 'bulk' | 'cut' | 'maintain' | 'recomp' | 'performance';

export const DEFAULT_FOCUS: TrainingFocus = 'hypertrophy';
export const FOCUS_ORDER: TrainingFocus[] = ['hypertrophy', 'strength', 'endurance', 'preserve', 'reduce'];
export const PHASE_ORDER: Phase[] = ['bulk', 'cut', 'maintain', 'recomp', 'performance'];

export const PHASE_FROM_GOAL: Record<Goal, Phase> = {
  build_muscle: 'bulk',
  lose_fat: 'cut',
  maintain: 'maintain',
  recomp: 'recomp',
  performance: 'performance',
};

export const GOAL_FROM_PHASE: Record<Phase, Goal> = {
  bulk: 'build_muscle',
  cut: 'lose_fat',
  maintain: 'maintain',
  recomp: 'recomp',
  performance: 'performance',
};

export const PHASE_META: Record<Phase, { label: string; blurb: string }> = {
  bulk: { label: 'Bulk', blurb: 'A small calorie surplus. The best time to add muscle and set records — some fat comes with it.' },
  cut: { label: 'Cut', blurb: 'A calorie deficit. The job is to lose fat while keeping the muscle: keep the weights heavy, let the volume ease.' },
  maintain: { label: 'Maintain', blurb: 'Eating at maintenance. Steady training, steady weight.' },
  recomp: { label: 'Recomp', blurb: 'Near maintenance with high protein and hard lifting. Slow, and works best for beginners and returners.' },
  performance: { label: 'Performance', blurb: 'Fuelled for a sport: enough to train hard and recover, carbohydrate first.' },
};

export interface FocusMeta {
  label: string;
  blurb: string;
  /** working-set reps */
  reps: [number, number];
  sets: [number, number];
  /** reps left in reserve at the end of a set */
  rir: [number, number];
  restS: [number, number];
  /** share of the estimated one-rep max */
  load: [number, number];
}

export const FOCUS_META: Record<TrainingFocus, FocusMeta> = {
  hypertrophy: {
    label: 'Hypertrophy',
    blurb: 'Grow the muscle: moderate weights for 6–12 reps, close to failure, more sets over the weeks.',
    reps: [6, 12],
    sets: [3, 4],
    rir: [1, 3],
    restS: [90, 180],
    load: [0.65, 0.8],
  },
  strength: {
    label: 'Strength',
    blurb: 'Lift more: heavy sets of 3–6 with long rests. Fewer reps, more weight.',
    reps: [3, 6],
    sets: [3, 5],
    rir: [1, 3],
    restS: [180, 300],
    load: [0.8, 0.9],
  },
  endurance: {
    label: 'Endurance',
    blurb: 'Last longer: light loads for 15–25 reps and short rests.',
    reps: [15, 25],
    sets: [2, 3],
    rir: [1, 4],
    restS: [30, 60],
    load: [0.4, 0.6],
  },
  preserve: {
    label: 'Preserve',
    blurb: 'Hold your muscle through a cut: keep the heavy weights heavy and drop about a third of the sets.',
    reps: [5, 10],
    sets: [2, 3],
    rir: [2, 3],
    restS: [120, 240],
    load: [0.75, 0.85],
  },
  reduce: {
    label: 'Reduce size',
    blurb: 'Carry less muscle on purpose: light, high-rep work far from failure, more walking, protein kept up.',
    reps: [15, 20],
    sets: [1, 2],
    rir: [3, 5],
    restS: [45, 75],
    load: [0.3, 0.5],
  },
};

export function sanitizeFocus(v: unknown): TrainingFocus {
  return typeof v === 'string' && (FOCUS_ORDER as string[]).includes(v) ? (v as TrainingFocus) : DEFAULT_FOCUS;
}

/** The pairing that pulls against itself, said once rather than tip by tip. */
export function focusPhaseNote(focus: TrainingFocus, phase: Phase): string | null {
  if (focus === 'hypertrophy' && phase === 'cut') return 'Building muscle in a deficit is slow. Matching last week’s numbers is a good result; the focus that fits a cut is Preserve.';
  if (focus === 'strength' && phase === 'cut') return 'Strength holds up well in a deficit, but records are unlikely. Keep the sets heavy and the rests long.';
  if (focus === 'reduce' && phase === 'bulk') return 'A surplus and reducing size work against each other. A cut or maintenance fits this focus.';
  if (focus === 'preserve' && phase === 'bulk') return 'In a surplus there is more to gain than to hold: Hypertrophy or Strength would use it.';
  if (focus === 'reduce') return 'Keep protein at about 1.6 g per kg and eat enough to train: the aim is less muscle, not less health.';
  return null;
}

export interface TipSet {
  reps: number | null;
  weightKg: number | null;
  durationS: number | null;
  distanceM: number | null;
}

export type TipKind = 'loaded' | 'bodyweight' | 'distance' | 'time';

export interface ExerciseTip {
  /** "Hypertrophy · Bulk" */
  heading: string;
  /** what to do today, in one line */
  line: string;
  /** why, or what changes it, in one line; optional */
  note: string | null;
}

/** Round to a loadable step: 2.5 kg on a bar, 2 kg on dumbbells and machines. */
export function roundLoad(kg: number, step = 2.5): number {
  return Math.max(step, Math.round(kg / step) * step);
}

function fmtKg(kg: number): string {
  return Number.isInteger(kg) ? `${kg}` : kg.toFixed(1);
}

function fmtSets(sets: TipSet[]): string {
  return sets
    .filter((s) => s.reps != null)
    .map((s) => (s.weightKg ? `${fmtKg(s.weightKg)}×${s.reps}` : `${s.reps}`))
    .join(', ');
}

/**
 * Today's tip for one exercise, from the focus, the phase and what was done
 * on it last time. Every number in it comes from the log or the 1RM estimate;
 * with nothing logged yet it says how to find the starting weight instead.
 */
export function exerciseTip(p: {
  focus: TrainingFocus;
  phase: Phase;
  kind: TipKind;
  /** sets from the most recent previous session with this exercise */
  last: TipSet[];
  /** best estimated one-rep max, kg; null when unknown */
  best1RM: number | null;
  /** dumbbells and machines move in 2 kg steps, bars in 2.5 */
  loadStep?: number;
}): ExerciseTip {
  const f = FOCUS_META[p.focus];
  const heading = `${f.label} · ${PHASE_META[p.phase].label}`;
  const step = p.loadStep ?? 2.5;
  const rx = `${f.sets[0]}–${f.sets[1]} sets of ${f.reps[0]}–${f.reps[1]}, ${f.rir[0]}–${f.rir[1]} reps in reserve`;
  const cutting = p.phase === 'cut';

  if (p.kind === 'distance' || p.kind === 'time') {
    const lastD = p.last.find((s) => s.distanceM && s.durationS);
    const lastLine = lastD ? ` Last time ${(lastD.distanceM! / 1000).toFixed(2)} km in ${Math.round(lastD.durationS! / 60)} min.` : '';
    if (p.focus === 'reduce' || cutting)
      return { heading, line: `Long and easy: a pace you could talk at, 30–60 minutes.${lastLine}`, note: 'Easy cardio adds to the deficit without eating into recovery for the weights.' };
    if (p.phase === 'bulk')
      return { heading, line: `Keep it to 2–3 short sessions a week, 20–30 minutes.${lastLine}`, note: 'Enough for the heart and recovery, not so much it spends the surplus meant for muscle.' };
    if (p.focus === 'endurance')
      return { heading, line: `Mostly easy, one session a week harder: intervals or a tempo.${lastLine}`, note: null };
    return { heading, line: `As planned: easy most days, hard on purpose.${lastLine}`, note: null };
  }

  const working = p.last.filter((s) => s.reps != null && s.reps > 0);

  if (p.kind === 'bodyweight') {
    const best = working.reduce((m, s) => Math.max(m, s.reps ?? 0), 0);
    const lastLine = working.length ? ` Last time: ${fmtSets(working)}.` : '';
    if (p.focus === 'strength')
      return { heading, line: `Make it heavy enough for ${f.reps[0]}–${f.reps[1]}: a harder version, or weight on a belt.${lastLine}`, note: best > f.reps[1] ? 'You are past the range — it is time for the harder progression.' : null };
    if (p.focus === 'reduce' || p.focus === 'endurance')
      return { heading, line: `${f.sets[0]}–${f.sets[1]} sets of ${f.reps[0]}–${f.reps[1]}, short rests, stopping well before failure.${lastLine}`, note: null };
    if (p.focus === 'preserve')
      return { heading, line: `Match your best set (${best || '—'} reps) in 2–3 sets; leave 2 reps in the tank.`, note: 'Holding the number through a cut is the win.' };
    return {
      heading,
      line: best >= 15 ? `${best} reps last time — move to the harder version or add load, back to 8–12.` : `${rx}.${lastLine}${best ? ` Aim for ${best + 1} on the first set.` : ''}`,
      note: null,
    };
  }

  // Loaded lifts
  const top = working.reduce<TipSet | null>((m, s) => (!m || (s.weightKg ?? 0) > (m.weightKg ?? 0) ? s : m), null);
  const lastLine = working.length ? ` Last time: ${fmtSets(working)}.` : '';
  const loadRange = p.best1RM
    ? `${fmtKg(roundLoad(p.best1RM * f.load[0], step))}–${fmtKg(roundLoad(p.best1RM * f.load[1], step))} kg`
    : null;

  if (!top || !top.weightKg) {
    return {
      heading,
      line: `${rx}.${loadRange ? ` About ${loadRange} for you.` : ' Find a weight you can lift for the top of that range with good form.'}`,
      note: 'Rest ' + `${Math.round(f.restS[0] / 60 * 10) / 10}–${Math.round(f.restS[1] / 60 * 10) / 10} min between sets.`,
    };
  }

  const w = top.weightKg;
  const atTop = working.filter((s) => s.weightKg === w).every((s) => (s.reps ?? 0) >= f.reps[1]);

  switch (p.focus) {
    case 'hypertrophy': {
      if (cutting)
        return { heading, line: `Hold ${fmtKg(w)} kg and match last time's reps.${lastLine}`, note: 'In a deficit, matching the numbers is progress. Do not add sets.' };
      if (atTop)
        return { heading, line: `Up to ${fmtKg(w + step)} kg, aiming for ${f.reps[0] + 2}+ reps per set.${lastLine}`, note: 'Every set reached the top of the range last time: that is the signal to add weight.' };
      return { heading, line: `Stay at ${fmtKg(w)} kg and add a rep where you can.${lastLine}`, note: `When every set reaches ${f.reps[1]}, add ${fmtKg(step)} kg.` };
    }
    case 'strength': {
      const target = p.best1RM ? roundLoad(p.best1RM * 0.85, step) : w + (top.reps != null && top.reps >= f.reps[1] ? step : 0);
      return {
        heading,
        line: `Work up to ${fmtKg(target)} kg for ${f.sets[0]}–${f.sets[1]} sets of ${f.reps[0]}–${f.reps[1]}.${lastLine}`,
        note: cutting ? 'A deficit is no time to test a max: stop each set with a rep or two left.' : `Rest ${Math.round(f.restS[0] / 60)}–${Math.round(f.restS[1] / 60)} min: strength needs the tank full.`,
      };
    }
    case 'endurance':
      return { heading, line: `${loadRange ? `About ${loadRange}` : `Around ${fmtKg(roundLoad(w * 0.6, step))} kg`}, ${f.reps[0]}–${f.reps[1]} reps, rest under a minute.${lastLine}`, note: null };
    case 'preserve':
      return { heading, line: `Keep ${fmtKg(w)} kg on the bar for 2–3 sets of ${Math.max(5, Math.min(top.reps ?? 8, 10))}.${lastLine}`, note: 'Heavy weight is the signal that keeps muscle in a deficit; fewer sets, not lighter ones.' };
    case 'reduce':
      return { heading, line: `Light: about ${fmtKg(roundLoad(Math.min(w * 0.5, p.best1RM ? p.best1RM * 0.5 : w), step))} kg, ${f.sets[0]}–${f.sets[1]} sets of ${f.reps[0]}–${f.reps[1]}, far from failure.${lastLine}`, note: 'Less weight and fewer hard sets let the muscle shrink slowly; keep protein up so it is muscle, not health, that goes.' };
  }
}
