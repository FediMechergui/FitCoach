import { sqlite } from '@/db/client';
import { atomic } from '@/db/atomic';
import { getWalkSession, addSteps, removeSteps } from './activityRepo';
import { finiteNumber } from '@/lib/validation';
import { toISODate } from '@/lib/date';
export interface WalkAnnotation {walk_id:number;route_name:string|null;saved:number;original_json:string|null;correction_json:string|null;reason:string|null;updated_at:number}
export function walkAnnotation(id:number) {return sqlite.getFirstSync<WalkAnnotation>('SELECT * FROM walk_annotations WHERE walk_id=?',id);}
export function saveRouteName(id:number,name:string,saved:boolean) {
  if(!getWalkSession(id))throw new Error('Walk not found.');
  if(saved&&!name.trim())throw new Error('Name this route to compare repeated trips.');
  sqlite.runSync('INSERT INTO walk_annotations(walk_id,route_name,saved,updated_at) VALUES(?,?,?,?) ON CONFLICT(walk_id) DO UPDATE SET route_name=excluded.route_name,saved=excluded.saved,updated_at=excluded.updated_at',id,name.trim().slice(0,120),saved?1:0,Date.now());
}
export function routeComparisons(name:string) {
  return sqlite.getAllSync<{id:number;start_time:number;distance_m:number;duration_s:number;mode:string}>('SELECT w.id,w.start_time,w.distance_m,w.duration_s,w.mode FROM walk_sessions w JOIN walk_annotations a ON a.walk_id=w.id WHERE a.saved=1 AND a.route_name=? ORDER BY w.start_time DESC',name);
}
export function correctWalk(id:number,values:{steps:number;distanceM:number;durationS:number;caloriesBurned:number},reason:string) {
  if(!reason.trim())throw new Error('Add a reason so the correction stays understandable.');
  finiteNumber(values.steps,'Steps',0,200000);if(!Number.isInteger(values.steps))throw new Error('Steps must be a whole number.');
  finiteNumber(values.distanceM,'Distance',0,1000000);finiteNumber(values.durationS,'Time',1,604800);finiteNumber(values.caloriesBurned,'Calories',0,100000);
  atomic(()=>{
    const old=getWalkSession(id);if(!old)throw new Error('Walk not found.');
    const annotation=walkAnnotation(id);const original=annotation?.original_json??JSON.stringify(old);
    sqlite.runSync('INSERT INTO walk_annotations(walk_id,original_json,correction_json,reason,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(walk_id) DO UPDATE SET original_json=excluded.original_json,correction_json=excluded.correction_json,reason=excluded.reason,updated_at=excluded.updated_at',id,original,JSON.stringify(values),reason.trim().slice(0,2000),Date.now());
    sqlite.runSync('UPDATE walk_sessions SET steps=?,distance_m=?,duration_s=?,calories_burned=?,avg_pace=? WHERE id=?',values.steps,values.distanceM,values.durationS,values.caloriesBurned,values.distanceM>0?values.durationS/(values.distanceM/1000):null,id);
    const day=toISODate(new Date(old.startTime));
    removeSteps(old.steps,old.distanceM,old.caloriesBurned,day,old.userId);addSteps(values.steps,values.distanceM,values.caloriesBurned,day,old.userId);
  });
}
export function restoreOriginalWalk(id:number) {
  const annotation=walkAnnotation(id);if(!annotation?.original_json)return;
  const original=JSON.parse(annotation.original_json);
  atomic(()=>{correctWalk(id,{steps:original.steps,distanceM:original.distanceM,durationS:original.durationS,caloriesBurned:original.caloriesBurned},'Restored original recorded totals');sqlite.runSync('UPDATE walk_annotations SET correction_json=NULL WHERE walk_id=?',id);});
}
