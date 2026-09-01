import { create } from 'zustand';
import type { BeverageType, MealType } from '@/db/schema';
import {
  addBeverage,
  addHonestFood,
  addPreciseFood,
  updateFoodEntry,
  restoreFoodEntry,
  getFoodEntry,
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
    eatenAt?: number;
  }) => ReturnType<typeof addHonestFood>;
  removeFood: (id: number) => void;
  /** edit a logged row in place — quantity rescales its totals */
  editFood: (id: number, patch: { quantity?: number; mealType?: MealType; eatenAt?: number }) => void;
  /** the other half of delete's Undo: put the captured row back */
  restoreFood: (row: Parameters<typeof restoreFoodEntry>[0]) => void;
  /** snapshot a row before deleting it, for the Undo */
  snapshotFood: (id: number) => ReturnType<typeof getFoodEntry>;
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
  editFood: (id, patch) => {
    updateFoodEntry(id, patch);
    get().refresh();
  },
  restoreFood: (row) => {
    restoreFoodEntry(row);
    get().refresh();
  },
  snapshotFood: (id) => getFoodEntry(id),

  addDrink: (type, opts) => {
    addBeverage(type, { ...opts, date: get().date });
    get().refresh();
  },

  removeDrink: (id) => {
    deleteBeverage(id);
    get().refresh();
  },
}));
