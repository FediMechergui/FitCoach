import React, { useEffect, useMemo, useState } from 'react';
import { View, Pressable, Alert, Switch, LayoutAnimation } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Row, Divider, EmptyState, Badge } from '@/components/ui/misc';
import type { RootStackParamList } from '@/navigation/types';
import { useSessionStore } from '@/stores/sessionStore';
import { metaFor, MOOD_EMOJI, MOOD_LABELS } from '@/constants/sessionTypes';
import { WARMUPS_BY_MUSCLE, MUSCLE_LABELS, SUB_MUSCLE_LABELS } from '@/data/exercises';
import { formatDuration } from '@/lib/format';
import { warmupsDoneOf, type ExerciseLogView } from '@/repositories/sessionRepo';
import { getExercise, listExercises } from '@/repositories/exerciseRepo';
import { findEasierAlternatives } from '@/lib/exerciseAlternatives';
import {
  isGpsBusyWithWalk,
  sessionGpsDistanceM,
  sessionGpsRoute,
  startSessionGps,
  stopSessionGps,
} from '@/services/sessionGps';
import { RouteMap } from '@/components/RouteMap';
import { RpeGuide } from '@/components/RpeGuide';
import type { LatLng } from '@/lib/geo';
import { useUserStore } from '@/stores/userStore';
import { levelOrDefault } from '@/lib/level';
import { exerciseProgression } from '@/repositories/statsRepo';
import { estimate1RMFromSet } from '@/lib/oneRepMax';
import { coLoad } from '@/lib/smokeClock';
import { recentSmokeEvents } from '@/repositories/smokingRepo';
import { stomachLoad, mealsFromEntries } from '@/lib/digestion';
import { foodEntriesForDay } from '@/repositories/nutritionRepo';
import { sleepSummary } from '@/repositories/sleepRepo';
import { todayISO } from '@/lib/date';
import type { RestConditions } from '@/lib/restPhysiology';
import {
  prescribeRest,
  pcrRecovered,
  formatRest,
  COMPOUND_PATTERNS,
  SYSTEM_LABEL,
  CNS_LABEL,
  type RestPrescription,
} from '@/lib/restPrescription';
import { profileFor, effectiveLoadKg, LOAD_FIELD_LABEL } from '@/lib/loadProfile';
import { toast } from '@/components/ui/Toast';
import { ExerciseHowToSheet } from '@/components/ExerciseHowTo';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const REST_PRESETS = [60, 90, 120, 180, 300];
/** Names that mean the set was explosive — power drops fast with fatigue. */
const EXPLOSIVE_RE = /jump|throw|clean|snatch|power|explosive|sprint|plyo|box jump|broad/i;

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
  const [onFoot, setOnFoot] = useState(true);
  const [moodAfter, setMoodAfter] = useState<number | null>(null);

  // GPS distance for hikes, rides, wanders — anything that covers ground.
  const [gpsOn, setGpsOn] = useState(false);
  const [gpsDistanceM, setGpsDistanceM] = useState(0);
  const [gpsRoute, setGpsRoute] = useState<LatLng[]>([]);

  // Poll the traced distance while GPS is on (the fixes land in the DB from the
  // background task, so this is just reading what's accumulated).
  useEffect(() => {
    if (!gpsOn) return;
    const t = setInterval(() => {
      setGpsDistanceM(sessionGpsDistanceM());
      setGpsRoute(sessionGpsRoute());
    }, 2000);
    return () => clearInterval(t);
  }, [gpsOn]);

  const toggleGps = async () => {
    if (gpsOn) {
      const { distanceM } = await stopSessionGps();
      setGpsOn(false);
      setGpsDistanceM(distanceM);
      // Hand the measured distance to the input so it's saved with the session.
      if (distanceM > 0) setDistanceKm((distanceM / 1000).toFixed(2));
      return;
    }
    if (isGpsBusyWithWalk()) {
      Alert.alert(
        'A walk or run is already tracking',
        'Finish that session first — only one GPS trace can run at a time.'
      );
      return;
    }
    const ok = await startSessionGps();
    if (!ok) {
      Alert.alert(
        'Could not start GPS',
        'Enable Location for FitCoach (ideally “Allow all the time”) to measure distance for this session.'
      );
      return;
    }
    setGpsOn(true);
  };

  const endSession = () => {
    // Measured GPS distance wins over anything typed in.
    const tracedM = gpsOn ? Math.round(sessionGpsDistanceM()) : gpsDistanceM;
    if (gpsOn) void stopSessionGps();
    const activity =
      flow === 'cardio'
        ? {
            distanceM: tracedM > 0 ? tracedM : distanceKm ? parseFloat(distanceKm) * 1000 : null,
            elevationM: elevation ? parseFloat(elevation) : null,
            score: score || null,
            pace:
              tracedM > 0
                ? elapsed / (tracedM / 1000)
                : distanceKm && parseFloat(distanceKm) > 0
                  ? elapsed / parseFloat(distanceKm)
                  : null,
          }
        : undefined;
    const result = store.finish({
      moodAfter: flow === 'mindbody' ? moodAfter : null,
      activity,
      notes: style || null,
      onFoot: flow === 'cardio' && onFoot,
    });
    if (result) {
      navigation.replace('SessionDetail', { sessionId: result.session.id, justFinished: true, prCount: result.prCount, stepsAdded: result.stepsAdded });
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

      {/* Exercises / activities — available for every session type, not just lifting */}
      <ExerciseSection detail={detail?.logs ?? []} accent={meta.color} isLifting={flow === 'lifting'} />

      {/* GPS distance — hikes, rides, wanders, anything that covers ground */}
      {flow === 'cardio' && (
        <Card accent={gpsOn ? theme.colors.outdoor : undefined} style={{ gap: 10 }}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Row gap={10} style={{ alignItems: 'center', flex: 1 }}>
              <Icon icon="cardio.gps" size={20} color={gpsOn ? theme.colors.outdoor : theme.colors.textFaint} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">{gpsOn ? 'Measuring with GPS' : 'Measure distance with GPS'}</Text>
                <Text variant="caption" color="textMuted">
                  {gpsOn
                    ? `${(gpsDistanceM / 1000).toFixed(2)} km traced — keeps recording with the screen off.`
                    : 'For hiking, cycling, a wander — measured instead of typed.'}
                </Text>
              </View>
            </Row>
            <Button
              title={gpsOn ? 'Stop' : 'Start'}
              size="sm"
              variant={gpsOn ? 'secondary' : 'primary'}
              fullWidth={false}
              color={theme.colors.outdoor}
              onPress={() => void toggleGps()}
            />
          </Row>
          {gpsRoute.length > 1 && <RouteMap route={gpsRoute} height={180} />}
        </Card>
      )}

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
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text variant="bodyStrong">On foot — count as steps</Text>
              <Text variant="caption" color="textMuted">
                Adds an estimated step count to your day. Off for cycling, swimming, rowing.
              </Text>
            </View>
            <Switch value={onFoot} onValueChange={setOnFoot} trackColor={{ true: meta.color }} />
          </Row>
          <Text variant="caption" color="textFaint">
            Distance & elevation are optional — duration and estimated calories are always
            captured. For a live GPS route map, start a Run from the Train tab.
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
  const restDurationS = useSessionStore((s) => s.restDurationS);
  const rx = useSessionStore((s) => s.restRx);
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

  const showing = !!restEndsAt && remaining > 0;
  // The banner used to pop in and vanish between frames; the cards below it
  // jumped with it. Layout now settles into and out of its place.
  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.create(theme.motion.settle, 'easeInEaseOut', 'opacity'));
  }, [showing, theme.motion.settle]);

  if (!showing) return null;
  const elapsed = Math.max(0, restDurationS - remaining);
  // Against the tank's ACTUAL refill rate, which slows when oxygen is short.
  const pcr = Math.round(pcrRecovered(elapsed, rx?.physiology?.tauS) * 100);
  return (
    <Card accent={theme.colors.warning} style={{ gap: 6 }}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Row gap={10} style={{ alignItems: 'center' }}>
          <Icon icon="core.timer" color={theme.colors.warning} />
          <View>
            <Text variant="bodyStrong">Rest</Text>
            {rx && (
              <Text variant="caption" color="textMuted">
                {SYSTEM_LABEL[rx.system]} · {CNS_LABEL[rx.cns]}
              </Text>
            )}
          </View>
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
      {/* The phosphagen tank refilling — the thing the rest is actually for. */}
      <ProgressBar progress={pcr / 100} color={pcr >= 90 ? theme.colors.success : theme.colors.warning} height={5} />
      <Text variant="caption" color="textFaint">
        Creatine phosphate ~{pcr}% refilled{rx && rx.system === 'phosphagen' ? ' — a heavy set wants 90%+' : ''}.
      </Text>
      {/* restBeforeStateSec was computed on every prescription and never
          rendered anywhere — the whole point of measuring the state
          you arrived in is that you get to SEE what it cost or saved. */}
      {rx?.restBeforeStateSec != null && rx.restSec !== rx.restBeforeStateSec && (
        <View
          style={{
            alignSelf: 'flex-start',
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: theme.radius.pill,
            backgroundColor: theme.alpha.tint14(
              rx.restSec > rx.restBeforeStateSec ? theme.colors.warning : theme.colors.primary
            ),
          }}
        >
          <Text
            variant="caption"
            style={{
              color: rx.restSec > rx.restBeforeStateSec ? theme.colors.warning : theme.colors.primary,
              fontVariant: ['tabular-nums'],
            }}
          >
            {`${rx.restSec > rx.restBeforeStateSec ? '+' : '\u2212'}${Math.abs(rx.restSec - rx.restBeforeStateSec)}s for the state you arrived in \u00b7 baseline ${formatRest(rx.restBeforeStateSec)}`}
          </Text>
        </View>
      )}
    </Card>
  );
}

// ── Exercise section (all session types) ─────────────────────────────────────
function ExerciseSection({ detail, accent, isLifting }: { detail: ExerciseLogView[]; accent: string; isLifting: boolean }) {
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
      {isLifting && detail.length > 0 && <WarmupChecklist detail={detail} />}
      {/* RPE means "reps left", not "how hard it felt" — say so in every session. */}
      {isLifting && detail.length > 0 && <RpeGuide />}

      {detail.length > 0 && (
        <Row style={{ justifyContent: 'space-between' }}>
          <Text variant="label" color="textMuted">
            {detail.length} exercise{detail.length === 1 ? '' : 's'}
          </Text>
          {isLifting && (
            <Text variant="label" color="textMuted">
              Volume {Math.round(totalVolume).toLocaleString()} kg
            </Text>
          )}
        </Row>
      )}

      {detail.length === 0 ? (
        <EmptyState
          icon={isLifting ? 'strength.dumbbell' : 'cardio.running'}
          title={isLifting ? 'Add your first exercise' : 'Add an activity (optional)'}
          message={
            isLifting
              ? 'Pick from the library, then log sets as you go.'
              : 'Log the specific drills or activities you did — each with its own reps, time or distance.'
          }
        />
      ) : (
        detail.map((lv, i) => {
          // The session runs top to bottom: "up next" is the first exercise
          // with nothing logged on it yet. Nothing reorders on its own.
          const started = lv.sets.some((s) => s.completed);
          const upNextIndex = detail.findIndex((x) => !x.sets.some((s) => s.completed));
          return (
            <ExerciseLogCard
              key={lv.log.id}
              lv={lv}
              accent={accent}
              isLifting={isLifting}
              position={i + 1}
              total={detail.length}
              started={started}
              upNext={i === upNextIndex}
              canMoveUp={i > 0 && !started}
              canMoveDown={i < detail.length - 1 && !started}
            />
          );
        })
      )}

      <Button
        title={isLifting ? 'Add Exercise' : 'Add Exercise / Activity'}
        icon="core.add"
        variant="secondary"
        onPress={() => navigation.navigate('ExerciseLibrary', { pick: true })}
      />
    </View>
  );
}

/** Which input fields a tracking type needs. */
function fieldsFor(t: ExerciseLogView['trackingType']) {
  return {
    weight: t === 'reps_weight',
    reps: t === 'reps_weight' || t === 'reps_only' || t === 'custom',
    duration: t === 'duration' || t === 'duration_distance',
    distance: t === 'distance' || t === 'duration_distance',
  };
}

function ExerciseLogCard({
  lv,
  accent,
  isLifting,
  position,
  total,
  started,
  upNext,
  canMoveUp,
  canMoveDown,
}: {
  lv: ExerciseLogView;
  accent: string;
  isLifting: boolean;
  /** 1-based place in the running order */
  position: number;
  total: number;
  /** at least one set logged — its place in the order is history now */
  started: boolean;
  /** the first exercise with nothing logged yet */
  upNext: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const theme = useTheme();
  const store = useSessionStore();
  const f = fieldsFor(lv.trackingType);
  const isDumbbell = lv.equipmentType === 'dumbbell';
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [rpe, setRpe] = useState('');
  const [toFailure, setToFailure] = useState(false);
  const [minutes, setMinutes] = useState('');
  const [distanceKm, setDistanceKm] = useState('');
  const [lastRx, setLastRx] = useState<RestPrescription | null>(null);
  const [showWhy, setShowWhy] = useState(false);
  const level = levelOrDefault(useUserStore((s) => s.user?.experienceLevel));
  const bodyKg = useUserStore((s) => s.currentWeightKg) ?? 75;
  const sessionStart = store.detail?.session.startTime ?? Date.now();
  // What the weight field MEANS for this exercise: the load itself, added
  // belt/vest kilograms on a bodyweight movement, or a carried pack.
  const profile = profileFor({ slug: lv.slug, equipmentType: lv.equipmentType, pattern: lv.pattern, trackingType: lv.trackingType });
  const showLoad = f.weight || profile.loadMode === 'added' || profile.loadMode === 'carried';
  const loadLabel = f.weight ? 'Weight' : (LOAD_FIELD_LABEL[profile.loadMode] ?? 'Weight');

  // History for this exercise: best 1RM and top weight ever, so the set can
  // be placed as a share of 1RM and recognised as a step up.
  const history = useMemo(() => {
    const pts = exerciseProgression(lv.log.exerciseId);
    return {
      best1RM: pts.reduce((m, p) => Math.max(m, p.best1RM), 0),
      topWeight: pts.reduce((m, p) => Math.max(m, p.topWeight), 0),
    };
  }, [lv.log.exerciseId]);

  /*
   * The state the lifter is actually in, re-read as the session runs.
   *
   * All three of these move DURING a session — carbon monoxide decays on a
   * four-hour half-life, the stomach drains, and an hour of squatting is an
   * hour further from breakfast — so this is recomputed as sets are completed
   * rather than frozen at the door. The reads are local SQLite and cheap.
   */
  const conditions = useMemo<RestConditions>(() => {
    try {
      return {
        coLoad: coLoad(recentSmokeEvents()),
        stomachKcal: stomachLoad(mealsFromEntries(foodEntriesForDay(todayISO()))).loadKcal,
        // Naps count: avgRest7d is night sleep plus what the naps were worth.
        avgSleepHours: sleepSummary().avgRest7d,
      };
    } catch {
      // Nothing known is a perfectly good answer — the prescription is then
      // exactly the evidence-based one, unadjusted.
      return {};
    }
  }, [lv.sets.length]);

  /** The rest this set earns — from what it was, where it sits, and who is lifting. */
  const rxFor = (d: { reps: number | null; weightKg: number | null; rpe: number | null; toFailure: boolean; durationS: number | null }): RestPrescription => {
    const completed = lv.sets.filter((s) => s.completed);
    const best1RMThisSession = completed.reduce((m, s) => Math.max(m, estimate1RMFromSet(s)), 0);
    const topWeightBefore = Math.max(history.topWeight, ...completed.map((s) => s.weightKg ?? 0));
    // Weighted calisthenics: reason in EFFECTIVE kilograms (bodyweight share
    // + added), so +20 kg on pull-ups reads as the ~97 kg set it really is.
    const addedMode = profile.loadMode === 'added' && profile.bwFraction != null;
    const effWeight = addedMode ? effectiveLoadKg(profile, bodyKg, d.weightKg) : d.weightKg;
    const histBest = Math.max(history.best1RM, best1RMThisSession);
    const effBest = addedMode ? (histBest > 0 || d.weightKg != null ? profile.bwFraction! * bodyKg + histBest : null) : histBest || null;
    return prescribeRest({
      reps: d.reps,
      weightKg: effWeight,
      rpe: d.rpe,
      toFailure: d.toFailure,
      durationS: d.durationS,
      bodyweight: lv.equipmentType === 'bodyweight',
      compound: COMPOUND_PATTERNS.has(lv.pattern ?? ''),
      explosive: EXPLOSIVE_RE.test(lv.exerciseName),
      best1RMKg: effBest,
      setIndex: completed.length,
      sessionElapsedMin: (Date.now() - sessionStart) / 60_000,
      level,
      isProgress: d.weightKg != null && topWeightBefore > 0 && d.weightKg > topWeightBefore,
      conditions,
    });
  };

  const addSet = () => {
    const draft = {
      reps: f.reps && reps && !(isLifting && toFailure) ? parseInt(reps, 10) : null,
      weightKg: showLoad && weight ? parseFloat(weight) : null,
      rpe: isLifting && rpe ? parseFloat(rpe) : null,
      toFailure: isLifting && toFailure,
      durationS: f.duration && minutes ? Math.round(parseFloat(minutes) * 60) : null,
      distanceM: f.distance && distanceKm ? Math.round(parseFloat(distanceKm) * 1000) : null,
    };
    // Prescribe from the set BEFORE it is logged, so setIndex counts the sets before it.
    const rx = isLifting ? rxFor(draft) : null;
    store.logSet(lv.log.id, draft);
    setReps('');
    setWeight('');
    setRpe('');
    // Deliberately NOT reset: failure sets usually come in a run, and re-ticking
    // it every set is how it stops getting logged at all.
    setMinutes('');
    setDistanceKm('');
    if (isLifting && rx) {
      setLastRx(rx);
      store.startRest(rx.restSec, rx);
    }
  };

  const describeSet = (s: (typeof lv.sets)[number]): string => {
    const parts: string[] = [];
    if (s.weightKg != null && profile.loadMode === 'added') parts.push(s.weightKg >= 0 ? `+${s.weightKg} kg` : `${s.weightKg} kg (assisted)`);
    else if (s.weightKg != null && profile.loadMode === 'carried') parts.push(`${s.weightKg} kg load`);
    else if (s.weightKg != null) parts.push(`${s.weightKg} kg`);
    if (s.reps != null) parts.push(`${s.reps} reps`);
    if (s.durationS != null) parts.push(formatDuration(s.durationS));
    if (s.distanceM != null) parts.push(`${(s.distanceM / 1000).toFixed(2)} km`);
    if (s.toFailure) parts.push('to failure');
    else if (s.rpe != null) parts.push(`RPE ${s.rpe}`);
    return parts.join(' · ') || 'logged';
  };

  const [showAlts, setShowAlts] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);

  return (
    <Card accent={accent} style={{ gap: 10 }}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Row gap={8} style={{ alignItems: 'center', flex: 1 }}>
          <Text variant="caption" color={upNext ? accent : 'textFaint'} style={{ fontVariant: ['tabular-nums'], fontWeight: '700' }}>
            {position}/{total}
          </Text>
          <Icon icon={lv.iconKey} size={20} color={accent} />
          <Text variant="h3" numberOfLines={1} style={{ flex: 1 }}>
            {lv.exerciseName}
          </Text>
          {upNext && <Badge label="Up next" color={accent} />}
        </Row>
        {/* Running order — the sequence you actually do them in. */}
        <Pressable
          onPress={() => canMoveUp && store.moveExercise(lv.log.id, 'up')}
          hitSlop={8}
          disabled={!canMoveUp}
          style={{ paddingHorizontal: 4, opacity: canMoveUp ? 1 : 0.25 }}
        >
          <Icon icon="core.chevronUp" size={18} color={theme.colors.textFaint} />
        </Pressable>
        <Pressable
          onPress={() => canMoveDown && store.moveExercise(lv.log.id, 'down')}
          hitSlop={8}
          disabled={!canMoveDown}
          style={{ paddingHorizontal: 4, opacity: canMoveDown ? 1 : 0.25 }}
        >
          <Icon icon="core.chevronDown" size={18} color={theme.colors.textFaint} />
        </Pressable>
        {/* How it's done — a sheet over the session, timers untouched. */}
        <Pressable onPress={() => setShowHowTo(true)} hitSlop={8} style={{ paddingHorizontal: 6 }}>
          <Icon icon="core.howto" size={18} color={theme.colors.textFaint} />
        </Pressable>
        <Pressable onPress={() => setShowAlts((v) => !v)} hitSlop={8} style={{ paddingHorizontal: 6 }}>
          <Icon icon="core.swap" size={18} color={showAlts ? accent : theme.colors.textFaint} />
        </Pressable>
        <Pressable onPress={() => store.removeExercise(lv.log.id)} hitSlop={8}>
          <Icon icon="core.delete" size={18} color={theme.colors.textFaint} />
        </Pressable>
      </Row>
      {started && (
        <Text variant="caption" color="textFaint">
          Started — its place in the running order is fixed now. Anything you have not begun can still be moved.
        </Text>
      )}

      <ExerciseHowToSheet exerciseId={lv.log.exerciseId} visible={showHowTo} onClose={() => setShowHowTo(false)} />

      {showAlts && (
        <AlternativePicker
          logId={lv.log.id}
          exerciseId={lv.log.exerciseId}
          accent={accent}
          onDone={() => setShowAlts(false)}
        />
      )}

      {lv.sets.length > 0 && (
        <View style={{ gap: 4 }}>
          {lv.sets.map((s) => (
            <Row key={s.id} style={{ alignItems: 'center', paddingHorizontal: 4 }}>
              <Text variant="body" style={{ width: 28 }}>
                {s.setNumber}
              </Text>
              <Text variant="body" style={{ flex: 1 }}>
                {describeSet(s)}
              </Text>
              <View style={{ width: 24, alignItems: 'flex-end' }}>
                {s.isPr ? (
                  <Icon icon="core.pr" size={16} color={theme.colors.warning} />
                ) : (
                  <Pressable
                    onPress={() => {
                      store.removeSet(s.id);
                      toast({
                        message: `Removed set ${s.setNumber} — ${describeSet(s)}`,
                        actionLabel: 'Undo',
                        onAction: () => store.restoreSet(s),
                      });
                    }}
                    hitSlop={6}
                  >
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
        {showLoad && (
          <View style={{ flex: 1 }}>
            {/*
              "Weight" is ambiguous the moment there are two dumbbells, and
              guessing wrong halves or doubles every volume and 1RM figure for
              that lift. State the convention on the field itself.
            */}
            <Input
              label={isDumbbell ? 'Weight / dumbbell' : loadLabel}
              value={weight}
              onChangeText={setWeight}
              placeholder="kg"
              keyboardType="numeric"
            />
          </View>
        )}
        {f.reps && !toFailure && (
          <View style={{ flex: 1 }}>
            <Input label="Reps" value={reps} onChangeText={setReps} placeholder="0" keyboardType="numeric" />
          </View>
        )}
        {f.duration && (
          <View style={{ flex: 1 }}>
            <Input label="Minutes" value={minutes} onChangeText={setMinutes} placeholder="0" keyboardType="numeric" />
          </View>
        )}
        {f.distance && (
          <View style={{ flex: 1 }}>
            <Input label="Distance" value={distanceKm} onChangeText={setDistanceKm} placeholder="km" keyboardType="numeric" />
          </View>
        )}
        {isLifting && !toFailure && (
          <View style={{ width: 64 }}>
            <Input label="RPE" value={rpe} onChangeText={setRpe} placeholder="–" keyboardType="numeric" />
          </View>
        )}
      </Row>
      {f.weight && isDumbbell && (
        <Text variant="caption" color="textFaint">
          One dumbbell, not the pair — 20 kg means 20 in each hand. Keep it the same every time and
          your progress stays comparable.
        </Text>
      )}
      {!f.weight && profile.loadMode === 'added' && (
        <Text variant="caption" color="textFaint">
          {profile.assistable
            ? 'Weight added on a belt or vest — leave empty for bodyweight, negative for band or machine assistance (−15 = the band takes ~15 kg).'
            : 'Weight added on a belt, vest or between the ankles — leave empty for pure bodyweight.'}
          {profile.bwFraction != null ? ` The set really moves ~${Math.round(profile.bwFraction * bodyKg)} kg of you before the plates.` : ''}
        </Text>
      )}
      {!f.weight && profile.loadMode === 'carried' && (
        <Text variant="caption" color="textFaint">
          The load you carry — pack, bag, vest or implement. Calories scale with it: ~
          {Math.round((Math.min(2, 1 + 20 / Math.max(1, bodyKg)) - 1) * 100)}% more per 20 kg at your weight.
        </Text>
      )}
      {isLifting && (
        <Pressable onPress={() => setToFailure((v) => !v)} hitSlop={6}>
          <Row gap={8} style={{ alignItems: 'center' }}>
            <Icon
              icon={toFailure ? 'core.checkFilled' : 'core.checkEmpty'}
              size={18}
              color={toFailure ? theme.colors.warning : theme.colors.textFaint}
            />
            <Text variant="caption" color={toFailure ? 'warning' : 'textMuted'} style={{ flex: 1 }}>
              {toFailure
                ? 'To failure — no rep left. Counts as RPE 10, and the reps become a real capacity test.'
                : 'To failure? Tick if you could not have done one more.'}
            </Text>
          </Row>
        </Pressable>
      )}
      <Row>
        <Button title={isLifting ? 'Add Set' : 'Log'} icon="core.add" size="sm" onPress={addSet} style={{ flex: 2 }} fullWidth={false} />
        {isLifting && (
          <Button
            title="Repeat Last"
            size="sm"
            variant="secondary"
            onPress={() => {
              const last = [...lv.sets].reverse().find((s) => s.completed);
              const rx = last
                ? rxFor({ reps: last.reps, weightKg: last.weightKg, rpe: last.rpe, toFailure: !!last.toFailure, durationS: last.durationS })
                : null;
              store.repeatLastSet(lv.log.id, lv.log.exerciseId);
              if (rx) { setLastRx(rx); store.startRest(rx.restSec, rx); }
              else store.startRest(store.restDurationS);
            }}
            style={{ flex: 1 }}
            fullWidth={false}
          />
        )}
      </Row>
      {isLifting && lastRx && (
        <Pressable onPress={() => setShowWhy((v) => !v)}>
          <View style={{ gap: 4 }}>
            <Row gap={6} style={{ alignItems: 'center' }}>
              <Icon icon="core.timer" size={14} color={theme.colors.warning} />
              <Text variant="caption" color="textMuted" style={{ flex: 1 }}>
                Rest set to <Text variant="caption" style={{ fontWeight: '700' }}>{formatRest(lastRx.restSec)}</Text> · {SYSTEM_LABEL[lastRx.system]}
                {lastRx.pctOneRM != null ? ` · ~${Math.round(lastRx.pctOneRM * 100)}% 1RM` : ''} · {CNS_LABEL[lastRx.cns]} — {showWhy ? 'hide' : 'why?'}
              </Text>
            </Row>
            {showWhy && lastRx.reasons.map((r, i) => (
              <Text key={i} variant="caption" color="textFaint">• {r}</Text>
            ))}
            {showWhy && (
              <Text variant="caption" color="textFaint">
                Evidence range for this kind of set: {formatRest(lastRx.rangeSec[0])}–{formatRest(lastRx.rangeSec[1])}. Override with a preset below.
              </Text>
            )}
          </View>
        </Pressable>
      )}
      {isLifting && (
        <Row gap={6}>
          {/* An override changes how long, not the physiology the banner reads. */}
          {REST_PRESETS.map((sec) => (
            <Pressable key={sec} onPress={() => store.startRest(sec, lastRx ?? undefined)} style={{ flex: 1 }}>
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
      )}
    </Card>
  );
}

/**
 * "Find an easier alternative" — same-muscle exercises ranked easier than the
 * current one, so a hard movement can be swapped mid-session without breaking
 * the flow. Difficulty is estimated (equipment + name), not stored.
 */
function AlternativePicker({
  logId,
  exerciseId,
  accent,
  onDone,
}: {
  logId: number;
  exerciseId: number;
  accent: string;
  onDone: () => void;
}) {
  const theme = useTheme();
  const store = useSessionStore();
  const target = useMemo(() => getExercise(exerciseId), [exerciseId]);
  const alts = useMemo(
    () => (target ? findEasierAlternatives(target, listExercises({})) : []),
    [target]
  );
  const targetSub = target?.subMuscle ? SUB_MUSCLE_LABELS[target.subMuscle] ?? null : null;

  const swap = (newId: number) => {
    store.swapExercise(logId, newId);
    onDone();
  };

  return (
    <View style={{ gap: 6, backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.md, padding: 10 }}>
      <Text variant="label" color="textMuted">
        Too hard? Swap for an easier one — same muscle{targetSub ? ` · ${targetSub}` : ''}
      </Text>
      {alts.length === 0 ? (
        <Text variant="caption" color="textFaint">
          Nothing in the library trains this muscle more easily. Rather than offer you a different
          exercise that happens to share a muscle group, it offers nothing.
        </Text>
      ) : (
        alts.map((a) => (
          <Pressable key={a.id} onPress={() => swap(a.id)}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 }}>
              <View style={{ flex: 1 }}>
                <Text variant="body" numberOfLines={1}>{a.name}</Text>
                {/* Say which ones hit the identical head, not just the muscle. */}
                <Text variant="caption" color={a.exactSubMuscle ? 'success' : 'textFaint'}>
                  {a.exactSubMuscle ? 'same sub-muscle' : 'same muscle'}
                </Text>
              </View>
              <Row gap={4} style={{ alignItems: 'center' }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <View
                    key={i}
                    style={{
                      width: 5, height: 5, borderRadius: 3,
                      backgroundColor: i < a.difficulty ? accent : theme.colors.border,
                    }}
                  />
                ))}
                <Icon icon="core.swap" size={15} color={accent} />
              </Row>
            </Row>
          </Pressable>
        ))
      )}
    </View>
  );
}

/**
 * Mandatory warm-up checklist (v2 reference): one warm-up line per distinct
 * muscle group in the session, each checkable. Collapses once all are done.
 */
function WarmupChecklist({ detail }: { detail: ExerciseLogView[] }) {
  const theme = useTheme();
  // Persisted on the session row: leaving the screen and resuming — or an app
  // restart — keeps what was ticked. (It used to be local state, and reset.)
  const session = useSessionStore((s) => s.detail?.session);
  const toggleWarmup = useSessionStore((s) => s.toggleWarmup);
  const done = useMemo(() => {
    const set = new Set(session ? warmupsDoneOf(session) : []);
    return (m: string) => set.has(m);
  }, [session?.warmupsDone]);

  const muscles = useMemo(() => {
    const seen = new Set<string>();
    for (const lv of detail) {
      if (lv.primaryMuscle && WARMUPS_BY_MUSCLE[lv.primaryMuscle]) seen.add(lv.primaryMuscle);
    }
    return [...seen];
  }, [detail]);

  if (muscles.length === 0) return null;
  const allDone = muscles.every((m) => done(m));

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
        <Pressable key={m} onPress={() => toggleWarmup(m)}>
          <Row gap={10} style={{ alignItems: 'flex-start' }}>
            <Icon
              icon={done(m) ? 'core.check' : 'core.add'}
              size={18}
              color={done(m) ? theme.colors.success : theme.colors.textFaint}
            />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong" style={done(m) ? { textDecorationLine: 'line-through' } : undefined}>
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
