import { sqlite } from '@/db/client';
import { fromISODate, addDays, todayISO } from '@/lib/date';
import { getRoutine } from './routinesRepo';
export interface CalendarEntry { id:number; date:string; title:string; routine_id:number|null; status:'planned'|'skipped'|'active'|'completed'; session_id:number|null; notes:string }
export function plannedSessions(): CalendarEntry[] {
  return sqlite.getAllSync<CalendarEntry>(`SELECT c.id,c.date,c.title,c.routine_id,c.session_id,c.notes,
    CASE WHEN s.end_time IS NOT NULL THEN 'completed' WHEN s.id IS NOT NULL AND s.archived_at IS NULL THEN 'active' ELSE c.status END AS status
    FROM training_calendar c LEFT JOIN sessions s ON s.id=c.session_id ORDER BY c.date,c.id`);
}
export function savePlannedSession(date:string,title:string,routineId:number|null,id?:number) {
  fromISODate(date);
  if(!title.trim())throw new Error('Name the planned session.');
  if(routineId!=null && !getRoutine(routineId))throw new Error('Routine no longer exists.');
  if(id!=null)sqlite.runSync('UPDATE training_calendar SET date=?,title=?,routine_id=? WHERE id=? AND session_id IS NULL',date,title.trim().slice(0,120),routineId,id);
  else sqlite.runSync('INSERT INTO training_calendar(date,title,routine_id) VALUES(?,?,?)',date,title.trim().slice(0,120),routineId);
}
export function skipPlanned(id:number) { sqlite.runSync("UPDATE training_calendar SET status=CASE WHEN status='skipped' THEN 'planned' ELSE 'skipped' END WHERE id=? AND session_id IS NULL",id); }
export function linkPlanned(id:number,sessionId:number) { sqlite.runSync('UPDATE training_calendar SET session_id=? WHERE id=?',sessionId,id); }
export function deletePlanned(id:number) { sqlite.runSync('DELETE FROM training_calendar WHERE id=?',id); }
export interface ReviewWorkout { id:number; date:string; label:string; sets:number; volume:number; duration:number }
export function weeklyReview(offset=0) {
  const end=addDays(todayISO(),1-offset*7);const start=addDays(end,-7);
  const rows=sqlite.getAllSync<{id:number;start_time:number;label:string|null;session_type:string;duration_s:number|null}>('SELECT id,start_time,label,session_type,duration_s FROM sessions WHERE end_time IS NOT NULL AND start_time >= ? AND start_time < ? ORDER BY start_time',fromISODate(start).getTime(),fromISODate(end).getTime());
  const workouts:ReviewWorkout[]=rows.map(s=>{
    const totals=sqlite.getFirstSync<{sets:number;volume:number}>('SELECT COUNT(*) AS sets,COALESCE(SUM(COALESCE(e.reps,0)*COALESCE(e.weight_kg,0)),0) AS volume FROM set_entries e JOIN exercise_logs l ON e.exercise_log_id=l.id WHERE l.session_id=? AND e.completed=1',s.id)!;
    return{id:s.id,date:new Date(s.start_time).toLocaleDateString(),label:s.label??s.session_type,sets:totals.sets,volume:totals.volume,duration:s.duration_s??0};
  });
  return{start,end,workouts,sets:workouts.reduce((n,s)=>n+s.sets,0),volume:workouts.reduce((n,s)=>n+s.volume,0),duration:workouts.reduce((n,s)=>n+s.duration,0)};
}
