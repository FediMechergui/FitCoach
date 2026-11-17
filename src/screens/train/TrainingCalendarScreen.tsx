import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Row } from '@/components/ui/misc';
import { plannedSessions, savePlannedSession, skipPlanned, linkPlanned, deletePlanned, weeklyReview, type CalendarEntry } from '@/repositories/calendarRepo';
import { getRoutine, listRoutines } from '@/repositories/routinesRepo';
import { useSessionStore } from '@/stores/sessionStore';
import { addDays, todayISO } from '@/lib/date';
import { clockDuration } from '@/lib/duration';
export function TrainingCalendarScreen() {
  const navigation=useNavigation();const store=useSessionStore();
  const [date,setDate]=useState(todayISO());const [title,setTitle]=useState('');const [routine,setRoutine]=useState<number|null>(null);
  const [entries,setEntries]=useState(plannedSessions);const [editing,setEditing]=useState<number|undefined>();const [offset,setOffset]=useState(0);
  const reload=()=>setEntries(plannedSessions());const review=weeklyReview(offset),prior=weeklyReview(offset+1);
  const begin=(entry:CalendarEntry)=>{
    if(entry.session_id){navigation.navigate(entry.status==='active'?'ActiveSession':'SessionDetail',{sessionId:entry.session_id});return;}
    if(store.activeId){Alert.alert('Workout already running','Finish the current workout before starting this plan.');return;}
    const r=entry.routine_id?getRoutine(entry.routine_id):undefined;
    store.begin(r?.sessionType??'strength',{label:entry.title,prescription:r?.prescription});
    const id=useSessionStore.getState().activeId;if(id){linkPlanned(entry.id,id);reload();navigation.navigate('ActiveSession',{sessionId:id});}
  };
  return <Screen><Text variant="h2">Calendar & weekly review</Text>
    <Card style={{gap:10}}><Text variant="h3">{editing?'Edit plan':'Plan a workout'}</Text><Input label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate}/><Input label="Session name" value={title} onChangeText={setTitle}/><View style={{flexDirection:'row',flexWrap:'wrap',gap:6}}><Chip label="Open workout" active={routine==null} onPress={()=>setRoutine(null)}/>{listRoutines().map(r=><Chip key={r.id} label={r.name} active={routine===r.id} onPress={()=>{setRoutine(r.id);if(!title)setTitle(r.name);}}/>)}</View>
      <Button title={editing?'Save changes':'Add to calendar'} onPress={()=>{try{savePlannedSession(date,title,routine,editing);setTitle('');setEditing(undefined);reload();}catch(e){Alert.alert('Calendar',(e as Error).message);}}}/>
    </Card>
    {entries.map(entry=><Card key={entry.id} style={{gap:8}}><Text variant="bodyStrong">{entry.date} · {entry.title}</Text><Text color="textMuted">{entry.status}</Text><Button title={entry.status==='completed'?'Review workout':entry.status==='active'?'Resume workout':'Start this plan'} size="sm" onPress={()=>begin(entry)}/>{!entry.session_id&&<Row><Button title="Edit" fullWidth={false} size="sm" variant="secondary" onPress={()=>{setEditing(entry.id);setDate(entry.date);setTitle(entry.title);setRoutine(entry.routine_id);}}/><Button title={entry.status==='skipped'?'Unskip':'Skip'} fullWidth={false} size="sm" variant="ghost" onPress={()=>{skipPlanned(entry.id);reload();}}/></Row>}<Button title="Remove calendar entry" variant="ghost" size="sm" onPress={()=>Alert.alert('Remove plan?','Completed workout history is preserved.',[{text:'Cancel',style:'cancel'},{text:'Remove',style:'destructive',onPress:()=>{deletePlanned(entry.id);reload();}}])}/></Card>)}
    <Card style={{gap:10}}><Text variant="h3">{review.start} — {addDays(review.end,-1)}</Text><Row><Button title="Earlier" size="sm" fullWidth={false} variant="secondary" onPress={()=>setOffset(v=>v+1)}/><Button title="Later" size="sm" fullWidth={false} variant="secondary" disabled={offset===0} onPress={()=>setOffset(v=>Math.max(0,v-1))}/></Row><Text>{review.workouts.length} completed workouts · {review.sets} sets · {clockDuration(review.duration)} total workout time</Text><Text color="textMuted">Previous seven days: {prior.workouts.length} workouts and {prior.sets} sets. Differences in volume can reflect exercise selection or logging, not necessarily performance or a plateau.</Text>{review.workouts.map(w=><Button key={w.id} title={`${w.date} · ${w.label} · ${w.sets} sets`} size="sm" variant="ghost" onPress={()=>navigation.navigate('SessionDetail',{sessionId:w.id})}/>)}</Card>
  </Screen>;
}
