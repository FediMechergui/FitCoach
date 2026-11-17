import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card } from './ui/Card';
import { Text } from './ui/Text';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Row } from './ui/misc';
import type { WalkSession } from '@/db/schema';
import { walkAnnotation,saveRouteName,routeComparisons,correctWalk,restoreOriginalWalk } from '@/repositories/walkReviewRepo';
import { parseDuration,clockDuration } from '@/lib/duration';
import { exportWalkGpx } from '@/services/dataExport';
export function WalkReview({walk,onChange}:{walk:WalkSession;onChange:()=>void}) {
  const navigation=useNavigation();const annotation=walkAnnotation(walk.id);
  const [name,setName]=useState(annotation?.route_name??'');const [editing,setEditing]=useState(false);
  const [steps,setSteps]=useState(String(walk.steps));const [distance,setDistance]=useState(String(walk.distanceM/1000));
  const [duration,setDuration]=useState(`${walk.durationS}s`);const [calories,setCalories]=useState(String(Math.round(walk.caloriesBurned)));const [reason,setReason]=useState('');
  const action=(work:()=>void)=>{try{work();onChange();}catch(e){Alert.alert('Review activity',(e as Error).message);}};
  return <Card style={{gap:10}}><Text variant="h3">Route & corrections</Text>
    {annotation?.correction_json&&<Text color="warning">Totals corrected manually · {annotation.reason}. Original recorded totals are preserved.</Text>}
    <Input label="Route name" value={name} onChangeText={setName} placeholder="Park loop"/><Button title="Save route for repeat comparison" size="sm" variant="secondary" onPress={()=>action(()=>saveRouteName(walk.id,name,true))}/>
    {annotation?.saved===1&&<><Button title="Unsave route" size="sm" variant="ghost" onPress={()=>action(()=>saveRouteName(walk.id,name,false))}/><Text variant="caption">Trips with the same name are grouped by your choice. Check distance, mode and conditions before comparing pace.</Text>{routeComparisons(annotation.route_name??'').map(other=><Button key={other.id} title={`${new Date(other.start_time).toLocaleDateString()} · ${other.mode} · ${(other.distance_m/1000).toFixed(2)} km · ${clockDuration(other.duration_s)}`} size="sm" variant="ghost" onPress={()=>navigation.navigate('WalkDetail',{walkId:other.id})}/>)}</>}
    <Button title="Export recorded route as GPX" variant="secondary" size="sm" onPress={()=>Alert.alert('Share precise location?','GPX contains the recorded GPS coordinates, including your route endpoints. Gaps remain separate segments.',[{text:'Cancel',style:'cancel'},{text:'Export',onPress:()=>void exportWalkGpx(walk.id).catch(e=>Alert.alert('Export',e.message))}])}/>
    <Button title={editing?'Close corrections':'Correct a tracking or vehicle-detection mistake'} variant="ghost" size="sm" onPress={()=>setEditing(v=>!v)}/>
    {editing&&<><Text variant="caption" color="textMuted">Enter totals you can verify. Excluded GPS fixes cannot be reconstructed; this changes totals, not the route. Independent all-day sensor counts remain intact.</Text><Row><View style={{flex:1}}><Input label="Steps" value={steps} onChangeText={setSteps} keyboardType="numeric"/></View><View style={{flex:1}}><Input label="Distance (km)" value={distance} onChangeText={setDistance} keyboardType="numeric"/></View></Row><Row><View style={{flex:1}}><Input label="Active time" value={duration} onChangeText={setDuration}/></View><View style={{flex:1}}><Input label="Estimated kcal" value={calories} onChangeText={setCalories} keyboardType="numeric"/></View></Row><Input label="Reason / source of corrected totals" value={reason} onChangeText={setReason} multiline/><Button title="Save manual correction" onPress={()=>action(()=>{const seconds=parseDuration(duration);if(!seconds)throw new Error('Enter the active time.');correctWalk(walk.id,{steps:Number(steps),distanceM:Number(distance)*1000,durationS:seconds,caloriesBurned:Number(calories)},reason);setEditing(false);})}/></>}
    {annotation?.correction_json&&<Button title="Restore original recorded totals" variant="ghost" size="sm" onPress={()=>action(()=>restoreOriginalWalk(walk.id))}/>}
  </Card>;
}
