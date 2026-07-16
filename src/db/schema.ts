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
export const GENDERS = ['male', 'female', 'non_binary', 'other', 'prefer_not_to_say'] as const;
export type Gender = (typeof GENDERS)[number];

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().default('Athlete'),
  // Biological sex — used only for metabolic (BMR) formulas.
  sex: text('sex', { enum: ['male', 'female'] }).notNull().default('male'),
  // Gender identity — user-chosen, independent of `sex`.
  gender: text('gender', { enum: GENDERS }).notNull().default('male'),
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
  // Detailed body composition (all optional; entered if the user knows them).
  fatMassKg: real('fat_mass_kg'),
  muscleMassKg: real('muscle_mass_kg'),
  bodyWaterPct: real('body_water_pct'), // total body water / retained water
  boneMassKg: real('bone_mass_kg'),
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
  /** e.g. 'push' | 'pull' | 'legs' | 'upper' | 'chest' — from the chosen split */
  splitKey: text('split_key'),
  splitDay: text('split_day'),
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

/** Equipment families used to split the library (spec: Part 2). */
export const EQUIPMENT_TYPES = ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'other'] as const;
export type EquipmentType = (typeof EQUIPMENT_TYPES)[number];

/** Movement patterns — drive the beginner illustration for each exercise. */
export const MOVEMENT_PATTERNS = [
  'horizontal_push', 'vertical_push', 'horizontal_pull', 'vertical_pull',
  'squat', 'hinge', 'lunge', 'curl', 'triceps_extension', 'lateral_raise',
  'calf_raise', 'core', 'carry', 'rotation', 'cardio', 'mobility',
] as const;
export type MovementPattern = (typeof MOVEMENT_PATTERNS)[number];

export const exercises = sqliteTable('exercises', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  /** stable natural key — lets the library be upserted without changing ids */
  slug: text('slug'),
  name: text('name').notNull(),
  category: text('category').notNull(), // e.g. 'barbell', 'bodyweight', 'running'
  sessionType: text('session_type', { enum: SESSION_TYPES }).notNull(),
  muscleGroups: text('muscle_groups'), // JSON array of strings
  primaryMuscle: text('primary_muscle'), // chest / back / quads / …
  /** finer target: lats / traps / mid_back / lower_back / front_delt / … */
  subMuscle: text('sub_muscle'),
  equipmentType: text('equipment_type', { enum: EQUIPMENT_TYPES }),
  equipment: text('equipment'),
  pattern: text('pattern', { enum: MOVEMENT_PATTERNS }),
  description: text('description'),
  instructions: text('instructions'), // JSON array of step strings
  trackingType: text('tracking_type', { enum: TRACKING_TYPES })
    .notNull()
    .default('reps_weight'),
  iconKey: text('icon_key').notNull().default('strength.dumbbell'),
  isCustom: integer('is_custom', { mode: 'boolean' }).notNull().default(false),
  metValue: real('met_value'), // metabolic equivalent for calorie estimation
});

// ── CustomRoutine (saved, updatable workout templates) ───────────────────────
export const customRoutines = sqliteTable('custom_routines', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  name: text('name').notNull(),
  /** JSON array of exercise ids, in performance order */
  exerciseIds: text('exercise_ids').notNull().default('[]'),
  updatedAt: integer('updated_at'),
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
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

// ── LiveWalk (in-progress walk/run, shared with the background service) ───────
// Single row (id = 1). The foreground-service location task writes distance in
// the background; the pedometer writes steps; the UI polls this row so tracking
// survives the screen turning off or the app being backgrounded.
export const liveWalks = sqliteTable('live_walks', {
  id: integer('id').primaryKey(),
  active: integer('active', { mode: 'boolean' }).notNull().default(false),
  userId: integer('user_id').notNull().default(1),
  mode: text('mode', { enum: ['walk', 'run'] }).notNull().default('walk'),
  source: text('source', { enum: ['pedometer', 'accelerometer', 'gps'] })
    .notNull()
    .default('pedometer'),
  startTime: integer('start_time'),
  steps: integer('steps').notNull().default(0),
  distanceM: real('distance_m').notNull().default(0),
  lastLat: real('last_lat'),
  lastLng: real('last_lng'),
  updatedAt: integer('updated_at'),
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

// ── SleepLog ─────────────────────────────────────────────────────────────────
export const sleepLogs = sqliteTable('sleep_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  date: text('date').notNull(), // the morning/wake ISO date the sleep belongs to
  hours: real('hours').notNull(),
  quality: integer('quality'), // 1..5 subjective
  bedtime: text('bedtime'), // optional 'HH:MM'
  wakeTime: text('wake_time'),
  notes: text('notes'),
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

// ── AlcoholEntry ─────────────────────────────────────────────────────────────
export const ALCOHOL_TYPES = ['beer', 'wine', 'spirit', 'cocktail', 'other'] as const;
export type AlcoholType = (typeof ALCOHOL_TYPES)[number];

export const alcoholEntries = sqliteTable('alcohol_entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  date: text('date').notNull(),
  type: text('type', { enum: ALCOHOL_TYPES }).notNull(),
  label: text('label'),
  volumeMl: real('volume_ml').notNull(),
  abvPct: real('abv_pct').notNull(),
  alcoholGrams: real('alcohol_grams').notNull(),
  standardDrinks: real('standard_drinks').notNull(),
  calories: real('calories').notNull(),
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

// ── Menstrual cycle ──────────────────────────────────────────────────────────
export const cycleProfiles = sqliteTable('cycle_profiles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(false),
  avgCycleLength: integer('avg_cycle_length').notNull().default(28),
  avgPeriodLength: integer('avg_period_length').notNull().default(5),
  lastPeriodStart: text('last_period_start'), // ISO date
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const periodLogs = sqliteTable('period_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  startDate: text('start_date').notNull(), // ISO
  endDate: text('end_date'), // ISO (null while ongoing)
  flow: text('flow', { enum: ['light', 'medium', 'heavy'] }),
  symptoms: text('symptoms'), // JSON array of strings
  notes: text('notes'),
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

// ── HealthCondition (chronic disease catalogue) ──────────────────────────────
export const healthConditions = sqliteTable('health_conditions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  conditionKey: text('condition_key').notNull(), // catalogue key
  label: text('label').notNull(),
  category: text('category'), // metabolic / cardiovascular / respiratory / …
  notes: text('notes'),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

// ── Habits (generalized "habit I want to change" tracker) ────────────────────
/** count = occurrences (e.g. times); duration = minutes spent. */
export const HABIT_KINDS = ['count', 'duration'] as const;
export type HabitKind = (typeof HABIT_KINDS)[number];

export const habitProfiles = sqliteTable('habit_profiles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  habitKey: text('habit_key').notNull(), // catalogue key or 'custom:<slug>'
  label: text('label').notNull(),
  kind: text('kind', { enum: HABIT_KINDS }).notNull().default('count'),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  /** goal: reduce toward this per-day cap (count) or minutes/day (duration) */
  dailyTarget: real('daily_target'),
  /** typical baseline before tracking, for savings math */
  baselinePerDay: real('baseline_per_day'),
  /** minutes an average occurrence costs (count-kind habits) */
  minutesPerOccurrence: real('minutes_per_occurrence'),
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const habitEntries = sqliteTable('habit_entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  habitKey: text('habit_key').notNull(),
  date: text('date').notNull(),
  /** occurrences (count habits) */
  quantity: real('quantity').notNull().default(1),
  /** minutes (duration habits) */
  minutes: real('minutes').notNull().default(0),
  /** optional context: late_night, stress, boredom… */
  trigger: text('trigger'),
  /** was it after 23:00 — used for sleep-displacement impact */
  lateNight: integer('late_night', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

// ── WorkLog (daily work hours, logged as a time range) ───────────────────────
export const workLogs = sqliteTable('work_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  date: text('date').notNull(),
  startTime: text('start_time'), // 'HH:MM'
  endTime: text('end_time'), // 'HH:MM'
  minutes: real('minutes').notNull().default(0), // total worked minutes
  breakMinutes: real('break_minutes').notNull().default(0),
  /** subjective focus/quality 1..5 */
  quality: integer('quality'),
  notes: text('notes'),
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

// ── PrayerSettings (single row, id = 1) ──────────────────────────────────────
export const prayerSettings = sqliteTable('prayer_settings', {
  id: integer('id').primaryKey(),
  userId: integer('user_id').notNull().default(1),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(false),
  latitude: real('latitude'),
  longitude: real('longitude'),
  locationName: text('location_name'),
  method: text('method').notNull().default('tunisia'),
  asrFactor: integer('asr_factor').notNull().default(1), // 1 standard, 2 hanafi
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

// ── FastingProfile (single row, id = 1) ──────────────────────────────────────
export const fastingProfiles = sqliteTable('fasting_profiles', {
  id: integer('id').primaryKey(),
  userId: integer('user_id').notNull().default(1),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(false),
  mode: text('mode', { enum: ['ramadan', 'intermittent'] }).notNull().default('ramadan'),
  /** manual fallbacks when prayer times aren't configured */
  manualSuhoor: text('manual_suhoor').default('04:00'),
  manualIftar: text('manual_iftar').default('19:00'),
  /** intermittent eating window */
  eatingStart: text('eating_start').default('12:00'),
  eatingEnd: text('eating_end').default('20:00'),
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const fastingLogs = sqliteTable('fasting_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  date: text('date').notNull(),
  completed: integer('completed', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

// ── AppOpenLog (daily app-usage / check-in streak) ───────────────────────────
export const appOpenLogs = sqliteTable('app_open_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  date: text('date').notNull(), // ISO day the app was opened (one row per day)
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

// ── ProfilePhoto (monthly athlete-card photo) ────────────────────────────────
export const profilePhotos = sqliteTable('profile_photos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  month: text('month').notNull(), // 'YYYY-MM'
  uri: text('uri').notNull(),
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
  'sleep',
  'alcohol',
  'cycle',
  'health',
  'habits',
  'work',
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
export type LiveWalk = typeof liveWalks.$inferSelect;
export type CustomRoutine = typeof customRoutines.$inferSelect;
export type DailyStepLog = typeof dailyStepLogs.$inferSelect;
export type FoodEntry = typeof foodEntries.$inferSelect;
export type NewFoodEntry = typeof foodEntries.$inferInsert;
export type BeverageEntry = typeof beverageEntries.$inferSelect;
export type NutritionGoal = typeof nutritionGoals.$inferSelect;
export type CoachTip = typeof coachTips.$inferSelect;
export type SmokingEntry = typeof smokingEntries.$inferSelect;
export type SmokingProfile = typeof smokingProfiles.$inferSelect;
export type NewSmokingProfile = typeof smokingProfiles.$inferInsert;
export type SleepLog = typeof sleepLogs.$inferSelect;
export type AlcoholEntry = typeof alcoholEntries.$inferSelect;
export type CycleProfile = typeof cycleProfiles.$inferSelect;
export type PeriodLog = typeof periodLogs.$inferSelect;
export type HealthCondition = typeof healthConditions.$inferSelect;
export type ProfilePhoto = typeof profilePhotos.$inferSelect;
export type AppOpenLog = typeof appOpenLogs.$inferSelect;
export type HabitProfile = typeof habitProfiles.$inferSelect;
export type HabitEntry = typeof habitEntries.$inferSelect;
export type WorkLog = typeof workLogs.$inferSelect;
export type PrayerSettings = typeof prayerSettings.$inferSelect;
export type FastingProfile = typeof fastingProfiles.$inferSelect;
export type FastingLog = typeof fastingLogs.$inferSelect;
