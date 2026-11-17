import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Text } from './ui/Text';
import { Row } from './ui/misc';
import type { SetEntry } from '@/db/schema';
import type { SetDraft } from '@/repositories/sessionRepo';
import { parseDuration } from '@/lib/duration';

export function SetReview({ entry, onSave }: { entry: SetEntry; onSave: (patch: SetDraft) => void }) {
  const [reps, setReps] = useState(entry.reps == null ? '' : String(entry.reps));
  const [weight, setWeight] = useState(entry.weightKg == null ? '' : String(entry.weightKg));
  const [duration, setDuration] = useState(entry.durationS == null ? '' : `${entry.durationS}s`);
  const save = () => {
    try {
      const seconds = parseDuration(duration);
      onSave({ reps: reps.trim() ? Number(reps) : null, weightKg: weight.trim() ? Number(weight) : null,
        ...(seconds === entry.durationS ? {} : { durationS: seconds, durationSource: 'manual' }) });
    } catch (e) { Alert.alert('Check set', (e as Error).message); }
  };
  return <View style={{ gap: 6 }}>
    <Text variant="caption">Correct set {entry.setNumber}</Text>
    <Row>
      <View style={{ flex: 1 }}><Input label="Reps" value={reps} onChangeText={setReps} keyboardType="numeric" /></View>
      <View style={{ flex: 1 }}><Input label="kg" value={weight} onChangeText={setWeight} keyboardType="numeric" /></View>
      <View style={{ flex: 1 }}><Input label="Time" value={duration} onChangeText={setDuration} placeholder="45s / 1:30" /></View>
    </Row>
    <Button title={`Save correction to set ${entry.setNumber}`} size="sm" variant="secondary" onPress={save} />
  </View>;
}
