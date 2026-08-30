import { netCaloriesFromMet, walkCalories, walkRunMet } from './met';
import { loadCalorieFactor, profileFor } from './loadProfile';

/**
 * Outdoor ground activities — everything you launch the way you launch a walk.
 *
 * A walk and a run already had a proper launcher: one tap, a live screen with
 * steps, distance, pace and a route map, a foreground service that keeps
 * counting with the screen off, and a recap. Every other thing you do on the
 * ground — a hike, a ruck, a trail run, stair climbing, a ride — went through
 * the generic session screen instead, where you had to remember to turn GPS on
 * and nothing knew what the activity was.
 *
 * This is the catalogue that lets one screen launch all of them. Each activity
 * declares:
 *   • `gait` — how a step becomes distance. Walking and running have different
 *     stride lengths, and a ride has no steps at all, so cycling is GPS-only
 *     and says so rather than inventing a distance from arm swing.
 *   • `sessionType` — what it is recorded as, so it lands in the right place in
 *     your stats and the right recovery margins apply.
 *   • `metFloor` — the floor for the pace-based MET. A hike at walking pace
 *     costs more than a walk at walking pace: uneven ground, a gradient and a
 *     pack all raise the cost, and the Compendium reflects that (walking ~3.5,
 *     hiking ~6, rucking higher again).
 *   • `carries` — whether to ask for a pack weight, which then scales the burn
 *     through lib/loadProfile (a 20 kg pack at 80 kg costs ~25 % more).
 */

export type Gait = 'walk' | 'run' | 'none';

export interface OutdoorActivity {
  key: string;
  label: string;
  /** the verb on the start button: "Start hike" */
  verb: string;
  icon: string;
  gait: Gait;
  sessionType: 'outdoor' | 'cardio' | 'sport';
  /** the pace-based MET can never read lower than this for this activity */
  metFloor: number;
  /** ask for a carried load (pack, vest, sandbag) */
  carries: boolean;
  /** minutes to plan for in the weather advice */
  plannedMin: number;
  blurb: string;
}

export const OUTDOOR_ACTIVITIES: OutdoorActivity[] = [
  {
    key: 'walk',
    label: 'Walk',
    verb: 'Start walk',
    icon: 'cardio.walk',
    gait: 'walk',
    sessionType: 'outdoor',
    metFloor: 0,
    carries: false,
    plannedMin: 60,
    blurb: 'Steps, distance and pace, counted with the screen off.',
  },
  {
    key: 'run',
    label: 'Run',
    verb: 'Start run',
    icon: 'cardio.running',
    gait: 'run',
    sessionType: 'cardio',
    metFloor: 0,
    carries: false,
    plannedMin: 40,
    blurb: 'Pace-driven, with the route mapped as you go.',
  },
  {
    key: 'hike',
    label: 'Hike',
    verb: 'Start hike',
    icon: 'cardio.hiking',
    gait: 'walk',
    sessionType: 'outdoor',
    metFloor: 6,
    carries: true,
    plannedMin: 120,
    blurb: 'Uneven ground and gradient cost more than the same pace on pavement.',
  },
  {
    key: 'trail-run',
    label: 'Trail run',
    verb: 'Start trail run',
    icon: 'cardio.marathon',
    gait: 'run',
    sessionType: 'outdoor',
    metFloor: 9,
    carries: false,
    plannedMin: 60,
    blurb: 'Rougher and slower than road pace for the same effort — the floor accounts for it.',
  },
  {
    key: 'ruck',
    label: 'Ruck',
    verb: 'Start ruck',
    icon: 'strength.plate',
    gait: 'walk',
    sessionType: 'outdoor',
    metFloor: 6.5,
    carries: true,
    plannedMin: 60,
    blurb: 'Loaded march. The pack weight scales the burn — carrying 25 % of your bodyweight costs about 25 % more.',
  },
  {
    key: 'stairs',
    label: 'Stairs',
    verb: 'Start stair climb',
    icon: 'cardio.stairs',
    gait: 'walk',
    sessionType: 'outdoor',
    metFloor: 8,
    carries: true,
    plannedMin: 30,
    blurb: 'Climbing is the most expensive thing you can do on foot per minute.',
  },
  {
    key: 'cycle',
    label: 'Ride',
    verb: 'Start ride',
    icon: 'cardio.cycling',
    gait: 'none',
    sessionType: 'outdoor',
    metFloor: 6,
    carries: false,
    plannedMin: 75,
    blurb: 'GPS only — there are no steps on a bike, so the route provides the distance.',
  },
];

export const DEFAULT_ACTIVITY_KEY = 'walk';

export function activityFor(key: string | null | undefined): OutdoorActivity {
  return OUTDOOR_ACTIVITIES.find((a) => a.key === key) ?? OUTDOOR_ACTIVITIES[0];
}

/** Activities whose distance can only come from GPS. */
export function requiresGps(activity: OutdoorActivity): boolean {
  return activity.gait === 'none';
}

/**
 * The MET for this activity at this pace: the walk/run curve, never below the
 * activity's own floor. `paceMet` comes from lib/met (walkRunMet × grade).
 */
export function activityMet(activity: OutdoorActivity, paceMet: number): number {
  return Math.max(activity.metFloor, paceMet);
}

export interface OutdoorCaloriesInput {
  weightKg: number;
  distanceM: number;
  durationSec: number;
  /** moving seconds; falls back to durationSec when 0 */
  activeSec: number;
  steps: number;
  activity: OutdoorActivity;
  /** carried pack/vest weight, kg (0 = none) */
  loadKg: number;
}

/**
 * The one calorie figure for an outdoor session — used by the live screen AND
 * by the save, so the number can never drop the moment you hit Finish.
 *
 * A hike at walking pace is not a walk: uneven ground and gradient cost more,
 * so the pace-based figure is floored at the activity's own MET, and a carried
 * pack scales it (see lib/loadProfile). A plain walk or run keeps exactly the
 * number walkCalories gives it — floor 0, no load.
 */
export function outdoorCalories(i: OutdoorCaloriesInput): number {
  const base = walkCalories({
    weightKg: i.weightKg,
    distanceM: i.distanceM,
    durationSec: i.durationSec,
    activeSec: i.activeSec,
    steps: i.steps,
  });
  const loadFactor =
    i.loadKg > 0 ? loadCalorieFactor(profileFor({ slug: 'rucking' }), i.weightKg, i.loadKg) : 1;
  const activeSec = i.activeSec > 0 ? i.activeSec : i.durationSec;
  const paceMet =
    i.distanceM > 0 && activeSec > 0 ? walkRunMet(i.distanceM / 1000 / (activeSec / 3600)) : 0;
  const flooredMet = activityMet(i.activity, paceMet);
  return i.activity.metFloor > 0 && activeSec > 0 && flooredMet > paceMet
    ? Math.round(netCaloriesFromMet(flooredMet, i.weightKg, activeSec) * loadFactor)
    : Math.round(base * loadFactor);
}
