import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Row, SectionHeader, Divider } from '@/components/ui/misc';
import type { RootStackParamList } from '@/navigation/types';
import { SPLITS, type SplitDay, type SplitTemplate } from '@/data/splits';
import { exercisesBySlugs } from '@/repositories/exerciseRepo';
import { MUSCLE_LABELS } from '@/data/exercises';
import { useSessionStore } from '@/stores/sessionStore';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function SplitPickerScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const begin = useSessionStore((s) => s.begin);
  const [split, setSplit] = useState<SplitTemplate | null>(null);
  const [day, setDay] = useState<SplitDay | null>(null);

  const start = () => {
    if (!split || !day) return;
    begin('strength', {
      label: `${split.name} · ${day.label}`,
      splitKey: split.key,
      splitDay: day.key,
      prefillSlugs: day.exercises,
    });
    const id = useSessionStore.getState().activeId!;
    navigation.replace('ActiveSession', { sessionId: id });
  };

  // Preview the exercises that will be pre-loaded.
  const preview = day ? exercisesBySlugs(day.exercises) : [];

  return (
    <Screen>
      <Text variant="h1">Training split</Text>
      <Text variant="body" color="textMuted">
        Pick a split and a day — FitCoach pre-loads that day's exercises so you can just start
        lifting. You can add or remove anything once you're in.
      </Text>

      <SectionHeader title="Choose a split" />
      {SPLITS.map((s) => {
        const active = split?.key === s.key;
        return (
          <Pressable
            key={s.key}
            onPress={() => {
              setSplit(s);
              setDay(null);
            }}
          >
            <Card
              accent={s.color}
              style={{
                borderColor: active ? s.color : theme.colors.border,
                backgroundColor: active ? s.color + '18' : theme.colors.card,
                gap: 6,
              }}
            >
              <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Row gap={10} style={{ alignItems: 'center', flex: 1 }}>
                  <Icon icon={s.icon} size={22} color={s.color} />
                  <Text variant="h3" style={{ flex: 1 }}>{s.name}</Text>
                </Row>
                <Text variant="caption" color="textFaint">{s.daysPerWeek}</Text>
              </Row>
              <Text variant="caption" color="textMuted">{s.blurb}</Text>
              <Text variant="caption" color="textFaint">Best for: {s.bestFor}</Text>
            </Card>
          </Pressable>
        );
      })}

      {/* Day picker */}
      {split && (
        <>
          <SectionHeader title={`${split.name} — pick your day`} />
          <Row gap={8} style={{ flexWrap: 'wrap' }}>
            {split.days.map((d) => (
              <Chip
                key={d.key}
                label={d.label}
                active={day?.key === d.key}
                color={split.color}
                onPress={() => setDay(d)}
              />
            ))}
          </Row>
        </>
      )}

      {/* Preview */}
      {split && day && (
        <Card style={{ gap: 10 }} accent={split.color}>
          <Text variant="h3">{day.label}</Text>
          <Text variant="caption" color="textMuted">{day.blurb}</Text>
          <Row gap={6} style={{ flexWrap: 'wrap' }}>
            {day.muscles.map((m) => (
              <Chip key={m} label={MUSCLE_LABELS[m] ?? m} color={split.color} small />
            ))}
          </Row>
          <Divider />
          <Text variant="label" color="textMuted">
            {preview.length} exercises will be pre-loaded
          </Text>
          {preview.map((ex, i) => (
            <Row key={ex.id} gap={8} style={{ alignItems: 'center' }}>
              <Text variant="caption" color="textFaint" style={{ width: 18 }}>{i + 1}.</Text>
              <Icon icon={ex.iconKey} size={16} color={split.color} />
              <Text variant="body" style={{ flex: 1 }} numberOfLines={1}>{ex.name}</Text>
            </Row>
          ))}
        </Card>
      )}

      <Button
        title={day ? `Start ${day.label}` : 'Pick a split day'}
        icon="core.start"
        disabled={!day}
        color={split?.color}
        onPress={start}
      />
    </Screen>
  );
}
