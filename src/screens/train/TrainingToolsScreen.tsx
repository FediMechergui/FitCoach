import React, { useEffect, useRef, useState } from 'react';
import { Alert, AppState, Vibration, View } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Row } from '@/components/ui/misc';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { platePlan, intervalPosition, validIntervalState, type IntervalState } from '@/lib/trainingTools';
import { clockDuration, parseDuration } from '@/lib/duration';
import { kvGet, kvSetStrict } from '@/repositories/kvRepo';
export function TrainingToolsScreen() {
  const [unit,setUnit] = useState('kg');
  const [bar,setBar] = useState('20'); const [target,setTarget] = useState('60'); const [plates,setPlates] = useState('20,10,5,2.5,1.25');
  const [work,setWork] = useState('45s'); const [rest,setRest] = useState('15s'); const [rounds,setRounds] = useState('8');
  const [timer,setTimer] = useState<IntervalState|null>(()=>{const saved=kvGet('tools.interval');return validIntervalState(saved)?saved:null;});
  const [now,setNow] = useState(Date.now());
  const [tempo,setTempo] = useState('3,1,1,0'); const [tempoRunning,setTempoRunning] = useState(false); const [beat,setBeat] = useState('');
  const lastPhase = useRef('');
  useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),250);return()=>clearInterval(t);},[]);
  const saveTimer = (next: IntervalState|null) => { kvSetStrict('tools.interval',next);setTimer(next); };
  const position = timer ? intervalPosition(timer,now) : null;
  const phaseKey=position?`${position.round}:${position.phase}`:'';
  useEffect(()=>{if(phaseKey && lastPhase.current && phaseKey!==lastPhase.current && AppState.currentState==='active')Vibration.vibrate([0,120,100,120]);lastPhase.current=phaseKey;},[phaseKey]);
  useEffect(()=>{
    if(!tempoRunning)return;
    const phases=tempo.split(',').map(Number);
    if(phases.length!==4 || phases.some(p=>!Number.isInteger(p)||p<0||p>30) || !phases.some(p=>p>0)){setTempoRunning(false);Alert.alert('Tempo','Enter four whole seconds, e.g. 3,1,1,0.');return;}
    const labels=['Lower','Bottom pause','Lift','Top pause']; const sequence=phases.flatMap((seconds,index)=>Array.from({length:seconds},(_,i)=>`${labels[index]} · ${i+1}/${seconds}`));
    let index=0;
    const pulse=()=>{if(AppState.currentState!=='active'){setTempoRunning(false);return;}setBeat(sequence[index++%sequence.length]);Vibration.vibrate(45);};
    pulse();const t=setInterval(pulse,1000);return()=>{clearInterval(t);Vibration.cancel();};
  },[tempoRunning,tempo]);
  let plan: ReturnType<typeof platePlan>|null=null;let plateError='';
  try { plan=platePlan(Number(target),Number(bar),plates.split(',').map(Number)); }catch(e){plateError=(e as Error).message;}
  return <Screen><Text variant="h2">Training tools</Text>
    <Card style={{gap:10}}><Text variant="h3">Plate calculator</Text><SegmentedControl options={[{value:'kg',label:'kg'},{value:'lb',label:'lb'}]} value={unit} onChange={setUnit}/><Text variant="caption">All numbers below use {unit}. Changing the unit relabels your inputs; enter the correct bar and plates.</Text>
      <Row><View style={{flex:1}}><Input label="Target total" value={target} onChangeText={setTarget} keyboardType="numeric"/></View><View style={{flex:1}}><Input label="Bar weight" value={bar} onChangeText={setBar} keyboardType="numeric"/></View></Row><Input label="Available plate sizes (comma separated)" value={plates} onChangeText={setPlates}/>
      {plan ? <><Text variant="bodyStrong">Each side: {plan.pairs.map(p=>`${p.count} × ${p.plate} ${unit}`).join(' + ') || 'empty bar'}</Text><Text>Loaded total: {plan.loaded} {unit}{plan.shortBy>0?` · ${plan.shortBy} ${unit} below target`:''}</Text><Text variant="caption" color="textMuted">Assumes enough pairs of each listed size. Check plate availability and load both sides equally.</Text></>:<Text color="warning">{plateError}</Text>}
      <Text variant="bodyStrong">Warm-up load guide</Text><Text>{[40,60,80].map(p=>`${p}%: ${(Number(target)*p/100).toFixed(1)} ${unit}`).join(' · ')}</Text><Text variant="caption" color="textMuted">Optional load steps based on your target, not a required prescription. Round to available plates and adjust for comfort and experience.</Text>
    </Card>
    <Card style={{gap:10}}><Text variant="h3">Interval timer</Text><Row><View style={{flex:1}}><Input label="Work" value={work} onChangeText={setWork}/></View><View style={{flex:1}}><Input label="Rest" value={rest} onChangeText={setRest}/></View><View style={{flex:1}}><Input label="Rounds" value={rounds} onChangeText={setRounds} keyboardType="numeric"/></View></Row>
      <Text variant="caption" color="textMuted">Use 45s, 1:30 or 1.5m. Clock position survives leaving the app. Vibration cues need this screen open; background alarms are not promised.</Text>
      {position && <Text variant="h2">{position.finished?'Finished':`${position.phase} · ${position.round}/${timer!.rounds} · ${clockDuration(position.remaining)}`}{timer?.pausedAt?' · paused':''}</Text>}
      <Button title={timer?'Restart intervals':'Start intervals'} onPress={()=>{try{const w=parseDuration(work),r=parseDuration(rest);const n=Number(rounds);if(!w||!r||!Number.isInteger(n)||n<1||n>100)throw new Error('Use positive work/rest and 1–100 rounds.');saveTimer({work:w,rest:r,rounds:n,startedAt:Date.now(),pausedAt:null,pausedMs:0});}catch(e){Alert.alert('Intervals',(e as Error).message);}}}/>
      {timer && !position?.finished && <Button title={timer.pausedAt?'Resume':'Pause'} variant="secondary" onPress={()=>saveTimer(timer.pausedAt?{...timer,pausedMs:timer.pausedMs+Date.now()-timer.pausedAt,pausedAt:null}:{...timer,pausedAt:Date.now()})}/>}
      {timer && <Button title="Clear interval timer" variant="ghost" onPress={()=>saveTimer(null)}/>}
    </Card>
    <Card style={{gap:10}}><Text variant="h3">Tempo metronome</Text><Input label="Lower, bottom pause, lift, top pause (seconds)" value={tempo} onChangeText={setTempo}/><Text variant="caption" color="textMuted">One vibration per second while this screen is open. This cues a tempo; it does not observe or verify your movement.</Text>{tempoRunning && <Text variant="h2">{beat}</Text>}<Button title={tempoRunning?'Stop tempo':'Start tempo'} onPress={()=>setTempoRunning(v=>!v)}/></Card>
  </Screen>;
}
