import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Text } from './ui/Text';
import { addDays, fromISODate, toISODate, todayISO } from '@/lib/date';
import { isCalendarDate } from '@/lib/validation';

/** Shared date control for reading and correcting health logs. */
export function LogDatePicker({ date, onChange }: { date: string; onChange: (date: string) => void }) {
  const [draft, setDraft] = useState(date);
  useEffect(() => setDraft(date), [date]);
  const valid = isCalendarDate(draft) && draft <= todayISO();
  return <View style={{ gap: 8 }}>
    <Text variant="label">Log date</Text>
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
      <Button title="Previous" size="sm" fullWidth={false} variant="secondary" onPress={() => onChange(addDays(date, -1))} />
      <View style={{ flex: 1 }}><Input accessibilityLabel="Log date, year month day" value={draft} onChangeText={setDraft}
        placeholder="YYYY-MM-DD" onEndEditing={() => { if (valid) onChange(draft); }} error={valid ? undefined : 'Use a real date, today or earlier'} /></View>
      <Button title="Today" size="sm" fullWidth={false} variant="secondary" onPress={() => onChange(todayISO())} />
    </View>
  </View>;
}
