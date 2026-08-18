/**
 * "Can I train now?" — the two clocks that answer it, combined.
 *
 * The stomach (lib/digestion: everything still digesting, stacked) and the
 * smoke (lib/smokeClock: acute nicotine plus the carbon-monoxide load, stacked)
 * each say how long to wait for the intensity you intend. The answer is the
 * LATER of the two, and the UI names which one is holding you — because the
 * fix is different: wait out a meal, or don't light the next one.
 */

import { currentDigestion, digestionStatus, stomachLoad, type DigestionStatus, type MealForDigestion, type TrainingIntensity } from './digestion';
import { smokeStatus, type SmokeEvent, type SmokeStatus } from './smokeClock';

export type Governor = 'stomach' | 'smoke' | null;

export interface Readiness {
  /** minutes still to wait for the intensity asked; 0 when clear */
  remainingMin: number;
  ready: boolean;
  /** epoch ms at which the requested intensity is fine on both counts */
  readyAt: number;
  /** what is holding you back right now, if anything */
  governor: Governor;
  /** which intensity is fine RIGHT NOW on both counts */
  readyFor: TrainingIntensity | null;
  /** 0..1 progress of the governing wait */
  progress: number;
  stomach: DigestionStatus | null;
  smoke: SmokeStatus | null;
}

const ORDER: TrainingIntensity[] = ['hard', 'moderate', 'light'];

export function trainReadiness(
  input: { meals: MealForDigestion[]; smokes?: SmokeEvent[] },
  intensity: TrainingIntensity = 'moderate',
  now = Date.now()
): Readiness {
  const stomach = currentDigestion(input.meals, intensity, now);
  const smoke = smokeStatus(input.smokes ?? [], intensity, now);
  const smokePending = smoke && !smoke.ready ? smoke : null;

  const stomachWait = stomach?.remainingMin ?? 0;
  const smokeWait = smokePending?.remainingMin ?? 0;
  const remainingMin = Math.max(stomachWait, smokeWait);
  const governor: Governor = remainingMin === 0 ? null : smokeWait > stomachWait ? 'smoke' : 'stomach';

  // "What can I do now?" — the strongest intensity both clocks allow.
  let readyFor: TrainingIntensity | null = null;
  const load = stomachLoad(input.meals, now);
  for (const level of ORDER) {
    const s = load.loadKcal > 0 ? currentDigestion(input.meals, level, now) : null;
    const k = smokeStatus(input.smokes ?? [], level, now);
    if (!s && (!k || k.ready)) { readyFor = level; break; }
  }

  const gov = governor === 'smoke' ? smokePending : stomach;
  return {
    remainingMin,
    ready: remainingMin === 0,
    readyAt: now + remainingMin * 60_000,
    governor,
    readyFor,
    progress: gov ? gov.progress : 1,
    stomach,
    smoke: smokePending,
  };
}

/** Re-exported for the per-meal line so consumers import from one place. */
export { digestionStatus };
