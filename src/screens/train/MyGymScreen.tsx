import React, { useState } from 'react';
import { Alert, Image, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Row } from '@/components/ui/misc';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Chip } from '@/components/ui/Chip';
import { deleteEquipment, equipmentList, saveEquipment, type GymEquipment } from '@/repositories/gymRepo';
import { listExercises } from '@/repositories/exerciseRepo';
import { nativeTools } from '../../../modules/fitcoach-tools';
import { identifyEquipment, type EquipmentCandidate } from '@/services/trainingAi';
export function MyGymScreen() {
  const [items, setItems] = useState(equipmentList);
  const [showForm, setShowForm] = useState(items.length === 0);
  const [id, setId] = useState<number | undefined>();
  const [name, setName] = useState('');
  const [kind, setKind] = useState('machine');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [location, setLocation] = useState('');
  const [unit, setUnit] = useState<'kg'|'lb'>('kg');
  const [settings, setSettings] = useState('');
  const [search, setSearch] = useState('');
  const [exerciseIds, setExerciseIds] = useState<number[]>([]);
  const [ocr, setOcr] = useState('');
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [candidates, setCandidates] = useState<EquipmentCandidate[]>([]);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const clear = () => { setId(undefined); setName(''); setBrand(''); setModel(''); setSettings(''); setExerciseIds([]); setOcr(''); setPhoto(null); setCandidates([]); setMessage(''); };
  const edit = (item: GymEquipment) => { setShowForm(true); setId(item.id); setName(item.name); setKind(item.kind); setBrand(item.brand ?? ''); setModel(item.model ?? ''); setLocation(item.location ?? ''); setUnit(item.unit); setSettings(item.settings ?? ''); setOcr(item.ocr_text ?? ''); setExerciseIds(JSON.parse(item.exercise_ids)); setPhoto(null); setCandidates([]); };
  const task = async (label: string, job: () => Promise<void>) => { setBusy(label); setMessage(''); try { await job(); } catch (e) { setMessage((e as Error).message); } finally { setBusy(''); } };
  const pick = (camera: boolean) => void task('Reading label…', async () => {
    if (camera && !(await ImagePicker.requestCameraPermissionsAsync()).granted) throw new Error('Camera permission is needed to take a label photo. You can choose a saved photo instead.');
    // Preserve the complete label. Android's default square crop can cut off
    // brand/model prefixes and units before recognition ever sees the image.
    const options: ImagePicker.ImagePickerOptions = { mediaTypes:['images'], quality:0.9, base64:true, allowsEditing:false };
    const result = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled) return;
    setCandidates([]); setOcr(''); setPhoto(result.assets[0]);
    const read = await nativeTools().readText(result.assets[0].uri);
    setOcr(read.text);
    if (!read.text.trim()) setMessage('No legible text found. Take a closer, sharper photo or enter the equipment manually.');
  });
  const save = () => {
    try {
      saveEquipment({ name,kind,brand,model,location,unit,settings,exercise_ids:JSON.stringify(exerciseIds),ocr_text:ocr }, id);
      setItems(equipmentList()); clear(); setShowForm(false); setMessage('Equipment saved on this device.');
    } catch (e) { setMessage((e as Error).message); }
  };
  const matchingIds = new Set(search.trim() ? listExercises({ search }).map(e => e.id) : []);
  const exerciseChoices = listExercises().filter(e => exerciseIds.includes(e.id) || matchingIds.has(e.id)).slice(0, 20);
  return <Screen>
    <Text variant="h2">My gym</Text>
    <Text color="textMuted">Save each machine, its attachments and seat settings. Loads are comparable only on the same equipment and setup.</Text>
    {!showForm&&<><Button title="Add equipment" onPress={()=>{clear();setShowForm(true);}}/>{!!message&&<Text accessibilityLiveRegion="polite">{message}</Text>}</>}
    {showForm&&<Card style={{ gap:10 }}>
      <Text variant="h3">{id ? 'Edit equipment' : 'Add equipment'}</Text>
      <Text variant="caption" color="textMuted">Built-in Latin-text recognition runs offline on your device. Arabic text is not supported by this OCR model.</Text>
      <Button title="Check text recognition" variant="secondary" size="sm" disabled={!!busy} onPress={() => void task('Preparing recognition…', async () => { await nativeTools().prepareOcr(); setMessage('On-device text recognition is ready.'); })} />
      <Row><Button title="Take photo" size="sm" fullWidth={false} onPress={() => pick(true)} disabled={!!busy} /><Button title="Choose photo" size="sm" fullWidth={false} variant="secondary" onPress={() => pick(false)} disabled={!!busy} /></Row>
      {!!busy && <Text accessibilityLiveRegion="polite" color="primary">{busy}</Text>}
      {!!message && <Text accessibilityLiveRegion="polite" color="textMuted">{message}</Text>}
      {photo && <Image source={{ uri:photo.uri }} style={{ height:180, borderRadius:12 }} resizeMode="contain" />}
      {!!photo && <>
        <Text variant="caption" color="textMuted">Visual identification sends this photo and label text to OpenRouter and your selected AI provider. Confirm any suggested match yourself.</Text>
        <Button title="Send photo for AI suggestions" variant="secondary" disabled={!!busy || !photo.base64} onPress={() => void task('Identifying equipment…', async () => { const found = await identifyEquipment(photo.base64!, ocr); setCandidates(found); if (!found.length) setMessage('Equipment is unknown. Add its details manually.'); })} />
      </>}
      {candidates.map((candidate, index) => <View key={index} style={{ gap:6 }}><Text variant="bodyStrong">Possible match: {candidate.name}</Text><Text variant="caption">{candidate.clues}</Text><Button title={`Use ${candidate.name}`} size="sm" variant="secondary" onPress={() => { setName(candidate.name); setKind(candidate.kind); setBrand(candidate.brand); setModel(candidate.model); }} /></View>)}
      <Input label="Label text (check and correct)" multiline value={ocr} onChangeText={setOcr} />
      <Input label="Equipment name" value={name} onChangeText={setName} placeholder="Leg press by the window" />
      <SegmentedControl scrollable options={['machine','cable','barbell','dumbbell','bodyweight','other'].map(value => ({value,label:value}))} value={kind} onChange={setKind} />
      <Row><View style={{flex:1}}><Input label="Brand" value={brand} onChangeText={setBrand} /></View><View style={{flex:1}}><Input label="Model" value={model} onChangeText={setModel} /></View></Row>
      <Input label="Gym / location" value={location} onChangeText={setLocation} />
      <Text variant="caption">Confirm the unit printed on the machine</Text>
      <SegmentedControl options={[{value:'kg',label:'kg'},{value:'lb',label:'lb'}]} value={unit} onChange={setUnit} />
      <Input label="Seat, attachments and setup notes" value={settings} onChangeText={setSettings} multiline placeholder="Seat 3; rope attachment; record stack marking" />
      <Input label="Link exercises" value={search} onChangeText={setSearch} placeholder="Search the library" />
      <View style={{ flexDirection:'row', flexWrap:'wrap', gap:6 }}>{exerciseChoices.map(e => <Chip key={e.id} label={e.name} active={exerciseIds.includes(e.id)} onPress={() => setExerciseIds(ids => ids.includes(e.id) ? ids.filter(n=>n!==e.id) : [...ids,e.id])} />)}</View>
      {!!message && <Text color="textMuted">{message}</Text>}
      <Button title={id ? 'Save equipment changes' : 'Confirm and save equipment'} onPress={save} disabled={!!busy || !name.trim()} />
      <Button title="Cancel editing" variant="ghost" onPress={()=>{clear();setShowForm(false);}} />
    </Card>}
    <Text variant="h3">Saved equipment · {items.length}</Text>
    {items.map(item => <Card key={item.id} style={{ gap:8 }}><Text variant="bodyStrong">{item.name}</Text><Text color="textMuted">{[item.location,item.brand,item.model,item.unit].filter(Boolean).join(' · ')}</Text><Text variant="caption">{item.settings}</Text><Row><Button title="Edit" size="sm" fullWidth={false} variant="secondary" onPress={() => edit(item)} /><Button title="Delete" size="sm" fullWidth={false} variant="ghost" onPress={() => Alert.alert('Delete equipment?', item.name, [{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:()=>{try{deleteEquipment(item.id);setItems(equipmentList());if(id===item.id)clear();}catch(e){Alert.alert('Keep equipment history',(e as Error).message);}}}])} /></Row></Card>)}
  </Screen>;
}
