import type { HabitKind } from '@/db/schema';

/**
 * Habit tracker — for habits you want to understand or reduce.
 *
 * Design principles (deliberate):
 *  1. **Honest, not moralising.** We report what the evidence actually supports.
 *     Where popular claims are NOT supported by research, we say so plainly
 *     rather than inventing scary numbers to drive engagement.
 *  2. **Your data over generic claims.** The headline impact is always the
 *     correlation with your OWN logged sleep and training.
 *  3. **Time is the honest common currency.** Every habit costs time; time is
 *     measurable and never judgmental.
 *  4. **No shame.** Streaks are encouragement, not punishment. Relapse just
 *     restarts a counter.
 */

export interface HabitDef {
  key: string;
  label: string;
  kind: HabitKind;
  icon: string;
  color: string;
  /** what we ask the user to log */
  unit: string;
  defaultMinutesPerOccurrence?: number;
  defaultDailyTarget?: number;
  blurb: string;
  /** what the evidence actually says — shown verbatim in the app */
  evidence: string;
  /** concrete, supported effects we can track */
  trackedImpacts: string[];
}

export const HABIT_CATALOGUE: HabitDef[] = [
  {
    key: 'doomscrolling',
    label: 'Doom-scrolling',
    kind: 'duration',
    icon: 'habits.phone',
    color: '#7C6CFF',
    unit: 'minutes',
    defaultDailyTarget: 30,
    blurb: 'Passive, compulsive scrolling — especially the late-night kind.',
    evidence:
      'Well-supported: heavy passive social-media/news use is linked to worse sleep (especially screens in the hour before bed), higher anxiety and low mood, and reduced sustained attention. The strongest and most consistent effect is on sleep — which is exactly what drives your training.',
    trackedImpacts: [
      'Time cost — hours per week and per year',
      'Sleep displacement — late-night scrolling vs your logged sleep',
      'Correlation with your own training output',
    ],
  },
  {
    key: 'masturbation',
    label: 'Masturbation',
    kind: 'count',
    icon: 'habits.private',
    color: '#5FD0E0',
    unit: 'times',
    defaultMinutesPerOccurrence: 15,
    defaultDailyTarget: 1,
    blurb: 'Private and optional. Track it only if YOU feel it is getting in the way.',
    evidence:
      'Honest answer: masturbation is a normal, common behaviour, and the research does NOT support the popular claims that it lowers testosterone, drains gains, or harms athletic performance. Any short-lived hormonal blip is small and transient. What the evidence DOES support is that when any behaviour becomes compulsive — eating into your sleep, time, focus or mood, or causing you distress — that pattern is worth seeing clearly. That, and nothing else, is what this tracker measures.',
    trackedImpacts: [
      'Time cost — where your hours actually go',
      'Late-night sessions vs your logged sleep',
      'Your own urge/compulsion pattern over time',
    ],
  },
  {
    key: 'junk_snacking',
    label: 'Mindless snacking',
    kind: 'count',
    icon: 'habits.snack',
    color: '#FF7A59',
    unit: 'times',
    defaultMinutesPerOccurrence: 5,
    defaultDailyTarget: 1,
    blurb: 'Eating without hunger — the calories that silently break a deficit.',
    evidence:
      'Well-supported: unplanned snacking is a leading cause of unintentional calorie surplus, because liquid and hyper-palatable calories are poorly compensated for at later meals.',
    trackedImpacts: ['Frequency trend', 'Correlation with your calorie adherence'],
  },
  {
    key: 'nail_biting',
    label: 'Nail biting',
    kind: 'count',
    icon: 'habits.generic',
    color: '#FFB454',
    unit: 'times',
    defaultMinutesPerOccurrence: 1,
    blurb: 'A common stress-driven body-focused habit.',
    evidence:
      'Body-focused repetitive behaviours are typically stress- or boredom-driven. Awareness tracking plus a competing response is the best-evidenced approach.',
    trackedImpacts: ['Frequency trend', 'Trigger pattern'],
  },
  {
    key: 'procrastination',
    label: 'Procrastination',
    kind: 'duration',
    icon: 'habits.generic',
    color: '#9AA6B2',
    unit: 'minutes',
    defaultDailyTarget: 30,
    blurb: 'Time lost to avoidance when you meant to be working.',
    evidence:
      'Procrastination is strongly linked to stress and poor sleep, and it is usually an emotion-regulation problem rather than a time-management one. Seeing the real hours helps.',
    trackedImpacts: ['Time cost', 'Correlation with your work hours and sleep'],
  },
];

export function findHabit(key: string): HabitDef | undefined {
  return HABIT_CATALOGUE.find((h) => h.key === key);
}

export const HABIT_TRIGGERS = ['stress', 'boredom', 'loneliness', 'tired', 'late night', 'habit', 'celebration'];

// ── Impact math ─────────────────────────────────────────────────────────────

/** Total minutes a habit consumed, for either kind. */
export function minutesFor(
  kind: HabitKind,
  quantity: number,
  minutes: number,
  minutesPerOccurrence = 0
): number {
  return kind === 'duration' ? minutes : quantity * minutesPerOccurrence;
}

export interface HabitImpact {
  /** minutes today / this week */
  todayMinutes: number;
  weekMinutes: number;
  todayCount: number;
  weekCount: number;
  avgPerDay: number;
  /** projected hours per year at the current rate */
  yearHoursProjected: number;
  /** how many days this week you were free of it */
  freeDays7d: number;
  /** consecutive days free, ending today */
  freeStreak: number;
  bestFreeStreak: number;
  /** how many of the logged occurrences were late at night */
  lateNightShare: number; // 0..1
  dailyTarget: number | null;
  overTarget: boolean;
}

/** Hours/year at the current weekly rate. */
export function projectedYearHours(weekMinutes: number): number {
  return Math.round((weekMinutes * 52) / 60);
}

/**
 * A legible "what else could that time have been" translation. Purely a framing
 * device for the time cost — never presented as a judgment.
 */
export function timeEquivalents(yearHours: number): string[] {
  if (yearHours <= 0) return [];
  const out: string[] = [];
  const workouts = Math.floor(yearHours / 1); // ~1h per session
  if (workouts >= 5) out.push(`${workouts} one-hour training sessions`);
  const books = Math.floor(yearHours / 8);
  if (books >= 1) out.push(`${books} book${books === 1 ? '' : 's'} read`);
  const fullDays = Math.round((yearHours / 24) * 10) / 10;
  if (fullDays >= 0.5) out.push(`${fullDays} full days`);
  return out;
}
