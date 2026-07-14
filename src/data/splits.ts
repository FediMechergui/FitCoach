/**
 * Training splits — how a strength week is organized. Choosing a split day
 * pre-populates a session with a sensible exercise list (by slug), which the
 * user can freely add to or remove from.
 */

export interface SplitDay {
  key: string;
  label: string;
  muscles: string[];
  /** exercise slugs, in the order they should be performed */
  exercises: string[];
  blurb: string;
}

export interface SplitTemplate {
  key: string;
  name: string;
  blurb: string;
  daysPerWeek: string;
  bestFor: string;
  icon: string;
  color: string;
  days: SplitDay[];
}

export const SPLITS: SplitTemplate[] = [
  {
    key: 'ppl',
    name: 'Push / Pull / Legs',
    blurb: 'Everything that pushes, everything that pulls, then legs. The most popular and balanced split.',
    daysPerWeek: '3 or 6 days/week',
    bestFor: 'Intermediates who train 3–6× a week',
    icon: 'strength.push',
    color: '#4F8CFF',
    days: [
      {
        key: 'push',
        label: 'Push',
        muscles: ['chest', 'shoulders', 'triceps'],
        blurb: 'Chest, shoulders and triceps — everything that presses.',
        exercises: [
          'bench-press-barbell',
          'db-incline-press',
          'overhead-press',
          'lateral-raise',
          'triceps-pushdown',
          'db-overhead-extension',
        ],
      },
      {
        key: 'pull',
        label: 'Pull',
        muscles: ['back', 'biceps', 'forearms'],
        blurb: 'Back and biceps — everything that pulls.',
        exercises: [
          'deadlift',
          'pull-up',
          'barbell-row',
          'seated-cable-row',
          'rear-delt-fly',
          'barbell-curl',
          'hammer-curl',
        ],
      },
      {
        key: 'legs',
        label: 'Legs',
        muscles: ['quads', 'hamstrings', 'glutes', 'calves'],
        blurb: 'The whole lower body plus calves.',
        exercises: [
          'back-squat',
          'romanian-deadlift',
          'leg-press',
          'leg-curl-machine',
          'leg-extension',
          'standing-calf-machine',
        ],
      },
    ],
  },
  {
    key: 'upper_lower',
    name: 'Upper / Lower',
    blurb: 'Split the body in half. Each muscle gets hit twice a week — great for strength and size.',
    daysPerWeek: '4 days/week',
    bestFor: 'Beginners and intermediates',
    icon: 'stats.muscleMap',
    color: '#33D9A6',
    days: [
      {
        key: 'upper',
        label: 'Upper Body',
        muscles: ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
        blurb: 'Everything above the waist.',
        exercises: [
          'bench-press-barbell',
          'barbell-row',
          'overhead-press',
          'lat-pulldown',
          'lateral-raise',
          'barbell-curl',
          'triceps-pushdown',
        ],
      },
      {
        key: 'lower',
        label: 'Lower Body',
        muscles: ['quads', 'hamstrings', 'glutes', 'calves', 'core'],
        blurb: 'Everything below the waist, plus core.',
        exercises: [
          'back-squat',
          'romanian-deadlift',
          'bulgarian-split-squat',
          'leg-curl-machine',
          'standing-calf-machine',
          'plank',
        ],
      },
    ],
  },
  {
    key: 'bro',
    name: 'Bro Split',
    blurb: 'One muscle group per day. Maximum volume per muscle, lots of recovery between hits.',
    daysPerWeek: '5 days/week',
    bestFor: 'Bodybuilding-style training',
    icon: 'strength.dumbbell',
    color: '#FF7A59',
    days: [
      {
        key: 'chest',
        label: 'Chest Day',
        muscles: ['chest'],
        blurb: 'Chest from every angle.',
        exercises: ['bench-press-barbell', 'db-incline-press', 'chest-press-machine', 'cable-crossover', 'db-fly', 'push-up'],
      },
      {
        key: 'back',
        label: 'Back Day',
        muscles: ['back'],
        blurb: 'Width and thickness.',
        exercises: ['deadlift', 'pull-up', 'barbell-row', 'lat-pulldown', 'seated-cable-row', 'straight-arm-pulldown'],
      },
      {
        key: 'shoulders',
        label: 'Shoulder Day',
        muscles: ['shoulders'],
        blurb: 'All three delt heads.',
        exercises: ['overhead-press', 'db-shoulder-press', 'lateral-raise', 'rear-delt-fly', 'front-raise', 'upright-row'],
      },
      {
        key: 'arms',
        label: 'Arm Day',
        muscles: ['biceps', 'triceps', 'forearms'],
        blurb: 'Biceps and triceps supersets.',
        exercises: ['barbell-curl', 'skullcrusher', 'hammer-curl', 'triceps-pushdown', 'incline-db-curl', 'db-overhead-extension'],
      },
      {
        key: 'legs',
        label: 'Leg Day',
        muscles: ['quads', 'hamstrings', 'glutes', 'calves'],
        blurb: 'Never skip it.',
        exercises: ['back-squat', 'leg-press', 'romanian-deadlift', 'leg-extension', 'leg-curl-machine', 'standing-calf-machine'],
      },
    ],
  },
  {
    key: 'full_body',
    name: 'Full Body',
    blurb: 'Hit everything every session. The most efficient split if you only train 2–3× a week.',
    daysPerWeek: '2–3 days/week',
    bestFor: 'Beginners, or anyone short on time',
    icon: 'stats.muscleMap',
    color: '#B58CFF',
    days: [
      {
        key: 'full_a',
        label: 'Full Body A',
        muscles: ['quads', 'chest', 'back', 'shoulders'],
        blurb: 'Squat-focused full body.',
        exercises: ['back-squat', 'bench-press-barbell', 'barbell-row', 'overhead-press', 'plank'],
      },
      {
        key: 'full_b',
        label: 'Full Body B',
        muscles: ['hamstrings', 'back', 'chest', 'biceps'],
        blurb: 'Hinge-focused full body.',
        exercises: ['deadlift', 'lat-pulldown', 'db-incline-press', 'goblet-squat', 'barbell-curl'],
      },
    ],
  },
  {
    key: 'arnold',
    name: 'Arnold Split',
    blurb: 'Chest+Back, Shoulders+Arms, Legs. Antagonist pairing with huge volume.',
    daysPerWeek: '6 days/week',
    bestFor: 'Advanced lifters with time to recover',
    icon: 'strength.barbell',
    color: '#FFB454',
    days: [
      {
        key: 'chest_back',
        label: 'Chest & Back',
        muscles: ['chest', 'back'],
        blurb: 'Superset pushing and pulling — a massive pump.',
        exercises: ['bench-press-barbell', 'barbell-row', 'db-incline-press', 'pull-up', 'db-fly', 'seated-cable-row'],
      },
      {
        key: 'shoulders_arms',
        label: 'Shoulders & Arms',
        muscles: ['shoulders', 'biceps', 'triceps'],
        blurb: 'Delts, then biceps/triceps supersets.',
        exercises: ['overhead-press', 'lateral-raise', 'rear-delt-fly', 'barbell-curl', 'skullcrusher', 'hammer-curl'],
      },
      {
        key: 'legs',
        label: 'Legs',
        muscles: ['quads', 'hamstrings', 'glutes', 'calves'],
        blurb: 'Quads, hams and calves.',
        exercises: ['back-squat', 'leg-press', 'romanian-deadlift', 'leg-curl-machine', 'standing-calf-machine'],
      },
    ],
  },
];

export function findSplit(key: string): SplitTemplate | undefined {
  return SPLITS.find((s) => s.key === key);
}

export function findSplitDay(splitKey: string, dayKey: string): SplitDay | undefined {
  return findSplit(splitKey)?.days.find((d) => d.key === dayKey);
}
