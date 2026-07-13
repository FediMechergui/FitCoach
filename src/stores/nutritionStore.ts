import { create } from 'zustand';
import type { BeverageType, MealType } from '@/db/schema';
import {
  addBeverage,
  addHonestFood,
  addPreciseFood,
  dayBeverages,
  dayNutrition,
  deleteBeverage,
  deleteFoodEntry,
  type DayBeverages,
  type DayNutrition,
  type PreciseFoodInput,
} from '@/repositories/nutritionRepo';
import { todayISO } from '@/lib/date';

interface NutritionState {
  date: string;
  food: DayNutrition | null;
  beverages: DayBeverages | null;

  setDate: (date: string) => void;
  refresh: () => void;
  addPrecise: (input: PreciseFoodInput) => void;
  addHonest: (input: {
    mealType: MealType;
    description: string;
    override?: { calories: number; proteinG: number; carbsG: number; fatG: number };
  }) => ReturnType<typeof addHonestFood>;
  removeFood: (id: number) => void;
  addDrink: (type: BeverageType, opts?: { volumeMl?: number; caffeineMg?: number }) => void;
  removeDrink: (id: number) => void;
}

export const useNutritionStore = create<NutritionState>((set, get) => ({
  date: todayISO(),
  food: null,
  beverages: null,

  setDate: (date) => {
    set({ date });
    get().refresh();
  },

  refresh: () => {
    const date = get().date;
    set({ food: dayNutrition(date), beverages: dayBeverages(date) });
  },

  addPrecise: (input) => {
    addPreciseFood({ ...input, date: get().date });
    get().refresh();
  },

  addHonest: (input) => {
    const res = addHonestFood({ ...input, date: get().date });
    get().refresh();
    return res;
  },

  removeFood: (id) => {
    deleteFoodEntry(id);
    get().refresh();
  },

  addDrink: (type, opts) => {
    addBeverage(type, { ...opts, date: get().date });
    get().refresh();
  },

  removeDrink: (id) => {
    deleteBeverage(id);
    get().refresh();
  },
}));
