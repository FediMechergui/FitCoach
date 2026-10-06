import React, { useEffect, useState } from 'react';
import { View, Pressable, Switch, Alert } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './ui/Text';
import { Button } from './ui/Button';
import { Chip } from './ui/Chip';
import { ProgressBar } from './ui/ProgressBar';
import { Row } from './ui/misc';
import { Icon } from './ui/Icon';
import {
  DEFAULT_LAP_PLAN,
  LAP_REST_PRESETS_S,
  LAP_TARGETS_M,
  describePlan,
  finishRepByHand,
  formatClock,
  formatLapDistance,
  formatPaceS,
  lapProgress,
  startLaps,
  startRepByHand,
  type LapPlan,
  type LapReading,
  type LapState,
} from '@/lib/gpsLaps';
import { lapState, lastLapPlan, rememberLapPlan, saveLapState } from '@/repositories/outdoorRepo';
import { getLiveRoute } from '@/repositories/activityRepo';
import { isSessionGpsOn, sessionGpsDistanceM, startSessionGps } from '@/services/sessionGps';

const REPS_OPTIONS = [null, 1, 3, 4, 5, 6, 8, 10, 12] as const;

export function currentReading(): LapReading {
  return { now: Date.now(), distanceM: sessionGpsDistanceM(), routeLen: getLiveRoute().length };
}

/**
 * GPS laps on one distance exercise. Closed: a single "Measure with GPS"
 * line. Open: the plan (target, reps, rest), then the live rep — distance
 * against the target, time, pace — and the rest between reps.
 *
 * The work itself happens elsewhere: the session screen advances the laps
 * every second and turns finished reps into sets, and the background
 * location task does the same with the screen off. This panel only shows the
 * state and changes it when a button is pressed.
 */
export function GpsLapsPanel({
  sessionId,
  logId,
  exerciseId,
  exerciseName,
  accent,
  onGpsStarted,
}: {
  sessionId: number;
  logId: number;
  exerciseId: number;
  exerciseName: string;
  accent: string;
  /** the session screen shows its GPS card as soon as a trace starts */
  onGpsStarted?: () => void;
}) {
  const theme = useTheme();
  const [state, setState] = useState<LapState | null>(() => lapState());
  const [reading, setReading] = useState<LapReading>(() => ({ now: Date.now(), distanceM: 0, routeLen: 0 }));
  const [editing, setEditing] = useState(false);
  const [plan, setPlan] = useState<LapPlan>(() => lastLapPlan(exerciseId) ?? DEFAULT_LAP_PLAN);

  const mine = state && state.logId === logId && state.sessionId === sessionId ? state : null;
  const otherRunning = state && !mine && state.sessionId === sessionId && state.phase !== 'done' ? state : null;

  // A second's refresh while this exercise owns the laps; one read otherwise.
  useEffect(() => {
    const read = () => {
      setState(lapState());
      setReading(currentReading());
    };
    read();
    if (!mine) return;
    const t = setInterval(read, 1000);
    return () => clearInterval(t);
  }, [mine?.logId, mine?.phase]);

  const begin = async () => {
    if (!isSessionGpsOn(sessionId)) {
      const ok = await startSessionGps(sessionId);
      if (!ok) {
        Alert.alert('Could not start GPS', 'Enable Location for FitCoach (ideally “Allow all the time”), and make sure no walk or run is already tracking.');
        return;
      }
      onGpsStarted?.();
    }
    rememberLapPlan(exerciseId, plan);
    const s = startLaps({ sessionId, logId, exerciseId, exerciseName, plan, reading: currentReading() });
    saveLapState(s);
    setState(s);
    setEditing(false);
  };

  const finishRep = () => {
    if (!mine) return;
    const { state: next } = finishRepByHand(mine, currentReading());
    saveLapState(next);
    setState(next);
  };

  const startNow = () => {
    if (!mine) return;
    const next = startRepByHand(mine, currentReading());
    saveLapState(next);
    setState(next);
  };

  const stop = () => {
    if (!mine) return;
    // A rep in progress with real distance is kept rather than thrown away.
    const r = currentReading();
    const kept = mine.phase === 'running' && r.distanceM - mine.startDistanceM >= 20 ? finishRepByHand(mine, r).state : mine;
    // Pending reps must reach the log before the state goes: the session
    // screen drains them on its next tick, so stop by marking it done.
    const done: LapState = { ...kept, phase: 'done', restEndsAt: null };
    saveLapState(done);
    setState(done);
  };

  if (otherRunning) {
    return (
      <Text variant="caption" color="textFaint">
        GPS laps are running on {otherRunning.exerciseName}. Finish those to measure this one.
      </Text>
    );
  }

  // ── Live ──
  if (mine && mine.phase !== 'done') {
    const p = lapProgress(mine, reading);
    return (
      <View style={{ gap: 8, padding: 10, borderRadius: theme.radius.md, backgroundColor: theme.alpha.tint14(accent) }}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Row gap={6} style={{ alignItems: 'center' }}>
            <Icon icon="cardio.gps" size={16} color={accent} />
            <Text variant="label" style={{ color: accent }}>
              {mine.phase === 'running' ? `Rep ${mine.repNo}${mine.plan.reps ? ` of ${mine.plan.reps}` : ''}` : `Rest · rep ${mine.repNo} next`}
            </Text>
          </Row>
          <Text variant="caption" color="textMuted">
            {describePlan(mine.plan)}
          </Text>
        </Row>

        {mine.phase === 'running' ? (
          <>
            <Row style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Text variant="h2" style={{ fontVariant: ['tabular-nums'] }}>
                {formatLapDistance(p.distanceM)}
                {mine.plan.targetM ? <Text variant="body" color="textMuted">{` / ${formatLapDistance(mine.plan.targetM)}`}</Text> : null}
              </Text>
              <Text variant="h3" style={{ fontVariant: ['tabular-nums'] }}>
                {formatClock(p.elapsedS)}
              </Text>
            </Row>
            {p.fraction != null && <ProgressBar progress={p.fraction} color={accent} height={6} />}
            <Text variant="caption" color="textMuted">
              {p.paceSPerKm ? `${formatPaceS(p.paceSPerKm)} /km` : 'Pace once you have moved a little'}
              {mine.plan.targetM ? ' · ends by itself at the target, with a buzz' : ''}
            </Text>
            <Row gap={8}>
              <Button title="Finish rep" size="sm" color={accent} onPress={finishRep} style={{ flex: 1 }} fullWidth={false} />
              <Button title="Stop laps" size="sm" variant="secondary" onPress={stop} style={{ flex: 1 }} fullWidth={false} />
            </Row>
          </>
        ) : (
          <>
            <Text variant="h2" style={{ fontVariant: ['tabular-nums'] }}>
              {p.restLeftS != null ? formatClock(p.restLeftS) : '—'}
            </Text>
            <Text variant="caption" color="textMuted">
              {mine.plan.autoNext ? 'The next rep starts by itself when the rest is over.' : 'Start the next rep when you are ready.'}
            </Text>
            <Row gap={8}>
              <Button title="Start rep now" size="sm" color={accent} onPress={startNow} style={{ flex: 1 }} fullWidth={false} />
              <Button title="Stop laps" size="sm" variant="secondary" onPress={stop} style={{ flex: 1 }} fullWidth={false} />
            </Row>
          </>
        )}
      </View>
    );
  }

  // ── Plan ──
  if (editing) {
    return (
      <View style={{ gap: 10, padding: 10, borderRadius: theme.radius.md, backgroundColor: theme.colors.surfaceAlt }}>
        <Text variant="label" color="textMuted">
          Each rep, measured by GPS and logged as a set
        </Text>
        <Text variant="caption" color="textMuted">Distance per rep</Text>
        <Row gap={6} style={{ flexWrap: 'wrap' }}>
          <Chip label="Open" small active={plan.targetM == null} onPress={() => setPlan({ ...plan, targetM: null })} />
          {LAP_TARGETS_M.map((m) => (
            <Chip key={m} label={formatLapDistance(m)} small active={plan.targetM === m} color={accent} onPress={() => setPlan({ ...plan, targetM: m })} />
          ))}
        </Row>
        <Text variant="caption" color="textMuted">Reps</Text>
        <Row gap={6} style={{ flexWrap: 'wrap' }}>
          {REPS_OPTIONS.map((r) => (
            <Chip key={String(r)} label={r == null ? 'Open' : String(r)} small active={plan.reps === r} color={accent} onPress={() => setPlan({ ...plan, reps: r })} />
          ))}
        </Row>
        <Text variant="caption" color="textMuted">Rest between reps</Text>
        <Row gap={6} style={{ flexWrap: 'wrap' }}>
          {LAP_REST_PRESETS_S.map((r) => (
            <Chip key={r} label={r === 0 ? 'None' : r >= 60 ? `${r / 60} min` : `${r} s`} small active={plan.restS === r} color={accent} onPress={() => setPlan({ ...plan, restS: r })} />
          ))}
        </Row>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="caption" color="textMuted" style={{ flex: 1, paddingRight: 8 }}>
            Start the next rep by itself after the rest
          </Text>
          <Switch value={plan.autoNext} onValueChange={(v) => setPlan({ ...plan, autoNext: v })} trackColor={{ true: accent }} />
        </Row>
        <Button title={`Start rep 1 · ${describePlan(plan)}`} icon="core.start" size="sm" color={accent} onPress={() => void begin()} />
        <Pressable onPress={() => setEditing(false)} hitSlop={6}>
          <Text variant="caption" color="textFaint" center>
            Cancel
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable onPress={() => setEditing(true)} hitSlop={4}>
      <Row gap={8} style={{ alignItems: 'center', paddingVertical: 2 }}>
        <Icon icon="cardio.gps" size={16} color={accent} />
        <Text variant="caption" style={{ color: accent, flex: 1 }}>
          {mine?.phase === 'done' ? `${mine.doneReps} GPS rep${mine.doneReps === 1 ? '' : 's'} logged — measure more` : 'Measure each rep with GPS'}
        </Text>
        <Icon icon="core.forward" size={14} color={theme.colors.textFaint} />
      </Row>
    </Pressable>
  );
}
