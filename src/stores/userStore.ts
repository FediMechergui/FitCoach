import { create } from 'zustand';
import type { NutritionGoal, User } from '@/db/schema';
import {
  ensureUser,
  getNutritionGoal,
  getUser,
  latestWeight,
  markOnboarded,
  updateUser,
  upsertNutritionGoal,
  addWeighIn,
  type WeighInExtra,
} from '@/repositories/userRepo';
import { computeTargets, recommendedWaterMl, type CalorieInputs } from '@/lib/calories';
import { computeBodyComp } from '@/lib/bodyComposition';
import { recordGoalChange } from '@/repositories/goalHistoryRepo';
import { estimateBodyType } from '@/lib/bodyType';
import { ageFromBirthdate } from '@/lib/date';
import { CAFFEINE_SOFT_LIMIT_MG } from '@/data/beverages';

interface UserState {
  user: User | null;
  goal: NutritionGoal | null;
  currentWeightKg: number | null;
  hydrated: boolean;

  load: () => void;
  updateProfile: (patch: Partial<User>) => void;
  logWeight: (weightKg: number, extra?: WeighInExtra) => void;
  /** Recompute targets; logs a goal-history entry when the targets change. */
  recalcTargets: (opts?: RecalcOptions) => NutritionGoal | null;
  completeOnboarding: (data: OnboardingData) => void;
}

export interface RecalcOptions {
  /** force a history entry even if the numbers didn't move */
  record?: boolean;
  targetWeightKg?: number | null;
  notes?: string | null;
}

export interface OnboardingData {
  name: string;
  gender: User['gender'];
  sex: 'male' | 'female'; // biological, for BMR
  birthdate: string;
  heightCm: number;
  weightKg: number;
  bodyFatPct?: number | null;
  waistCm?: number | null;
  hipCm?: number | null;
  activityLevel: User['activityLevel'];
  goal: User['goal'];
  rate: User['rateOfChange'];
}

/**
 * Build calorie inputs, folding in measured body composition when the latest
 * weigh-in has it: lean mass switches BMR to Katch-McArdle and body-fat % anchors
 * the protein target, so targets track your composition, not just your weight.
 */
function inputsFor(user: User, weightKg: number): CalorieInputs {
  const w = latestWeight();
  const comp = w
    ? computeBodyComp({
        weightKg,
        heightCm: user.heightCm,
        bodyFatPct: w.bodyFatPct,
        fatMassKg: w.fatMassKg,
        sex: user.sex,
      })
    : null;
  return {
    sex: user.sex,
    age: ageFromBirthdate(user.birthdate),
    heightCm: user.heightCm ?? 175,
    weightKg,
    activityLevel: user.activityLevel,
    goal: user.goal,
    rate: user.rateOfChange,
    bodyFatPct: comp?.bodyFatPct ?? null,
    leanMassKg: comp?.leanMassKg ?? null,
  };
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  goal: null,
  currentWeightKg: null,
  hydrated: false,

  load: () => {
    const user = ensureUser();
    const goal = getNutritionGoal();
    const w = latestWeight();
    set({ user, goal, currentWeightKg: w?.weightKg ?? null, hydrated: true });
  },

  updateProfile: (patch) => {
    const user = updateUser(patch);
    set({ user });
    get().recalcTargets();
  },

  logWeight: (weightKg, extra) => {
    addWeighIn(weightKg, extra ?? {});
    set({ currentWeightKg: weightKg });
    get().recalcTargets();
  },

  recalcTargets: (opts) => {
    const user = get().user ?? getUser();
    const weightKg = get().currentWeightKg ?? latestWeight()?.weightKg;
    if (!user || !weightKg || !user.heightCm) return get().goal;
    const inputs = inputsFor(user, weightKg);
    const result = computeTargets(inputs);
    const previous = get().goal;
    const goal = upsertNutritionGoal({
      calorieTarget: result.calorieTarget,
      proteinG: result.macros.protein,
      carbsG: result.macros.carbs,
      fatG: result.macros.fat,
      // Water scales with bodyweight; keep a user override unless weight moved.
      waterGoalMl: recommendedWaterMl(weightKg),
      caffeineSoftLimitMg: previous?.caffeineSoftLimitMg ?? CAFFEINE_SOFT_LIMIT_MG,
      tdee: result.tdee,
    });
    set({ goal });

    // Log the change so targets have a history, like weigh-ins do. Only when
    // something actually moved (or the caller explicitly asked to record).
    const changed =
      !previous ||
      previous.calorieTarget !== goal.calorieTarget ||
      previous.proteinG !== goal.proteinG ||
      previous.carbsG !== goal.carbsG ||
      previous.fatG !== goal.fatG;
    if (changed || opts?.record) {
      try {
        recordGoalChange({
          goal: user.goal,
          rateOfChange: user.rateOfChange,
          targetWeightKg: opts?.targetWeightKg ?? null,
          calorieTarget: goal.calorieTarget,
          proteinG: goal.proteinG,
          carbsG: goal.carbsG,
          fatG: goal.fatG,
          tdee: result.tdee,
          bmr: result.bmr,
          basis: result.bmrBasis,
          atWeightKg: weightKg,
          atBodyFatPct: inputs.bodyFatPct ?? null,
          notes: opts?.notes ?? null,
        });
      } catch {
        // history is best-effort — never block a recalculation
      }
    }
    return goal;
  },

  completeOnboarding: (data) => {
    const bodyType = estimateBodyType({
      heightCm: data.heightCm,
      weightKg: data.weightKg,
      waistCm: data.waistCm,
      hipCm: data.hipCm,
      sex: data.sex,
    });
    updateUser({
      name: data.name,
      gender: data.gender,
      sex: data.sex,
      birthdate: data.birthdate,
      heightCm: data.heightCm,
      activityLevel: data.activityLevel,
      goal: data.goal,
      rateOfChange: data.rate,
      bodyType,
    });
    addWeighIn(data.weightKg, {
      bodyFatPct: data.bodyFatPct ?? null,
      waistCm: data.waistCm ?? null,
      hipCm: data.hipCm ?? null,
    });
    set({ currentWeightKg: data.weightKg });
    // Compute initial targets, then mark onboarded.
    const user = getUser()!;
    const result = computeTargets(inputsFor(user, data.weightKg));
    upsertNutritionGoal({
      calorieTarget: result.calorieTarget,
      proteinG: result.macros.protein,
      carbsG: result.macros.carbs,
      fatG: result.macros.fat,
      waterGoalMl: recommendedWaterMl(data.weightKg),
      caffeineSoftLimitMg: CAFFEINE_SOFT_LIMIT_MG,
      tdee: result.tdee,
    });
    markOnboarded();
    get().load();
  },
}));
