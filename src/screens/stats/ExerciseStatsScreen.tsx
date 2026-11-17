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
import { PageHero } from '@/components/ui/PageHero';
import { ExerciseHowToBlock } from '@/components/ExerciseHowTo';
import { MUSCLE_LABELS, EQUIPMENT_LABELS, SUB_MUSCLE_LABELS, WARMUPS_BY_MUSCLE } from '@/data/exercises';
import type { RootStackParamList } from '@/navigation/types';
import { exerciseProgression } from '@/repositories/statsRepo';
import { getExercise, type ExerciseView } from '@/repositories/exerciseRepo';
import type { ORMFormula } from '@/lib/oneRepMax';
import { EvidenceLink } from '@/components/EvidenceLink';
import { equipmentList, exercisePreferences, saveExercisePreference } from '@/repositories/gymRepo';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

type StatsRoute = RouteProp<RootStackParamList, 'ExerciseStats'>;

export function ExerciseStatsScreen() {
  const theme = useTheme();
  const route = useRoute<StatsRoute>();
  const { exerciseId, name } = route.params;
  const [formula, setFormula] = useState<ORMFormula>('epley');
  const [metric, setMetric] = useState<'orm' | 'volume'>('orm');
  const [equipmentId, setEquipmentId] = useState('unassigned');
  const equipment = equipmentList();
  const equipmentFilter = <SegmentedControl scrollable value={equipmentId} onChange={setEquipmentId} options={[{value:'unassigned',label:'Unassigned'}, ...equipment.map(item => ({value:String(item.id),label:item.name}))]} />;
  const exercise = useMemo(() => getExercise(exerciseId), [exerciseId]);

  const progression = useMemo(
    () => exerciseProgression(exerciseId, formula, undefined, equipmentId === 'unassigned' ? null : Number(equipmentId)),
    [exerciseId, formula, equipmentId]
  );

  if (progression.length === 0) {
    return (
      <Screen>
        <PageHero icon="stats.progression" color={theme.colors.primary} title={name} />
        {exercise && <ExerciseGuide exercise={exercise} />}
        {equipmentFilter}
        <ExerciseNotes exerciseId={exerciseId} />
        <EvidenceLink />
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
      <PageHero icon="stats.progression" color={theme.colors.primary} title={name} />
      {exercise && <ExerciseGuide exercise={exercise} />}
      <EvidenceLink />
      {equipmentFilter}
      <Text variant="caption" color="textMuted">Compare only the same machine, attachment and setup. Historical entries without a machine stay unassigned.</Text>
      <ExerciseNotes exerciseId={exerciseId} />

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

/** The shared how-to block — video, both figures, targets, warm-up, cues. */
function ExerciseGuide({ exercise }: { exercise: ExerciseView }) {
  return <ExerciseHowToBlock exercise={exercise} />;
}
function ExerciseNotes({exerciseId}:{exerciseId:number}) {
  const old = exercisePreferences().find(p=>p.exercise_id===exerciseId);
  const [aliases,setAliases] = useState(old?.aliases ?? '');
  const [notes,setNotes] = useState(old?.notes ?? '');
  const [saved,setSaved] = useState(false);
  return <Card style={{gap:8}}><Input label="Your names / translations for this exercise" value={aliases} onChangeText={v=>{setAliases(v);setSaved(false);}} /><Input label="Technique and setup notes" multiline value={notes} onChangeText={v=>{setNotes(v);setSaved(false);}} /><Button title={saved?'Saved':'Save aliases and notes'} size="sm" variant="secondary" onPress={()=>{saveExercisePreference(exerciseId,{aliases,notes});setSaved(true);}} /></Card>;
}
