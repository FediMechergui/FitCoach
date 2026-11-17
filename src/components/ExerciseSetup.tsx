import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Text } from './ui/Text';
import { Button } from './ui/Button';
import { Chip } from './ui/Chip';
import { assignEquipment, equipmentList, skipExercise, setCircuitGroup } from '@/repositories/gymRepo';
import { listExercises } from '@/repositories/exerciseRepo';
import { Input } from './ui/Input';
import { lastSessionSets, type ExerciseLogView } from '@/repositories/sessionRepo';
import { useSessionStore } from '@/stores/sessionStore';
export function ExerciseSetup({ lv }: { lv: ExerciseLogView }) {
  const store = useSessionStore();
  const navigation = useNavigation();
  const [group,setGroup] = useState(lv.log.supersetGroup==null?'':String(lv.log.supersetGroup));
  const [alternatives,setAlternatives] = useState(false);
  const [options,setOptions] = useState(false);
  const availableIds = new Set(equipmentList().flatMap(e=>JSON.parse(e.exercise_ids) as number[]));
  const replacements = alternatives ? listExercises().filter(e=>e.id!==lv.log.exerciseId&&e.primaryMuscle===lv.primaryMuscle&&e.pattern===lv.pattern&&e.trackingType===lv.trackingType&&(e.equipmentType==='bodyweight'||availableIds.has(e.id))).slice(0,6) : [];
  const equipment = equipmentList().filter(item => item.id === lv.log.equipmentId || (JSON.parse(item.exercise_ids) as number[]).includes(lv.log.exerciseId));
  const selected = equipment.find(item => item.id === lv.log.equipmentId);
  const previous = lastSessionSets(lv.log.exerciseId, store.activeId, undefined, lv.log.equipmentId);
  const change = (id: number | null) => { try { assignEquipment(lv.log.id, id); store.refresh(); } catch(e) { Alert.alert('Equipment', (e as Error).message); } };
  return <View style={{ gap:8 }}>
    <Text variant="caption" color="textMuted">{lv.log.skipped ? 'Skipped' : lv.sets.some(s => s.completed) ? 'In progress' : 'Planned'} · {lv.sets.filter(s => s.completed).length} completed / {lv.sets.length} listed sets</Text>
    <View style={{ flexDirection:'row',flexWrap:'wrap',gap:6 }}><Chip label="Unassigned equipment" active={lv.log.equipmentId == null} onPress={() => change(null)} />{equipment.map(item => <Chip key={item.id} label={item.name} active={item.id === lv.log.equipmentId} onPress={() => change(item.id)} />)}</View>
    {selected && <Text variant="caption">{selected.settings || 'No setup notes'} · machine label in {selected.unit}. Enter workout loads in kg.</Text>}
    <Text variant="caption" color="textMuted">Previous on this setup: {previous.length ? previous.map(s => `${s.reps ?? '—'} reps × ${s.weightKg ?? '—'} kg`).join(' · ') : 'no comparable completed sets'}</Text>
    <Button title={options?'Hide exercise options':'Circuit, alternatives & equipment options'} size="sm" variant="ghost" onPress={()=>setOptions(value=>!value)}/>
    {options&&<><Button title="Add or edit gym equipment" size="sm" variant="ghost" onPress={() => navigation.navigate('MyGym')} />
    <Input label="Superset / circuit group (optional, 1–20)" value={group} onChangeText={setGroup} keyboardType="numeric" onBlur={()=>{try{setCircuitGroup(lv.log.id,group.trim()?Number(group):null);store.refresh();}catch(e){Alert.alert('Circuit',(e as Error).message);}}}/>
    {!lv.sets.some(s=>s.completed)&&<Button title="Equipment occupied · find available alternatives" variant="ghost" size="sm" onPress={()=>setAlternatives(v=>!v)}/>}
    {alternatives&&<><Text variant="caption" color="textMuted">Same movement pattern and muscle, using bodyweight or equipment linked in My gym. Recheck load and technique; these are alternatives, not equivalent resistance.</Text>{replacements.length?replacements.map(e=><Button key={e.id} title={e.name} size="sm" variant="secondary" onPress={()=>{try{store.swapExercise(lv.log.id,e.id);setAlternatives(false);}catch(error){Alert.alert('Substitution',(error as Error).message);}}}/>):<Text variant="caption">No matching available equipment is saved. Link exercises in My gym or choose from the library.</Text>}</>}
    {!lv.sets.some(s => s.completed) && <Button title={lv.log.skipped ? 'Return to plan' : 'Mark exercise skipped'} size="sm" variant="ghost" onPress={() => { try { skipExercise(lv.log.id, !lv.log.skipped); store.refresh(); } catch(e) { Alert.alert('Exercise', (e as Error).message); } }} />}
    </>}
  </View>;
}
