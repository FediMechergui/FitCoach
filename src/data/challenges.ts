/**
 * Daily challenges — the pool the wheel spins from.
 *
 * Every challenge is **measurable from data you already log**. That is the
 * whole design constraint: a challenge you have to mark done by hand is a
 * to-do list, and a to-do list you grade yourself on is worth nothing. Each one
 * names a `metric` the app can read and a `target` to beat, so completion is
 * observed rather than claimed.
 *
 * Difficulty is honest about effort, not about how impressive it sounds. A
 * "hard" challenge should cost you a real decision about your day.
 *
 * `requires` keeps the wheel from offering something you cannot do: a prayer
 * challenge when prayer tracking is off, or a smoke-free day when the smoking
 * tracker was never enabled. An impossible challenge is worse than no
 * challenge, because it teaches you to ignore the wheel.
 */

export type ChallengeMetric =
  | 'steps'
  | 'waterMl'
  | 'proteinG'
  | 'fibreG'
  | 'sessionMinutes'
  | 'sessionCount'
  | 'hardSets'
  | 'failureSets'
  | 'distinctMuscles'
  | 'meditationMinutes'
  | 'mindbodyMinutes'
  | 'caloriesLogged'
  | 'withinCalorieTarget'
  | 'prayersDone'
  | 'selfCareDone'
  | 'supplementsTaken'
  | 'smokeFreeDay'
  | 'newExerciseTried'
  | 'walkDistanceM'
  | 'sleepHours'
  | 'burnedKcal'
  // ── 3.2.1 ──
  /** 1 when the day was flagged a rest day */
  | 'restDayTaken'
  /** GPS walks / runs finished that day */
  | 'walkSessions'
  /** distinct exercises logged that day */
  | 'distinctExercises'
  /** personal records set that day */
  | 'prsToday'
  /** 1 when the day's caffeine stayed at or under the soft limit */
  | 'caffeineUnderLimit'
  /** minutes napped that day */
  | 'napMinutes'
  /** 1 when a fast was completed that day */
  | 'fastedDay'
  /** 1 when no vitamin or mineral gap remains for the day (needs logged micros) */
  | 'microGapsZero';

export type ChallengeDifficulty = 'easy' | 'medium' | 'hard';

/** Feature gates — the wheel skips a challenge whose feature is switched off. */
export type ChallengeRequirement = 'prayer' | 'smoking' | 'sleep' | 'supplements' | 'nutrition';

export interface ChallengeDef {
  key: string;
  label: string;
  /** what to actually do, in one line */
  detail: string;
  metric: ChallengeMetric;
  target: number;
  /** how the number reads on screen: "8,000 steps", "45 min" */
  unit: string;
  difficulty: ChallengeDifficulty;
  category: 'move' | 'lift' | 'fuel' | 'mind' | 'care';
  icon: string;
  accent: string;
  requires?: ChallengeRequirement;
}

export const DIFFICULTY_POINTS: Record<ChallengeDifficulty, number> = {
  easy: 10,
  medium: 20,
  hard: 35,
};

export const DIFFICULTY_LABEL: Record<ChallengeDifficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

export const DIFFICULTY_COLOR: Record<ChallengeDifficulty, string> = {
  easy: '#33D9A6',
  medium: '#4F8CFF',
  hard: '#FF8A3D',
};

export const CHALLENGES: ChallengeDef[] = [
  // ── Move ──
  { key: 'steps-8k', label: '8,000 Steps', detail: 'Get 8,000 steps on the board before the day closes.', metric: 'steps', target: 8000, unit: 'steps', difficulty: 'easy', category: 'move', icon: 'cardio.steps', accent: '#33D9A6' },
  { key: 'steps-12k', label: '12,000 Steps', detail: 'Twelve thousand. You will have to go looking for some of them.', metric: 'steps', target: 12000, unit: 'steps', difficulty: 'medium', category: 'move', icon: 'cardio.steps', accent: '#33D9A6' },
  { key: 'steps-18k', label: '18,000 Steps', detail: 'A properly long day on your feet. Plan it or it will not happen.', metric: 'steps', target: 18000, unit: 'steps', difficulty: 'hard', category: 'move', icon: 'cardio.steps', accent: '#33D9A6' },
  { key: 'walk-5k', label: 'Five Kilometres', detail: 'Walk or run 5 km, tracked.', metric: 'walkDistanceM', target: 5000, unit: 'm', difficulty: 'medium', category: 'move', icon: 'cardio.walk', accent: '#33D9A6' },
  { key: 'walk-10k', label: 'Ten Kilometres', detail: 'Ten kilometres on foot. Take water.', metric: 'walkDistanceM', target: 10000, unit: 'm', difficulty: 'hard', category: 'move', icon: 'cardio.running', accent: '#33D9A6' },
  { key: 'move-30', label: 'Thirty Minutes', detail: 'Any session, any type — thirty minutes of moving.', metric: 'sessionMinutes', target: 30, unit: 'min', difficulty: 'easy', category: 'move', icon: 'nav.train', accent: '#4F8CFF' },
  { key: 'move-75', label: 'Seventy-Five Minutes', detail: 'Over an hour of training logged today.', metric: 'sessionMinutes', target: 75, unit: 'min', difficulty: 'hard', category: 'move', icon: 'nav.train', accent: '#4F8CFF' },
  { key: 'two-sessions', label: 'Double Day', detail: 'Two separate sessions. Morning and evening is the usual way.', metric: 'sessionCount', target: 2, unit: 'sessions', difficulty: 'hard', category: 'move', icon: 'nav.train', accent: '#4F8CFF' },
  { key: 'steps-10k', label: '10,000 Steps', detail: 'The classic. Ten thousand before midnight.', metric: 'steps', target: 10000, unit: 'steps', difficulty: 'medium', category: 'move', icon: 'cardio.steps', accent: '#33D9A6' },
  { key: 'move-45', label: 'Forty-Five Minutes', detail: 'Three quarters of an hour of training, any type.', metric: 'sessionMinutes', target: 45, unit: 'min', difficulty: 'medium', category: 'move', icon: 'nav.train', accent: '#4F8CFF' },
  { key: 'walk-7k', label: 'Seven Kilometres', detail: 'Seven on foot. A podcast and a half.', metric: 'walkDistanceM', target: 7000, unit: 'm', difficulty: 'medium', category: 'move', icon: 'cardio.walk', accent: '#33D9A6' },
  { key: 'burn-400', label: 'Burn 400', detail: 'Four hundred kcal of tracked training and walking.', metric: 'burnedKcal', target: 400, unit: 'kcal', difficulty: 'medium', category: 'move', icon: 'nutrition.calories', accent: '#FF8A3D' },
  { key: 'burn-700', label: 'Burn 700', detail: 'Seven hundred kcal earned the honest way. A serious day.', metric: 'burnedKcal', target: 700, unit: 'kcal', difficulty: 'hard', category: 'move', icon: 'nutrition.calories', accent: '#FF8A3D' },

  // ── Lift ──
  { key: 'sets-12', label: 'Twelve Hard Sets', detail: 'Twelve sets taken close enough to failure to count.', metric: 'hardSets', target: 12, unit: 'sets', difficulty: 'easy', category: 'lift', icon: 'strength.dumbbell', accent: '#FF8A3D' },
  { key: 'sets-20', label: 'Twenty Hard Sets', detail: 'Twenty working sets. A real session, not a visit.', metric: 'hardSets', target: 20, unit: 'sets', difficulty: 'medium', category: 'lift', icon: 'strength.dumbbell', accent: '#FF8A3D' },
  { key: 'failure-3', label: 'Three To Failure', detail: 'Take three sets to genuine failure — no rep left.', metric: 'failureSets', target: 3, unit: 'sets', difficulty: 'medium', category: 'lift', icon: 'strength.barbell', accent: '#FF8A3D' },
  { key: 'muscles-4', label: 'Four Muscle Groups', detail: 'Hit four different muscle groups in one day.', metric: 'distinctMuscles', target: 4, unit: 'groups', difficulty: 'medium', category: 'lift', icon: 'core.muscles', accent: '#FF8A3D' },
  { key: 'new-exercise', label: 'Try Something New', detail: 'Log an exercise you have never done before.', metric: 'newExerciseTried', target: 1, unit: '', difficulty: 'easy', category: 'lift', icon: 'core.sparkle', accent: '#FF8A3D' },
  { key: 'sets-25', label: 'Twenty-Five Hard Sets', detail: 'A high-volume day. Bring food and patience.', metric: 'hardSets', target: 25, unit: 'sets', difficulty: 'hard', category: 'lift', icon: 'strength.dumbbell', accent: '#FF8A3D' },
  { key: 'muscles-3', label: 'Three Muscle Groups', detail: 'Touch three different muscle groups today.', metric: 'distinctMuscles', target: 3, unit: 'groups', difficulty: 'easy', category: 'lift', icon: 'core.muscles', accent: '#FF8A3D' },
  { key: 'failure-5', label: 'Five To Failure', detail: 'Five sets to the true end. Save them for the last set of each exercise.', metric: 'failureSets', target: 5, unit: 'sets', difficulty: 'hard', category: 'lift', icon: 'strength.barbell', accent: '#FF8A3D' },
  { key: 'new-exercise-2', label: 'Two New Moves', detail: 'Two exercises you have never logged. The library has hundreds you have not tried.', metric: 'newExerciseTried', target: 2, unit: '', difficulty: 'medium', category: 'lift', icon: 'core.sparkle', accent: '#FF8A3D' },

  // ── Fuel ──
  { key: 'water-goal', label: 'Hit Your Water', detail: 'Reach your daily hydration goal.', metric: 'waterMl', target: 2500, unit: 'ml', difficulty: 'easy', category: 'fuel', icon: 'nutrition.water', accent: '#4FC3F7' },
  { key: 'water-3l', label: 'Three Litres', detail: 'Three full litres of water today.', metric: 'waterMl', target: 3000, unit: 'ml', difficulty: 'medium', category: 'fuel', icon: 'nutrition.water', accent: '#4FC3F7' },
  { key: 'protein-hit', label: 'Protein On Target', detail: 'Reach at least 120 g of protein.', metric: 'proteinG', target: 120, unit: 'g', difficulty: 'medium', category: 'fuel', icon: 'nutrition.protein', accent: '#FF6B6B', requires: 'nutrition' },
  { key: 'fibre-30', label: 'Thirty Grams of Fibre', detail: 'Thirty grams. Most days land nearer fifteen.', metric: 'fibreG', target: 30, unit: 'g', difficulty: 'hard', category: 'fuel', icon: 'nutrition.veg', accent: '#8BC34A', requires: 'nutrition' },
  { key: 'log-everything', label: 'Log Every Meal', detail: 'Log at least three meals — the whole day, honestly.', metric: 'caloriesLogged', target: 3, unit: 'meals', difficulty: 'easy', category: 'fuel', icon: 'nav.nutrition', accent: '#FFB454', requires: 'nutrition' },
  { key: 'within-target', label: 'Inside The Line', detail: 'Finish the day within your calorie target.', metric: 'withinCalorieTarget', target: 1, unit: '', difficulty: 'medium', category: 'fuel', icon: 'nutrition.calories', accent: '#FFB454', requires: 'nutrition' },
  { key: 'supplements-all', label: 'Take Your Stack', detail: 'Log every supplement in your stack today.', metric: 'supplementsTaken', target: 1, unit: '', difficulty: 'easy', category: 'fuel', icon: 'supp.pill', accent: '#B39DDB', requires: 'supplements' },
  { key: 'protein-150', label: 'Protein Big Day', detail: 'One hundred and fifty grams. Plan the meals or it will not happen.', metric: 'proteinG', target: 150, unit: 'g', difficulty: 'hard', category: 'fuel', icon: 'nutrition.protein', accent: '#FF6B6B', requires: 'nutrition' },
  { key: 'fibre-25', label: 'Twenty-Five Grams of Fibre', detail: 'Beans, oats, vegetables — twenty-five grams.', metric: 'fibreG', target: 25, unit: 'g', difficulty: 'medium', category: 'fuel', icon: 'nutrition.veg', accent: '#8BC34A', requires: 'nutrition' },
  { key: 'meals-4', label: 'Four Honest Meals', detail: 'Log all four meal slots today — nothing slips through.', metric: 'caloriesLogged', target: 4, unit: 'meals', difficulty: 'medium', category: 'fuel', icon: 'nav.nutrition', accent: '#FFB454', requires: 'nutrition' },
  { key: 'water-4l', label: 'Four Litres', detail: 'A hot-day, hard-training amount of water. Spread it out.', metric: 'waterMl', target: 4000, unit: 'ml', difficulty: 'hard', category: 'fuel', icon: 'nutrition.water', accent: '#4FC3F7' },

  // ── Mind ──
  { key: 'meditate-10', label: 'Ten Minutes Still', detail: 'Ten minutes of meditation. Sitting still counts as training.', metric: 'meditationMinutes', target: 10, unit: 'min', difficulty: 'easy', category: 'mind', icon: 'mindbody.meditation', accent: '#B39DDB' },
  { key: 'meditate-25', label: 'Twenty-Five Minutes Still', detail: 'A long sit. Harder than it sounds.', metric: 'meditationMinutes', target: 25, unit: 'min', difficulty: 'hard', category: 'mind', icon: 'mindbody.meditation', accent: '#B39DDB' },
  { key: 'mobility-20', label: 'Twenty Minutes Mobility', detail: 'Stretch, yoga, mobility — twenty minutes of the work you skip.', metric: 'mindbodyMinutes', target: 20, unit: 'min', difficulty: 'easy', category: 'mind', icon: 'mindbody.stretch', accent: '#B39DDB' },
  { key: 'sleep-7', label: 'Seven Hours', detail: 'Log seven hours of sleep. The one that makes the rest work.', metric: 'sleepHours', target: 7, unit: 'h', difficulty: 'medium', category: 'mind', icon: 'mindbody.sleep', accent: '#7986CB', requires: 'sleep' },
  { key: 'meditate-15', label: 'Fifteen Minutes Still', detail: 'A proper sit. The mind will offer excuses; note them and stay.', metric: 'meditationMinutes', target: 15, unit: 'min', difficulty: 'medium', category: 'mind', icon: 'mindbody.meditation', accent: '#B39DDB' },
  { key: 'mobility-30', label: 'Half an Hour of Mobility', detail: 'Thirty minutes of stretch, yoga or mobility work.', metric: 'mindbodyMinutes', target: 30, unit: 'min', difficulty: 'medium', category: 'mind', icon: 'mindbody.stretch', accent: '#B39DDB' },
  { key: 'sleep-8', label: 'Eight Hours', detail: 'A full eight. It will cost you an evening; it pays back a day.', metric: 'sleepHours', target: 8, unit: 'h', difficulty: 'hard', category: 'mind', icon: 'mindbody.sleep', accent: '#7986CB', requires: 'sleep' },

  // ── Care ──
  { key: 'prayers-5', label: 'All Five', detail: 'Complete all five prayers today.', metric: 'prayersDone', target: 5, unit: '', difficulty: 'medium', category: 'care', icon: 'faith.prayer', accent: '#4DB6AC', requires: 'prayer' },
  { key: 'selfcare-3', label: 'Three Acts of Care', detail: 'Three self-care check-ins — the small things that add up.', metric: 'selfCareDone', target: 3, unit: '', difficulty: 'easy', category: 'care', icon: 'mindbody.spa', accent: '#4DB6AC' },
  { key: 'selfcare-5', label: 'Five Acts of Care', detail: 'Five self-care check-ins in one day. Look after the machine.', metric: 'selfCareDone', target: 5, unit: '', difficulty: 'medium', category: 'care', icon: 'mindbody.spa', accent: '#4DB6AC' },
  { key: 'smoke-free', label: 'A Clean Day', detail: 'Get through the day without smoking anything.', metric: 'smokeFreeDay', target: 1, unit: '', difficulty: 'hard', category: 'care', icon: 'smoking.quit', accent: '#66BB6A', requires: 'smoking' },

  // ── 3.2.1: twenty-six more, including rest, walks, records, caffeine, naps and micros ──
  { key: 'walks-1', label: 'One Tracked Walk', detail: 'Start the GPS, walk, stop it. Any distance counts, as long as it is tracked.', metric: 'walkSessions', target: 1, unit: 'walk', difficulty: 'easy', category: 'move', icon: 'cardio.gps', accent: '#33D9A6' },
  { key: 'walks-2', label: 'Two Walks', detail: 'Two separate tracked walks or runs. Before work and after is the easy split.', metric: 'walkSessions', target: 2, unit: 'walks', difficulty: 'medium', category: 'move', icon: 'cardio.gps', accent: '#33D9A6' },
  { key: 'walks-3', label: 'Three Walks', detail: 'Three tracked walks in one day — morning, lunch, evening. Short is fine; separate is the point.', metric: 'walkSessions', target: 3, unit: 'walks', difficulty: 'hard', category: 'move', icon: 'cardio.gps', accent: '#33D9A6' },
  { key: 'walk-3k', label: 'Three Kilometres', detail: 'Three kilometres on foot, tracked. Half an hour at an ordinary pace.', metric: 'walkDistanceM', target: 3000, unit: 'm', difficulty: 'easy', category: 'move', icon: 'cardio.walk', accent: '#33D9A6' },
  { key: 'steps-15k', label: '15,000 Steps', detail: 'Fifteen thousand. Take the long way there and the long way back.', metric: 'steps', target: 15000, unit: 'steps', difficulty: 'hard', category: 'move', icon: 'cardio.steps', accent: '#33D9A6' },
  { key: 'move-60', label: 'One Hour', detail: 'Sixty minutes of training logged today, in one session or two.', metric: 'sessionMinutes', target: 60, unit: 'min', difficulty: 'medium', category: 'move', icon: 'nav.train', accent: '#4F8CFF' },
  { key: 'exercises-6', label: 'Six Exercises', detail: 'Six different exercises logged today. A full session, not just your favourites.', metric: 'distinctExercises', target: 6, unit: 'exercises', difficulty: 'easy', category: 'lift', icon: 'core.list', accent: '#FF8A3D' },
  { key: 'exercises-10', label: 'Ten Exercises', detail: 'Ten distinct exercises in a day. Cover the whole body; two sets each is allowed.', metric: 'distinctExercises', target: 10, unit: 'exercises', difficulty: 'hard', category: 'lift', icon: 'core.list', accent: '#FF8A3D' },
  { key: 'pr-1', label: 'Set A Record', detail: 'Beat a personal best on any exercise — one more rep or one more kilo is enough.', metric: 'prsToday', target: 1, unit: 'PR', difficulty: 'medium', category: 'lift', icon: 'core.pr', accent: '#FF8A3D' },
  { key: 'pr-3', label: 'Three Records', detail: 'Three personal bests in one session. Pick lifts you have not pushed in a while.', metric: 'prsToday', target: 3, unit: 'PRs', difficulty: 'hard', category: 'lift', icon: 'core.pr', accent: '#FF8A3D' },
  { key: 'sets-16', label: 'Sixteen Hard Sets', detail: 'Sixteen working sets. Longer than a quick one, shorter than a grind.', metric: 'hardSets', target: 16, unit: 'sets', difficulty: 'medium', category: 'lift', icon: 'strength.dumbbell', accent: '#FF8A3D' },
  { key: 'water-2l', label: 'Two Litres', detail: 'Two litres of water. A bottle on the desk does most of the work.', metric: 'waterMl', target: 2000, unit: 'ml', difficulty: 'easy', category: 'fuel', icon: 'nutrition.water', accent: '#4FC3F7' },
  { key: 'protein-100', label: 'A Hundred Grams', detail: 'One hundred grams of protein, spread across the meals rather than saved for dinner.', metric: 'proteinG', target: 100, unit: 'g', difficulty: 'easy', category: 'fuel', icon: 'nutrition.protein', accent: '#FF6B6B', requires: 'nutrition' },
  { key: 'fibre-20', label: 'Twenty Grams of Fibre', detail: 'Twenty grams. Oats in the morning and one real portion of vegetables gets you there.', metric: 'fibreG', target: 20, unit: 'g', difficulty: 'easy', category: 'fuel', icon: 'nutrition.veg', accent: '#8BC34A', requires: 'nutrition' },
  { key: 'fasted-day', label: 'Finish The Fast', detail: 'Keep your fasting window to its end and log the fast as completed.', metric: 'fastedDay', target: 1, unit: '', difficulty: 'medium', category: 'fuel', icon: 'faith.fasting', accent: '#FFB454' },
  { key: 'micro-gaps-zero', label: 'No Gaps', detail: 'End the day with no vitamin or mineral gap — food first, the stack for what is left.', metric: 'microGapsZero', target: 1, unit: '', difficulty: 'hard', category: 'fuel', icon: 'micro.vitamins', accent: '#B39DDB', requires: 'nutrition' },
  { key: 'meditate-5', label: 'Five Minutes Still', detail: 'Five minutes of meditation. Long enough to notice you want to stop.', metric: 'meditationMinutes', target: 5, unit: 'min', difficulty: 'easy', category: 'mind', icon: 'mindbody.meditation', accent: '#B39DDB' },
  { key: 'meditate-20', label: 'Twenty Minutes Still', detail: 'Twenty minutes in one sit. Set the timer and do not check it.', metric: 'meditationMinutes', target: 20, unit: 'min', difficulty: 'medium', category: 'mind', icon: 'mindbody.meditation', accent: '#B39DDB' },
  { key: 'mobility-10', label: 'Ten Minutes of Mobility', detail: 'Ten minutes of stretching on the floor before bed. Hips and shoulders first.', metric: 'mindbodyMinutes', target: 10, unit: 'min', difficulty: 'easy', category: 'mind', icon: 'mindbody.stretch', accent: '#B39DDB' },
  { key: 'mobility-45', label: 'Forty-Five Minutes of Mobility', detail: 'A full class worth of yoga, stretching or mobility work. Log it as a session.', metric: 'mindbodyMinutes', target: 45, unit: 'min', difficulty: 'hard', category: 'mind', icon: 'mindbody.yoga', accent: '#B39DDB' },
  { key: 'sleep-9', label: 'Nine Hours', detail: 'Nine hours logged. A recovery night — in bed early enough that it is possible.', metric: 'sleepHours', target: 9, unit: 'h', difficulty: 'hard', category: 'mind', icon: 'mindbody.sleep', accent: '#7986CB', requires: 'sleep' },
  { key: 'rest-day', label: 'Rest On Purpose', detail: 'Flag today as a rest day and take it. No session, no guilt.', metric: 'restDayTaken', target: 1, unit: '', difficulty: 'easy', category: 'care', icon: 'core.rest', accent: '#4DB6AC' },
  { key: 'prayers-3', label: 'Three Prayers', detail: 'Three of the five today. Start with the ones you usually miss.', metric: 'prayersDone', target: 3, unit: '', difficulty: 'easy', category: 'care', icon: 'faith.prayer', accent: '#4DB6AC', requires: 'prayer' },
  { key: 'nap-20', label: 'Twenty-Minute Nap', detail: 'Lie down before three, alarm set for twenty minutes. You wake clear-headed.', metric: 'napMinutes', target: 20, unit: 'min', difficulty: 'medium', category: 'care', icon: 'sleep.debt', accent: '#7986CB', requires: 'sleep' },
  { key: 'nap-90', label: 'A Full Cycle', detail: 'A ninety-minute nap, finished before three in the afternoon. Best after a short night.', metric: 'napMinutes', target: 90, unit: 'min', difficulty: 'hard', category: 'care', icon: 'sleep.quality', accent: '#7986CB', requires: 'sleep' },
  { key: 'caffeine-limit', label: 'Caffeine In Check', detail: 'Finish the day at or under your caffeine limit. The afternoon cup is the one that counts.', metric: 'caffeineUnderLimit', target: 1, unit: '', difficulty: 'medium', category: 'care', icon: 'nutrition.coffee', accent: '#C69368' },
];

export const findChallenge = (key: string): ChallengeDef | undefined =>
  CHALLENGES.find((c) => c.key === key);

export const CATEGORY_LABEL: Record<ChallengeDef['category'], string> = {
  move: 'Move',
  lift: 'Lift',
  fuel: 'Fuel',
  mind: 'Mind',
  care: 'Care',
};
