import React, { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { Card } from './ui/Card';
import { Text } from './ui/Text';
import { Button } from './ui/Button';
import { Row } from './ui/misc';
import { clockDuration } from '@/lib/duration';
import { useSessionStore } from '@/stores/sessionStore';
import { discardPendingWork, openTiming, pauseTiming, pendingWorkSeconds, resumeTiming, startWork, stopWork, timingSummary } from '@/repositories/timingRepo';

export function WorkoutTiming({ sessionId, live = false }: { sessionId: number; live?: boolean }) {
  const [, tick] = useState(0);
  const [details,setDetails]=useState(false);
  useEffect(() => { if (!live) return; const t = setInterval(() => tick(v => v + 1), 1000); return () => clearInterval(t); }, [live]);
  const totals = timingSummary(sessionId);
  const current = openTiming(sessionId);
  if (!totals.recorded) return <Text variant="caption" color="textMuted">Set and rest timing were not recorded for this workout.</Text>;
  const toggle = () => {
    try {
      if (current?.phase === 'paused') resumeTiming(sessionId); else pauseTiming(sessionId);
      const next = openTiming(sessionId);
      useSessionStore.setState({ restEndsAt: next?.phase === 'rest' ? next.target_end : null });
      tick(v => v + 1);
    } catch (e) { Alert.alert('Timer', String(e)); }
  };
  return <Card style={{ gap: 10 }}>
    <Text variant="bodyStrong">{live ? `Workout clock · ${current?.phase ?? 'transition'}` : 'Recorded timing'}</Text>
    <Row>{(['work','rest','transition','paused'] as const).map(phase => <View key={phase} style={{ flex: 1 }}>
      <Text variant="caption" color="textMuted">{phase === 'work' ? 'Set clock' : phase === 'transition' ? 'Between' : phase === 'paused' ? 'Paused' : 'Rest'}</Text>
      <Text variant="bodyStrong">{clockDuration(Math.round(totals[phase]))}</Text>
    </View>)}</Row>
    {(!live||details)&&<Text variant="caption" color="textMuted">Clock intervals are rounded to seconds and exclude pauses from set time. Manually entered set durations appear in the set review and do not change this timeline. This does not measure time under muscular tension.</Text>}
    {totals.reviewRequired && <Text variant="caption" color="warning">A set timer survived an interruption or was left running. Review its duration before comparing performance.</Text>}
    {live && <Row><Button title={current?.phase === 'paused' ? 'Resume clock' : 'Pause clock'} size="sm" variant="secondary" style={{flex:1}} onPress={toggle} /><Button title={details?'Hide details':'Timing details'} size="sm" variant="ghost" style={{flex:1}} onPress={()=>setDetails(value=>!value)} /></Row>}
  </Card>;
}
export function SetClock({ sessionId, logId }: { sessionId: number; logId: number }) {
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick(v => v + 1), 1000); return () => clearInterval(t); }, []);
  const current = openTiming(sessionId);
  const running = current?.phase === 'work' && current.log_id === logId;
  const seconds = pendingWorkSeconds(sessionId, logId);
  const act = () => {
    try {
      if (running) stopWork(sessionId, logId); else startWork(sessionId, logId);
      useSessionStore.setState({ restEndsAt: null });
      tick(v => v + 1);
    } catch (e) { Alert.alert('Set clock', e instanceof Error ? e.message : 'Unable to start.'); }
  };
  return <View style={{ gap: 8 }}>
    <Row style={{ alignItems: 'center' }}>
      <Button title={running ? 'End set' : seconds != null ? 'Time ready to save' : 'Start set'} onPress={act} disabled={!running && seconds != null} size="sm" style={{ flex: 1 }} />
      {seconds != null && <Text variant="h3">{clockDuration(seconds)}</Text>}
    </Row>
    {seconds != null && !running && <>
      <Text variant="caption" color="textMuted">Enter reps/load, then save. A duration you type overrides the clock and is labelled manual.</Text>
      <Button title="Discard unsaved set timing" variant="ghost" size="sm" onPress={() => Alert.alert('Discard this timing?', 'The interval stays in the workout total as time between sets.', [
        { text: 'Keep', style: 'cancel' }, { text: 'Discard', style: 'destructive', onPress: () => { discardPendingWork(sessionId, logId); tick(v => v + 1); } },
      ])} />
    </>}
  </View>;
}
