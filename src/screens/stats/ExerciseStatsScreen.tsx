import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { StatTile } from '@/components/ui/StatTile';
import { LineChart } from '@/components/charts/LineChart';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Row, SectionHeader, EmptyState, Divider } from '@/components/ui/misc';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { ExerciseIllustration } from '@/components/ExerciseIllustration';
import { MUSCLE_LABELS, EQUIPMENT_LABELS } from '@/data/exercises';
import type { RootStackParamList } from '@/navigation/types';
import { exerciseProgression } from '@/repositories/statsRepo';
import { getExercise, type ExerciseView } from '@/repositories/exerciseRepo';
import type { ORMFormula } from '@/lib/oneRepMax';

type StatsRoute = RouteProp<RootStackParamList, 'ExerciseStats'>;

export function ExerciseStatsScreen() {
  const theme = useTheme();
  const route = useRoute<StatsRoute>();
  const { exerciseId, name } = route.params;
  const [formula, setFormula] = useState<ORMFormula>('epley');
  const [metric, setMetric] = useState<'orm' | 'volume'>('orm');
  const exercise = useMemo(() => getExercise(exerciseId), [exerciseId]);

  const progression = useMemo(
    () => exerciseProgression(exerciseId, formula),
    [exerciseId, formula]
  );

  if (progression.length === 0) {
    return (
      <Screen>
        <Text variant="h1">{name}</Text>
        {exercise && <ExerciseGuide exercise={exercise} />}
        <EmptyState
          icon="stats.progression"
          title="No history yet"
          message="Log this exercise in a session to see progression charts."
        />
      </Screen>
    );
  }

  const best1RM = Math.max(...progression.map((p) => p.best1RM));
  const topWeight = Math.max(...progression.map((p) => p.topWeight));
  const totalVolume = progression.reduce((s, p) => s + p.volume, 0);
  const series = progression.map((p, i) => ({
    x: i,
    y: metric === 'orm' ? p.best1RM : p.volume,
    label: p.date,
  }));

  return (
    <Screen>
      <Text variant="h1">{name}</Text>
      {exercise && <ExerciseGuide exercise={exercise} />}

      <Row>
        <StatTile icon="core.pr" label="Best est. 1RM" value={`${Math.round(best1RM)}`} sub="kg" accent={theme.colors.warning} />
        <StatTile icon="strength.barbell" label="Top weight" value={`${Math.round(topWeight)}`} sub="kg" accent={theme.colors.primary} />
      </Row>
      <Row>
        <StatTile icon="stats.volume" label="Total volume" value={`${Math.round(totalVolume / 1000)}k`} sub="kg all-time" accent={theme.colors.accent} />
        <StatTile icon="core.calendar" label="Sessions" value={`${progression.length}`} />
      </Row>

      <SectionHeader title="Progression" />
      <SegmentedControl
        options={[
          { value: 'orm', label: 'Est. 1RM' },
          { value: 'volume', label: 'Volume' },
        ]}
        value={metric}
        onChange={setMetric}
      />
      <Card>
        <LineChart
          data={series}
          color={metric === 'orm' ? theme.colors.warning : theme.colors.primary}
          yFormat={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : `${Math.round(v)}`)}
        />
      </Card>

      {metric === 'orm' && (
        <View>
          <Text variant="label" color="textMuted" style={{ marginBottom: 6 }}>
            1RM formula
          </Text>
          <SegmentedControl
            options={[
              { value: 'epley', label: 'Epley' },
              { value: 'brzycki', label: 'Brzycki' },
            ]}
            value={formula}
            onChange={setFormula}
          />
        </View>
      )}
    </Screen>
  );
}

/**
 * Beginner guide block: a movement illustration, what it works, what equipment
 * you need, and step-by-step form cues. Shown above the progression charts.
 */
function ExerciseGuide({ exercise }: { exercise: ExerciseView }) {
  const theme = useTheme();
  return (
    <>
      <ExerciseIllustration pattern={exercise.pattern} sessionType={exercise.sessionType} size={170} />

      <Row gap={6} style={{ flexWrap: 'wrap' }}>
        {exercise.primaryMuscle && (
          <Chip
            label={MUSCLE_LABELS[exercise.primaryMuscle] ?? exercise.primaryMuscle}
            icon="stats.muscleMap"
            color={theme.colors.primary}
            small
          />
        )}
        {exercise.equipmentType && (
          <Chip
            label={EQUIPMENT_LABELS[exercise.equipmentType] ?? exercise.equipmentType}
            icon={exercise.iconKey}
            color={theme.colors.accent}
            small
          />
        )}
        {exercise.muscleGroups.slice(0, 3).map((m) => (
          <Chip key={m} label={m} color={theme.colors.textMuted} small />
        ))}
      </Row>

      {exercise.description ? (
        <Text variant="body" color="textMuted">
          {exercise.description}
        </Text>
      ) : null}

      {exercise.instructions.length > 0 && (
        <Card style={{ gap: 10 }} accent={theme.colors.accent}>
          <Row gap={8} style={{ alignItems: 'center' }}>
            <Icon icon="core.info" size={18} color={theme.colors.accent} />
            <Text variant="h3">How to do it</Text>
          </Row>
          {exercise.instructions.map((step, i) => (
            <View key={i}>
              {i > 0 ? <Divider /> : null}
              <Row gap={10} style={{ alignItems: 'flex-start' }}>
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: theme.colors.accent + '33',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text variant="caption" color={theme.colors.accent} style={{ fontSize: 10 }}>
                    {i + 1}
                  </Text>
                </View>
                <Text variant="body" color="textMuted" style={{ flex: 1 }}>
                  {step}
                </Text>
              </Row>
            </View>
          ))}
        </Card>
      )}
    </>
  );
}
