import React, { useCallback, useState } from 'react';
import { View, Alert, Pressable } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatTile } from '@/components/ui/StatTile';
import { Row, Divider, SectionHeader, Badge } from '@/components/ui/misc';
import type { RootStackParamList } from '@/navigation/types';
import {
  addSet,
  deleteSet,
  deleteSession,
  getSessionDetail,
  removeExerciseLog,
  sessionCalorieBreakdown,
  type ExerciseLogView,
  type SessionDetail,
} from '@/repositories/sessionRepo';
import { metaFor, MOOD_EMOJI } from '@/constants/sessionTypes';
import { EnergyBalanceCard } from '@/components/EnergyBalanceCard';
import { toISODate } from '@/lib/date';
import { formatDurationLong, formatDistance, formatPace, formatDuration } from '@/lib/format';
import type { SetEntry } from '@/db/schema';
import { useUserStore } from '@/stores/userStore';
import { PostSessionCard } from '@/components/PostSessionCard';
import { postSessionFor } from '@/repositories/postSessionRepo';
import { saveRoutine, sessionExerciseIds, findRoutineByName } from '@/repositories/routinesRepo';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type DetailRoute = RouteProp<RootStackParamList, 'SessionDetail'>;

/** Human-readable one-liner for a logged set (reps/weight, or time/distance). */
function describeSet(s: SetEntry): string {
  const parts: string[] = [];
  if (s.weightKg != null) parts.push(`${s.weightKg} kg`);
  if (s.reps != null) parts.push(`${s.reps} reps`);
  if (s.durationS != null) parts.push(formatDuration(s.durationS));
  if (s.distanceM != null) parts.push(`${(s.distanceM / 1000).toFixed(2)} km`);
  if (s.toFailure) parts.push('to failure');
  else if (s.rpe != null) parts.push(`RPE ${s.rpe}`);
  return parts.join(' · ') || '—';
}

function fieldsFor(t: ExerciseLogView['trackingType']) {
  return {
    weight: t === 'reps_weight',
    reps: t === 'reps_weight' || t === 'reps_only' || t === 'custom',
    duration: t === 'duration' || t === 'duration_distance',
    distance: t === 'distance' || t === 'duration_distance',
  };
}

export function SessionDetailScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<DetailRoute>();
  const sessionId = route.params.sessionId;
  const unit = useUserStore((s) => s.user?.unitPreference ?? 'metric');
  const bodyKg = useUserStore((s) => s.currentWeightKg) ?? 75;
  const [detail, setDetail] = useState<SessionDetail>(() => getSessionDetail(sessionId));
  const [editing, setEditing] = useState(false);
  const justFinished = route.params.justFinished ?? false;
  const [after, setAfter] = useState(() => postSessionFor(sessionId));

  const reload = useCallback(() => {
    setDetail(getSessionDetail(sessionId));
    // The margins scale with what is logged, so they refresh with the logs.
    setAfter(postSessionFor(sessionId));
  }, [sessionId]);
  useFocusEffect(useCallback(() => reload(), [reload]));

  const { session, logs } = detail;
  const meta = metaFor(session.sessionType);
  const isLifting = meta.flow === 'lifting';
  // Real per-exercise calorie split, recomputed on read from each movement's MET.
  const burn = sessionCalorieBreakdown(detail, bodyKg);
  // Passed fresh from the finish; derived from the PR flags for any later visit.
  const prCount = route.params.prCount ?? logs.flatMap((l) => l.sets).filter((x) => x.isPr).length;

  const confirmDelete = () => {
    Alert.alert('Delete session?', 'This permanently removes it from your history and stats.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteSession(session.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <Screen>
      {/* Just finished — the recap moment lives here now, on the same screen
          that can edit, price and delete the session. */}
      {justFinished && (
        <View style={{ alignItems: 'center', gap: 8, paddingVertical: theme.spacing.md }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: meta.color,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon icon="core.check" size={40} color="#fff" />
          </View>
          <Text variant="h1">Nice work!</Text>
          <Text variant="body" color="textMuted">
            {meta.label} session complete
          </Text>
          {prCount > 0 && <Badge label={`${prCount} new PR${prCount === 1 ? '' : 's'} 🏆`} color={theme.colors.warning} />}
        </View>
      )}

      <Row gap={12} style={{ alignItems: 'center' }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 16,
            backgroundColor: theme.alpha.tint14(meta.color),
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon icon={meta.icon} size={26} color={meta.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="h2">{session.label ?? meta.label}</Text>
          <Text variant="caption" color="textMuted">
            {new Date(session.startTime).toLocaleString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </Row>

      <Row>
        <StatTile icon="core.timer" label="Duration" value={formatDurationLong(session.durationS ?? 0)} />
        <StatTile icon="nutrition.calories" label="Calories" value={`${Math.round(session.caloriesBurned ?? 0)}`} sub="kcal" accent={theme.colors.calories} />
      </Row>

      {isLifting ? (
        <Row>
          <StatTile icon="stats.volume" label="Volume" value={`${Math.round(session.totalVolume ?? 0).toLocaleString()}`} sub="kg" accent={theme.colors.primary} />
          <StatTile icon="strength.dumbbell" label="Exercises" value={`${logs.length}`} />
        </Row>
      ) : session.distanceM ? (
        <Row>
          <StatTile icon="cardio.gps" label="Distance" value={formatDistance(session.distanceM, unit)} accent={theme.colors.outdoor} />
          <StatTile icon="cardio.pace" label="Pace" value={formatPace(session.pace, unit)} />
        </Row>
      ) : null}

      {justFinished && route.params.stepsAdded ? (
        <Card accent={theme.colors.primary}>
          <Row gap={8} style={{ alignItems: 'center' }}>
            <Icon icon="cardio.walk" size={18} color={theme.colors.primary} />
            <Text variant="body" style={{ flex: 1 }}>
              +{route.params.stepsAdded.toLocaleString()} steps added to today's count
            </Text>
          </Row>
        </Card>
      ) : null}

      {(session.moodBefore || session.moodAfter) && (
        <Card>
          <Row style={{ justifyContent: 'space-around', alignItems: 'center' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 30 }}>{session.moodBefore ? MOOD_EMOJI[session.moodBefore - 1] : '—'}</Text>
              <Text variant="caption" color="textMuted">Before</Text>
            </View>
            <Icon icon="core.forward" color={theme.colors.textFaint} />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 30 }}>{session.moodAfter ? MOOD_EMOJI[session.moodAfter - 1] : '—'}</Text>
              <Text variant="caption" color="textMuted">After</Text>
            </View>
          </Row>
        </Card>
      )}

      {session.notes ? (
        <Card>
          <Text variant="label" color="textMuted">Notes</Text>
          <Text variant="body">{session.notes}</Text>
        </Card>
      ) : null}

      {/* The margins after this session — alive for 12 hours, then history. */}
      {after && Date.now() - after.endedAt < 12 * 3_600_000 && (
        <PostSessionCard endedAt={after.endedAt} strain={after.strain} margins={after.margins} />
      )}

      {/* Where this day's training leaves your calorie goal + the over-training line */}
      <EnergyBalanceCard date={toISODate(new Date(session.startTime))} />

      {/* Exercises — editable for any session type (fixes adding to logged/premade sessions) */}
      <SectionHeader
        title="Exercises"
        action={editing ? 'Done' : 'Edit'}
        onAction={() => setEditing((e) => !e)}
      />
      {logs.length === 0 && !editing ? (
        <Card style={{ borderStyle: 'dashed' }}>
          <Text variant="body" color="textFaint" center>No exercises logged. Tap “Edit” to add some.</Text>
        </Card>
      ) : (
        <Card style={{ gap: 12 }}>
          {logs.map((lv, idx) => (
            <View key={lv.log.id} style={{ gap: 6 }}>
              {idx > 0 ? <Divider /> : null}
              <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Row gap={8} style={{ alignItems: 'center', flex: 1 }}>
                  <Icon icon={lv.iconKey} size={18} color={theme.colors.primary} />
                  <Text variant="bodyStrong" style={{ flex: 1 }}>{lv.exerciseName}</Text>
                </Row>
                {burn.byLogId[lv.log.id] > 0 && (
                  <Text variant="caption" color={theme.colors.calories} style={{ fontVariant: ['tabular-nums'] }}>
                    {Math.round(burn.byLogId[lv.log.id])} kcal
                  </Text>
                )}
                {editing && (
                  <Pressable onPress={() => { removeExerciseLog(lv.log.id); reload(); }} hitSlop={8} style={{ marginLeft: 8 }}>
                    <Icon icon="core.delete" size={16} color={theme.colors.textFaint} />
                  </Pressable>
                )}
              </Row>
              {lv.sets.map((s) => (
                <Row key={s.id} style={{ paddingLeft: 26, alignItems: 'center' }}>
                  <Text variant="caption" color="textFaint" style={{ width: 30 }}>#{s.setNumber}</Text>
                  <Text variant="body" style={{ flex: 1 }}>{describeSet(s)}</Text>
                  {s.isPr ? (
                    <Icon icon="core.pr" size={15} color={theme.colors.warning} />
                  ) : editing ? (
                    <Pressable onPress={() => { deleteSet(s.id); reload(); }} hitSlop={6}>
                      <Icon icon="core.close" size={14} color={theme.colors.textFaint} />
                    </Pressable>
                  ) : null}
                </Row>
              ))}
              {editing && <AddSetRow lv={lv} onAdded={reload} />}
            </View>
          ))}
          {editing && (
            <Button
              title="Add exercise"
              icon="core.add"
              variant="secondary"
              onPress={() => navigation.navigate('ExerciseLibrary', { pick: true, sessionId })}
            />
          )}
        </Card>
      )}
      {burn.basis === 'per-exercise' && logs.length > 0 && !editing && (
        <Text variant="caption" color="textFaint" style={{ marginTop: -4 }}>
          Calories are attributed to each movement from its own effort (MET) and time at your
          bodyweight{burn.restCalories > 0
            ? ` — plus ${Math.round(burn.restCalories)} kcal over ${Math.round(burn.restSeconds / 60)} min of rest between sets, priced at recovery rate, not at the exercise's.`
            : ' — so heavier, harder work shows its real share.'}
        </Text>
      )}

      {/* Any session with exercises can be saved as a reusable routine — the
          only place routines are born, so it survives the recap's death. */}
      {logs.length > 0 && <SaveAsRoutine sessionId={session.id} defaultName={session.label} />}

      {justFinished && <Button title="Done" icon="core.check" onPress={() => navigation.navigate('Main')} />}
      <Button title="Delete Session" variant="ghost" icon="core.delete" onPress={confirmDelete} color={theme.colors.danger} />
    </Screen>
  );
}

/** Inline "log a set" row on a finished session, adapting inputs to the exercise. */
function AddSetRow({ lv, onAdded }: { lv: ExerciseLogView; onAdded: () => void }) {
  const theme = useTheme();
  const f = fieldsFor(lv.trackingType);
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [minutes, setMinutes] = useState('');
  const [distanceKm, setDistanceKm] = useState('');

  const add = () => {
    addSet(lv.log.id, {
      reps: f.reps && reps ? parseInt(reps, 10) : null,
      weightKg: f.weight && weight ? parseFloat(weight) : null,
      durationS: f.duration && minutes ? Math.round(parseFloat(minutes) * 60) : null,
      distanceM: f.distance && distanceKm ? Math.round(parseFloat(distanceKm) * 1000) : null,
    });
    setReps(''); setWeight(''); setMinutes(''); setDistanceKm('');
    onAdded();
  };

  return (
    <Row style={{ alignItems: 'flex-end', paddingLeft: 26 }} gap={6}>
      {f.weight && <View style={{ flex: 1 }}><Input label="kg" value={weight} onChangeText={setWeight} placeholder="0" keyboardType="numeric" /></View>}
      {f.reps && <View style={{ flex: 1 }}><Input label="reps" value={reps} onChangeText={setReps} placeholder="0" keyboardType="numeric" /></View>}
      {f.duration && <View style={{ flex: 1 }}><Input label="min" value={minutes} onChangeText={setMinutes} placeholder="0" keyboardType="numeric" /></View>}
      {f.distance && <View style={{ flex: 1 }}><Input label="km" value={distanceKm} onChangeText={setDistanceKm} placeholder="0" keyboardType="numeric" /></View>}
      <Button title="Add" size="sm" icon="core.add" onPress={add} fullWidth={false} color={theme.colors.primary} />
    </Row>
  );
}


/**
 * Save (or update) this session's exercise list as a reusable custom routine.
 * Saving under an existing name updates that routine — templates stay current.
 */
function SaveAsRoutine({ sessionId, defaultName }: { sessionId: number; defaultName: string | null }) {
  const theme = useTheme();
  const [name, setName] = useState(defaultName ?? '');
  const [savedAs, setSavedAs] = useState<string | null>(null);

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const existed = !!findRoutineByName(trimmed);
    saveRoutine(trimmed, sessionExerciseIds(sessionId));
    setSavedAs(existed ? `Updated routine “${trimmed}”` : `Saved routine “${trimmed}”`);
  };

  return (
    <Card style={{ gap: 10 }} accent={theme.colors.primary}>
      <Row gap={8} style={{ alignItems: 'center' }}>
        <Icon icon="core.custom" size={18} color={theme.colors.primary} />
        <Text variant="h3" style={{ flex: 1 }}>Save as routine</Text>
      </Row>
      {savedAs ? (
        <Row gap={8} style={{ alignItems: 'center' }}>
          <Icon icon="core.check" size={18} color={theme.colors.success} />
          <Text variant="body" color="success">{savedAs}</Text>
        </Row>
      ) : (
        <>
          <Text variant="caption" color="textMuted">
            Reuse this exact workout later from the Train tab. Saving with an existing name
            updates that routine.
          </Text>
          <Row style={{ alignItems: 'flex-end' }}>
            <View style={{ flex: 2 }}>
              <Input value={name} onChangeText={setName} placeholder="e.g. My Push Day" />
            </View>
            <Button title="Save" size="sm" onPress={save} disabled={!name.trim()} style={{ flex: 1 }} fullWidth={false} />
          </Row>
        </>
      )}
    </Card>
  );
}
