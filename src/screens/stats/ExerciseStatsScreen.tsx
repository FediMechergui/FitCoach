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
import { Row, SectionHeader, EmptyState } from '@/components/ui/misc';
import { ExerciseHero } from '@/components/ExerciseHero';
import type { RootStackParamList } from '@/navigation/types';
import { exerciseProgression } from '@/repositories/statsRepo';
import { getExercise } from '@/repositories/exerciseRepo';
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
        {exercise ? <ExerciseHero iconKey={exercise.iconKey} sessionType={exercise.sessionType} size="banner" /> : null}
        <Text variant="h1">{name}</Text>
        {exercise?.description ? (
          <Text variant="body" color="textMuted">
            {exercise.description}
          </Text>
        ) : null}
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
      {exercise ? <ExerciseHero iconKey={exercise.iconKey} sessionType={exercise.sessionType} size="banner" /> : null}
      <Text variant="h1">{name}</Text>

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
