import React, { useEffect, useMemo, useState } from 'react';
import { View, Pressable, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Row, Divider, EmptyState } from '@/components/ui/misc';
import type { RootStackParamList } from '@/navigation/types';
import { useSessionStore } from '@/stores/sessionStore';
import { metaFor, MOOD_EMOJI, MOOD_LABELS } from '@/constants/sessionTypes';
import { WARMUPS_BY_MUSCLE, MUSCLE_LABELS } from '@/data/exercises';
import { formatDuration } from '@/lib/format';
import type { ExerciseLogView } from '@/repositories/sessionRepo';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const REST_PRESETS = [60, 90, 120, 180];

export function ActiveSessionScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const store = useSessionStore();
  const { sessionType, startedAt, detail } = store;
  const meta = sessionType ? metaFor(sessionType) : null;
  const flow = meta?.flow ?? 'lifting';

  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const t = setInterval(() => {
      if (startedAt) setElapsed(Math.round((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [startedAt]);

  // Cardio / mind-body captured fields
  const [distanceKm, setDistanceKm] = useState('');
  const [elevation, setElevation] = useState('');
  const [score, setScore] = useState('');
  const [style, setStyle] = useState('');
  const [moodAfter, setMoodAfter] = useState<number | null>(null);

  const endSession = () => {
    const activity =
      flow === 'cardio'
        ? {
            distanceM: distanceKm ? parseFloat(distanceKm) * 1000 : null,
            elevationM: elevation ? parseFloat(elevation) : null,
            score: score || null,
            pace:
              distanceKm && parseFloat(distanceKm) > 0
                ? elapsed / parseFloat(distanceKm)
                : null,
          }
        : undefined;
    const result = store.finish({
      moodAfter: flow === 'mindbody' ? moodAfter : null,
      activity,
      notes: style || null,
    });
    if (result) {
      navigation.replace('SessionRecap', { sessionId: result.session.id, prCount: result.prCount });
    }
  };

  const confirmCancel = () => {
    Alert.alert('Discard session?', 'This will delete the in-progress session.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          store.cancel();
          navigation.navigate('Main');
        },
      },
    ]);
  };

  if (!store.activeId || !meta) {
    return (
      <Screen>
        <EmptyState title="No active session" message="Start one from the Train tab." />
        <Button title="Back" onPress={() => navigation.navigate('Main')} />
      </Screen>
    );
  }

  return (
    <Screen>
      {/* Timer header */}
      <Card accent={meta.color}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Row gap={10} style={{ alignItems: 'center' }}>
            <Icon icon={meta.icon} size={24} color={meta.color} />
            <View>
              <Text variant="h3">{meta.label}</Text>
              <Text variant="caption" color="textMuted">
                In progress
              </Text>
            </View>
          </Row>
          <Text variant="display" style={{ fontVariant: ['tabular-nums'], color: meta.color }}>
            {formatDuration(elapsed)}
          </Text>
        </Row>
      </Card>

      <RestTimerBanner />

      {flow === 'lifting' && <LiftingSection detail={detail?.logs ?? []} accent={meta.color} />}

      {flow === 'cardio' && (
        <Card style={{ gap: theme.spacing.md }}>
          <Text variant="h3">Session details</Text>
          <Row>
            <View style={{ flex: 1 }}>
              <Input
                label="Distance"
                value={distanceKm}
                onChangeText={setDistanceKm}
                placeholder="0.0"
                suffix="km"
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Elevation"
                value={elevation}
                onChangeText={setElevation}
                placeholder="0"
                suffix="m"
                keyboardType="numeric"
              />
            </View>
          </Row>
          {(sessionType === 'sport') && (
            <Input label="Score / notes (optional)" value={score} onChangeText={setScore} placeholder="e.g. 6-4, 6-3" />
          )}
          <Text variant="caption" color="textFaint">
            Distance & elevation are optional — duration and estimated calories are always
            captured. Live GPS route arrives in Phase 2.
          </Text>
        </Card>
      )}

      {flow === 'mindbody' && (
        <Card style={{ gap: theme.spacing.md }}>
          <Text variant="h3">Session details</Text>
          <Input
            label="Technique / style (optional)"
            value={style}
            onChangeText={setStyle}
            placeholder={sessionType === 'meditation' ? 'e.g. box breathing' : 'e.g. vinyasa'}
          />
          <Text variant="label" color="textMuted">
            How do you feel now? (after)
          </Text>
          <Row style={{ justifyContent: 'space-between' }}>
            {MOOD_EMOJI.map((emoji, i) => (
              <Pressable key={i} onPress={() => setMoodAfter(i + 1)} style={{ alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 28, opacity: moodAfter === i + 1 ? 1 : 0.4 }}>{emoji}</Text>
                <Text variant="caption" color={moodAfter === i + 1 ? 'text' : 'textFaint'}>
                  {MOOD_LABELS[i]}
                </Text>
              </Pressable>
            ))}
          </Row>
        </Card>
      )}

      <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
        <Button title="End Session" icon="core.end" onPress={endSession} color={meta.color} />
        <Button title="Discard" variant="ghost" onPress={confirmCancel} />
      </View>
    </Screen>
  );
}

// ── Rest timer banner ─────────────────────────────────────────────────────────
function RestTimerBanner() {
  const theme = useTheme();
  const restEndsAt = useSessionStore((s) => s.restEndsAt);
  const clearRest = useSessionStore((s) => s.clearRest);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!restEndsAt) return;
    const t = setInterval(() => {
      const r = Math.max(0, Math.round((restEndsAt - Date.now()) / 1000));
      setRemaining(r);
      if (r <= 0) clearRest();
    }, 250);
    return () => clearInterval(t);
  }, [restEndsAt, clearRest]);

  if (!restEndsAt || remaining <= 0) return null;
  return (
    <Card accent={theme.colors.warning}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Row gap={10} style={{ alignItems: 'center' }}>
          <Icon icon="core.timer" color={theme.colors.warning} />
          <Text variant="bodyStrong">Rest</Text>
        </Row>
        <Text variant="h2" style={{ fontVariant: ['tabular-nums'], color: theme.colors.warning }}>
          {formatDuration(remaining)}
        </Text>
        <Pressable onPress={clearRest} hitSlop={8}>
          <Text variant="label" color="textMuted">
            Skip
          </Text>
        </Pressable>
      </Row>
    </Card>
  );
}

// ── Lifting section (strength / calisthenics) ────────────────────────────────
function LiftingSection({ detail, accent }: { detail: ExerciseLogView[]; accent: string }) {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();

  const totalVolume = useMemo(
    () =>
      detail.reduce(
        (sum, lv) =>
          sum + lv.sets.reduce((v, s) => v + (s.completed && s.weightKg && s.reps ? s.weightKg * s.reps : 0), 0),
        0
      ),
    [detail]
  );

  return (
    <View style={{ gap: theme.spacing.md }}>
      {detail.length > 0 && <WarmupChecklist detail={detail} />}

      {detail.length > 0 && (
        <Row style={{ justifyContent: 'space-between' }}>
          <Text variant="label" color="textMuted">
            {detail.length} exercise{detail.length === 1 ? '' : 's'}
          </Text>
          <Text variant="label" color="textMuted">
            Volume {Math.round(totalVolume).toLocaleString()} kg
          </Text>
        </Row>
      )}

      {detail.length === 0 ? (
        <EmptyState
          icon="strength.dumbbell"
          title="Add your first exercise"
          message="Pick from the library, then log sets as you go."
        />
      ) : (
        detail.map((lv) => <ExerciseLogCard key={lv.log.id} lv={lv} accent={accent} />)
      )}

      <Button
        title="Add Exercise"
        icon="core.add"
        variant="secondary"
        onPress={() => navigation.navigate('ExerciseLibrary', { pick: true })}
      />
    </View>
  );
}

function ExerciseLogCard({ lv, accent }: { lv: ExerciseLogView; accent: string }) {
  const theme = useTheme();
  const store = useSessionStore();
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [rpe, setRpe] = useState('');

  const addSet = () => {
    store.logSet(lv.log.id, {
      reps: reps ? parseInt(reps, 10) : null,
      weightKg: weight ? parseFloat(weight) : null,
      rpe: rpe ? parseFloat(rpe) : null,
    });
    setReps('');
    setWeight('');
    setRpe('');
    store.startRest(store.restDurationS);
  };

  return (
    <Card accent={accent} style={{ gap: 10 }}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Row gap={8} style={{ alignItems: 'center', flex: 1 }}>
          <Icon icon={lv.iconKey} size={20} color={accent} />
          <Text variant="h3" numberOfLines={1} style={{ flex: 1 }}>
            {lv.exerciseName}
          </Text>
        </Row>
        <Pressable onPress={() => store.removeExercise(lv.log.id)} hitSlop={8}>
          <Icon icon="core.delete" size={18} color={theme.colors.textFaint} />
        </Pressable>
      </Row>

      {lv.sets.length > 0 && (
        <View style={{ gap: 4 }}>
          <Row style={{ paddingHorizontal: 4 }}>
            <Text variant="caption" color="textFaint" style={{ width: 28 }}>
              #
            </Text>
            <Text variant="caption" color="textFaint" style={{ flex: 1 }}>
              Weight
            </Text>
            <Text variant="caption" color="textFaint" style={{ flex: 1 }}>
              Reps
            </Text>
            <Text variant="caption" color="textFaint" style={{ width: 44 }}>
              RPE
            </Text>
            <View style={{ width: 24 }} />
          </Row>
          {lv.sets.map((s) => (
            <Row key={s.id} style={{ alignItems: 'center', paddingHorizontal: 4 }}>
              <Text variant="body" style={{ width: 28 }}>
                {s.setNumber}
              </Text>
              <Text variant="body" style={{ flex: 1 }}>
                {s.weightKg != null ? `${s.weightKg} kg` : '—'}
              </Text>
              <Text variant="body" style={{ flex: 1 }}>
                {s.reps ?? '—'}
              </Text>
              <Text variant="body" style={{ width: 44 }}>
                {s.rpe ?? '—'}
              </Text>
              <View style={{ width: 24, alignItems: 'flex-end' }}>
                {s.isPr ? (
                  <Icon icon="core.pr" size={16} color={theme.colors.warning} />
                ) : (
                  <Pressable onPress={() => store.removeSet(s.id)} hitSlop={6}>
                    <Icon icon="core.close" size={14} color={theme.colors.textFaint} />
                  </Pressable>
                )}
              </View>
            </Row>
          ))}
        </View>
      )}

      <Divider />

      <Row style={{ alignItems: 'flex-end' }}>
        <View style={{ flex: 1 }}>
          <Input label="Weight" value={weight} onChangeText={setWeight} placeholder="kg" keyboardType="numeric" />
        </View>
        <View style={{ flex: 1 }}>
          <Input label="Reps" value={reps} onChangeText={setReps} placeholder="0" keyboardType="numeric" />
        </View>
        <View style={{ width: 64 }}>
          <Input label="RPE" value={rpe} onChangeText={setRpe} placeholder="–" keyboardType="numeric" />
        </View>
      </Row>
      <Row>
        <Button title="Add Set" icon="core.add" size="sm" onPress={addSet} style={{ flex: 2 }} fullWidth={false} />
        <Button
          title="Repeat Last"
          size="sm"
          variant="secondary"
          onPress={() => {
            store.repeatLastSet(lv.log.id, lv.log.exerciseId);
            store.startRest(store.restDurationS);
          }}
          style={{ flex: 1 }}
          fullWidth={false}
        />
      </Row>
      <Row gap={6}>
        {REST_PRESETS.map((sec) => (
          <Pressable key={sec} onPress={() => store.startRest(sec)} style={{ flex: 1 }}>
            <View
              style={{
                paddingVertical: 6,
                borderRadius: theme.radius.sm,
                backgroundColor: theme.colors.surfaceAlt,
                alignItems: 'center',
              }}
            >
              <Text variant="caption" color="textMuted">
                {sec >= 60 ? `${sec / 60}m` : `${sec}s`}
              </Text>
            </View>
          </Pressable>
        ))}
      </Row>
    </Card>
  );
}

/**
 * Mandatory warm-up checklist (v2 reference): one warm-up line per distinct
 * muscle group in the session, each checkable. Collapses once all are done.
 */
function WarmupChecklist({ detail }: { detail: ExerciseLogView[] }) {
  const theme = useTheme();
  const [done, setDone] = useState<Record<string, boolean>>({});

  const muscles = useMemo(() => {
    const seen = new Set<string>();
    for (const lv of detail) {
      if (lv.primaryMuscle && WARMUPS_BY_MUSCLE[lv.primaryMuscle]) seen.add(lv.primaryMuscle);
    }
    return [...seen];
  }, [detail]);

  if (muscles.length === 0) return null;
  const allDone = muscles.every((m) => done[m]);

  if (allDone) {
    return (
      <Row gap={8} style={{ alignItems: 'center', paddingHorizontal: 4 }}>
        <Icon icon="core.check" size={16} color={theme.colors.success} />
        <Text variant="caption" color="success">Warm-ups done — lift safe.</Text>
      </Row>
    );
  }

  return (
    <Card accent={theme.colors.warning} style={{ gap: 10 }}>
      <Row gap={8} style={{ alignItems: 'center' }}>
        <Icon icon="core.timer" size={18} color={theme.colors.warning} />
        <Text variant="h3" style={{ flex: 1 }}>Warm up first (mandatory)</Text>
      </Row>
      {muscles.map((m) => (
        <Pressable key={m} onPress={() => setDone((d) => ({ ...d, [m]: !d[m] }))}>
          <Row gap={10} style={{ alignItems: 'flex-start' }}>
            <Icon
              icon={done[m] ? 'core.check' : 'core.add'}
              size={18}
              color={done[m] ? theme.colors.success : theme.colors.textFaint}
            />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong" style={done[m] ? { textDecorationLine: 'line-through' } : undefined}>
                {MUSCLE_LABELS[m] ?? m}
              </Text>
              <Text variant="caption" color="textMuted">{WARMUPS_BY_MUSCLE[m]}</Text>
            </View>
          </Row>
        </Pressable>
      ))}
      <Text variant="caption" color="textFaint">
        Warming up raises muscle temperature and primes the joints — it directly cuts injury
        risk before your working sets.
      </Text>
    </Card>
  );
}
