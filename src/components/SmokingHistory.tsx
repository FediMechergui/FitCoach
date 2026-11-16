import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { LogDatePicker } from './LogDatePicker';
import { Text } from './ui/Text';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { todayISO } from '@/lib/date';
import { dayEntries, deleteSmokingEntry, logCigarettes, updateSmokingEntry } from '@/repositories/smokingRepo';
import { useSmokingStore } from '@/stores/smokingStore';
import { findNicotineProduct } from '@/data/nicotineProducts';

export function SmokingHistory() {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(todayISO);
  const [revision, setRevision] = useState(0);
  const [editing, setEditing] = useState<number | null>(null);
  const [quantity, setQuantity] = useState('1');
  const rows = dayEntries(date);
  const refresh = () => { setRevision(revision + 1); useSmokingStore.getState().refresh(); };
  return <View style={{ gap: 12 }}>
    <Button title={open ? 'Close log history' : 'Review or correct past logs'} variant="secondary" onPress={() => setOpen(!open)} />
    {open && <Card style={{ gap: 12 }}>
      <LogDatePicker date={date} onChange={value => { setDate(value); setEditing(null); }} />
      {rows.map(row => <View key={row.id} style={{ gap: 4 }}>
        <Text>{row.quantity} × {findNicotineProduct(row.productKey ?? 'cigarette')?.label ?? 'Cigarette'}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button title="Edit quantity" size="sm" fullWidth={false} variant="secondary" onPress={() => { setEditing(row.id); setQuantity(String(row.quantity)); }} />
          <Button title="Delete" size="sm" fullWidth={false} variant="ghost" onPress={() => Alert.alert('Delete this entry?', date, [
            { text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => { deleteSmokingEntry(row.id); refresh(); } }
          ])} />
        </View>
      </View>)}
      {!rows.length && <Text color="textMuted">No entries on this date.</Text>}
      <Input label={editing ? 'Corrected quantity' : 'Cigarettes to add for this date'} value={quantity} onChangeText={setQuantity} keyboardType="number-pad" />
      <Button title={editing ? 'Save correction' : 'Add past cigarette log'} onPress={() => {
        try { if (editing) updateSmokingEntry(editing, Number(quantity)); else logCigarettes(Number(quantity), { date });
          setEditing(null); refresh();
        } catch (e) { Alert.alert('Check quantity', e instanceof Error ? e.message : 'Unable to save.'); }
      }} />
    </Card>}
  </View>;
}
