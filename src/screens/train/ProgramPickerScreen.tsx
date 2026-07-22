import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Row, SectionHeader, Badge, Divider } from '@/components/ui/misc';
import type { RootStackParamList } from '@/navigation/types';
import { metaFor } from '@/constants/sessionTypes';
import {
  LEVEL_LABEL,
  programStyleTag,
  programsFor,
  weeklyMinutes,
  type ProgramDay,
  type TrainingProgram,
} from '@/data/programs';
import { findMethod } from '@/data/trainingMethods';
import { exercisesBySlugs } from '@/repositories/exerciseRepo';
import { useSessionStore } from '@/stores/sessionStore';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type ProgramRoute = RouteProp<RootStackParamList, 'ProgramPicker'>;

const LEVEL_COLOR: Record<string, string> = {
  beginner: '#3FBF7F',
  intermediate: '#E8A33D',
  advanced: '#E5533D',
};

export function ProgramPickerScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<ProgramRoute>();
  const sessionType = route.params.sessionType;
  const meta = metaFor(sessionType);
  const begin = useSessionStore((s) => s.begin);

  const programs = programsFor(sessionType);
  const [program, setProgram] = useState<TrainingProgram | null>(programs.length === 1 ? programs[0] : null);
  const [day, setDay] = useState<ProgramDay | null>(null);

  const start = () => {
    if (!program || !day) return;
    begin(sessionType, {
      label: `${program.name} · ${day.label}`,
      // Tagged so history can group every "Fight Camp — sparring" together and
      // show real progress within the day, not across unrelated sessions.
      style: programStyleTag(program, day),
      prefillSlugs: day.exercises,
    });
    const id = useSessionStore.getState().activeId!;
    navigation.replace('ActiveSession', { sessionId: id });
  };

  const preview = day ? exercisesBySlugs(day.exercises) : [];
  const method = day?.method ? findMethod(day.method) : undefined;

  if (programs.length === 0) {
    return (
      <Screen>
        <Text variant="h1">{meta.label} programs</Text>
        <Text variant="body" color="textMuted">
          No pre-built program for this category yet — pick a method instead, or start a free session.
        </Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Row gap={12} style={{ alignItems: 'center' }}>
        <Icon icon={meta.icon} size={26} color={meta.color} />
        <View style={{ flex: 1 }}>
          <Text variant="h1">{meta.label} programs</Text>
          <Text variant="caption" color="textMuted">
            A whole week planned out — pick the program, then today's day.
          </Text>
        </View>
      </Row>

      <SectionHeader title="Choose a program" />
      {programs.map((p) => {
        const active = program?.key === p.key;
        return (
          <Pressable
            key={p.key}
            onPress={() => {
              setProgram(active ? null : p);
              setDay(null);
            }}
          >
            <Card
              accent={meta.color}
              style={{
                borderColor: active ? meta.color : theme.colors.border,
                backgroundColor: active ? meta.color + '18' : theme.colors.card,
                gap: 6,
              }}
            >
              <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Row gap={10} style={{ alignItems: 'center', flex: 1 }}>
                  <Icon icon={p.icon} size={22} color={meta.color} />
                  <Text variant="h3" style={{ flex: 1 }}>{p.name}</Text>
                </Row>
                <Badge label={LEVEL_LABEL[p.level]} color={LEVEL_COLOR[p.level]} />
              </Row>
              <Text variant="caption" color="textMuted">{p.blurb}</Text>
              <Row gap={8} style={{ flexWrap: 'wrap' }}>
                <Chip label={`${p.daysPerWeek}×/week`} color={meta.color} small />
                <Chip label={`${p.blockWeeks} weeks`} color={meta.color} small />
                <Chip label={`~${Math.round(weeklyMinutes(p) / 60)} h/week`} color={meta.color} small />
              </Row>
              <Text variant="caption" color="textFaint">Best for: {p.bestFor}</Text>
            </Card>
          </Pressable>
        );
      })}

      {program && (
        <>
          {/* What actually tells you the program is working. */}
          <Card style={{ gap: 4 }} accent={theme.colors.accent}>
            <Text variant="label" color={theme.colors.accent}>How you'll know it's working</Text>
            <Text variant="caption" color="textMuted">{program.progressMarker}</Text>
          </Card>

          <SectionHeader title={`${program.name} — pick your day`} />
          <Row gap={8} style={{ flexWrap: 'wrap' }}>
            {program.days.map((d) => (
              <Chip
                key={d.key}
                label={d.label}
                active={day?.key === d.key}
                color={meta.color}
                onPress={() => setDay(day?.key === d.key ? null : d)}
              />
            ))}
          </Row>
        </>
      )}

      {program && day && (
        <Card style={{ gap: 10 }} accent={meta.color}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="h3" style={{ flex: 1 }}>{day.label}</Text>
            <Badge label={`~${day.minutes}m`} color={theme.colors.textFaint} />
          </Row>
          <Text variant="caption" color="textMuted">{day.purpose}</Text>

          <Divider />
          <View>
            <Text variant="label" color={theme.colors.accent}>Prescription</Text>
            <Text variant="caption" color="textMuted">{day.prescription}</Text>
          </View>
          {method && (
            <View>
              <Text variant="label" color={theme.colors.accent}>Method · {method.label}</Text>
              <Text variant="caption" color="textMuted">{method.progressNote}</Text>
            </View>
          )}

          <Divider />
          <Text variant="label" color="textMuted">
            {preview.length} {preview.length === 1 ? 'exercise' : 'exercises'} will be pre-loaded
          </Text>
          {preview.map((ex, i) => (
            <Row key={ex.id} gap={8} style={{ alignItems: 'center' }}>
              <Text variant="caption" color="textFaint" style={{ width: 18 }}>{i + 1}.</Text>
              <Icon icon={ex.iconKey} size={16} color={meta.color} />
              <Text variant="body" style={{ flex: 1 }} numberOfLines={1}>{ex.name}</Text>
            </Row>
          ))}
          {preview.length < day.exercises.length && (
            <Text variant="caption" color="textFaint">
              Some of this day's exercises aren't in your library yet — add them from the library once
              you're in the session.
            </Text>
          )}
        </Card>
      )}

      <Button
        title={day ? `Start ${day.label}` : 'Pick a day'}
        icon="core.start"
        disabled={!day}
        color={meta.color}
        onPress={start}
      />
      <Text variant="caption" color="textFaint" center>
        Days are pre-loaded, never locked — add, remove or reorder anything once the session starts.
      </Text>
    </Screen>
  );
}
