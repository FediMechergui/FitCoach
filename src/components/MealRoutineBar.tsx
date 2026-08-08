import React, { useMemo, useState } from 'react';
import { View, Pressable, Alert } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Row } from '@/components/ui/misc';
import type { MealType } from '@/db/schema';
import {
  applyMealRoutine,
  deleteMealRoutine,
  listMealRoutines,
  routineTotals,
  saveMealRoutine,
  saveableEntryCount,
} from '@/repositories/mealRoutineRepo';

/**
 * Saved meals for one meal slot: tap a chip to re-log it, or save what you have
 * just logged as a new one.
 *
 * A whole-day routine (saved from the day header) appears under every meal,
 * because applying it fills all of them at once — which is how a fasting
 * window's distribution gets re-used in a single tap.
 */
export function MealRoutineBar({
  mealType,
  date,
  onChanged,
}: {
  /** null = the whole day */
  mealType: MealType | null;
  date: string;
  onChanged: () => void;
}) {
  const theme = useTheme();
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');
  const [rev, setRev] = useState(0);

  const routines = useMemo(() => listMealRoutines(mealType), [mealType, rev]);
  const saveable = useMemo(() => saveableEntryCount(mealType, date), [mealType, date, rev]);

  const bump = () => {
    setRev((n) => n + 1);
    onChanged();
  };

  const save = () => {
    if (saveable === 0) return;
    saveMealRoutine(name, mealType, date);
    setName('');
    setNaming(false);
    bump();
  };

  const apply = (id: number, label: string) => {
    const n = applyMealRoutine(id, mealType ?? undefined, date);
    if (n > 0) bump();
    else Alert.alert('Nothing to add', `"${label}" has no saved items.`);
  };

  const confirmDelete = (id: number, label: string) => {
    Alert.alert(`Delete "${label}"?`, 'Meals you already logged from it are kept.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteMealRoutine(id);
          bump();
        },
      },
    ]);
  };

  if (routines.length === 0 && saveable === 0) return null;

  return (
    <View style={{ gap: 6 }}>
      {routines.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {routines.map((r) => {
            const t = routineTotals(r);
            return (
              <Pressable
                key={r.id}
                onPress={() => apply(r.id, r.name)}
                onLongPress={() => confirmDelete(r.id, r.name)}
              >
                <Chip
                  label={`${r.mealType === null ? '☀ ' : ''}${r.name} · ${t.calories} kcal`}
                  small
                />
              </Pressable>
            );
          })}
        </View>
      )}

      {naming ? (
        <Row gap={8} style={{ alignItems: 'flex-end' }}>
          <View style={{ flex: 1 }}>
            <Input
              label={mealType ? 'Name this meal' : "Name this day's distribution"}
              value={name}
              onChangeText={setName}
              placeholder={mealType ? 'e.g. My usual breakfast' : 'e.g. Ramadan split'}
            />
          </View>
          <Button title="Save" size="sm" onPress={save} fullWidth={false} />
        </Row>
      ) : (
        saveable > 0 && (
          <Pressable onPress={() => setNaming(true)} hitSlop={6}>
            <Row gap={6} style={{ alignItems: 'center' }}>
              <Icon icon="core.add" size={14} color={theme.colors.primary} />
              <Text variant="caption" color="primary">
                Save {mealType ? 'this meal' : "today's whole distribution"} as a routine
                {` (${saveable} item${saveable === 1 ? '' : 's'})`}
              </Text>
            </Row>
          </Pressable>
        )
      )}

      {routines.length > 0 && (
        <Text variant="caption" color="textFaint">
          Tap to log it again · long-press to delete
        </Text>
      )}
    </View>
  );
}
