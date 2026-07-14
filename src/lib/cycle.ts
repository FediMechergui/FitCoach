import { addDays, daysBetween, todayISO } from './date';

/**
 * Menstrual-cycle model. Tracks the cycle and maps its phases to how the sex
 * hormones (estrogen, progesterone) tend to influence energy, strength and
 * recovery — so training and nutrition can flex with the cycle rather than
 * against it. Guidance is general and educational, not medical advice.
 */

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';

export interface CycleState {
  dayOfCycle: number;
  phase: CyclePhase;
  cycleLength: number;
  periodLength: number;
  nextPeriodDate: string;
  daysUntilNextPeriod: number;
  ovulationDate: string;
  fertileWindow: { start: string; end: string };
  inPeriod: boolean;
  inFertileWindow: boolean;
}

export interface CycleInputs {
  lastPeriodStart: string; // ISO
  cycleLength: number; // e.g. 28
  periodLength: number; // e.g. 5
  today?: string;
}

export function computeCycle(input: CycleInputs): CycleState {
  const today = input.today ?? todayISO();
  const cycleLength = Math.max(21, Math.min(40, input.cycleLength || 28));
  const periodLength = Math.max(2, Math.min(10, input.periodLength || 5));

  const elapsed = daysBetween(today, input.lastPeriodStart);
  // Day within the current cycle (1-indexed), handling multiple elapsed cycles.
  const dayOfCycle = ((elapsed % cycleLength) + cycleLength) % cycleLength + 1;

  const ovulationDay = cycleLength - 14; // luteal phase is ~14 days
  const cycleStart = addDays(input.lastPeriodStart, Math.floor(elapsed / cycleLength) * cycleLength);
  const nextPeriodDate = addDays(cycleStart, cycleLength);
  const ovulationDate = addDays(cycleStart, ovulationDay - 1);

  let phase: CyclePhase;
  if (dayOfCycle <= periodLength) phase = 'menstrual';
  else if (dayOfCycle < ovulationDay) phase = 'follicular';
  else if (dayOfCycle <= ovulationDay + 1) phase = 'ovulation';
  else phase = 'luteal';

  const fertileStart = addDays(ovulationDate, -5);
  const fertileEnd = addDays(ovulationDate, 1);

  return {
    dayOfCycle,
    phase,
    cycleLength,
    periodLength,
    nextPeriodDate,
    daysUntilNextPeriod: daysBetween(nextPeriodDate, today),
    ovulationDate,
    fertileWindow: { start: fertileStart, end: fertileEnd },
    inPeriod: dayOfCycle <= periodLength,
    inFertileWindow: today >= fertileStart && today <= fertileEnd,
  };
}

export interface PhaseGuidance {
  phase: CyclePhase;
  title: string;
  hormones: string;
  training: string;
  nutrition: string;
  color: string;
}

export const PHASE_GUIDANCE: Record<CyclePhase, PhaseGuidance> = {
  menstrual: {
    phase: 'menstrual',
    title: 'Menstrual',
    hormones: 'Estrogen & progesterone are at their lowest.',
    training: 'Energy can dip — keep intensity moderate and honor how you feel. Light movement often eases symptoms.',
    nutrition: 'Prioritize iron-rich foods and stay hydrated to offset menstrual losses.',
    color: '#FF6B9D',
  },
  follicular: {
    phase: 'follicular',
    title: 'Follicular',
    hormones: 'Estrogen is rising — often your strongest, highest-energy window.',
    training: 'Great time to push strength and power, chase PRs and add intensity.',
    nutrition: 'You tolerate carbs well here — fuel harder sessions with them.',
    color: '#4F8CFF',
  },
  ovulation: {
    phase: 'ovulation',
    title: 'Ovulation',
    hormones: 'Estrogen peaks; a testosterone bump can boost performance.',
    training: 'Peak strength potential — but joint laxity is slightly higher, so warm up well on heavy lifts.',
    nutrition: 'Keep protein high to support the harder training this window invites.',
    color: '#33D9A6',
  },
  luteal: {
    phase: 'luteal',
    title: 'Luteal',
    hormones: 'Progesterone rises; core temperature and perceived effort go up.',
    training: 'Favor steady volume over max intensity, and build in more recovery. PMS fatigue is normal here.',
    nutrition: 'Metabolism rises slightly and cravings are common — a small calorie/carb bump and extra magnesium can help.',
    color: '#B58CFF',
  },
};

export const CYCLE_SYMPTOMS = [
  'cramps',
  'headache',
  'bloating',
  'fatigue',
  'mood swings',
  'cravings',
  'back pain',
  'tender breasts',
  'acne',
  'insomnia',
] as const;
