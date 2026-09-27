import type { ChallengeMetric, ChallengeRequirement } from '@/data/challenges';
import { hashSeed, seededRandom, seededShuffle } from '@/lib/challengeWheel';

/**
 * Weekly quests — three a week, one of each weight.
 *
 * The daily wheel asks for one thing today. A quest asks for something a
 * single day cannot do: four sessions, fifty thousand steps, five days inside
 * the calorie line. It is measured Monday to Sunday from the same tables the
 * daily challenge reads, and it pays once, when it is met.
 *
 * Which three a week holds is decided by the week itself (a seed from its
 * Monday), so the quests are the same on every device, cannot be re-rolled,
 * and can be tested without a database.
 *
 * Everything here is pure.
 */

export type QuestWeight = 'light' | 'solid' | 'heavy';

export const QUEST_POINTS: Record<QuestWeight, number> = { light: 40, solid: 70, heavy: 110 };
export const QUEST_WEIGHT_LABEL: Record<QuestWeight, string> = { light: 'Light', solid: 'Solid', heavy: 'Heavy' };

export interface QuestDef {
  key: string;
  label: string;
  detail: string;
  metric: ChallengeMetric;
  /**
   * sum  — the metric added up across the week reaches `target`
   * days — the number of days on which the metric reached `dayTarget` reaches `target`
   */
  mode: 'sum' | 'days';
  target: number;
  dayTarget?: number;
  unit: string;
  weight: QuestWeight;
  icon: string;
  requires?: ChallengeRequirement;
}

export const QUESTS: QuestDef[] = [
  // ── light ──
  { key: 'q-sessions-3', label: 'Three sessions', detail: 'Finish three training sessions this week.', metric: 'sessionCount', mode: 'sum', target: 3, unit: 'sessions', weight: 'light', icon: 'core.start' },
  { key: 'q-steps-40k', label: 'Forty thousand steps', detail: 'Walk 40,000 steps across the week.', metric: 'steps', mode: 'sum', target: 40000, unit: 'steps', weight: 'light', icon: 'cardio.steps' },
  { key: 'q-water-4', label: 'Four days of water', detail: 'Drink at least 2 litres on four days.', metric: 'waterMl', mode: 'days', dayTarget: 2000, target: 4, unit: 'days', weight: 'light', icon: 'nutrition.water', requires: 'nutrition' },
  { key: 'q-meals-5', label: 'Five honest days', detail: 'Log at least three meals on five days.', metric: 'caloriesLogged', mode: 'days', dayTarget: 3, target: 5, unit: 'days', weight: 'light', icon: 'nutrition.calories', requires: 'nutrition' },
  { key: 'q-walks-2', label: 'Two tracked walks', detail: 'Track two walks or runs this week.', metric: 'walkSessions', mode: 'sum', target: 2, unit: 'walks', weight: 'light', icon: 'cardio.walk' },
  { key: 'q-rest-1', label: 'One chosen rest day', detail: 'Flag one rest day on purpose. Recovery is part of the plan.', metric: 'restDayTaken', mode: 'sum', target: 1, unit: 'rest day', weight: 'light', icon: 'core.rest' },
  { key: 'q-sleep-4', label: 'Four good nights', detail: 'Sleep at least 7 hours on four nights.', metric: 'sleepHours', mode: 'days', dayTarget: 7, target: 4, unit: 'nights', weight: 'light', icon: 'sleep.moon', requires: 'sleep' },
  // ── solid ──
  { key: 'q-sessions-4', label: 'Four sessions', detail: 'Finish four training sessions this week.', metric: 'sessionCount', mode: 'sum', target: 4, unit: 'sessions', weight: 'solid', icon: 'core.start' },
  { key: 'q-minutes-180', label: 'Three hours trained', detail: 'Spend 180 minutes in sessions this week.', metric: 'sessionMinutes', mode: 'sum', target: 180, unit: 'min', weight: 'solid', icon: 'core.timer' },
  { key: 'q-hardsets-40', label: 'Forty hard sets', detail: 'Log 40 hard sets across the week.', metric: 'hardSets', mode: 'sum', target: 40, unit: 'sets', weight: 'solid', icon: 'strength.barbell' },
  { key: 'q-steps-60k', label: 'Sixty thousand steps', detail: 'Walk 60,000 steps across the week.', metric: 'steps', mode: 'sum', target: 60000, unit: 'steps', weight: 'solid', icon: 'cardio.steps' },
  { key: 'q-protein-5', label: 'Five protein days', detail: 'Reach 100 g of protein on five days.', metric: 'proteinG', mode: 'days', dayTarget: 100, target: 5, unit: 'days', weight: 'solid', icon: 'nutrition.protein', requires: 'nutrition' },
  { key: 'q-inline-4', label: 'Four days inside the line', detail: 'Stay within your calorie target on four logged days.', metric: 'withinCalorieTarget', mode: 'days', dayTarget: 1, target: 4, unit: 'days', weight: 'solid', icon: 'nutrition.calories', requires: 'nutrition' },
  { key: 'q-walk-15k', label: 'Fifteen kilometres on foot', detail: 'Cover 15 km walking or running this week.', metric: 'walkDistanceM', mode: 'sum', target: 15000, unit: 'm', weight: 'solid', icon: 'cardio.running' },
  { key: 'q-new-2', label: 'Two firsts', detail: 'Try two exercises you have never logged before.', metric: 'newExerciseTried', mode: 'sum', target: 2, unit: 'exercises', weight: 'solid', icon: 'core.sparkle' },
  { key: 'q-mind-45', label: 'Forty-five quiet minutes', detail: 'Spend 45 minutes in meditation or mind-body work.', metric: 'mindbodyMinutes', mode: 'sum', target: 45, unit: 'min', weight: 'solid', icon: 'mindbody.meditation' },
  { key: 'q-prayers-5', label: 'Five full days', detail: 'Mark all five prayers on five days.', metric: 'prayersDone', mode: 'days', dayTarget: 5, target: 5, unit: 'days', weight: 'solid', icon: 'faith.prayer', requires: 'prayer' },
  { key: 'q-smokefree-4', label: 'Four clean days', detail: 'Go four days without smoking anything.', metric: 'smokeFreeDay', mode: 'days', dayTarget: 1, target: 4, unit: 'days', weight: 'solid', icon: 'smoking.smokeFree', requires: 'smoking' },
  // ── heavy ──
  { key: 'q-sessions-5', label: 'Five sessions', detail: 'Finish five training sessions this week.', metric: 'sessionCount', mode: 'sum', target: 5, unit: 'sessions', weight: 'heavy', icon: 'core.start' },
  { key: 'q-minutes-300', label: 'Five hours trained', detail: 'Spend 300 minutes in sessions this week.', metric: 'sessionMinutes', mode: 'sum', target: 300, unit: 'min', weight: 'heavy', icon: 'core.timer' },
  { key: 'q-hardsets-70', label: 'Seventy hard sets', detail: 'Log 70 hard sets across the week.', metric: 'hardSets', mode: 'sum', target: 70, unit: 'sets', weight: 'heavy', icon: 'strength.barbell' },
  { key: 'q-steps-80k', label: 'Eighty thousand steps', detail: 'Walk 80,000 steps across the week.', metric: 'steps', mode: 'sum', target: 80000, unit: 'steps', weight: 'heavy', icon: 'cardio.steps' },
  { key: 'q-burn-3500', label: 'Thirty-five hundred burned', detail: 'Burn 3,500 kcal in sessions and walks this week.', metric: 'burnedKcal', mode: 'sum', target: 3500, unit: 'kcal', weight: 'heavy', icon: 'nutrition.calories' },
  { key: 'q-walk-30k', label: 'Thirty kilometres on foot', detail: 'Cover 30 km walking or running this week.', metric: 'walkDistanceM', mode: 'sum', target: 30000, unit: 'm', weight: 'heavy', icon: 'cardio.marathon' },
  { key: 'q-pr-2', label: 'Two records', detail: 'Set two personal records this week.', metric: 'prsToday', mode: 'sum', target: 2, unit: 'records', weight: 'heavy', icon: 'core.pr' },
  { key: 'q-muscles-6', label: 'Train the whole body', detail: 'Hit four different muscle groups on each of three days.', metric: 'distinctMuscles', mode: 'days', dayTarget: 4, target: 3, unit: 'days', weight: 'heavy', icon: 'core.muscles' },
  { key: 'q-inline-6', label: 'Six days inside the line', detail: 'Stay within your calorie target on six logged days.', metric: 'withinCalorieTarget', mode: 'days', dayTarget: 1, target: 6, unit: 'days', weight: 'heavy', icon: 'nutrition.calories', requires: 'nutrition' },
  { key: 'q-smokefree-7', label: 'A clean week', detail: 'Go the whole week without smoking anything.', metric: 'smokeFreeDay', mode: 'days', dayTarget: 1, target: 7, unit: 'days', weight: 'heavy', icon: 'smoking.smokeFree', requires: 'smoking' },
];

export const findQuest = (key: string): QuestDef | undefined => QUESTS.find((q) => q.key === key);

export const WEIGHTS: QuestWeight[] = ['light', 'solid', 'heavy'];

/**
 * The three quests of a week: one light, one solid, one heavy, drawn from
 * what the user can actually attempt. `weekISO` is the Monday of the week.
 */
export function questsForWeek(
  weekISO: string,
  enabled: Partial<Record<ChallengeRequirement, boolean>>
): QuestDef[] {
  const out: QuestDef[] = [];
  const usedMetrics = new Set<string>();
  for (const w of WEIGHTS) {
    const pool = QUESTS.filter((q) => q.weight === w && (!q.requires || enabled[q.requires] === true));
    if (!pool.length) continue;
    const shuffled = seededShuffle(pool, seededRandom(hashSeed(`${weekISO}:quest:${w}`)));
    // Three quests on the same metric is one quest asked three times.
    const pick = shuffled.find((q) => !usedMetrics.has(q.metric)) ?? shuffled[0];
    usedMetrics.add(pick.metric);
    out.push(pick);
  }
  return out;
}

/** A week's progress on one quest, from the metric read on each of its days. */
export function questProgress(q: QuestDef, daily: number[]): { current: number; target: number; complete: boolean } {
  const clean = daily.map((v) => (Number.isFinite(v) && v > 0 ? v : 0));
  const current = q.mode === 'sum' ? clean.reduce((s, v) => s + v, 0) : clean.filter((v) => v >= (q.dayTarget ?? 1)).length;
  return { current, target: q.target, complete: q.target > 0 && current >= q.target };
}
