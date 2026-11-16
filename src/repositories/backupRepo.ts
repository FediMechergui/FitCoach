import { sqlite } from '@/db/client';
import { SCHEMA_VERSION } from '@/db/bootstrap';
import { atomic } from '@/db/atomic';

/** Explicit allowlist. Runtime state, credentials, cached weather and transient tasks never leave the device. */
export const BACKUP_TABLES = [
  'users', 'exercises', 'weigh_ins', 'goal_history', 'sessions', 'exercise_logs', 'set_entries',
  'custom_routines', 'walk_sessions', 'daily_step_logs', 'food_entries', 'supplement_stack', 'supplement_logs',
  'beverage_entries', 'nutrition_goals', 'smoking_entries', 'smoking_profiles', 'sleep_logs', 'nap_logs',
  'hormone_flags', 'alcohol_entries', 'cycle_profiles', 'period_logs', 'health_conditions', 'habit_profiles',
  'habit_entries', 'work_logs', 'prayer_settings', 'fasting_profiles', 'fasting_logs', 'self_care_logs',
  'prayer_logs', 'app_open_logs', 'profile_photos', 'custom_foods', 'daily_challenges', 'meal_routines',
  'rest_days', 'challenge_spins', 'point_purchases', 'weekly_quests', 'path_enrolments', 'path_graduations',
  'places', 'place_visits',
] as const;
type Row = Record<string, string | number | null>;
export interface BackupSnapshot { format: 1; schema: number; createdAt: number; tables: Record<string, Row[]>;
  preferences: Row[]; media: Record<string, string> }
// Explicit known preference namespaces. No token, key, tracking checkpoint or backup settings.
const safePreference = (key: string) => /^(theme\.preference|outdoor\.settings|openrouter\.model|alcohol\.freeDays\.\d+|diet\.exclusions)$/.test(key);
export function captureSnapshot(): BackupSnapshot {
  return atomic(() => ({ format: 1, schema: SCHEMA_VERSION, createdAt: Date.now(),
    tables: Object.fromEntries(BACKUP_TABLES.map(table => [table, sqlite.getAllSync<Row>(`SELECT * FROM "${table}"`)])),
    preferences: sqlite.getAllSync<Row>('SELECT * FROM app_kv').filter(row => safePreference(String(row.key))), media: {} }));
}
export function validateSnapshot(value: unknown): BackupSnapshot {
  const s = value as BackupSnapshot;
  if (!s || s.format !== 1 || !Number.isInteger(s.schema) || s.schema > SCHEMA_VERSION || s.schema < 43
    || !Number.isFinite(s.createdAt) || !s.tables || typeof s.tables !== 'object' || !s.media || typeof s.media !== 'object'
    || !Array.isArray(s.preferences)) throw new Error('This backup is unsupported. Update FitCoach before restoring it.');
  for (const table of Object.keys(s.tables)) if (!(BACKUP_TABLES as readonly string[]).includes(table)) throw new Error('Backup contains an unsupported table.');
  for (const table of BACKUP_TABLES) {
    if (!Array.isArray(s.tables[table]) || s.tables[table].length > 500_000) throw new Error(`Invalid backup table: ${table}`);
    const columns = new Set(sqlite.getAllSync<{name: string}>(`PRAGMA table_info("${table}")`).map(c => c.name));
    for (const row of s.tables[table]) {
      if (!row || typeof row !== 'object' || Array.isArray(row)) throw new Error('Invalid backup record.');
      for (const [key, val] of Object.entries(row)) if (!columns.has(key) || !(val === null || typeof val === 'string' || (typeof val === 'number' && Number.isFinite(val)))) throw new Error('Invalid backup column or value.');
    }
  }
  if (s.tables.users.length !== 1 || s.tables.users[0].id !== 1) throw new Error('Backup must contain one local profile.');
  for (const rows of Object.values(s.tables)) for (const row of rows) {
    if ('user_id' in row && row.user_id !== 1) throw new Error('Backup contains another local profile.');
  }
  const links = [
    ['exercise_logs','session_id','sessions'], ['exercise_logs','exercise_id','exercises'],
    ['set_entries','exercise_log_id','exercise_logs'], ['supplement_logs','food_entry_id','food_entries'],
    ['alcohol_entries','food_entry_id','food_entries'], ['place_visits','place_id','places'],
  ];
  // Older databases were created without SQL FK constraints; validate these links explicitly too.
  for (const [table,column,parent] of links) {
    const ids = new Set(s.tables[parent].map(row => row.id));
    for (const row of s.tables[table]) if (row[column] != null && !ids.has(row[column])) throw new Error(`Broken backup relationship: ${table}.${column}`);
  }
  for (const row of s.preferences) if (!safePreference(String(row.key)) || typeof row.value !== 'string' || typeof row.updated_at !== 'number') throw new Error('Backup contains an unsafe preference.');
  return s;
}
/** Caller stages media first and keeps a safety snapshot before applying. All records commit together. */
export function restoreSnapshot(value: unknown): void {
  const s = validateSnapshot(value);
  if (sqlite.getFirstSync('SELECT id FROM live_walks WHERE active = 1')) throw new Error('Finish the active walk before restoring.');
  if (sqlite.getFirstSync('SELECT id FROM sessions WHERE end_time IS NULL AND archived_at IS NULL')) throw new Error('Finish your current workout before restoring.');
  atomic(() => {
    sqlite.execSync('PRAGMA defer_foreign_keys = ON');
    for (const table of [...BACKUP_TABLES].reverse()) sqlite.execSync(`DELETE FROM "${table}"`);
    for (const table of BACKUP_TABLES) for (const row of s.tables[table]) {
      const columns = Object.keys(row);
      if (columns.length) sqlite.runSync(`INSERT INTO "${table}" (${columns.map(c => `"${c}"`).join(',')}) VALUES (${columns.map(() => '?').join(',')})`, ...Object.values(row));
    }
    for (const row of sqlite.getAllSync<{key: string}>('SELECT key FROM app_kv')) {
      if (safePreference(row.key) || /^(tracking\.|outdoor\.(laps|session)|steps\.totals\.)/.test(row.key)) sqlite.runSync('DELETE FROM app_kv WHERE key = ?', row.key);
    }
    for (const row of s.preferences) sqlite.runSync('INSERT OR REPLACE INTO app_kv(key,value,updated_at) VALUES(?,?,?)', row.key, row.value, row.updated_at);
    sqlite.execSync('DELETE FROM live_walks');
    sqlite.execSync('DELETE FROM coach_tips; DELETE FROM weather_readings');
    sqlite.execSync('UPDATE sessions SET archived_at = start_time WHERE end_time IS NULL');
    const failures = sqlite.getAllSync('PRAGMA foreign_key_check');
    if (failures.length) throw new Error('Backup relationships are damaged. Your current data has been preserved.');
  });
}
