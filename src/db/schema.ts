import { sql } from 'drizzle-orm';
import {
  integer,
  real,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core';

/**
 * FitCoach relational schema (spec §4).
 * Timestamps are stored as unix-epoch milliseconds (integer).
 * Dates (day granularity) are stored as ISO 'YYYY-MM-DD' text for easy grouping.
 * Booleans are stored as integer 0/1 (mode: 'boolean').
 */

// ── User ────────────────────────────────────────────────────────────────────
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().default('Athlete'),
  sex: text('sex', { enum: ['male', 'female'] }).notNull().default('male'),
  birthdate: text('birthdate'), // ISO date
  heightCm: real('height_cm'),
  activityLevel: text('activity_level', {
    enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'],
  })
    .notNull()
    .default('moderate'),
  goal: text('goal', {
    enum: ['lose_fat', 'maintain', 'build_muscle'],
  })
    .notNull()
    .default('maintain'),
  bodyType: text('body_type', {
    enum: ['ectomorph', 'mesomorph', 'endomorph'],
  }),
  rateOfChange: text('rate_of_change', {
    enum: ['slow', 'moderate', 'aggressive'],
  })
    .notNull()
    .default('moderate'),
  unitPreference: text('unit_preference', { enum: ['metric', 'imperial'] })
    .notNull()
    .default('metric'),
  onboardedAt: integer('onboarded_at'),
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

// ── WeighIn ──────────────────────────────────────────────────────────────────
export const weighIns = sqliteTable('weigh_ins', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  date: text('date').notNull(), // ISO date
  weightKg: real('weight_kg').notNull(),
  bodyFatPct: real('body_fat_pct'),
  waistCm: real('waist_cm'),
  hipCm: real('hip_cm'),
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

// ── Session ──────────────────────────────────────────────────────────────────
export const SESSION_TYPES = [
  'strength',
  'calisthenics',
  'cardio',
  'outdoor',
  'sport',
  'mindbody',
  'meditation',
  'custom',
] as const;
export type SessionType = (typeof SESSION_TYPES)[number];

export const sessions = sqliteTable('sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  sessionType: text('session_type', { enum: SESSION_TYPES }).notNull(),
  label: text('label'),
  startTime: integer('start_time').notNull(),
  endTime: integer('end_time'),
  durationS: integer('duration_s'),
  totalVolume: real('total_volume'), // strength (kg)
  distanceM: real('distance_m'), // outdoor
  pace: real('pace'), // s per km
  elevationM: real('elevation_m'),
  score: text('score'), // sport free-text score
  style: text('style'), // mind-body technique/style tag
  caloriesBurned: real('calories_burned'),
  moodBefore: integer('mood_before'), // 1..5 emoji scale
  moodAfter: integer('mood_after'),
  notes: text('notes'),
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

// ── ExerciseLog ──────────────────────────────────────────────────────────────
export const exerciseLogs = sqliteTable('exercise_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: integer('session_id').notNull(),
  exerciseId: integer('exercise_id').notNull(),
  orderIndex: integer('order_index').notNull().default(0),
  supersetGroup: integer('superset_group'), // null = not grouped
  notes: text('notes'),
});

// ── SetEntry ─────────────────────────────────────────────────────────────────
export const setEntries = sqliteTable('set_entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  exerciseLogId: integer('exercise_log_id').notNull(),
  setNumber: integer('set_number').notNull(),
  reps: integer('reps'),
  weightKg: real('weight_kg'),
  rpe: real('rpe'), // 1..10
  isPr: integer('is_pr', { mode: 'boolean' }).notNull().default(false),
  completed: integer('completed', { mode: 'boolean' }).notNull().default(true),
});

// ── Exercise (library) ───────────────────────────────────────────────────────
export const TRACKING_TYPES = [
  'reps_weight',
  'reps_only',
  'duration',
  'distance',
  'duration_distance',
  'custom',
] as const;
export type TrackingType = (typeof TRACKING_TYPES)[number];

export const exercises = sqliteTable('exercises', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  category: text('category').notNull(), // e.g. 'barbell', 'bodyweight', 'running'
  sessionType: text('session_type', { enum: SESSION_TYPES }).notNull(),
  muscleGroups: text('muscle_groups'), // JSON array of strings
  equipment: text('equipment'),
  description: text('description'),
  trackingType: text('tracking_type', { enum: TRACKING_TYPES })
    .notNull()
    .default('reps_weight'),
  iconKey: text('icon_key').notNull().default('strength.dumbbell'),
  isCustom: integer('is_custom', { mode: 'boolean' }).notNull().default(false),
  metValue: real('met_value'), // metabolic equivalent for calorie estimation
});

// ── WalkSession ──────────────────────────────────────────────────────────────
export const walkSessions = sqliteTable('walk_sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  mode: text('mode', { enum: ['walk', 'run'] }).notNull().default('walk'),
  startTime: integer('start_time').notNull(),
  endTime: integer('end_time'),
  steps: integer('steps').notNull().default(0),
  distanceM: real('distance_m').notNull().default(0),
  durationS: integer('duration_s').notNull().default(0),
  caloriesBurned: real('calories_burned').notNull().default(0),
  avgPace: real('avg_pace'), // s per km
  source: text('source', { enum: ['pedometer', 'accelerometer', 'gps'] })
    .notNull()
    .default('pedometer'),
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

// ── DailyStepLog ─────────────────────────────────────────────────────────────
export const dailyStepLogs = sqliteTable('daily_step_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  date: text('date').notNull(), // ISO date (unique per user/day)
  stepCount: integer('step_count').notNull().default(0),
  distanceM: real('distance_m').notNull().default(0),
  caloriesBurned: real('calories_burned').notNull().default(0),
});

// ── FoodEntry ────────────────────────────────────────────────────────────────
export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export const foodEntries = sqliteTable('food_entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  date: text('date').notNull(), // ISO date
  mealType: text('meal_type', { enum: MEAL_TYPES }).notNull(),
  logMode: text('log_mode', { enum: ['precise', 'honest'] })
    .notNull()
    .default('precise'),
  foodName: text('food_name'),
  freeTextDescription: text('free_text_description'),
  servingSize: text('serving_size'),
  quantity: real('quantity').notNull().default(1),
  calories: real('calories').notNull().default(0),
  proteinG: real('protein_g').notNull().default(0),
  carbsG: real('carbs_g').notNull().default(0),
  fatG: real('fat_g').notNull().default(0),
  fiberG: real('fiber_g').notNull().default(0),
  isEstimated: integer('is_estimated', { mode: 'boolean' })
    .notNull()
    .default(false),
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

// ── BeverageEntry ────────────────────────────────────────────────────────────
export const BEVERAGE_TYPES = [
  'water',
  'coffee',
  'tea',
  'energy_drink',
  'soda',
  'other',
] as const;
export type BeverageType = (typeof BEVERAGE_TYPES)[number];

export const beverageEntries = sqliteTable('beverage_entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  date: text('date').notNull(), // ISO date
  type: text('type', { enum: BEVERAGE_TYPES }).notNull(),
  volumeMl: real('volume_ml').notNull().default(0),
  caffeineMg: real('caffeine_mg').notNull().default(0),
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

// ── NutritionGoal ────────────────────────────────────────────────────────────
export const nutritionGoals = sqliteTable('nutrition_goals', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  calorieTarget: real('calorie_target').notNull(),
  proteinG: real('protein_g').notNull(),
  carbsG: real('carbs_g').notNull(),
  fatG: real('fat_g').notNull(),
  waterGoalMl: real('water_goal_ml').notNull().default(2500),
  caffeineSoftLimitMg: real('caffeine_soft_limit_mg').notNull().default(400),
  tdee: real('tdee'),
  lastRecalculatedDate: text('last_recalculated_date'),
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

// ── SmokingEntry (opt-in smoking tracker) ────────────────────────────────────
export const smokingEntries = sqliteTable('smoking_entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  date: text('date').notNull(), // ISO date
  quantity: integer('quantity').notNull().default(1), // cigarettes
  trigger: text('trigger'), // optional context tag (stress, coffee, social…)
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

// ── SmokingProfile (per-user tracker settings) ───────────────────────────────
export const smokingProfiles = sqliteTable('smoking_profiles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(false),
  mode: text('mode', { enum: ['tracking', 'quitting'] })
    .notNull()
    .default('quitting'),
  cigarettesPerPack: integer('cigarettes_per_pack').notNull().default(20),
  pricePerPack: real('price_per_pack').notNull().default(8),
  currency: text('currency').notNull().default('$'),
  nicotineMgPerCig: real('nicotine_mg_per_cig').notNull().default(1.1),
  baselinePerDay: integer('baseline_per_day').notNull().default(10),
  dailyTarget: integer('daily_target'), // for quitting mode (cap)
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

// ── CoachTip ─────────────────────────────────────────────────────────────────
export const COACH_CATEGORIES = [
  'training',
  'nutrition',
  'hydration',
  'caffeine',
  'recovery',
  'activity',
  'smoking',
] as const;
export type CoachCategory = (typeof COACH_CATEGORIES)[number];

export const coachTips = sqliteTable('coach_tips', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  date: text('date').notNull(),
  category: text('category', { enum: COACH_CATEGORIES }).notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  ruleKey: text('rule_key').notNull(), // dedupe key so a rule fires once per window
  dismissed: integer('dismissed', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

// ── Inferred types ───────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type WeighIn = typeof weighIns.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type ExerciseLog = typeof exerciseLogs.$inferSelect;
export type SetEntry = typeof setEntries.$inferSelect;
export type NewSetEntry = typeof setEntries.$inferInsert;
export type Exercise = typeof exercises.$inferSelect;
export type NewExercise = typeof exercises.$inferInsert;
export type WalkSession = typeof walkSessions.$inferSelect;
export type DailyStepLog = typeof dailyStepLogs.$inferSelect;
export type FoodEntry = typeof foodEntries.$inferSelect;
export type NewFoodEntry = typeof foodEntries.$inferInsert;
export type BeverageEntry = typeof beverageEntries.$inferSelect;
export type NutritionGoal = typeof nutritionGoals.$inferSelect;
export type CoachTip = typeof coachTips.$inferSelect;
export type SmokingEntry = typeof smokingEntries.$inferSelect;
export type SmokingProfile = typeof smokingProfiles.$inferSelect;
export type NewSmokingProfile = typeof smokingProfiles.$inferInsert;
