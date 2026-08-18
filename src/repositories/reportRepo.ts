import { computeBodyComp, type BodyComp } from '@/lib/bodyComposition';
import { ageFromBirthdate, daysAgoISO, todayISO } from '@/lib/date';
import type { CardRating } from '@/lib/rating';
import type { CycleState } from '@/lib/cycle';
import { computeCycle } from '@/lib/cycle';
import {
  getNutritionGoal,
  getUser,
  latestWeight,
  PRIMARY_USER_ID,
  weightTrendKgPerWeek,
  weighInHistory,
} from './userRepo';
import { dailyIntakeSince } from './nutritionRepo';
import {
  currentStreak,
  personalRecords,
  sessionTypeCounts,
  weeklyVolume,
} from './statsRepo';
import { listSessions } from './sessionRepo';
import { weeklyStepAverage } from './coachRepo';
import { sleepSummary } from './sleepRepo';
import { alcoholImpact } from './alcoholRepo';
import { smokingImpact } from './smokingRepo';
import { getCycleProfile } from './cycleRepo';
import { listConditions } from './conditionsRepo';
import { computeCardRating } from './cardRepo';
import { dayMicros } from './microsRepo';
import { getStack } from './supplementsRepo';
import { findSupplement, servingUnits } from '@/data/supplements';
import { MICRO_DEFS, formatMicro, percentRdi, rdiFor, sumMicros } from '@/lib/micros';
import { recommendedFiberG } from '@/lib/calories';
import { lastNDates } from '@/lib/date';

export interface ReportData {
  generatedOn: string;
  audience: 'nutritionist' | 'coach';
  profile: {
    name: string;
    age: number;
    sex: 'male' | 'female';
    gender: string;
    heightCm: number | null;
    goal: string;
    activityLevel: string;
    bodyType: string | null;
  };
  weightKg: number | null;
  bodyComp: BodyComp | null;
  weightTrendKgPerWeek: number | null;
  nutrition: {
    calorieTarget: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    avg7d: { calories: number; protein: number; fiber: number };
    avg30d: { calories: number; protein: number; fiber: number };
    /** the fibre target the app shows — WHO floor, IOM ratio (see recommendedFiberG) */
    fiberTargetG: number;
    daysLogged30d: number;
    waterGoalMl: number;
    caffeineSoftLimitMg: number;
  } | null;
  /**
   * Seven-day micronutrient picture: the average daily intake against the
   * reference intake, listing what runs low. Averaged over the days that had
   * any micro data (food with micros or a supplement), so a day not logged does
   * not read as a day of zero.
   */
  micros: {
    daysWithData: number;
    /** below 50% of the RDI on average, lowest first */
    gaps: Array<{ label: string; avgAmount: string; rdi: string; pct: number }>;
    /** at or above 100% of the RDI on average */
    coveredCount: number;
    trackedCount: number;
  };
  /** the supplements currently in the stack, as the user takes them */
  supplements: Array<{ label: string; dose: string; category: string }>;
  training: {
    sessions30d: number;
    streak: number;
    weeklyVolume: Array<{ weekStart: string; volume: number }>;
    sessionMix: Record<string, number>;
    prs: Array<{ date: string; exerciseName: string; weightKg: number; reps: number; est1RM: number }>;
    avgStepsPerDay: number;
  };
  sleep: ReturnType<typeof sleepSummary>;
  alcohol: ReturnType<typeof alcoholImpact>;
  smoking: NonNullable<ReturnType<typeof smokingImpact>>;
  cycle: CycleState | null;
  conditions: Array<{ label: string; category: string | null; notes: string | null }>;
  rating: CardRating;
}

function avgOf(values: number[]): number {
  return values.length ? Math.round(values.reduce((s, v) => s + v, 0) / values.length) : 0;
}

export function buildReportData(
  audience: 'nutritionist' | 'coach',
  userId: number = PRIMARY_USER_ID
): ReportData {
  const user = getUser(userId)!;
  const goal = getNutritionGoal(userId);
  const weigh = latestWeight(userId);
  const weightKg = weigh?.weightKg ?? null;

  const bodyComp =
    weigh && weightKg
      ? computeBodyComp({
          weightKg,
          heightCm: user.heightCm,
          bodyFatPct: weigh.bodyFatPct,
          fatMassKg: weigh.fatMassKg,
          muscleMassKg: weigh.muscleMassKg,
          bodyWaterPct: weigh.bodyWaterPct,
          boneMassKg: weigh.boneMassKg,
          sex: user.sex,
        })
      : null;

  const intake7 = dailyIntakeSince(daysAgoISO(6), userId);
  const intake30 = dailyIntakeSince(daysAgoISO(29), userId);

  // Micros: average the days that carried any micro data.
  const microDays = lastNDates(7).map((d) => dayMicros(d, userId)).filter((m) => m.foodEntriesWithMicros > 0 || m.supplementCount > 0);
  const microAvg = sumMicros(microDays.map((m) => m.totals));
  const nDays = Math.max(1, microDays.length);
  for (const k of Object.keys(microAvg) as Array<keyof typeof microAvg>) microAvg[k] = microAvg[k] / nDays;
  const microRows = MICRO_DEFS.filter((d) => d.key !== 'sodium_mg').map((d) => ({ def: d, pct: percentRdi(microAvg[d.key], d.key, user.sex) }));
  const micros = {
    daysWithData: microDays.length,
    gaps: microDays.length
      ? microRows.filter((r) => r.pct < 50).sort((a, b) => a.pct - b.pct).map((r) => ({
          label: r.def.label,
          avgAmount: formatMicro(r.def.key, microAvg[r.def.key]),
          rdi: formatMicro(r.def.key, rdiFor(r.def.key, user.sex)),
          pct: r.pct,
        }))
      : [],
    coveredCount: microDays.length ? microRows.filter((r) => r.pct >= 100).length : 0,
    trackedCount: microRows.length,
  };

  const supplements = getStack(userId)
    .map((s) => {
      const def = findSupplement(s.key);
      if (!def) return null;
      return { label: def.label, dose: servingUnits(def) ?? def.defaultDose, category: def.category as string };
    })
    .filter((s): s is { label: string; dose: string; category: string } => s !== null);

  const cycleProfile = getCycleProfile(userId);
  const cycle =
    cycleProfile?.enabled && cycleProfile.lastPeriodStart
      ? computeCycle({
          lastPeriodStart: cycleProfile.lastPeriodStart,
          cycleLength: cycleProfile.avgCycleLength,
          periodLength: cycleProfile.avgPeriodLength,
          today: todayISO(),
        })
      : null;

  return {
    generatedOn: todayISO(),
    audience,
    profile: {
      name: user.name,
      age: ageFromBirthdate(user.birthdate),
      sex: user.sex,
      gender: user.gender,
      heightCm: user.heightCm,
      goal: user.goal,
      activityLevel: user.activityLevel,
      bodyType: user.bodyType,
    },
    weightKg,
    bodyComp,
    weightTrendKgPerWeek: weightTrendKgPerWeek(28, userId),
    nutrition: goal
      ? {
          calorieTarget: goal.calorieTarget,
          proteinG: goal.proteinG,
          carbsG: goal.carbsG,
          fatG: goal.fatG,
          avg7d: { calories: avgOf(intake7.map((r) => r.calories)), protein: avgOf(intake7.map((r) => r.protein)), fiber: avgOf(intake7.map((r) => r.fiber)) },
          avg30d: { calories: avgOf(intake30.map((r) => r.calories)), protein: avgOf(intake30.map((r) => r.protein)), fiber: avgOf(intake30.map((r) => r.fiber)) },
          fiberTargetG: recommendedFiberG(goal.calorieTarget),
          daysLogged30d: intake30.length,
          waterGoalMl: goal.waterGoalMl,
          caffeineSoftLimitMg: goal.caffeineSoftLimitMg,
        }
      : null,
    training: {
      sessions30d: listSessions({ since: daysAgoISO(29) }, userId).length,
      streak: currentStreak(userId),
      weeklyVolume: weeklyVolume(8, userId).map((w) => ({ weekStart: w.weekStart, volume: w.volume })),
      sessionMix: sessionTypeCounts(30, userId),
      prs: personalRecords(12, userId),
      avgStepsPerDay: weeklyStepAverage(userId),
    },
    sleep: sleepSummary(userId),
    alcohol: alcoholImpact(userId),
    smoking: smokingImpact(userId) ?? {
      today: 0, week: 0, avgPerDay: 0, dailyTarget: null, nicotineWeekMg: 0, moneyWeek: 0,
      moneyYearProjected: 0, currency: '$', lifeMinutesWeek: 0, lifeHoursYearProjected: 0,
      aerobicPenaltyPct: 0, restingHrElevationBpm: 0, smokeFreeHours: Infinity, smokeFreeStreak: 0,
    },
    micros,
    supplements,
    cycle,
    conditions: listConditions(userId).map((c) => ({ label: c.label, category: c.category, notes: c.notes })),
    rating: computeCardRating(userId),
  };
}
