CREATE TABLE `alcohol_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`date` text NOT NULL,
	`type` text NOT NULL,
	`label` text,
	`volume_ml` real NOT NULL,
	`abv_pct` real NOT NULL,
	`alcohol_grams` real NOT NULL,
	`standard_drinks` real NOT NULL,
	`calories` real NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `app_open_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`date` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `beverage_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`date` text NOT NULL,
	`type` text NOT NULL,
	`volume_ml` real DEFAULT 0 NOT NULL,
	`caffeine_mg` real DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `coach_tips` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`date` text NOT NULL,
	`category` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`rule_key` text NOT NULL,
	`dismissed` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `custom_routines` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`name` text NOT NULL,
	`exercise_ids` text DEFAULT '[]' NOT NULL,
	`updated_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `cycle_profiles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`enabled` integer DEFAULT false NOT NULL,
	`avg_cycle_length` integer DEFAULT 28 NOT NULL,
	`avg_period_length` integer DEFAULT 5 NOT NULL,
	`last_period_start` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `daily_step_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`date` text NOT NULL,
	`step_count` integer DEFAULT 0 NOT NULL,
	`distance_m` real DEFAULT 0 NOT NULL,
	`calories_burned` real DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `exercise_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer NOT NULL,
	`exercise_id` integer NOT NULL,
	`order_index` integer DEFAULT 0 NOT NULL,
	`superset_group` integer,
	`notes` text
);
--> statement-breakpoint
CREATE TABLE `exercises` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`session_type` text NOT NULL,
	`muscle_groups` text,
	`primary_muscle` text,
	`sub_muscle` text,
	`equipment_type` text,
	`equipment` text,
	`pattern` text,
	`description` text,
	`instructions` text,
	`tracking_type` text DEFAULT 'reps_weight' NOT NULL,
	`icon_key` text DEFAULT 'strength.dumbbell' NOT NULL,
	`is_custom` integer DEFAULT false NOT NULL,
	`met_value` real
);
--> statement-breakpoint
CREATE TABLE `fasting_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`date` text NOT NULL,
	`completed` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `fasting_profiles` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer DEFAULT 1 NOT NULL,
	`enabled` integer DEFAULT false NOT NULL,
	`mode` text DEFAULT 'ramadan' NOT NULL,
	`manual_suhoor` text DEFAULT '04:00',
	`manual_iftar` text DEFAULT '19:00',
	`eating_start` text DEFAULT '12:00',
	`eating_end` text DEFAULT '20:00',
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `food_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`date` text NOT NULL,
	`meal_type` text NOT NULL,
	`log_mode` text DEFAULT 'precise' NOT NULL,
	`food_name` text,
	`free_text_description` text,
	`serving_size` text,
	`quantity` real DEFAULT 1 NOT NULL,
	`calories` real DEFAULT 0 NOT NULL,
	`protein_g` real DEFAULT 0 NOT NULL,
	`carbs_g` real DEFAULT 0 NOT NULL,
	`fat_g` real DEFAULT 0 NOT NULL,
	`fiber_g` real DEFAULT 0 NOT NULL,
	`micros` text,
	`is_estimated` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `goal_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`date` text NOT NULL,
	`goal` text NOT NULL,
	`rate_of_change` text NOT NULL,
	`target_weight_kg` real,
	`calorie_target` real NOT NULL,
	`protein_g` real NOT NULL,
	`carbs_g` real NOT NULL,
	`fat_g` real NOT NULL,
	`tdee` real,
	`bmr` real,
	`basis` text,
	`at_weight_kg` real,
	`at_body_fat_pct` real,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `habit_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`habit_key` text NOT NULL,
	`date` text NOT NULL,
	`quantity` real DEFAULT 1 NOT NULL,
	`minutes` real DEFAULT 0 NOT NULL,
	`trigger` text,
	`late_night` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `habit_profiles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`habit_key` text NOT NULL,
	`label` text NOT NULL,
	`kind` text DEFAULT 'count' NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`daily_target` real,
	`baseline_per_day` real,
	`minutes_per_occurrence` real,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `health_conditions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`condition_key` text NOT NULL,
	`label` text NOT NULL,
	`category` text,
	`notes` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `hormone_flags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`hormone_key` text NOT NULL,
	`label` text NOT NULL,
	`status` text DEFAULT 'monitoring' NOT NULL,
	`notes` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `live_walks` (
	`id` integer PRIMARY KEY NOT NULL,
	`active` integer DEFAULT false NOT NULL,
	`user_id` integer DEFAULT 1 NOT NULL,
	`mode` text DEFAULT 'walk' NOT NULL,
	`source` text DEFAULT 'pedometer' NOT NULL,
	`start_time` integer,
	`steps` integer DEFAULT 0 NOT NULL,
	`distance_m` real DEFAULT 0 NOT NULL,
	`last_lat` real,
	`last_lng` real,
	`route_json` text,
	`updated_at` integer,
	`android_baseline_steps` integer,
	`android_current_cumulative` integer
);
--> statement-breakpoint
CREATE TABLE `nap_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`date` text NOT NULL,
	`minutes` real DEFAULT 0 NOT NULL,
	`start_time` text,
	`quality` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `nutrition_goals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`calorie_target` real NOT NULL,
	`protein_g` real NOT NULL,
	`carbs_g` real NOT NULL,
	`fat_g` real NOT NULL,
	`water_goal_ml` real DEFAULT 2500 NOT NULL,
	`caffeine_soft_limit_mg` real DEFAULT 400 NOT NULL,
	`tdee` real,
	`last_recalculated_date` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `period_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text,
	`flow` text,
	`symptoms` text,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `prayer_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`date` text NOT NULL,
	`prayer` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `prayer_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer DEFAULT 1 NOT NULL,
	`enabled` integer DEFAULT false NOT NULL,
	`latitude` real,
	`longitude` real,
	`location_name` text,
	`method` text DEFAULT 'tunisia' NOT NULL,
	`asr_factor` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `profile_photos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`month` text NOT NULL,
	`uri` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `self_care_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`date` text NOT NULL,
	`key` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`session_type` text NOT NULL,
	`label` text,
	`split_key` text,
	`split_day` text,
	`start_time` integer NOT NULL,
	`end_time` integer,
	`duration_s` integer,
	`total_volume` real,
	`distance_m` real,
	`pace` real,
	`elevation_m` real,
	`score` text,
	`style` text,
	`calories_burned` real,
	`mood_before` integer,
	`mood_after` integer,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `set_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`exercise_log_id` integer NOT NULL,
	`set_number` integer NOT NULL,
	`reps` integer,
	`weight_kg` real,
	`rpe` real,
	`duration_s` integer,
	`distance_m` real,
	`is_pr` integer DEFAULT false NOT NULL,
	`completed` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sleep_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`date` text NOT NULL,
	`hours` real NOT NULL,
	`quality` integer,
	`bedtime` text,
	`wake_time` text,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `smoking_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`date` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`trigger` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `smoking_profiles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`enabled` integer DEFAULT false NOT NULL,
	`mode` text DEFAULT 'quitting' NOT NULL,
	`cigarettes_per_pack` integer DEFAULT 20 NOT NULL,
	`price_per_pack` real DEFAULT 8 NOT NULL,
	`currency` text DEFAULT '$' NOT NULL,
	`nicotine_mg_per_cig` real DEFAULT 1.1 NOT NULL,
	`baseline_per_day` integer DEFAULT 10 NOT NULL,
	`daily_target` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `supplement_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`date` text NOT NULL,
	`key` text NOT NULL,
	`label` text NOT NULL,
	`category` text NOT NULL,
	`dose` text,
	`micros` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `supplement_stack` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`key` text NOT NULL,
	`dose` text,
	`enabled` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text DEFAULT 'Athlete' NOT NULL,
	`sex` text DEFAULT 'male' NOT NULL,
	`gender` text DEFAULT 'male' NOT NULL,
	`birthdate` text,
	`height_cm` real,
	`activity_level` text DEFAULT 'moderate' NOT NULL,
	`goal` text DEFAULT 'maintain' NOT NULL,
	`body_type` text,
	`rate_of_change` text DEFAULT 'moderate' NOT NULL,
	`unit_preference` text DEFAULT 'metric' NOT NULL,
	`onboarded_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `walk_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`mode` text DEFAULT 'walk' NOT NULL,
	`start_time` integer NOT NULL,
	`end_time` integer,
	`steps` integer DEFAULT 0 NOT NULL,
	`distance_m` real DEFAULT 0 NOT NULL,
	`duration_s` integer DEFAULT 0 NOT NULL,
	`calories_burned` real DEFAULT 0 NOT NULL,
	`avg_pace` real,
	`source` text DEFAULT 'pedometer' NOT NULL,
	`route_json` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `weigh_ins` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`date` text NOT NULL,
	`weight_kg` real NOT NULL,
	`body_fat_pct` real,
	`fat_mass_kg` real,
	`muscle_mass_kg` real,
	`body_water_pct` real,
	`bone_mass_kg` real,
	`skeletal_muscle_kg` real,
	`visceral_fat_rating` real,
	`protein_pct` real,
	`bmr_kcal` real,
	`trapped_water_kg` real,
	`waist_cm` real,
	`hip_cm` real,
	`neck_cm` real,
	`shoulder_cm` real,
	`chest_cm` real,
	`upper_abdomen_cm` real,
	`lower_abdomen_cm` real,
	`arm_upper_l_cm` real,
	`arm_upper_r_cm` real,
	`arm_lower_l_cm` real,
	`arm_lower_r_cm` real,
	`thigh_l_cm` real,
	`thigh_r_cm` real,
	`calf_l_cm` real,
	`calf_r_cm` real,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `work_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`date` text NOT NULL,
	`start_time` text,
	`end_time` text,
	`minutes` real DEFAULT 0 NOT NULL,
	`break_minutes` real DEFAULT 0 NOT NULL,
	`quality` integer,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
