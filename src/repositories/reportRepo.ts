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
    avg7d: { calories: number; protein: number };
    avg30d: { calories: number; protein: number };
    daysLogged30d: number;
    waterGoalMl: number;
    caffeineSoftLimitMg: number;
  } | null;
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
          avg7d: { calories: avgOf(intake7.map((r) => r.calories)), protein: avgOf(intake7.map((r) => r.protein)) },
          avg30d: { calories: avgOf(intake30.map((r) => r.calories)), protein: avgOf(intake30.map((r) => r.protein)) },
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
    cycle,
    conditions: listConditions(userId).map((c) => ({ label: c.label, category: c.category, notes: c.notes })),
    rating: computeCardRating(userId),
  };
}
