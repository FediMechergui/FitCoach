import React, { useCallback, useState } from 'react';
import { View, Pressable } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Row, SectionHeader, Badge } from '@/components/ui/misc';
import type { RootStackParamList } from '@/navigation/types';
import { useNutritionStore } from '@/stores/nutritionStore';
import { useUserStore } from '@/stores/userStore';
import { dayMicros, type DayMicros } from '@/repositories/microsRepo';
import {
  MICRO_DEFS,
  formatMicro,
  microGaps,
  microStatus,
  percentRdi,
  rdiFor,
  type MicroDef,
  type MicroGroup,
} from '@/lib/micros';
import { addDays, todayISO } from '@/lib/date';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const STATUS_COLOR = { low: '#FFB454', ok: '#33D9A6', high: '#4F8CFF', over: '#FF5D5D' } as const;

export function MicronutrientsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const date = useNutritionStore((s) => s.date);
  const setDate = useNutritionStore((s) => s.setDate);
  const sex = useUserStore((s) => s.user?.sex ?? 'male');
  const [micros, setMicros] = useState<DayMicros | null>(null);

  useFocusEffect(
    useCallback(() => {
      setMicros(dayMicros(date));
    }, [date])
  );

  if (!micros) return <Screen><Text>Loading…</Text></Screen>;

  const gaps = microGaps(micros.totals, sex);
  const hasData = micros.foodEntriesWithMicros > 0 || micros.supplementCount > 0;
  const isToday = date === todayISO();
  const dateLabel = isToday
    ? 'Today'
    : new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

  const groups: Array<{ title: string; group: MicroGroup }> = [
    { title: 'Vitamins', group: 'vitamin' },
    { title: 'Minerals', group: 'mineral' },
    { title: 'Other', group: 'other' },
  ];

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Pressable onPress={() => setDate(addDays(date, -1))} hitSlop={8}>
          <Icon icon="core.back" size={24} color={theme.colors.textMuted} />
        </Pressable>
        <Text variant="h2">Micronutrients · {dateLabel}</Text>
        <Pressable onPress={() => setDate(addDays(date, 1))} hitSlop={8} disabled={isToday}>
          <Icon icon="core.forward" size={24} color={isToday ? theme.colors.surfaceAlt : theme.colors.textMuted} />
        </Pressable>
      </Row>

      <Button
        title="Supplements & pills"
        icon="supp.pill"
        variant="secondary"
        onPress={() => navigation.navigate('Supplements')}
      />

      {!hasData ? (
        <Card>
          <Text variant="body" color="textMuted">
            No micronutrient data for this day yet. Log whole foods (they carry vitamin/mineral
            data) or a micronutrient supplement, and it'll show up here.
          </Text>
        </Card>
      ) : (
        <>
          {/* Gaps */}
          {gaps.length > 0 && (
            <Card accent={theme.colors.warning} style={{ gap: 6 }}>
              <Row gap={8} style={{ alignItems: 'center' }}>
                <Icon icon="stats.coachTip" size={18} color={theme.colors.warning} />
                <Text variant="bodyStrong">Running low ({gaps.length})</Text>
              </Row>
              <Text variant="caption" color="textMuted">
                {gaps.slice(0, 6).map((g) => `${MICRO_DEFS.find((d) => d.key === g.key)!.label} ${g.pct}%`).join(' · ')}
                {gaps.length > 6 ? '…' : ''}
              </Text>
            </Card>
          )}

          {groups.map(({ title, group }) => {
            const defs = MICRO_DEFS.filter((d) => d.group === group);
            return (
              <View key={group} style={{ gap: theme.spacing.sm }}>
                <SectionHeader title={title} />
                <Card style={{ gap: 12 }}>
                  {defs.map((d) => (
                    <MicroRow key={d.key} def={d} total={micros.totals[d.key]} sex={sex} />
                  ))}
                </Card>
              </View>
            );
          })}

          {/* Source split */}
          <Card style={{ gap: 4 }}>
            <Text variant="label" color="textMuted">Where it came from</Text>
            <Text variant="caption" color="textFaint">
              {micros.foodEntriesWithMicros} of {micros.foodEntriesTotal} food entries had known
              micronutrient data{micros.supplementCount > 0 ? `, plus ${micros.supplementCount} supplement${micros.supplementCount === 1 ? '' : 's'}` : ''}.
              Composite/fast foods contribute macros only — totals here reflect foods & pills with
              known data, so treat them as a floor, not a ceiling.
            </Text>
          </Card>
        </>
      )}
    </Screen>
  );
}

function MicroRow({ def, total, sex }: { def: MicroDef; total: number; sex: 'male' | 'female' }) {
  const theme = useTheme();
  const pct = percentRdi(total, def.key, sex);
  const status = microStatus(total, def.key, sex);
  const rdi = rdiFor(def.key, sex);
  const color = STATUS_COLOR[status];

  return (
    <View style={{ gap: 4 }}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="body">{def.label}</Text>
        <Row gap={6} style={{ alignItems: 'center' }}>
          <Text variant="caption" color="textMuted">
            {formatMicro(def.key, total)} / {rdi} {def.unit}
          </Text>
          <Badge label={`${pct}%`} color={color} />
        </Row>
      </Row>
      <ProgressBar progress={pct / 100} color={color} height={6} />
      {status === 'over' && (
        <Text variant="caption" color="danger" style={{ fontSize: 10 }}>
          Above the tolerable upper intake — ease off.
        </Text>
      )}
    </View>
  );
}
