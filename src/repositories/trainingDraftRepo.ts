import { atomic } from '@/db/atomic';
import { sqlite } from '@/db/client';
import { findRoutineByName, saveRoutine } from './routinesRepo';
import { getExercise } from './exerciseRepo';
import { parseTrainingDraft, type TrainingDraftEntry } from '@/lib/trainingDraft';
export function saveTrainingDraft(title:string,entries:Array<TrainingDraftEntry & {exerciseId:number}>) {
  const draft=parseTrainingDraft({title,exercises:entries});
  if(!title.trim()||!entries.length)throw new Error('Name the routine and choose at least one exercise.');
  if(findRoutineByName(title))throw new Error('A routine already has that name. Use a new name to preserve it.');
  for(const entry of entries)if(!getExercise(entry.exerciseId))throw new Error('Match every exercise to the library.');
  if(new Set(entries.map(e=>e.exerciseId)).size!==entries.length)throw new Error('Combine repeated exercises into one entry before saving.');
  return atomic(()=>{
    const routine=saveRoutine(title,entries.map(e=>e.exerciseId));
    const prescription=entries.map((entry,index)=>({exerciseId:entry.exerciseId,restSeconds:draft.exercises[index].restSeconds,sets:Array.from({length:entry.sets},()=>({reps:entry.reps,weightKg:entry.weightKg,durationS:entry.durationS,completed:false}))}));
    sqlite.runSync('UPDATE custom_routines SET prescription=?,session_type=? WHERE id=?',JSON.stringify(prescription),getExercise(entries[0].exerciseId)!.sessionType,routine.id);
    return routine.id;
  });
}
