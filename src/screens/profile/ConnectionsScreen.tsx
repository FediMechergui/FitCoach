import React, { useState } from 'react';
import { Alert, Linking, Switch, View } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Row } from '@/components/ui/misc';
import { nativeTools } from '../../../modules/fitcoach-tools';
import { todayISO, fromISODate, nextDayMs } from '@/lib/date';
import { sqlite } from '@/db/client';
import { kvGet, kvSetStrict } from '@/repositories/kvRepo';
import { exportLogsCsv } from '@/services/dataExport';
import { setWidgetEnabled, updateHomeWidget, widgetEnabled } from '@/services/widget';
export function ConnectionsScreen() {
  const [date,setDate]=useState(todayISO());const [summary,setSummary]=useState<{steps:number|null;sleepMs:number|null}|null>(null);
  const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');const [widget,setWidget]=useState(widgetEnabled);
  const task=async(job:()=>Promise<void>)=>{setBusy(true);setMessage('');try{await job();}catch(e){const reason=(e as Error).message;setMessage(reason);Alert.alert('Connections & exports',reason);}finally{setBusy(false);}};
  const read=async()=>{setSummary(null);setSummary(await nativeTools().healthSummary(fromISODate(date).getTime(),nextDayMs(date)));};
  const workouts=sqlite.getAllSync<{id:number;start_time:number;end_time:number;label:string|null;session_type:string}>('SELECT id,start_time,end_time,label,session_type FROM sessions WHERE end_time IS NOT NULL ORDER BY start_time DESC LIMIT 12');
  return <Screen><Text variant="h2">Connections & exports</Text>
    {!!message&&<Text accessibilityLiveRegion="polite">{message}</Text>}{busy&&<Text>Working…</Text>}
    <Card style={{gap:10}}><Text variant="h3">Health Connect · Android 14+</Text><Text color="textMuted">Read daily aggregate steps and sleep. These stay separate from FitCoach logs, so phone and watch records are not added twice. Only the selected completed workout is exported. Routes, food and notes are excluded.</Text><Button title="Choose Health Connect permissions" disabled={busy} onPress={()=>void task(async()=>{if(!nativeTools().healthAvailable())throw new Error('This integration requires Android 14 or later.');await nativeTools().requestHealthPermissions();await read();})}/><Input label="Day (YYYY-MM-DD)" value={date} onChangeText={setDate}/><Button title="Read this day" disabled={busy} variant="secondary" onPress={()=>void task(read)}/>
      {summary&&<Text>{summary.steps==null?'No step data':`${summary.steps} steps`} · {summary.sleepMs==null?'No sleep data':`${(summary.sleepMs/3600000).toFixed(1)} h sleep`} (Health Connect)</Text>}
      <Text variant="caption" color="textMuted">Grant read access in Android Health Connect settings. Readings are not saved to the fitness diary, backup or AI context. Revoke permissions or remove exported records through Health Connect.</Text>
      <Button title="Open Android settings" variant="ghost" size="sm" onPress={()=>void Linking.openSettings()}/>
      <Text variant="bodyStrong">Export a completed workout</Text>{workouts.map(w=><Button key={w.id} title={`${new Date(w.start_time).toLocaleDateString()} · ${w.label??w.session_type}`} size="sm" variant="secondary" disabled={busy} onPress={()=>Alert.alert('Export this workout?','Sends its title and start/end times to Health Connect as a manually logged workout. Re-export updates the same record.',[{text:'Cancel',style:'cancel'},{text:'Export',onPress:()=>void task(async()=>{let device=kvGet<string>('health.export.id');if(!device){device=`${Date.now()}-${Math.random().toString(36).slice(2)}`;kvSetStrict('health.export.id',device);}await nativeTools().exportWorkout(`fitcoach-${device}-${w.id}`,w.start_time,w.end_time,w.label??w.session_type);setMessage('Workout exported to Health Connect.');})}])}/>)}</Card>
    <Card style={{gap:10}}><Text variant="h3">Home-screen widget</Text><Row style={{alignItems:'center',justifyContent:'space-between'}}><Text style={{flex:1}}>Show step/workout snapshot on the home screen</Text><Switch value={widget} onValueChange={value=>{try{setWidgetEnabled(value);setWidget(value);}catch(e){setMessage((e as Error).message);}}}/></Row><Text variant="caption" color="textMuted">Updates when FitCoach is open. The timestamp shows freshness. People who can see your home screen may see this summary.</Text><Button title="Add FitCoach widget" variant="secondary" onPress={()=>{try{updateHomeWidget();if(!nativeTools().pinWidget())setMessage('Long-press your home screen, choose Widgets, then FitCoach.');}catch(e){setMessage((e as Error).message);}}}/></Card>
    <Card style={{gap:10}}><Text variant="h3">Export your data</Text><Text color="textMuted">The CSV archive contains personal fitness and health logs, exercise history and equipment. Credentials and photo files are excluded. Choose a destination you trust.</Text><Button title="Export all logs as CSV archive" disabled={busy} onPress={()=>Alert.alert('Share private logs?','The archive includes all logged health and activity records. The Android share sheet lets you choose where it goes.',[{text:'Cancel',style:'cancel'},{text:'Create export',onPress:()=>void task(exportLogsCsv)}])}/></Card>
  </Screen>;
}
