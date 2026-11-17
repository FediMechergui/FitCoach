export interface TrainingDraftEntry { name:string; sets:number; reps:number|null; weightKg:number|null; durationS:number|null; restSeconds:number }
export interface TrainingDraft { title:string; explanation:string; exercises:TrainingDraftEntry[]; references:string[]; sessionIds:number[] }
export function parseTrainingDraft(raw: unknown): TrainingDraft {
  const value=raw as Partial<TrainingDraft>;
  if(!value || typeof value.title!=='string' || !Array.isArray(value.exercises) || value.exercises.length>30)throw new Error('AI returned an invalid training draft.');
  const number=(n:unknown,min:number,max:number,integer=false):number|null=>{
    if(n==null)return null;
    if(typeof n!=='number'||!Number.isFinite(n)||n<min||n>max||(integer&&!Number.isInteger(n)))throw new Error('AI returned an out-of-range training value.');
    return n;
  };
  const exercises=value.exercises.map(e=>{
    if(!e||typeof e.name!=='string'||!e.name.trim())throw new Error('AI returned an unnamed exercise.');
    const sets=number(e.sets,1,20,true);if(!sets)throw new Error('AI returned an invalid set count.');
    return{name:e.name.slice(0,120),sets,reps:number(e.reps,1,1000,true),weightKg:number(e.weightKg,0,1000),durationS:number(e.durationS,1,86400,true),restSeconds:number(e.restSeconds,0,900,true)??90};
  });
  return {title:value.title.slice(0,120),explanation:typeof value.explanation==='string'?value.explanation.slice(0,5000):'',exercises,
    references:Array.isArray(value.references)?value.references.filter((s):s is string=>typeof s==='string').slice(0,10):[],
    sessionIds:Array.isArray(value.sessionIds)?value.sessionIds.filter((n):n is number=>Number.isInteger(n)&&n>0).slice(0,30):[]};
}
