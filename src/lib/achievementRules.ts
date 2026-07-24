import type { AchievementStats } from '@/repositories/achievementsRepo';
import type { AchievementDef } from '@/data/achievements';

/**
 * Progress rules for achievements that can be derived from the user's data.
 * Each rule returns { current, target }; unlocked = current >= target.
 *
 * Achievements without a rule are "criteria-based" (event-driven or not yet
 * tracked from stored data, e.g. exporting a PNG card) — they still show with
 * their badge and criteria, marked as not auto-tracked, so nothing is faked.
 */
export interface AchievementProgress {
  current: number;
  target: number;
  unlocked: boolean;
  /** false = criteria-based, not auto-tracked from data */
  tracked: boolean;
}

type Rule = (s: AchievementStats) => { current: number; target: number };
const bool = (v: boolean): { current: number; target: number } => ({ current: v ? 1 : 0, target: 1 });
const r1 = (n: number) => Math.round(n * 10) / 10;

const RULES: Record<number, Rule> = {
  // 1. Consistency & Streaks
  1: (s) => ({ current: s.appStreakBest, target: 3 }),
  2: (s) => ({ current: s.appStreakBest, target: 7 }),
  3: (s) => ({ current: s.appStreakBest, target: 14 }),
  4: (s) => ({ current: s.appStreakBest, target: 30 }),
  5: (s) => ({ current: s.appStreakBest, target: 100 }),
  6: (s) => ({ current: s.appStreakBest, target: 365 }),
  8: (s) => ({ current: s.cardOverall, target: 70 }),

  // 2. Strength & Muscle Growth
  12: (s) => ({ current: s.routineCount, target: 1 }),
  13: (s) => ({ current: s.prCount, target: 1 }),
  14: (s) => bool(s.fullBodyDone),
  16: (s) => ({ current: s.maxSetsThisWeek, target: 10 }),
  19: (s) => ({ current: s.customExerciseCount, target: 1 }),
  20: (s) => ({ current: Math.round(s.maxVolumeKg), target: 10000 }),

  // 3. Movement & Endurance
  21: (s) => ({ current: s.bestStepDay, target: 5000 }),
  22: (s) => ({ current: s.bestStepDay, target: 10000 }),
  23: (s) => ({ current: s.best10kStreak, target: 7 }),
  24: (s) => ({ current: r1(s.monthDistanceKm), target: 42.2 }),
  27: (s) => ({ current: Math.round(s.bestRunKcal), target: 500 }),
  28: (s) => ({ current: Math.round(s.bestRunMinutes), target: 60 }),
  29: (s) => ({ current: s.cardEND, target: 75 }),

  // 4. Honest Nutrition & Hydration
  31: (s) => bool(s.tdeeCalculated),
  32: (s) => ({ current: Math.min(s.caloriesAdherentDays, 3), target: 3 }),
  33: (s) => ({ current: s.macroHitsToday, target: 3 }),
  34: (s) => ({ current: s.waterGoalStreak, target: 7 }),
  35: (s) => ({ current: s.caffeineUnderStreak, target: 5 }),
  38: (s) => ({ current: Math.round(s.proteinPerKgToday * 100) / 100, target: 1.6 }),
  39: (s) => ({ current: s.loggedDaysCount, target: 30 }),
  40: (s) => ({ current: s.nutritionLogStreak, target: 30 }),

  // 5. Tunisian & Mediterranean Heritage
  41: (s) => bool(/olive oil|zit zitoun|zeitoun/.test(s.loggedBlob)),
  42: (s) => bool(/bsisa|bsissa/.test(s.loggedBlob)),
  43: (s) => bool(/kafteji|mlewi|mlaoui/.test(s.loggedBlob)),
  44: (s) => bool(/couscous|kosksi/.test(s.loggedBlob)),
  45: (s) => bool(/harissa/.test(s.loggedBlob)),
  46: (s) => ({ current: s.tunisianSalads, target: 3 }),
  47: (s) => bool(/brik/.test(s.loggedBlob)),
  48: (s) => bool(/lablabi/.test(s.loggedBlob)),
  50: (s) => ({ current: Math.round(s.tunisianShare7d * 100), target: 30 }),

  // 6. Smoking Cessation
  51: (s) => bool(s.smokingEnabled && s.smokeFreeStreak >= 1),
  52: (s) => ({ current: Math.round(s.smokeFreeHours), target: 12 }),
  53: (s) => ({ current: s.smokeFreeStreak, target: 14 }),
  57: (s) => ({ current: s.smokeFreeStreak, target: 30 }),
  59: (s) => ({ current: s.smokeFreeStreak, target: 7 }),

  // 7. Mind, Sleep & Work
  61: (s) => ({ current: r1(s.bestSleepHours), target: 7 }),
  62: (s) => bool(s.sleepDebt <= 0),

  // 8. Mindful Alcohol Moderation
  71: (s) => ({ current: Math.min(s.dryDays7d, 1), target: 1 }),
  72: (s) => bool(s.alcoholWeekGrams <= s.alcoholLimitG),
  73: (s) => bool(s.alcoholWeekGrams === 0),
  75: (s) => ({ current: s.dryStreak, target: 7 }),
  76: (s) => ({ current: s.dryStreak, target: 30 }),

  // 9. Faith & Fasting
  81: (s) => bool(s.fastedLast30 >= 1),
  82: (s) => bool(s.fastedLast30 >= 1),
  84: (s) => bool(s.prayersEnabled),
  88: (s) => ({ current: s.fastingStreak, target: 7 }),
  90: (s) => ({ current: s.cardDIS, target: 75 }),

  // 10. Micronutrients & Supplements
  91: (s) => ({ current: s.microRdiMetCount, target: 5 }),
  92: (s) => ({ current: s.suppStackCount, target: 1 }),
  93: (s) => bool(s.hasStrongSupp),
  94: (s) => ({ current: s.creatineStreak, target: 7 }),
  95: (s) => ({ current: s.ashwaStreak, target: 14 }),
  96: (s) => bool(s.hasMicroData && s.microGapsCount === 0),

  // 11. Self-Care & Devotion
  101: (s) => ({ current: s.brushBestDay, target: 3 }),
  102: (s) => bool(s.hygieneFullBest === 1),
  103: (s) => ({ current: s.hygieneStreak, target: 7 }),
  104: (s) => ({ current: s.prayersBestDay, target: 5 }),
  105: (s) => ({ current: s.allPrayersStreak, target: 7 }),
  106: (s) => bool(s.fajrLogged),
  107: (s) => ({ current: s.napCount, target: 1 }),
  108: (s) => ({ current: s.meditationSessions, target: 10 }),
  109: (s) => ({ current: Math.round(s.meditationMinutes7d), target: 60 }),
  110: (s) => bool(s.balancedDayDone === 1),

  // 12. Body Mastery & Special Ops
  111: (s) => bool(s.hasBodyFat),
  112: (s) => bool(s.hasAllMeasurements),
  113: (s) => ({ current: s.weighInCount, target: 4 }),
  114: (s) => bool(s.goalIsRecompOrPerf),
  115: (s) => ({ current: s.suppStackCount, target: 3 }),
  116: (s) => ({ current: s.suppStackCount, target: 5 }),
  117: (s) => ({ current: s.specialSessionCount, target: 1 }),
  118: (s) => ({ current: s.distinctSpecialPrograms, target: 3 }),
  119: (s) => ({ current: s.specialSessionCount, target: 10 }),
  120: (s) => ({ current: s.distinctSessionTypes, target: 8 }),
};

export function evaluateAchievement(def: AchievementDef, s: AchievementStats): AchievementProgress {
  const rule = RULES[def.id];
  if (!rule) return { current: 0, target: 1, unlocked: false, tracked: false };
  const { current, target } = rule(s);
  return { current, target, unlocked: current >= target, tracked: true };
}

/** How many achievements are auto-tracked from data (the rest are criteria-based). */
export const TRACKED_ACHIEVEMENT_COUNT = Object.keys(RULES).length;
