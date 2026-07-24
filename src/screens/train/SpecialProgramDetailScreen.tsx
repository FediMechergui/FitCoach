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
import { LEVEL_LABEL } from '@/data/programs';
import {
  findSpecialProgram,
  specialStyleTag,
  specialWeeklyMinutes,
  type SpecialDay,
} from '@/data/specialPrograms';
import { exercisesBySlugs } from '@/repositories/exerciseRepo';
import { useSessionStore } from '@/stores/sessionStore';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type DetailRoute = RouteProp<RootStackParamList, 'SpecialProgramDetail'>;

export function SpecialProgramDetailScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<DetailRoute>();
  const program = findSpecialProgram(route.params.programKey);
  const begin = useSessionStore((s) => s.begin);
  const [openDay, setOpenDay] = useState<string | null>(null);

  if (!program) {
    return (
      <Screen>
        <Text variant="h2">Programme not found</Text>
      </Screen>
    );
  }

  const startDay = (day: SpecialDay) => {
    begin(day.sessionType, {
      label: `${program.name} · ${day.label}`,
      style: specialStyleTag(program, day),
      prefillSlugs: day.exercises,
    });
    const id = useSessionStore.getState().activeId!;
    navigation.replace('ActiveSession', { sessionId: id });
  };

  return (
    <Screen>
      {/* Header */}
      <Row gap={12} style={{ alignItems: 'center' }}>
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            backgroundColor: program.accent + '22',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon icon={program.icon} size={28} color={program.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="h1">{program.name}</Text>
          <Text variant="caption" color="textMuted">{program.tagline}</Text>
        </View>
      </Row>

      <Row gap={6} style={{ flexWrap: 'wrap' }}>
        <Badge label={LEVEL_LABEL[program.level]} color={program.accent} />
        <Chip label={`${program.daysPerWeek}×/week`} color={program.accent} small />
        <Chip label={`${program.blockWeeks} weeks`} color={program.accent} small />
        <Chip label={`~${Math.round(specialWeeklyMinutes(program) / 60)} h/week`} color={program.accent} small />
      </Row>

      {/* Story */}
      <Card accent={program.accent} style={{ gap: 8 }}>
        <View>
          <Text variant="label" color={program.accent}>Origin</Text>
          <Text variant="body" color="textMuted">{program.origin}</Text>
        </View>
        <Divider />
        <Row gap={8} style={{ alignItems: 'flex-start' }}>
          <Icon icon="core.pr" size={16} color={program.accent} />
          <Text variant="bodyStrong" style={{ flex: 1, fontStyle: 'italic' }}>{program.ethos}</Text>
        </Row>
      </Card>

      {/* Honesty + safety */}
      <Card accent={theme.colors.textFaint} style={{ gap: 6 }}>
        <Row gap={8} style={{ alignItems: 'flex-start' }}>
          <Icon icon="core.info" size={16} color={theme.colors.textFaint} />
          <View style={{ flex: 1 }}>
            <Text variant="label" color="textMuted">What's real, what's adapted</Text>
            <Text variant="caption" color="textMuted">{program.authenticityNote}</Text>
          </View>
        </Row>
        {program.safetyNote && (
          <>
            <Divider />
            <Row gap={8} style={{ alignItems: 'flex-start' }}>
              <Icon icon="core.info" size={16} color={theme.colors.warning} />
              <View style={{ flex: 1 }}>
                <Text variant="label" color={theme.colors.warning}>Train it safely</Text>
                <Text variant="caption" color="textMuted">{program.safetyNote}</Text>
              </View>
            </Row>
          </>
        )}
      </Card>

      {/* The week */}
      <SectionHeader title="The training week" />
      {program.days.map((day) => {
        const meta = metaFor(day.sessionType);
        const open = openDay === day.key;
        const preview = open ? exercisesBySlugs(day.exercises) : [];
        return (
          <Card key={day.key} accent={open ? program.accent : undefined} style={{ gap: 8 }}>
            <Pressable onPress={() => setOpenDay(open ? null : day.key)}>
              <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Row gap={10} style={{ alignItems: 'center', flex: 1 }}>
                  <Icon icon={meta.icon} size={20} color={meta.color} />
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyStrong">{day.label}</Text>
                    <Text variant="caption" color="textMuted" numberOfLines={open ? undefined : 1}>
                      {day.focus}
                    </Text>
                  </View>
                </Row>
                <Badge label={`~${day.minutes}m`} color={theme.colors.textFaint} />
              </Row>
            </Pressable>

            {open && (
              <View style={{ gap: 8 }}>
                <Divider />
                <View>
                  <Text variant="label" color={theme.colors.accent}>Prescription</Text>
                  <Text variant="caption" color="textMuted">{day.prescription}</Text>
                </View>
                <Text variant="label" color="textMuted">
                  {preview.length}/{day.exercises.length} exercises pre-loaded
                </Text>
                {preview.map((ex, i) => (
                  <Row key={ex.id} gap={8} style={{ alignItems: 'center' }}>
                    <Text variant="caption" color="textFaint" style={{ width: 18 }}>{i + 1}.</Text>
                    <Icon icon={ex.iconKey} size={16} color={meta.color} />
                    <Text variant="body" style={{ flex: 1 }} numberOfLines={1}>{ex.name}</Text>
                  </Row>
                ))}
                <Button
                  title={`Start ${day.label}`}
                  icon="core.start"
                  size="sm"
                  color={program.accent}
                  onPress={() => startDay(day)}
                />
              </View>
            )}
          </Card>
        );
      })}

      {/* The diet */}
      <SectionHeader title={program.diet.name} />
      <Card accent={theme.colors.calories} style={{ gap: 8 }}>
        <Text variant="body" color="textMuted">{program.diet.approach}</Text>
        <Row gap={8} style={{ alignItems: 'flex-start' }}>
          <Icon icon="nutrition.protein" size={16} color={theme.colors.calories} />
          <Text variant="caption" color={theme.colors.calories} style={{ flex: 1 }}>
            {program.diet.macroSlant}
          </Text>
        </Row>
        <Divider />
        <Text variant="label" color="textMuted">A day of eating</Text>
        {program.diet.sampleDay.map((meal) => (
          <Row key={meal.label} gap={8} style={{ alignItems: 'flex-start' }}>
            <Text variant="caption" color={theme.colors.calories} style={{ width: 96 }}>{meal.label}</Text>
            <Text variant="caption" color="textMuted" style={{ flex: 1 }}>{meal.detail}</Text>
          </Row>
        ))}
        {program.diet.notes.map((n, i) => (
          <Row key={i} gap={8} style={{ alignItems: 'flex-start' }}>
            <Icon icon="core.info" size={14} color={theme.colors.textFaint} />
            <Text variant="caption" color="textFaint" style={{ flex: 1 }}>{n}</Text>
          </Row>
        ))}
        <Button
          title="Build a day at my macros"
          icon="nutrition.calories"
          variant="secondary"
          size="sm"
          onPress={() => navigation.navigate('DietPlan')}
        />
      </Card>

      <Text variant="caption" color="textFaint" center>
        Days are pre-loaded, never locked — add, remove or reorder anything once the session starts.
      </Text>
    </Screen>
  );
}
