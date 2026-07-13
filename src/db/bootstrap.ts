import { sqlite } from './client';
import { seedExerciseLibrary } from './seed';

/**
 * Schema bootstrap. Runs idempotent `CREATE TABLE IF NOT EXISTS` DDL matching
 * src/db/schema.ts. We keep the runtime schema in sync here rather than shipping
 * drizzle-kit migration bundles, which keeps the managed Expo build simple and
 * avoids the Metro .sql transformer. `PRAGMA user_version` guards re-seeding.
 */
const SCHEMA_VERSION = 1;

const DDL = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL DEFAULT 'Athlete',
  sex TEXT NOT NULL DEFAULT 'male',
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
  waist_cm REAL,
  hip_cm REAL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX IF NOT EXISTS idx_weigh_ins_user_date ON weigh_ins(user_id, date);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  session_type TEXT NOT NULL,
  label TEXT,
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
  is_pr INTEGER NOT NULL DEFAULT 0,
  completed INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_set_entries_log ON set_entries(exercise_log_id);

CREATE TABLE IF NOT EXISTS exercises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  session_type TEXT NOT NULL,
  muscle_groups TEXT,
  equipment TEXT,
  description TEXT,
  tracking_type TEXT NOT NULL DEFAULT 'reps_weight',
  icon_key TEXT NOT NULL DEFAULT 'strength.dumbbell',
  is_custom INTEGER NOT NULL DEFAULT 0,
  met_value REAL
);
CREATE INDEX IF NOT EXISTS idx_exercises_type ON exercises(session_type);

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
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX IF NOT EXISTS idx_walk_sessions_user ON walk_sessions(user_id, start_time);

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
  is_estimated INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX IF NOT EXISTS idx_food_entries_user_date ON food_entries(user_id, date);

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

  sqlite.execSync('PRAGMA journal_mode = WAL;');
  sqlite.execSync('PRAGMA foreign_keys = ON;');
  sqlite.execSync(DDL);

  const row = sqlite.getFirstSync<{ user_version: number }>(
    'PRAGMA user_version;'
  );
  const currentVersion = row?.user_version ?? 0;

  if (currentVersion < SCHEMA_VERSION) {
    // First install (or upgrade) — seed the built-in exercise library.
    seedExerciseLibrary();
    sqlite.execSync(`PRAGMA user_version = ${SCHEMA_VERSION};`);
  }

  initialized = true;
}
