import React, { useEffect, useMemo, useState } from 'react';
import { View, Pressable, Alert, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Row, SectionHeader } from '@/components/ui/misc';
import { PageHero } from '@/components/ui/PageHero';
import type { RootStackParamList } from '@/navigation/types';
import { SESSION_TYPE_META, type SessionTypeMeta } from '@/constants/sessionTypes';
import { logPastSession } from '@/repositories/sessionRepo';
import { getExercise, type ExerciseView } from '@/repositories/exerciseRepo';
import { useExerciseDraftStore } from '@/stores/exerciseDraftStore';
import { useUserStore } from '@/stores/userStore';
import { fromISODate, todayISO } from '@/lib/date';
import { hmToMinutes, rangeMinutes, minutesToHM } from '@/lib/time';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/** Build epoch-ms for a 'YYYY-MM-DD' date + 'HH:MM' time. */
function epochFor(dateISO: string, hm: string): number | null {
  const mins = hmToMinutes(hm);
  if (mins == null) return null;
  return fromISODate(dateISO).getTime() + mins * 60_000;
}

export function LogSessionScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const weightKg = useUserStore((s) => s.currentWeightKg) ?? undefined;

  const [selected, setSelected] = useState<SessionTypeMeta | null>(null);
  const [date, setDate] = useState(todayISO());
  const [start, setStart] = useState('18:00');
  const [end, setEnd] = useState('19:00');
  const [distanceKm, setDistanceKm] = useState('');
  const [onFoot, setOnFoot] = useState(true);
  const [notes, setNotes] = useState('');

  const isCardio = selected?.flow === 'cardio';
  const durationMin = useMemo(() => rangeMinutes(start, end), [start, end]);
  const validTimes = durationMin != null && durationMin > 0;
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date);

  // Exercises picked from the library before the session exists.
  const draftIds = useExerciseDraftStore((s) => s.ids);
  const removeDraft = useExerciseDraftStore((s) => s.remove);
  const clearDraft = useExerciseDraftStore((s) => s.clear);
  // Start each visit with a clean draft list.
  useEffect(() => clearDraft, [clearDraft]);
  const draftExercises = useMemo(
    () => draftIds.map((id) => getExercise(id)).filter((e): e is ExerciseView => !!e),
    [draftIds]
  );

  const save = () => {
    if (!selected || !validTimes || !validDate) return;
    const startTime = epochFor(date, start);
    if (startTime == null) return;
    // rangeMinutes already wraps past midnight, so derive end from the duration.
    const endTime = startTime + (durationMin as number) * 60_000;

    const { session, stepsAdded } = logPastSession({
      sessionType: selected.type,
      label: selected.label,
      startTime,
      endTime,
      distanceM: isCardio && distanceKm ? Math.round(parseFloat(distanceKm) * 1000) : null,
      notes: notes.trim() || null,
      weightKg,
      onFoot: isCardio && onFoot,
      exerciseIds: draftIds,
    });
    clearDraft();
    Alert.alert(
      'Session logged ✓',
      `${selected.label} · ${minutesToHM(durationMin as number)}${
        session.caloriesBurned ? ` · ~${Math.round(session.caloriesBurned)} kcal` : ''
      }${stepsAdded > 0 ? `\n+${stepsAdded.toLocaleString()} steps added to your day` : ''}`
    );
    navigation.replace('SessionDetail', { sessionId: session.id });
  };

  return (
    <Screen>
      <PageHero icon="core.calendar" color={theme.colors.primary} title="Log a past session" subtitle="Forgot to start the timer? Record what you did after the fact — just pick the type and the start–finish time. Duration and calories are worked out for you." />

      <SectionHeader title="Type" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
        {SESSION_TYPE_META.map((m) => {
          const active = selected?.type === m.type;
          return (
            <Pressable key={m.type} onPress={() => setSelected(m)} style={{ width: '47%', flexGrow: 1 }}>
              <Card
                accent={m.color}
                style={{
                  gap: 6,
                  borderColor: active ? m.color : theme.colors.border,
                  backgroundColor: active ? m.color + '18' : theme.colors.card,
                }}
              >
                <Icon icon={m.icon} size={22} color={m.color} />
                <Text variant="bodyStrong">{m.label}</Text>
              </Card>
            </Pressable>
          );
        })}
      </View>

      <SectionHeader title="When" />
      <Card style={{ gap: theme.spacing.md }}>
        <Input label="Date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" />
        <Row>
          <View style={{ flex: 1 }}>
            <Input label="Start" value={start} onChangeText={setStart} placeholder="18:00" keyboardType="numbers-and-punctuation" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Finish" value={end} onChangeText={setEnd} placeholder="19:00" keyboardType="numbers-and-punctuation" />
          </View>
        </Row>
        <Text variant="caption" color={validTimes ? 'success' : 'warning'} center>
          {validTimes ? `Duration: ${minutesToHM(durationMin as number)}` : 'Enter times as HH:MM (finish can be past midnight)'}
        </Text>
      </Card>

      {isCardio && (
        <Card style={{ gap: theme.spacing.md }}>
          <Input label="Distance (optional)" value={distanceKm} onChangeText={setDistanceKm} placeholder="0.0" suffix="km" keyboardType="numeric" />
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text variant="bodyStrong">On foot — count as steps</Text>
              <Text variant="caption" color="textMuted">
                Adds an estimated step count to your day. Turn off for cycling, swimming or rowing.
              </Text>
            </View>
            <Switch
              value={onFoot}
              onValueChange={setOnFoot}
              trackColor={{ true: theme.colors.primary }}
            />
          </Row>
        </Card>
      )}

      {/* Exercises — available for EVERY session type, outdoor included */}
      <SectionHeader title="Exercises (optional)" />
      <Card style={{ gap: 8 }}>
        {draftExercises.length === 0 ? (
          <Text variant="caption" color="textMuted">
            Add the specific exercises or activities you did — the same library as a live session.
          </Text>
        ) : (
          draftExercises.map((ex, i) => (
            <Row key={ex.id} gap={8} style={{ alignItems: 'center' }}>
              <Text variant="caption" color="textFaint" style={{ width: 18 }}>{i + 1}.</Text>
              <Icon icon={ex.iconKey} size={16} color={theme.colors.primary} />
              <Text variant="body" style={{ flex: 1 }} numberOfLines={1}>{ex.name}</Text>
              <Pressable onPress={() => removeDraft(ex.id)} hitSlop={8}>
                <Icon icon="core.close" size={15} color={theme.colors.textFaint} />
              </Pressable>
            </Row>
          ))
        )}
        <Button
          title="Add exercise from library"
          icon="core.add"
          variant="secondary"
          size="sm"
          onPress={() =>
            navigation.navigate('ExerciseLibrary', {
              pick: true,
              draft: true,
              // Pre-filter to the type being logged (e.g. Outdoor) so the right
              // activities are front and centre.
              sessionType: selected?.type,
            })
          }
        />
      </Card>

      <Card>
        <Input label="Notes (optional)" value={notes} onChangeText={setNotes} placeholder="How it went, what you did…" />
      </Card>

      <Button
        title={selected ? `Log ${selected.label}` : 'Pick a type'}
        icon="core.check"
        onPress={save}
        disabled={!selected || !validTimes || !validDate}
        color={selected?.color}
      />
      <Text variant="caption" color="textFaint" center>
        Saved straight to your history. Open it afterwards to add the specific exercises you did.
      </Text>
    </Screen>
  );
}
