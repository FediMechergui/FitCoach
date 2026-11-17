export function platePlan(target: number, bar: number, plates: number[]) {
  if (![target,bar,...plates].every(Number.isFinite) || target < bar || bar < 0 || target>5000 || plates.length>50 || plates.some(p=>p<0.01||p>1000||Math.abs(p*100-Math.round(p*100))>0.00001)) throw new Error('Use a target from the bar weight to 5000, and plate sizes from 0.01 to 1000 with at most two decimals.');
  const sizes=[...new Set(plates.map(p=>Math.round(p*100)))].sort((a,b)=>b-a);
  const gcd=(a:number,b:number):number=>b?gcd(b,a%b):a;
  const unit=sizes.reduce(gcd,0)||1;
  const goal=Math.floor((target-bar)*50/unit+1e-8);
  const count=new Int32Array(goal+1).fill(1_000_000);count[0]=0;
  const chosen=new Int32Array(goal+1).fill(-1);
  for(let amount=1;amount<=goal;amount++)for(let index=0;index<sizes.length;index++){
    const size=sizes[index]/unit;
    if(size<=amount&&count[amount-size]+1<count[amount]){count[amount]=count[amount-size]+1;chosen[amount]=index;}
  }
  let reached=goal;while(reached>0&&chosen[reached]<0)reached--;
  const quantities=new Map<number,number>();
  for(let remaining=reached;remaining>0;){const size=sizes[chosen[remaining]];quantities.set(size,(quantities.get(size)??0)+1);remaining-=size/unit;}
  const pairs: Array<{ plate:number; count:number }> = [];
  for(const size of sizes)if(quantities.has(size))pairs.push({plate:size/100,count:quantities.get(size)!});
  const loaded=Math.round((bar+reached*unit/50)*100)/100;
  return { pairs, loaded, shortBy:Math.max(0,Math.round((target-loaded)*100)/100) };
}
export interface IntervalState { work:number; rest:number; rounds:number; startedAt:number; pausedAt:number|null; pausedMs:number }
export function validIntervalState(value:unknown):value is IntervalState {
  const s=value as IntervalState|null;
  return !!s && [s.work,s.rest,s.rounds,s.startedAt,s.pausedMs].every(Number.isFinite) && s.work>0 && s.rest>=0 && Number.isInteger(s.rounds) && s.rounds>=1 && s.rounds<=100 && s.startedAt>0 && s.pausedMs>=0 && (s.pausedAt===null||(Number.isFinite(s.pausedAt)&&s.pausedAt>=s.startedAt));
}
export function intervalPosition(state: IntervalState, now: number) {
  const elapsed = Math.max(0, ((state.pausedAt ?? now)-state.startedAt-state.pausedMs)/1000);
  const cycle = state.work+state.rest;
  const total = state.rounds*state.work+Math.max(0,state.rounds-1)*state.rest;
  if (elapsed>=total) return { finished:true,round:state.rounds,phase:'done',remaining:0,elapsed };
  const round = Math.floor(elapsed/cycle)+1;
  const offset = elapsed%cycle;
  const working = offset < state.work;
  return { finished:false,round,phase:working?'work':'rest',remaining:Math.ceil((working?state.work:cycle)-offset),elapsed };
}
