/**
 * Turn an on-foot activity (a run, a hike, a logged outdoor session) into an
 * approximate step count so it can feed the daily step total — the way phones
 * fold a tracked run into your step count.
 *
 * Only for activities that actually involve stepping. Cycling, swimming, rowing
 * and the like cover distance without steps, so the caller decides whether an
 * activity is "on foot"; this just does the maths once it is.
 */
import { stepsFromDistance, stepsFromDuration, estimateStrideLengthM } from './pedometer';

export interface ActivityStepInput {
  distanceM?: number | null;
  durationSec?: number | null;
  heightCm?: number | null;
}

export interface ActivityStepResult {
  steps: number;
  /** distance actually attributed (given, or derived from steps when only time is known) */
  distanceM: number;
  mode: 'walk' | 'run';
}

/** Speed (km/h) at or above which we treat the gait as running for stride/cadence. */
const RUN_SPEED_KMH = 7;

export function estimateActivitySteps(input: ActivityStepInput): ActivityStepResult {
  const heightCm = input.heightCm && input.heightCm > 0 ? input.heightCm : 170;
  const distanceM = input.distanceM && input.distanceM > 0 ? input.distanceM : 0;
  const durationSec = input.durationSec && input.durationSec > 0 ? input.durationSec : 0;

  // Pick gait from pace when we can — a fast pace means a longer stride and faster cadence.
  let mode: 'walk' | 'run' = 'walk';
  if (distanceM > 0 && durationSec > 0) {
    const kmh = distanceM / 1000 / (durationSec / 3600);
    mode = kmh >= RUN_SPEED_KMH ? 'run' : 'walk';
  }

  if (distanceM > 0) {
    return { steps: stepsFromDistance(distanceM, heightCm, mode), distanceM, mode };
  }
  if (durationSec > 0) {
    const steps = stepsFromDuration(durationSec, mode);
    return { steps, distanceM: Math.round(steps * estimateStrideLengthM(heightCm, mode)), mode };
  }
  return { steps: 0, distanceM: 0, mode };
}
