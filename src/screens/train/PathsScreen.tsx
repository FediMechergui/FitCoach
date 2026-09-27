import React, { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { PageHero } from '@/components/ui/PageHero';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Rail } from '@/components/ui/Meter';
import { Row, SectionHeader } from '@/components/ui/misc';
import { DISCIPLINE_LABEL, DISCIPLINE_ORDER, TRAINING_PATHS, pathWeeks, type PathDiscipline, type TrainingPath } from '@/data/paths';
import { myPaths, type PathState } from '@/repositories/pathsRepo';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Filter = 'all' | PathDiscipline;

/**
 * Paths — pick what to become.
 *
 * The ones being walked come first, each with how far along it is. Below them
 * every path the app knows, by discipline.
 */
export function PathsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const [mine, setMine] = useState<PathState[]>([]);
  const [filter, setFilter] = useState<Filter>('all');

  useFocusEffect(
    useCallback(() => {
      try {
        setMine(myPaths());
      } catch (e) {
        console.warn('[paths] failed to read enrolments:', e);
        setMine([]);
      }
    }, [])
  );

  const begun = useMemo(() => new Set(mine.map((m) => m.path.key)), [mine]);
  const disciplines = DISCIPLINE_ORDER.filter((d) => TRAINING_PATHS.some((p) => p.discipline === d));
  const shown = disciplines.filter((d) => filter === 'all' || filter === d);

  return (
    <Screen>
      <PageHero
        icon="cardio.elevation"
        color={theme.colors.primary}
        eyebrow="The long road"
        title="Paths"
        subtitle="Choose what to become. Each path is five stages, and a stage is left by doing the work."
      />

      {mine.length > 0 && (
        <>
          <SectionHeader title="You are walking" />
          {mine.map((s) => (
            <Card key={s.path.key} accent={s.path.accent} raised onPress={() => navigation.navigate('PathDetail', { pathKey: s.path.key })} style={{ gap: 10 }}>
              <Row gap={12} style={{ alignItems: 'center' }}>
                <Tile path={s.path} />
                <View style={{ flex: 1 }}>
                  <Text variant="h3" numberOfLines={1}>
                    {s.path.name}
                  </Text>
                  <Text variant="caption" color="textMuted" numberOfLines={1}>
                    {s.completed ? 'Walked to the end' : `Stage ${s.stageIndex + 1} of ${s.path.stages.length} · ${s.stage.name}`}
                    {s.paused ? ' · paused' : ''}
                  </Text>
                </View>
                {s.gate.met && !s.completed ? <Icon icon="core.check" size={20} color={theme.colors.success} /> : <Icon icon="core.forward" size={18} color={theme.colors.textFaint} />}
              </Row>
              <Rail value={s.progress} max={1} color={s.path.accent} height={6} />
              <Text variant="caption" color={s.gate.met && !s.completed ? 'success' : 'textFaint'}>
                {s.completed
                  ? 'Every stage graduated.'
                  : s.gate.met
                    ? 'The gate is met. You can graduate this stage.'
                    : `${s.sessions} of ${s.stage.gate.sessions} sessions in this stage`}
              </Text>
            </Card>
          ))}
        </>
      )}

      <SegmentedControl
        scrollable
        value={filter}
        onChange={(v) => setFilter(v as Filter)}
        options={[{ value: 'all', label: `All · ${TRAINING_PATHS.length}` }, ...disciplines.map((d) => ({ value: d, label: DISCIPLINE_LABEL[d] }))]}
      />

      {shown.map((d) => (
        <View key={d} style={{ gap: theme.spacing.md }}>
          <SectionHeader title={DISCIPLINE_LABEL[d]} />
          {TRAINING_PATHS.filter((p) => p.discipline === d).map((p) => (
            <Card
              key={p.key}
              accent={p.accent}
              onPress={() => navigation.navigate('PathDetail', { pathKey: p.key })}
              style={{ gap: 8 }}
            >
              <Row gap={12} style={{ alignItems: 'center' }}>
                <Tile path={p} />
                <View style={{ flex: 1 }}>
                  <Text variant="h3" numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Text variant="caption" color="textMuted" numberOfLines={2}>
                    {p.tagline}
                  </Text>
                </View>
              </Row>
              <Row gap={8} style={{ flexWrap: 'wrap' }}>
                <Chip label={`${p.stages.length} stages`} />
                <Chip label={`about ${pathWeeks(p)} weeks`} />
                <Chip label={`${p.stages[0].sessionsPerWeek} to ${Math.max(...p.stages.map((s) => s.sessionsPerWeek))} a week`} />
                {begun.has(p.key) ? <Chip label="begun" tint={p.accent} /> : null}
              </Row>
            </Card>
          ))}
        </View>
      ))}

      <Text variant="caption" color="textFaint" center>
        A path can plan the work and count it. It cannot watch you move: every one of these says where a coach, a club or a partner is needed.
      </Text>
    </Screen>
  );
}

function Tile({ path }: { path: TrainingPath }) {
  const theme = useTheme();
  return (
    <View
      style={{
        width: 48,
        height: 48,
        borderRadius: theme.radius.md,
        backgroundColor: theme.alpha.tint14(path.accent),
        borderWidth: 1.5,
        borderColor: theme.alpha.tint22(path.accent),
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: path.accent,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.28,
        shadowRadius: 5,
      }}
    >
      <Icon icon={path.icon} size={25} color={path.accent} />
    </View>
  );
}


function Chip({ label, tint }: { label: string; tint?: string }) {
  const theme = useTheme();
  return (
    <View
      style={{
        paddingHorizontal: 9,
        paddingVertical: 3,
        borderRadius: theme.radius.pill,
        backgroundColor: tint ? theme.alpha.tint14(tint) : theme.colors.surfaceAlt,
      }}
    >
      <Text variant="caption" color="textMuted">
        {label}
      </Text>
    </View>
  );
}
