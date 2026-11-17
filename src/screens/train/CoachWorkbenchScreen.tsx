import React, { useState } from 'react';
import { Alert, Switch, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Row } from '@/components/ui/misc';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Chip } from '@/components/ui/Chip';
import { EvidenceLink } from '@/components/EvidenceLink';
import { nativeTools } from '../../../modules/fitcoach-tools';
import { openRouterKey, setOpenRouterKey } from '@/repositories/kvRepo';
import { draftTraining } from '@/services/trainingAi';
import { listExercises } from '@/repositories/exerciseRepo';
import { saveTrainingDraft } from '@/repositories/trainingDraftRepo';
import { parseTrainingDraft, type TrainingDraft, type TrainingDraftEntry } from '@/lib/trainingDraft';
import { useSessionStore } from '@/stores/sessionStore';
import { addSet, addExerciseToSession, activeSession } from '@/repositories/sessionRepo';
import { atomic } from '@/db/atomic';
import { parseDuration } from '@/lib/duration';

type DraftRow=TrainingDraftEntry & {exerciseId:number|null;durationInput?:string};
export function CoachWorkbenchScreen() {
  const navigation=useNavigation();const [mode,setMode]=useState('import');const [text,setText]=useState('');const [key,setKey]=useState('');const [configured,setConfigured]=useState(()=>!!openRouterKey());
  const [logs,setLogs]=useState(false);const [busy,setBusy]=useState('');const [message,setMessage]=useState('');const [draft,setDraft]=useState<TrainingDraft|null>(null);const [title,setTitle]=useState('');const [rows,setRows]=useState<DraftRow[]>([]);
  const task=async(label:string,job:()=>Promise<void>)=>{setBusy(label);setMessage('');try{await job();}catch(e){setMessage((e as Error).message);}finally{setBusy('');}};
  const importPhoto=()=>void task('Reading programme…',async()=>{
    const r=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],quality:1});if(r.canceled)return;
    const result=await nativeTools().readText(r.assets[0].uri);if(!result.text.trim())throw new Error('No legible text. Use a sharper image or paste the programme.');setText(result.text);
  });
  const importPdf=()=>void task('Reading PDF…',async()=>{
    const pages=await nativeTools().pickPdf();if(!pages)return;const texts:string[]=[];
    try { for(let i=0;i<pages.length;i++){setBusy(`Reading page ${i+1}/${pages.length}…`);texts.push(`Page ${i+1}\n${(await nativeTools().readText(pages[i])).text}`);} }
    finally { await Promise.all(pages.map(uri=>FileSystem.deleteAsync(uri,{idempotent:true}).catch(()=>{}))); }
    setText(texts.join('\n\n'));setMessage('Check the extracted text before sending it to AI.');
  });
  const generate=()=>void task('Preparing editable draft…',async()=>{
    const result=await draftTraining(text,mode,logs);setDraft(result);setTitle(result.title);
    setRows(result.exercises.map(e=>{const matches=listExercises({search:e.name});return{...e,exerciseId:matches.find(x=>x.name.toLowerCase()===e.name.toLowerCase())?.id??null};}));
  });
  const verifiedRows=()=>{
    if(rows.some(r=>r.exerciseId==null))throw new Error('Match every exercise to the library first.');
    const verified=rows.map(r=>({...r,durationS:r.durationInput===undefined?r.durationS:parseDuration(r.durationInput)}));
    parseTrainingDraft({title,exercises:verified});return verified as Array<TrainingDraftEntry & {exerciseId:number}>;
  };
  const save=()=>{try{saveTrainingDraft(title,verifiedRows());setMessage('Saved as a new routine. Choose it from the calendar or Train.');setDraft(null);setRows([]);}catch(e){setMessage((e as Error).message);}};
  const log=()=>{try{
    const confirmed=verifiedRows();const store=useSessionStore.getState();if(!store.activeId)throw new Error('Start a workout before logging these sets.');
    atomic(()=>{if(activeSession()?.id!==store.activeId)throw new Error('Workout is no longer active.');for(const row of confirmed){const logId=addExerciseToSession(store.activeId!,row.exerciseId);for(let i=0;i<row.sets;i++)addSet(logId,{reps:row.reps,weightKg:row.weightKg,durationS:row.durationS,durationSource:row.durationS?'manual':null,completed:true});}});
    store.refresh();setDraft(null);setRows([]);navigation.navigate('ActiveSession',{sessionId:store.activeId});
  }catch(e){setMessage((e as Error).message);}};
  return <Screen><Text variant="h2">AI training tools</Text><Text color="textMuted">Import a programme, dictate a log, review training or request equipment-aware substitutions. Every result is an editable suggestion.</Text>
    <Card style={{gap:10}}><Text variant="bodyStrong">{configured?'OpenRouter connected':'Connect your own AI account'}</Text><Input label="OpenRouter API key" secureTextEntry value={key} onChangeText={setKey} autoCapitalize="none" autoCorrect={false}/><Button title="Save API key securely" disabled={!key.trim()} variant="secondary" size="sm" onPress={()=>{setOpenRouterKey(key);setKey('');setConfigured(true);}}/><Text variant="caption" color="textMuted">Requests may incur provider charges. Your key stays in device secure storage and is excluded from backup. AI uses OpenRouter directly; Netlify is only for backup.</Text></Card>
    <SegmentedControl scrollable options={[{value:'import',label:'Import plan'},{value:'log',label:'Voice log'},{value:'review',label:'Review / plateau'},{value:'substitute',label:'Substitute'}]} value={mode} onChange={setMode}/>
    <Card style={{gap:10}}><Button title="Check on-device OCR" variant="secondary" size="sm" disabled={!!busy} onPress={()=>void task('Preparing OCR…',async()=>{await nativeTools().prepareOcr();setMessage('Built-in text recognition is ready and works offline.');})}/><Row><Button title="Programme photo" size="sm" fullWidth={false} variant="secondary" disabled={!!busy} onPress={importPhoto}/><Button title="PDF" size="sm" fullWidth={false} variant="secondary" disabled={!!busy} onPress={importPdf}/></Row><Button title="Dictate with Android speech service" variant="secondary" disabled={!!busy} onPress={()=>void task('Listening…',async()=>{const result=await nativeTools().speech();if(result)setText(result);})}/><Text variant="caption" color="textMuted">Android speech recognition may send audio to your installed speech provider. OCR text stays local until you choose Send.</Text><Input label="Instructions or extracted text — review before sending" multiline value={text} onChangeText={setText}/><Row style={{alignItems:'center',justifyContent:'space-between'}}><Text style={{flex:1}}>Include last 30 days of completed sets (up to 100)</Text><Switch value={logs} onValueChange={setLogs}/></Row><Text variant="caption" color="textMuted">Send shares this text and saved gym equipment names/settings with OpenRouter and its selected provider. Training records are included only when the switch is on.</Text><Button title="Send and prepare draft" disabled={!!busy||!text.trim()||!configured} onPress={generate}/></Card>
    {!!busy&&<Text color="primary">{busy}</Text>}{!!message&&<Text accessibilityLiveRegion="polite">{message}</Text>}
    {draft&&<><Card style={{gap:10}}><Text variant="h3">Review AI draft</Text><Text>{draft.explanation}</Text><Input label="New routine name" value={title} onChangeText={setTitle}/>{draft.sessionIds.map(id=><Button key={id} title={`Open cited workout #${id}`} size="sm" variant="ghost" onPress={()=>navigation.navigate('SessionDetail',{sessionId:id})}/>)}<Text variant="caption">Reference topics: {draft.references.join(', ')||'No references returned'}. Citations do not independently verify the generated explanation.</Text><EvidenceLink/></Card>
      {rows.map((row,index)=><DraftEditor key={index} row={row} onChange={next=>setRows(all=>all.map((r,i)=>i===index?next:r))} onRemove={()=>setRows(all=>all.filter((_,i)=>i!==index))}/>)}
      {!!rows.length&&<><Button title="Confirm and save as new routine" onPress={save}/>{mode==='log'&&<Button title="Confirm completed sets in current workout" variant="secondary" onPress={()=>Alert.alert('Log these as completed?', 'Confirm that you performed every set shown. Times entered here are manual, not measured by a timer.',[{text:'Cancel',style:'cancel'},{text:'Log completed sets',onPress:log}])}/>}</>}
      <Button title="Discard AI draft" variant="ghost" onPress={()=>{setDraft(null);setRows([]);}}/>
    </>}
  </Screen>;
}
function DraftEditor({row,onChange,onRemove}:{row:DraftRow;onChange:(row:DraftRow)=>void;onRemove:()=>void}) {
  const [query,setQuery]=useState(row.name);
  const matches=listExercises({search:query}).slice(0,6);
  return <Card style={{gap:8}}><Text variant="bodyStrong">{row.name}</Text><Text variant="caption" color={row.exerciseId?'primary':'warning'}>{row.exerciseId?'Library match selected':'Choose a library match before saving'}</Text><Input label="Find or replace exercise" value={query} onChangeText={setQuery}/>{matches.map(e=><Chip key={e.id} label={e.name} active={e.id===row.exerciseId} onPress={()=>onChange({...row,name:e.name,exerciseId:e.id})}/>)}
    <Row>{(['sets','reps','weightKg','restSeconds'] as const).map(field=><View key={field} style={{flex:1}}><Input label={{sets:'Sets',reps:'Reps',weightKg:'kg',restSeconds:'Rest (s)'}[field]} value={row[field]==null?'':String(row[field])} keyboardType="numeric" onChangeText={value=>onChange({...row,[field]:value.trim()?Number(value):field==='sets'?1:field==='restSeconds'?90:null})}/></View>)}</Row>
    <Input label="Time per set (45s / 1:30)" value={row.durationInput ?? (row.durationS?`${row.durationS}s`:'')} onChangeText={durationInput=>onChange({...row,durationInput})}/><Button title="Remove exercise from draft" variant="ghost" size="sm" onPress={onRemove}/>
  </Card>;
}
