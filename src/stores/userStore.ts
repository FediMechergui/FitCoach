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
} from '@/repositories/userRepo';
import { computeTargets, recommendedWaterMl, type CalorieInputs } from '@/lib/calories';
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
  logWeight: (weightKg: number, extra?: { bodyFatPct?: number | null; waistCm?: number | null; hipCm?: number | null }) => void;
  recalcTargets: () => NutritionGoal | null;
  completeOnboarding: (data: OnboardingData) => void;
}

export interface OnboardingData {
  name: string;
  sex: 'male' | 'female';
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

function inputsFor(user: User, weightKg: number): CalorieInputs {
  return {
    sex: user.sex,
    age: ageFromBirthdate(user.birthdate),
    heightCm: user.heightCm ?? 175,
    weightKg,
    activityLevel: user.activityLevel,
    goal: user.goal,
    rate: user.rateOfChange,
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

  recalcTargets: () => {
    const user = get().user ?? getUser();
    const weightKg = get().currentWeightKg ?? latestWeight()?.weightKg;
    if (!user || !weightKg || !user.heightCm) return get().goal;
    const result = computeTargets(inputsFor(user, weightKg));
    const goal = upsertNutritionGoal({
      calorieTarget: result.calorieTarget,
      proteinG: result.macros.protein,
      carbsG: result.macros.carbs,
      fatG: result.macros.fat,
      waterGoalMl: get().goal?.waterGoalMl ?? recommendedWaterMl(weightKg),
      caffeineSoftLimitMg: get().goal?.caffeineSoftLimitMg ?? CAFFEINE_SOFT_LIMIT_MG,
      tdee: result.tdee,
    });
    set({ goal });
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
