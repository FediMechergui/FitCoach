-- Legacy v42 schema captured before the v4 migration.
CREATE TABLE alcohol_entries (
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
CREATE TABLE app_kv (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE TABLE app_open_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE TABLE beverage_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  type TEXT NOT NULL,
  volume_ml REAL NOT NULL DEFAULT 0,
  caffeine_mg REAL NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE TABLE challenge_spins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  challenge_key TEXT NOT NULL,
  cost INTEGER NOT NULL DEFAULT 0,
  spun_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE TABLE coach_tips (
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
CREATE TABLE custom_foods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  serving TEXT NOT NULL,
  calories REAL NOT NULL DEFAULT 0,
  protein REAL NOT NULL DEFAULT 0,
  carbs REAL NOT NULL DEFAULT 0,
  fat REAL NOT NULL DEFAULT 0,
  fiber REAL NOT NULL DEFAULT 0,
  category TEXT,
  calories_estimated INTEGER NOT NULL DEFAULT 0,
  components_json TEXT,
  micros_json TEXT,
  form TEXT,
  source TEXT,
  barcode TEXT,
  image_uri TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE TABLE custom_routines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  exercise_ids TEXT NOT NULL DEFAULT '[]',
  updated_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE TABLE cycle_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 0,
  avg_cycle_length INTEGER NOT NULL DEFAULT 28,
  avg_period_length INTEGER NOT NULL DEFAULT 5,
  last_period_start TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE TABLE daily_challenges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  challenge_key TEXT NOT NULL,
  spun_at INTEGER NOT NULL,
  completed_at INTEGER,
  final_value REAL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE TABLE daily_step_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  step_count INTEGER NOT NULL DEFAULT 0,
  distance_m REAL NOT NULL DEFAULT 0,
  calories_burned REAL NOT NULL DEFAULT 0,
  UNIQUE(user_id, date)
);
CREATE TABLE exercise_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  exercise_id INTEGER NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  superset_group INTEGER,
  notes TEXT
);
CREATE TABLE exercises (
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
  met_value REAL,
  video_id TEXT
);
CREATE TABLE fasting_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE TABLE fasting_profiles (
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
CREATE TABLE food_entries (
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
  form TEXT,
  is_estimated INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE TABLE goal_history (
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
CREATE TABLE habit_entries (
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
CREATE TABLE habit_profiles (
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
CREATE TABLE health_conditions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  condition_key TEXT NOT NULL,
  label TEXT NOT NULL,
  category TEXT,
  notes TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE TABLE hormone_flags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  hormone_key TEXT NOT NULL,
  label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'monitoring',
  notes TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE TABLE live_walks (
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
  updated_at INTEGER,
  boot_step_baseline INTEGER,
  activity TEXT
);
CREATE TABLE meal_routines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  meal_type TEXT,
  items_json TEXT NOT NULL DEFAULT '[]',
  use_count INTEGER NOT NULL DEFAULT 0,
  last_used_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE TABLE nap_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  minutes REAL NOT NULL DEFAULT 0,
  start_time TEXT,
  quality INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE TABLE nutrition_goals (
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
CREATE TABLE path_enrolments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  path_key TEXT NOT NULL,
  stage_index INTEGER NOT NULL DEFAULT 0,
  enrolled_at INTEGER NOT NULL,
  stage_started_at INTEGER NOT NULL,
  completed_at INTEGER,
  paused_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE TABLE path_graduations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  path_key TEXT NOT NULL,
  stage_key TEXT NOT NULL,
  sessions INTEGER NOT NULL,
  graduated_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE TABLE period_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT,
  flow TEXT,
  symptoms TEXT,
  notes TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE TABLE place_visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  place_id INTEGER NOT NULL,
  session_id INTEGER,
  walk_id INTEGER,
  visited_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE TABLE places (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  governorate TEXT,
  city TEXT,
  address TEXT,
  notes TEXT,
  access TEXT,
  price_note TEXT,
  activities TEXT,
  rating INTEGER,
  is_home INTEGER NOT NULL DEFAULT 0,
  visibility TEXT NOT NULL DEFAULT 'private',
  remote_id TEXT,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE TABLE point_purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  item_key TEXT NOT NULL,
  cost INTEGER NOT NULL,
  purchased_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE TABLE prayer_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  prayer TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE TABLE prayer_settings (
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
CREATE TABLE profile_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  month TEXT NOT NULL,
  uri TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE TABLE rest_days (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE TABLE self_care_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  key TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE TABLE sessions (
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
  steps_added INTEGER,
  distance_added_m REAL,
  mood_before INTEGER,
  mood_after INTEGER,
  notes TEXT,
  warmups_done TEXT,
  place_id INTEGER,
  route_json TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE TABLE set_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exercise_log_id INTEGER NOT NULL,
  set_number INTEGER NOT NULL,
  reps INTEGER,
  weight_kg REAL,
  rpe REAL,
  duration_s INTEGER,
  distance_m REAL,
  is_pr INTEGER NOT NULL DEFAULT 0,
  completed INTEGER NOT NULL DEFAULT 1,
  to_failure INTEGER NOT NULL DEFAULT 0,
  gps_from INTEGER,
  gps_to INTEGER
);
CREATE TABLE sleep_logs (
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
CREATE TABLE smoking_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  product_key TEXT,
  trigger TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE TABLE smoking_profiles (
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
CREATE TABLE supplement_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  category TEXT NOT NULL,
  dose TEXT,
  units_taken REAL,
  food_entry_id INTEGER,
  micros TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE TABLE supplement_stack (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  key TEXT NOT NULL,
  dose TEXT,
  units_per_serving INTEGER,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE TABLE users (
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
  experience_level TEXT,
  training_focus TEXT,
  onboarded_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE TABLE walk_sessions (
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
  activity TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE TABLE weather_readings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  temp_c REAL NOT NULL,
  humidity_pct REAL,
  wind_kmh REAL,
  source TEXT NOT NULL,
  observed_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE TABLE weekly_quests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  week TEXT NOT NULL,
  quest_key TEXT NOT NULL,
  points INTEGER NOT NULL,
  completed_at INTEGER NOT NULL,
  final_value REAL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE TABLE weigh_ins (
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
CREATE TABLE work_logs (
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
CREATE INDEX idx_alcohol_entries_user_date ON alcohol_entries(user_id, date);
CREATE UNIQUE INDEX idx_app_open_logs_user_date ON app_open_logs(user_id, date);
CREATE INDEX idx_beverage_entries_user_date ON beverage_entries(user_id, date);
CREATE INDEX idx_challenge_spins_user_date ON challenge_spins(user_id, date);
CREATE INDEX idx_coach_tips_user ON coach_tips(user_id, dismissed);
CREATE INDEX idx_custom_foods_user ON custom_foods(user_id, name);
CREATE INDEX idx_custom_routines_user ON custom_routines(user_id);
CREATE INDEX idx_cycle_profiles_user ON cycle_profiles(user_id);
CREATE UNIQUE INDEX idx_daily_challenges_user_date ON daily_challenges(user_id, date);
CREATE INDEX idx_exercise_logs_session ON exercise_logs(session_id);
CREATE INDEX idx_exercises_muscle ON exercises(primary_muscle);
CREATE INDEX idx_exercises_type ON exercises(session_type);
CREATE UNIQUE INDEX idx_fasting_logs_user_date ON fasting_logs(user_id, date);
CREATE INDEX idx_food_entries_user_date ON food_entries(user_id, date);
CREATE INDEX idx_goal_history_user_date ON goal_history(user_id, date);
CREATE INDEX idx_habit_entries_user_key_date ON habit_entries(user_id, habit_key, date);
CREATE UNIQUE INDEX idx_habit_profiles_user_key ON habit_profiles(user_id, habit_key);
CREATE INDEX idx_health_conditions_user ON health_conditions(user_id, active);
CREATE INDEX idx_hormone_flags_user ON hormone_flags(user_id, active);
CREATE INDEX idx_meal_routines_user ON meal_routines(user_id, meal_type);
CREATE INDEX idx_nap_logs_user_date ON nap_logs(user_id, date);
CREATE INDEX idx_nutrition_goals_user ON nutrition_goals(user_id);
CREATE UNIQUE INDEX idx_path_enrolments_user_path ON path_enrolments(user_id, path_key);
CREATE UNIQUE INDEX idx_path_graduations_user_stage ON path_graduations(user_id, path_key, stage_key);
CREATE INDEX idx_period_logs_user ON period_logs(user_id, start_date);
CREATE INDEX idx_place_visits_user_place ON place_visits(user_id, place_id);
CREATE INDEX idx_places_user_kind ON places(user_id, kind);
CREATE UNIQUE INDEX idx_point_purchases_user_item ON point_purchases(user_id, item_key);
CREATE UNIQUE INDEX idx_prayer_logs_user_date_prayer ON prayer_logs(user_id, date, prayer);
CREATE UNIQUE INDEX idx_profile_photos_user_month ON profile_photos(user_id, month);
CREATE UNIQUE INDEX idx_rest_days_user_date ON rest_days(user_id, date);
CREATE UNIQUE INDEX idx_self_care_user_date_key ON self_care_logs(user_id, date, key);
CREATE INDEX idx_sessions_user_time ON sessions(user_id, start_time);
CREATE INDEX idx_set_entries_log ON set_entries(exercise_log_id);
CREATE UNIQUE INDEX idx_sleep_logs_user_date ON sleep_logs(user_id, date);
CREATE INDEX idx_smoking_entries_user_date ON smoking_entries(user_id, date);
CREATE INDEX idx_smoking_profiles_user ON smoking_profiles(user_id);
CREATE INDEX idx_supplement_logs_user_date ON supplement_logs(user_id, date);
CREATE UNIQUE INDEX idx_supplement_stack_user_key ON supplement_stack(user_id, key);
CREATE INDEX idx_walk_sessions_user ON walk_sessions(user_id, start_time);
CREATE INDEX idx_weather_readings_user_date ON weather_readings(user_id, date);
CREATE UNIQUE INDEX idx_weekly_quests_user_week_key ON weekly_quests(user_id, week, quest_key);
CREATE INDEX idx_weigh_ins_user_date ON weigh_ins(user_id, date);
CREATE UNIQUE INDEX idx_work_logs_user_date ON work_logs(user_id, date);
PRAGMA user_version = 42;
