import { sqlite } from '@/db/client';
import { atomic } from '@/db/atomic';
export interface GymEquipment {
  id: number; name: string; kind: string; brand: string | null; model: string | null;
  location: string | null; unit: 'kg' | 'lb'; settings: string | null;
  exercise_ids: string; ocr_text: string | null; created_at: number; updated_at: number;
}
export interface ExercisePreference { exercise_id: number; favorite: number; aliases: string; notes: string }
export function equipmentList(): GymEquipment[] { return sqlite.getAllSync<GymEquipment>('SELECT * FROM gym_equipment ORDER BY location, name'); }
export function exercisePreferences(): ExercisePreference[] { return sqlite.getAllSync<ExercisePreference>('SELECT * FROM exercise_preferences'); }
export function saveExercisePreference(id: number, patch: Partial<Omit<ExercisePreference, 'exercise_id'>>): void {
  const old = sqlite.getFirstSync<ExercisePreference>('SELECT * FROM exercise_preferences WHERE exercise_id = ?', id);
  sqlite.runSync('INSERT OR REPLACE INTO exercise_preferences(exercise_id,favorite,aliases,notes) VALUES(?,?,?,?)', id,
    patch.favorite ?? old?.favorite ?? 0, (patch.aliases ?? old?.aliases ?? '').slice(0, 500), (patch.notes ?? old?.notes ?? '').slice(0, 3000));
}
export function recentExerciseIds(): number[] {
  return sqlite.getAllSync<{exercise_id: number}>('SELECT l.exercise_id FROM exercise_logs l JOIN sessions s ON s.id=l.session_id JOIN set_entries e ON e.exercise_log_id=l.id WHERE e.completed=1 GROUP BY l.exercise_id ORDER BY MAX(s.start_time) DESC LIMIT 30').map(r => r.exercise_id);
}
export function saveEquipment(input: Omit<GymEquipment, 'id'|'created_at'|'updated_at'>, id?: number): number {
  if (!input.name.trim()) throw new Error('Name this piece of equipment.');
  if (!['kg','lb'].includes(input.unit)) throw new Error('Confirm kg or lb.');
  const ids: unknown = JSON.parse(input.exercise_ids);
  if (!Array.isArray(ids) || ids.some(i => !Number.isInteger(i) || !sqlite.getFirstSync('SELECT id FROM exercises WHERE id = ?', i))) throw new Error('Choose valid exercises.');
  const values = [input.name.trim().slice(0, 120), input.kind.slice(0, 60), input.brand?.slice(0, 80) ?? null,
    input.model?.slice(0, 80) ?? null, input.location?.slice(0, 120) ?? null, input.unit,
    input.settings?.slice(0, 3000) ?? null, JSON.stringify([...new Set(ids)]), input.ocr_text?.slice(0, 12000) ?? null, Date.now()];
  if (id != null) {
    sqlite.runSync('UPDATE gym_equipment SET name=?,kind=?,brand=?,model=?,location=?,unit=?,settings=?,exercise_ids=?,ocr_text=?,updated_at=? WHERE id=?', ...values, id);
    return id;
  }
  return Number(sqlite.runSync('INSERT INTO gym_equipment(name,kind,brand,model,location,unit,settings,exercise_ids,ocr_text,updated_at,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)', ...values, Date.now()).lastInsertRowId);
}
export function deleteEquipment(id: number): void {
  if (sqlite.getFirstSync('SELECT id FROM exercise_logs WHERE equipment_id = ?', id)) throw new Error('This machine has training history. Rename it or update its notes to preserve comparable records.');
  sqlite.runSync('DELETE FROM gym_equipment WHERE id = ?', id);
}
export function assignEquipment(logId: number, equipmentId: number | null): void {
  if (equipmentId != null && !sqlite.getFirstSync('SELECT id FROM gym_equipment WHERE id = ?', equipmentId)) throw new Error('Equipment no longer exists.');
  if (sqlite.getFirstSync('SELECT id FROM set_entries WHERE exercise_log_id = ? AND completed = 1', logId)) throw new Error('Choose the machine before logging sets. Start another exercise entry if you change machines.');
  sqlite.runSync('UPDATE exercise_logs SET equipment_id=? WHERE id=?', equipmentId, logId);
}
export function skipExercise(logId: number, skipped: boolean): void {
  atomic(() => {
    if (skipped && sqlite.getFirstSync('SELECT id FROM set_entries WHERE exercise_log_id=? AND completed=1', logId)) throw new Error('An exercise with completed sets cannot be marked skipped.');
    sqlite.runSync('UPDATE exercise_logs SET skipped=? WHERE id=?', skipped ? 1 : 0, logId);
  });
}
export function setCircuitGroup(logId:number,group:number|null):void {
  if(group!=null&&(!Number.isInteger(group)||group<1||group>20))throw new Error('Circuit number must be 1–20, or empty.');
  sqlite.runSync('UPDATE exercise_logs SET superset_group=? WHERE id=?',group,logId);
}
