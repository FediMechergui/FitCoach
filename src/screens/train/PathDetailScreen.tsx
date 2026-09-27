import React, { useCallback, useMemo, useState } from 'react';
import { View, Pressable } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { PageHero } from '@/components/ui/PageHero';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Rail } from '@/components/ui/Meter';
import { Row, Divider, SectionHeader, Badge } from '@/components/ui/misc';
import { EmptyState } from '@/components/ui/misc3';
import { toast } from '@/components/ui/Toast';
import { findPath, pathWeeks, type PathDay, type PathStage } from '@/data/paths';
import { pathStyleTag } from '@/lib/paths';
import { enrol, graduate, pathState, pausePath, type PathState } from '@/repositories/pathsRepo';
import { exercisesBySlugs } from '@/repositories/exerciseRepo';
import { useSessionStore } from '@/stores/sessionStore';
import { sessionTypeIcon } from '@/constants/icon-map';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Tab = 'stage' | 'road' | 'truth';

/**
 * One path: the stage you are in and its week, the road from first stage to
 * last, and the plain truth about what the app cannot do for you.
 */
export function PathDetailScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<RouteProp<RootStackParamList, 'PathDetail'>>();
  const path = findPath(params.pathKey);
  const begin = useSessionStore((s) => s.begin);
  const [state, setState] = useState<PathState | null>(null);
  const [tab, setTab] = useState<Tab>('stage');
  const [open, setOpen] = useState<string | null>(null);

  const reload = useCallback(() => {
    try {
      setState(pathState(params.pathKey));
    } catch (e) {
      console.warn('[paths] failed to read state:', e);
      setState(null);
    }
  }, [params.pathKey]);

  useFocusEffect(reload);

  // The stage on show: the one being walked, or the first for someone looking.
  const stage: PathStage | null = useMemo(() => (path ? (state ? state.stage : path.stages[0]) : null), [path, state]);

  if (!path || !stage) {
    return (
      <Screen>
        <EmptyState icon="core.warning" title="This path is not on the map" message="It may have been renamed in an update. Go back and choose from the list." action={<Button title="All paths" fullWidth={false} onPress={() => navigation.goBack()} />} />
      </Screen>
    );
  }

  const walking = !!state && !state.completed && !state.paused;

  const startDay = (day: PathDay) => {
    begin(day.sessionType, {
      label: `${path.become} · ${stage.name} · ${day.label}`,
      style: pathStyleTag(path.key, stage.key, day.key),
      prefillSlugs: day.exercises,
    });
    const id = useSessionStore.getState().activeId!;
    navigation.replace('ActiveSession', { sessionId: id });
  };

  const onEnrol = () => {
    const was = !!state;
    enrol(path.key);
    reload();
    toast({ message: was ? `Back on the path: ${path.name}` : `You are on the path: ${path.name}` });
  };

  const onGraduate = () => {
    const r = graduate(path.key);
    reload();
    if (!r.ok) {
      toast({ message: r.reason === 'gate' ? 'The gate is not met yet' : 'Nothing to graduate here' });
      return;
    }
    toast({ message: r.finished ? `You walked it to the end. ${path.become}.` : `Graduated: ${r.stage.name}. Next: ${r.next?.name}` });
  };

  return (
    <Screen>
      <PageHero icon={path.icon} color={path.accent} eyebrow={state ? (state.completed ? 'Walked to the end' : `Stage ${state.stageIndex + 1} of ${path.stages.length}`) : `${path.stages.length} stages · about ${pathWeeks(path)} weeks`} title={path.name} subtitle={path.tagline} />

      {state ? (
        <Card raised accent={path.accent} style={{ gap: 12 }}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Text variant="h3" style={{ flex: 1 }}>
              {state.completed ? 'Every stage graduated' : stage.name}
            </Text>
            {state.paused ? <Badge label="Paused" color={theme.colors.warning} /> : null}
          </Row>
          {!state.completed && (
            <>
              <Text variant="body" color="textMuted">
                {stage.aim}
              </Text>
              {state.gate.checks.map((c) => (
                <View key={c.key} style={{ gap: 4 }}>
                  <Row style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <Row gap={6} style={{ alignItems: 'center', flex: 1 }}>
                      <Icon icon={c.met ? 'core.check' : 'core.checkEmpty'} size={15} color={c.met ? theme.colors.success : theme.colors.textFaint} />
                      <Text variant="label" color={c.met ? 'text' : 'textMuted'} numberOfLines={1} style={{ flex: 1 }}>
                        {c.label}
                      </Text>
                    </Row>
                    <Text variant="caption" color="textFaint" style={{ fontVariant: ['tabular-nums'] }}>
                      {c.key === 'rank' ? (c.met ? 'held' : 'not yet') : `${Math.min(c.current, c.target)} of ${c.target} ${c.unit}`}
                    </Text>
                  </Row>
                  <Rail value={c.current} max={c.target} color={c.met ? theme.colors.success : path.accent} height={5} />
                </View>
              ))}
              {state.paused ? (
                <Button title="Pick the path back up" icon="core.start" color={path.accent} onPress={onEnrol} />
              ) : (
                <Button
                  title={state.stageIndex === path.stages.length - 1 ? 'Graduate the final stage' : 'Graduate this stage'}
                  icon="core.pr"
                  color={path.accent}
                  disabled={!state.gate.met}
                  hint={!state.gate.met ? 'The gate opens when every line above is met. It is counted from what you log.' : undefined}
                  onPress={onGraduate}
                />
              )}
            </>
          )}
          {state.completed && (
            <Text variant="body" color="textMuted">
              You are what this path set out to make: {path.become.toLowerCase()}. The weeks of the final stage stay here to train from.
            </Text>
          )}
        </Card>
      ) : (
        <Card raised accent={path.accent} style={{ gap: 10 }}>
          <Text variant="body" color="textMuted">
            {path.whoFor}
          </Text>
          <Button title={`Begin: ${path.name}`} icon="core.start" color={path.accent} onPress={onEnrol} />
          <Text variant="caption" color="textFaint">
            Beginning costs nothing and commits you to nothing. You can walk more than one path, and pause any of them.
          </Text>
        </Card>
      )}

      <SegmentedControl
        value={tab}
        onChange={(v) => setTab(v as Tab)}
        options={[
          { value: 'stage', label: 'The week' },
          { value: 'road', label: 'The road' },
          { value: 'truth', label: 'The truth' },
        ]}
      />

      {/* ── The week of the current stage ── */}
      {tab === 'stage' && (
        <>
          <Text variant="caption" color="textMuted">
            {stage.sessionsPerWeek} sessions a week from these {stage.days.length} days, for about {stage.weeks} weeks.
            {walking ? ' The one logged least is marked next.' : ''}
          </Text>
          {stage.days.map((day, idx) => {
            const isOpen = open === day.key;
            const done = state?.dayCounts[day.key] ?? 0;
            const next = walking && state?.nextDay === day.key;
            const found = isOpen ? exercisesBySlugs(day.exercises) : [];
            return (
              <Card key={day.key} accent={next ? path.accent : undefined} style={{ gap: 10 }}>
                <Pressable onPress={() => setOpen(isOpen ? null : day.key)} accessibilityRole="button">
                  <Row gap={12} style={{ alignItems: 'center' }}>
                    <Text variant="eyebrow" color={next ? path.accent : 'textFaint'}>
                      D{idx + 1}
                    </Text>
                    <Icon icon={sessionTypeIcon(day.sessionType)} size={20} color={path.accent} />
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyStrong" numberOfLines={2}>
                        {day.label}
                      </Text>
                      <Text variant="caption" color="textMuted" numberOfLines={isOpen ? undefined : 1}>
                        {day.focus}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text variant="caption" color="textFaint">
                        ~{day.minutes}m
                      </Text>
                      {state ? (
                        <Text variant="caption" color={next ? path.accent : 'textFaint'}>
                          {next ? 'next' : `${done} done`}
                        </Text>
                      ) : null}
                    </View>
                  </Row>
                </Pressable>
                {isOpen && (
                  <View style={{ gap: 8 }}>
                    <Divider />
                    <Text variant="body">{day.prescription}</Text>
                    {found.map((ex, i) => (
                      <Row key={ex.id} gap={8} style={{ alignItems: 'center' }}>
                        <Text variant="caption" color="textFaint" style={{ width: 18, fontVariant: ['tabular-nums'] }}>
                          {i + 1}
                        </Text>
                        <Icon icon={ex.iconKey} size={16} color={theme.colors.textMuted} />
                        <Text variant="body" style={{ flex: 1 }} numberOfLines={1}>
                          {ex.name}
                        </Text>
                      </Row>
                    ))}
                    <Text variant="caption" color="textFaint">
                      {found.length} of {day.exercises.length} exercises loaded. Each one carries its how-to video inside the session.
                    </Text>
                    {state && !state.paused ? (
                      <Button title={`Start ${day.label}`} icon="core.start" size="sm" color={path.accent} onPress={() => startDay(day)} />
                    ) : (
                      <Button title={state ? 'Pick the path back up to start' : 'Begin the path to start'} size="sm" variant="secondary" onPress={onEnrol} />
                    )}
                  </View>
                )}
              </Card>
            );
          })}

          <SectionHeader title="Before you move on" />
          <Card style={{ gap: 8 }}>
            {stage.benchmarks.map((b) => (
              <Row key={b} gap={8} style={{ alignItems: 'flex-start' }}>
                <Icon icon="core.target" size={15} color={path.accent} />
                <Text variant="body" color="textMuted" style={{ flex: 1 }}>
                  {b}
                </Text>
              </Row>
            ))}
            <Divider />
            <Text variant="caption" color="textFaint">
              These are yours to judge, or your coach's. The app cannot see a skill, so it does not pretend to measure one: the gate above counts only what it can count.
            </Text>
          </Card>

          <Card accent={path.accent} style={{ gap: 4 }}>
            <Text variant="eyebrow" color="textMuted">
              What matters most here
            </Text>
            <Text variant="body">{stage.coachNote}</Text>
          </Card>
        </>
      )}

      {/* ── The road: all five stages ── */}
      {tab === 'road' &&
        path.stages.map((s, i) => {
          const at = state ? (state.completed ? path.stages.length : state.stageIndex) : -1;
          const status = i < at ? 'done' : i === at ? 'here' : 'ahead';
          return (
            <Card key={s.key} accent={status === 'here' ? path.accent : undefined} style={{ gap: 6, opacity: status === 'ahead' && state ? 0.8 : 1 }}>
              <Row gap={10} style={{ alignItems: 'center' }}>
                <View
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: status === 'done' ? theme.alpha.tint22(theme.colors.success) : theme.alpha.tint14(path.accent),
                  }}
                >
                  {status === 'done' ? <Icon icon="core.check" size={16} color={theme.colors.success} /> : <Text variant="label">{i + 1}</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="h3">{s.name}</Text>
                  <Text variant="caption" color="textFaint">
                    about {s.weeks} weeks · {s.sessionsPerWeek} a week · {s.days.length} days
                    {status === 'here' ? ' · you are here' : ''}
                  </Text>
                </View>
              </Row>
              <Text variant="body" color="textMuted">
                {s.aim}
              </Text>
              <Text variant="caption" color="textFaint">
                Gate: {s.gate.sessions} sessions over at least {s.gate.weeks} weeks
                {s.gate.longestRunKm != null ? `, and a tracked run of ${s.gate.longestRunKm} km` : ''}
                {s.gate.overallTier != null ? ', and a strength rank to match' : ''}.
              </Text>
            </Card>
          );
        })}

      {/* ── The truth ── */}
      {tab === 'truth' && (
        <>
          <Card accent={theme.colors.warning} style={{ gap: 6 }}>
            <Text variant="eyebrow" color="textMuted">
              What this app cannot teach
            </Text>
            <Text variant="body">{path.honesty}</Text>
          </Card>
          <Card accent={theme.colors.danger} style={{ gap: 6 }}>
            <Text variant="eyebrow" color="textMuted">
              Train it safely
            </Text>
            <Text variant="body">{path.safety}</Text>
          </Card>
          <Card style={{ gap: 6 }}>
            <Text variant="eyebrow" color="textMuted">
              Who this is for
            </Text>
            <Text variant="body" color="textMuted">
              {path.whoFor}
            </Text>
          </Card>
          {state && !state.completed && !state.paused ? (
            <Button
              title="Pause this path"
              variant="ghost"
              onPress={() => {
                pausePath(path.key);
                reload();
                toast({ message: 'Paused. The sessions you logged stay counted.', actionLabel: 'Undo', onAction: () => { enrol(path.key); reload(); } });
              }}
            />
          ) : null}
        </>
      )}
    </Screen>
  );
}
