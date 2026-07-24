import { sqlite } from './client';
import { seedExerciseLibrary } from './seed';

/**
 * Schema bootstrap. Runs idempotent `CREATE TABLE IF NOT EXISTS` DDL matching
 * src/db/schema.ts. We keep the runtime schema in sync here rather than shipping
 * drizzle-kit migration bundles, which keeps the managed Expo build simple and
 * avoids the Metro .sql transformer. `PRAGMA user_version` guards re-seeding.
 */
/**
 * Bump this whenever the schema changes **or** `EXERCISE_LIBRARY` gains entries.
 * The seed is version-gated, so without a bump new exercises reach fresh
 * installs only and existing users silently never see them. Re-seeding is
 * always safe: `seedExerciseLibrary()` upserts by slug and never deletes, so
 * logged sets keep pointing at the same exercise ids.
 *
 *   8 → 9  v2.8: +111 exercises (cardio machines, martial-arts drills,
 *                calisthenics skill holds, sports, outdoor, mind-body).
 *                Also lands v2.7's 27 exercises, which were added without a
 *                bump and so had only ever reached fresh installs.
 *   9 → 10 v2.9: +124 exercises (sport, outdoor, mind-body, meditation)
 *   10 → 11 v2.11: +27 tactical & heritage exercises (Special Programmes)
 */
const SCHEMA_VERSION = 11;

/**
 * Columns added after v1. `ALTER TABLE ADD COLUMN` is applied only if the column
 * is missing, so this is safe on both fresh installs (already present via the
 * CREATE above) and upgrades from an earlier dev database.
 */
const ADDED_COLUMNS: Array<{ table: string; column: string; ddl: string }> = [
  // v2
  { table: 'users', column: 'gender', ddl: "TEXT NOT NULL DEFAULT 'male'" },
  { table: 'weigh_ins', column: 'fat_mass_kg', ddl: 'REAL' },
  { table: 'weigh_ins', column: 'muscle_mass_kg', ddl: 'REAL' },
  { table: 'weigh_ins', column: 'body_water_pct', ddl: 'REAL' },
  { table: 'weigh_ins', column: 'bone_mass_kg', ddl: 'REAL' },
  // v3 — richer exercise library + training splits
  { table: 'exercises', column: 'slug', ddl: 'TEXT' },
  { table: 'exercises', column: 'primary_muscle', ddl: 'TEXT' },
  { table: 'exercises', column: 'equipment_type', ddl: 'TEXT' },
  { table: 'exercises', column: 'pattern', ddl: 'TEXT' },
  { table: 'exercises', column: 'instructions', ddl: 'TEXT' },
  { table: 'sessions', column: 'split_key', ddl: 'TEXT' },
  { table: 'sessions', column: 'split_day', ddl: 'TEXT' },
  // v4 — per-muscle targeting
  { table: 'exercises', column: 'sub_muscle', ddl: 'TEXT' },
  // v5 — micronutrients
  { table: 'food_entries', column: 'micros', ddl: 'TEXT' },
  // v6 — activity logging, GPS routes, naps & hormones
  { table: 'set_entries', column: 'duration_s', ddl: 'INTEGER' },
  { table: 'set_entries', column: 'distance_m', ddl: 'REAL' },
  { table: 'walk_sessions', column: 'route_json', ddl: 'TEXT' },
  { table: 'live_walks', column: 'route_json', ddl: 'TEXT' },
  // v8 — body composition inputs + circumference measurements
  { table: 'weigh_ins', column: 'skeletal_muscle_kg', ddl: 'REAL' },
  { table: 'weigh_ins', column: 'visceral_fat_rating', ddl: 'REAL' },
  { table: 'weigh_ins', column: 'protein_pct', ddl: 'REAL' },
  { table: 'weigh_ins', column: 'bmr_kcal', ddl: 'REAL' },
  { table: 'weigh_ins', column: 'trapped_water_kg', ddl: 'REAL' },
  { table: 'weigh_ins', column: 'neck_cm', ddl: 'REAL' },
  { table: 'weigh_ins', column: 'shoulder_cm', ddl: 'REAL' },
  { table: 'weigh_ins', column: 'chest_cm', ddl: 'REAL' },
  { table: 'weigh_ins', column: 'upper_abdomen_cm', ddl: 'REAL' },
  { table: 'weigh_ins', column: 'lower_abdomen_cm', ddl: 'REAL' },
  { table: 'weigh_ins', column: 'arm_upper_l_cm', ddl: 'REAL' },
  { table: 'weigh_ins', column: 'arm_upper_r_cm', ddl: 'REAL' },
  { table: 'weigh_ins', column: 'arm_lower_l_cm', ddl: 'REAL' },
  { table: 'weigh_ins', column: 'arm_lower_r_cm', ddl: 'REAL' },
  { table: 'weigh_ins', column: 'thigh_l_cm', ddl: 'REAL' },
  { table: 'weigh_ins', column: 'thigh_r_cm', ddl: 'REAL' },
  { table: 'weigh_ins', column: 'calf_l_cm', ddl: 'REAL' },
  { table: 'weigh_ins', column: 'calf_r_cm', ddl: 'REAL' },
];

function ensureColumns(): void {
  for (const { table, column, ddl } of ADDED_COLUMNS) {
    try {
      const cols = sqlite.getAllSync<{ name: string }>(`PRAGMA table_info(${table});`);
      if (!cols.some((c) => c.name === column)) {
        sqlite.execSync(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl};`);
      }
    } catch (e) {
      console.warn(`[db] add column ${table}.${column} failed:`, e);
    }
  }
}

const DDL = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL DEFAULT 'Athlete',
  sex TEXT NOT NULL DEFAULT 'male',
  gender TEXT NOT NULL DEFAULT 'male',
  birthdate TEXT,
  height_cm REAL,
  activity_level TEXT NOT NULL DEFAULT 'moderate',
  goal TEXT NOT NULL DEFAULT 'maintain',
  body_type TEXT,
  rate_of_change TEXT NOT NULL DEFAULT 'moderate',
  unit_preference TEXT NOT NULL DEFAULT 'metric',
  onboarded_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS weigh_ins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  weight_kg REAL NOT NULL,
  body_fat_pct REAL,
  fat_mass_kg REAL,
  muscle_mass_kg REAL,
  body_water_pct REAL,
  bone_mass_kg REAL,
  skeletal_muscle_kg REAL,
  visceral_fat_rating REAL,
  protein_pct REAL,
  bmr_kcal REAL,
  trapped_water_kg REAL,
  waist_cm REAL,
  hip_cm REAL,
  neck_cm REAL,
  shoulder_cm REAL,
  chest_cm REAL,
  upper_abdomen_cm REAL,
  lower_abdomen_cm REAL,
  arm_upper_l_cm REAL,
  arm_upper_r_cm REAL,
  arm_lower_l_cm REAL,
  arm_lower_r_cm REAL,
  thigh_l_cm REAL,
  thigh_r_cm REAL,
  calf_l_cm REAL,
  calf_r_cm REAL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX IF NOT EXISTS idx_weigh_ins_user_date ON weigh_ins(user_id, date);

CREATE TABLE IF NOT EXISTS goal_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  goal TEXT NOT NULL,
  rate_of_change TEXT NOT NULL,
  target_weight_kg REAL,
  calorie_target REAL NOT NULL,
  protein_g REAL NOT NULL,
  carbs_g REAL NOT NULL,
  fat_g REAL NOT NULL,
  tdee REAL,
  bmr REAL,
  basis TEXT,
  at_weight_kg REAL,
  at_body_fat_pct REAL,
  notes TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX IF NOT EXISTS idx_goal_history_user_date ON goal_history(user_id, date);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  session_type TEXT NOT NULL,
  label TEXT,
  split_key TEXT,
  split_day TEXT,
  start_time INTEGER NOT NULL,
  end_time INTEGER,
  duration_s INTEGER,
  total_volume REAL,
  distance_m REAL,
  pace REAL,
  elevation_m REAL,
  score TEXT,
  style TEXT,
  calories_burned REAL,
  mood_before INTEGER,
  mood_after INTEGER,
  notes TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_time ON sessions(user_id, start_time);

CREATE TABLE IF NOT EXISTS exercise_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  exercise_id INTEGER NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  superset_group INTEGER,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_session ON exercise_logs(session_id);

CREATE TABLE IF NOT EXISTS set_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exercise_log_id INTEGER NOT NULL,
  set_number INTEGER NOT NULL,
  reps INTEGER,
  weight_kg REAL,
  rpe REAL,
  duration_s INTEGER,
  distance_m REAL,
  is_pr INTEGER NOT NULL DEFAULT 0,
  completed INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_set_entries_log ON set_entries(exercise_log_id);

CREATE TABLE IF NOT EXISTS exercises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  session_type TEXT NOT NULL,
  muscle_groups TEXT,
  primary_muscle TEXT,
  sub_muscle TEXT,
  equipment_type TEXT,
  equipment TEXT,
  pattern TEXT,
  description TEXT,
  instructions TEXT,
  tracking_type TEXT NOT NULL DEFAULT 'reps_weight',
  icon_key TEXT NOT NULL DEFAULT 'strength.dumbbell',
  is_custom INTEGER NOT NULL DEFAULT 0,
  met_value REAL
);
CREATE INDEX IF NOT EXISTS idx_exercises_type ON exercises(session_type);
CREATE INDEX IF NOT EXISTS idx_exercises_muscle ON exercises(primary_muscle);

CREATE TABLE IF NOT EXISTS custom_routines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  exercise_ids TEXT NOT NULL DEFAULT '[]',
  updated_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX IF NOT EXISTS idx_custom_routines_user ON custom_routines(user_id);

CREATE TABLE IF NOT EXISTS walk_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  mode TEXT NOT NULL DEFAULT 'walk',
  start_time INTEGER NOT NULL,
  end_time INTEGER,
  steps INTEGER NOT NULL DEFAULT 0,
  distance_m REAL NOT NULL DEFAULT 0,
  duration_s INTEGER NOT NULL DEFAULT 0,
  calories_burned REAL NOT NULL DEFAULT 0,
  avg_pace REAL,
  source TEXT NOT NULL DEFAULT 'pedometer',
  route_json TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX IF NOT EXISTS idx_walk_sessions_user ON walk_sessions(user_id, start_time);

CREATE TABLE IF NOT EXISTS live_walks (
  id INTEGER PRIMARY KEY,
  active INTEGER NOT NULL DEFAULT 0,
  user_id INTEGER NOT NULL DEFAULT 1,
  mode TEXT NOT NULL DEFAULT 'walk',
  source TEXT NOT NULL DEFAULT 'pedometer',
  start_time INTEGER,
  steps INTEGER NOT NULL DEFAULT 0,
  distance_m REAL NOT NULL DEFAULT 0,
  last_lat REAL,
  last_lng REAL,
  route_json TEXT,
  updated_at INTEGER
);

CREATE TABLE IF NOT EXISTS daily_step_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  step_count INTEGER NOT NULL DEFAULT 0,
  distance_m REAL NOT NULL DEFAULT 0,
  calories_burned REAL NOT NULL DEFAULT 0,
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS food_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  meal_type TEXT NOT NULL,
  log_mode TEXT NOT NULL DEFAULT 'precise',
  food_name TEXT,
  free_text_description TEXT,
  serving_size TEXT,
  quantity REAL NOT NULL DEFAULT 1,
  calories REAL NOT NULL DEFAULT 0,
  protein_g REAL NOT NULL DEFAULT 0,
  carbs_g REAL NOT NULL DEFAULT 0,
  fat_g REAL NOT NULL DEFAULT 0,
  fiber_g REAL NOT NULL DEFAULT 0,
  micros TEXT,
  is_estimated INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX IF NOT EXISTS idx_food_entries_user_date ON food_entries(user_id, date);

CREATE TABLE IF NOT EXISTS supplement_stack (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  key TEXT NOT NULL,
  dose TEXT,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_supplement_stack_user_key ON supplement_stack(user_id, key);

CREATE TABLE IF NOT EXISTS supplement_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  category TEXT NOT NULL,
  dose TEXT,
  micros TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX IF NOT EXISTS idx_supplement_logs_user_date ON supplement_logs(user_id, date);

CREATE TABLE IF NOT EXISTS beverage_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  type TEXT NOT NULL,
  volume_ml REAL NOT NULL DEFAULT 0,
  caffeine_mg REAL NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX IF NOT EXISTS idx_beverage_entries_user_date ON beverage_entries(user_id, date);

CREATE TABLE IF NOT EXISTS nutrition_goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  calorie_target REAL NOT NULL,
  protein_g REAL NOT NULL,
  carbs_g REAL NOT NULL,
  fat_g REAL NOT NULL,
  water_goal_ml REAL NOT NULL DEFAULT 2500,
  caffeine_soft_limit_mg REAL NOT NULL DEFAULT 400,
  tdee REAL,
  last_recalculated_date TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX IF NOT EXISTS idx_nutrition_goals_user ON nutrition_goals(user_id);

CREATE TABLE IF NOT EXISTS smoking_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  trigger TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX IF NOT EXISTS idx_smoking_entries_user_date ON smoking_entries(user_id, date);

CREATE TABLE IF NOT EXISTS smoking_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 0,
  mode TEXT NOT NULL DEFAULT 'quitting',
  cigarettes_per_pack INTEGER NOT NULL DEFAULT 20,
  price_per_pack REAL NOT NULL DEFAULT 8,
  currency TEXT NOT NULL DEFAULT '$',
  nicotine_mg_per_cig REAL NOT NULL DEFAULT 1.1,
  baseline_per_day INTEGER NOT NULL DEFAULT 10,
  daily_target INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX IF NOT EXISTS idx_smoking_profiles_user ON smoking_profiles(user_id);

CREATE TABLE IF NOT EXISTS sleep_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  hours REAL NOT NULL,
  quality INTEGER,
  bedtime TEXT,
  wake_time TEXT,
  notes TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sleep_logs_user_date ON sleep_logs(user_id, date);

CREATE TABLE IF NOT EXISTS nap_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  minutes REAL NOT NULL DEFAULT 0,
  start_time TEXT,
  quality INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX IF NOT EXISTS idx_nap_logs_user_date ON nap_logs(user_id, date);

CREATE TABLE IF NOT EXISTS hormone_flags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  hormone_key TEXT NOT NULL,
  label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'monitoring',
  notes TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX IF NOT EXISTS idx_hormone_flags_user ON hormone_flags(user_id, active);

CREATE TABLE IF NOT EXISTS alcohol_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  type TEXT NOT NULL,
  label TEXT,
  volume_ml REAL NOT NULL,
  abv_pct REAL NOT NULL,
  alcohol_grams REAL NOT NULL,
  standard_drinks REAL NOT NULL,
  calories REAL NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX IF NOT EXISTS idx_alcohol_entries_user_date ON alcohol_entries(user_id, date);

CREATE TABLE IF NOT EXISTS cycle_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 0,
  avg_cycle_length INTEGER NOT NULL DEFAULT 28,
  avg_period_length INTEGER NOT NULL DEFAULT 5,
  last_period_start TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX IF NOT EXISTS idx_cycle_profiles_user ON cycle_profiles(user_id);

CREATE TABLE IF NOT EXISTS period_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT,
  flow TEXT,
  symptoms TEXT,
  notes TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX IF NOT EXISTS idx_period_logs_user ON period_logs(user_id, start_date);

CREATE TABLE IF NOT EXISTS health_conditions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  condition_key TEXT NOT NULL,
  label TEXT NOT NULL,
  category TEXT,
  notes TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX IF NOT EXISTS idx_health_conditions_user ON health_conditions(user_id, active);

CREATE TABLE IF NOT EXISTS habit_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  habit_key TEXT NOT NULL,
  label TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'count',
  enabled INTEGER NOT NULL DEFAULT 1,
  daily_target REAL,
  baseline_per_day REAL,
  minutes_per_occurrence REAL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_habit_profiles_user_key ON habit_profiles(user_id, habit_key);

CREATE TABLE IF NOT EXISTS habit_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  habit_key TEXT NOT NULL,
  date TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 1,
  minutes REAL NOT NULL DEFAULT 0,
  trigger TEXT,
  late_night INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX IF NOT EXISTS idx_habit_entries_user_key_date ON habit_entries(user_id, habit_key, date);

CREATE TABLE IF NOT EXISTS work_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  start_time TEXT,
  end_time TEXT,
  minutes REAL NOT NULL DEFAULT 0,
  break_minutes REAL NOT NULL DEFAULT 0,
  quality INTEGER,
  notes TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_work_logs_user_date ON work_logs(user_id, date);

CREATE TABLE IF NOT EXISTS prayer_settings (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL DEFAULT 1,
  enabled INTEGER NOT NULL DEFAULT 0,
  latitude REAL,
  longitude REAL,
  location_name TEXT,
  method TEXT NOT NULL DEFAULT 'tunisia',
  asr_factor INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS fasting_profiles (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL DEFAULT 1,
  enabled INTEGER NOT NULL DEFAULT 0,
  mode TEXT NOT NULL DEFAULT 'ramadan',
  manual_suhoor TEXT DEFAULT '04:00',
  manual_iftar TEXT DEFAULT '19:00',
  eating_start TEXT DEFAULT '12:00',
  eating_end TEXT DEFAULT '20:00',
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS fasting_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_fasting_logs_user_date ON fasting_logs(user_id, date);

CREATE TABLE IF NOT EXISTS self_care_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  key TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_self_care_user_date_key ON self_care_logs(user_id, date, key);

CREATE TABLE IF NOT EXISTS prayer_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  prayer TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_prayer_logs_user_date_prayer ON prayer_logs(user_id, date, prayer);

CREATE TABLE IF NOT EXISTS app_open_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_app_open_logs_user_date ON app_open_logs(user_id, date);

CREATE TABLE IF NOT EXISTS profile_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  month TEXT NOT NULL,
  uri TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_profile_photos_user_month ON profile_photos(user_id, month);

CREATE TABLE IF NOT EXISTS coach_tips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  rule_key TEXT NOT NULL,
  dismissed INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX IF NOT EXISTS idx_coach_tips_user ON coach_tips(user_id, dismissed);
`;

let initialized = false;

/**
 * Create tables and seed the exercise library on first run.
 * Safe to call multiple times; guarded by an in-memory flag + user_version.
 */
export function initDatabase(): void {
  if (initialized) return;

  try {
    sqlite.execSync('PRAGMA journal_mode = WAL;');
    sqlite.execSync('PRAGMA foreign_keys = ON;');
  } catch {
    // pragmas are best-effort
  }

  // Run each CREATE statement independently so a single failure can't abort the
  // rest of the schema (which would leave the app unusable / white-screening).
  for (const stmt of DDL.split(';')) {
    const sql = stmt.trim();
    if (!sql) continue;
    try {
      sqlite.execSync(sql + ';');
    } catch (e) {
      console.warn('[db] statement failed:', sql.slice(0, 60), e);
    }
  }

  ensureColumns();

  let currentVersion = 0;
  try {
    currentVersion = sqlite.getFirstSync<{ user_version: number }>('PRAGMA user_version;')?.user_version ?? 0;
  } catch {
    currentVersion = 0;
  }

  if (currentVersion < SCHEMA_VERSION) {
    // First install (or upgrade) — seed the built-in exercise library. Isolated
    // so a seed hiccup never prevents the app from opening.
    try {
      seedExerciseLibrary();
      sqlite.execSync(`PRAGMA user_version = ${SCHEMA_VERSION};`);
    } catch (e) {
      console.warn('[db] seed failed (will retry next launch):', e);
    }
  }

  initialized = true;
}
