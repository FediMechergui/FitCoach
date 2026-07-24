import React, { useCallback, useState } from 'react';
import { View, Pressable, Alert } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { SectionHeader, Row, EmptyState } from '@/components/ui/misc';
import type { RootStackParamList } from '@/navigation/types';
import { SESSION_TYPE_META } from '@/constants/sessionTypes';
import { sessionTypeIcon } from '@/constants/icon-map';
import { useSessionStore } from '@/stores/sessionStore';
import { listSessions } from '@/repositories/sessionRepo';
import { deleteRoutine, listRoutines, type RoutineView } from '@/repositories/routinesRepo';
import type { Session } from '@/db/schema';
import { formatDurationLong } from '@/lib/format';
import { fromISODate, toISODate } from '@/lib/date';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function TrainScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const resume = useSessionStore((s) => s.resume);
  const activeId = useSessionStore((s) => s.activeId);
  const begin = useSessionStore((s) => s.begin);
  const [recent, setRecent] = useState<Session[]>([]);
  const [routines, setRoutines] = useState<RoutineView[]>([]);

  useFocusEffect(
    useCallback(() => {
      resume();
      setRecent(listSessions({ limit: 8 }));
      setRoutines(listRoutines());
    }, [resume])
  );

  const startRoutine = (r: RoutineView) => {
    begin('strength', { label: r.name, prefillExerciseIds: r.exerciseIds });
    const id = useSessionStore.getState().activeId!;
    navigation.navigate('ActiveSession', { sessionId: id });
  };

  const confirmDeleteRoutine = (r: RoutineView) => {
    Alert.alert(`Delete “${r.name}”?`, 'The routine template is removed; logged sessions are untouched.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteRoutine(r.id); setRoutines(listRoutines()); } },
    ]);
  };

  // Tapping a category opens its methods/splits/routines rather than blindly
  // starting a blank session — the "pick how you're training" step.
  const openCategory = (type: (typeof SESSION_TYPE_META)[number]) => {
    navigation.navigate('MethodPicker', { sessionType: type.type });
  };

  return (
    <Screen>
      <Text variant="h1">Train</Text>

      {activeId ? (
        <Card accent={theme.colors.accent}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Row gap={10} style={{ alignItems: 'center', flex: 1 }}>
              <Icon icon="core.timer" color={theme.colors.accent} />
              <View>
                <Text variant="bodyStrong">Session in progress</Text>
                <Text variant="caption" color="textMuted">
                  Tap to resume your check-in
                </Text>
              </View>
            </Row>
            <Button
              title="Resume"
              size="sm"
              fullWidth={false}
              onPress={() => navigation.navigate('ActiveSession', { sessionId: activeId })}
            />
          </Row>
        </Card>
      ) : (
        <Button
          title="Start a Session"
          icon="core.start"
          size="lg"
          onPress={() => navigation.navigate('SessionTypePicker')}
        />
      )}

      <Button
        title="Train a Split (Push / Pull / Legs…)"
        icon="stats.muscleMap"
        variant="secondary"
        onPress={() => navigation.navigate('SplitPicker')}
      />

      <Button
        title="Log a past session"
        icon="core.calendar"
        variant="ghost"
        onPress={() => navigation.navigate('LogSession')}
      />

      {/* Themed military / historical / lifestyle programmes */}
      <Pressable onPress={() => navigation.navigate('SpecialPrograms')}>
        <Card accent={theme.colors.accent} style={{ gap: 6 }}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Row gap={12} style={{ alignItems: 'center', flex: 1 }}>
              <Icon icon="mindbody.special" size={24} color={theme.colors.accent} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">Special Programmes</Text>
                <Text variant="caption" color="textMuted" numberOfLines={1}>
                  Military, Shaolin, Roman, Spartan, Dagestan… + their diets
                </Text>
              </View>
            </Row>
            <Icon icon="core.forward" size={18} color={theme.colors.textFaint} />
          </Row>
        </Card>
      </Pressable>

      <Row>
        <Button
          title="Walk"
          icon="cardio.walk"
          variant="secondary"
          onPress={() => navigation.navigate('Walk', { mode: 'walk' })}
          fullWidth={false}
          style={{ flex: 1 }}
        />
        <Button
          title="Run"
          icon="cardio.running"
          variant="secondary"
          onPress={() => navigation.navigate('Walk', { mode: 'run' })}
          fullWidth={false}
          style={{ flex: 1 }}
        />
      </Row>

      {/* Saved custom routines */}
      {routines.length > 0 && (
        <>
          <SectionHeader title="My Routines" />
          {routines.map((r) => (
            <Pressable key={r.id} onPress={() => startRoutine(r)}>
              <Card accent={theme.colors.primary}>
                <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Row gap={12} style={{ alignItems: 'center', flex: 1 }}>
                    <Icon icon="core.custom" size={20} color={theme.colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyStrong" numberOfLines={1}>{r.name}</Text>
                      <Text variant="caption" color="textMuted" numberOfLines={1}>
                        {r.exercises.length} exercises · {r.exercises.slice(0, 3).map((e) => e.name).join(', ')}
                        {r.exercises.length > 3 ? '…' : ''}
                      </Text>
                    </View>
                  </Row>
                  <Pressable onPress={() => confirmDeleteRoutine(r)} hitSlop={8} style={{ paddingHorizontal: 6 }}>
                    <Icon icon="core.delete" size={18} color={theme.colors.textFaint} />
                  </Pressable>
                  <Icon icon="core.start" size={22} color={theme.colors.primary} />
                </Row>
              </Card>
            </Pressable>
          ))}
        </>
      )}

      <SectionHeader title="Train by category" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md }}>
        {SESSION_TYPE_META.map((m) => (
          <Pressable
            key={m.type}
            onPress={() => openCategory(m)}
            style={{ width: '47%', flexGrow: 1 }}
          >
            <Card accent={m.color} style={{ gap: 8 }}>
              <Icon icon={m.icon} size={26} color={m.color} />
              <Text variant="h3">{m.label}</Text>
              <Text variant="caption" color="textMuted">
                {m.blurb}
              </Text>
            </Card>
          </Pressable>
        ))}
      </View>

      <SectionHeader
        title="Recent Sessions"
        action={recent.length ? 'All' : undefined}
        onAction={() => navigation.navigate('SessionHistory')}
      />
      {recent.length === 0 ? (
        <EmptyState
          icon="core.calendar"
          title="No sessions yet"
          message="Start your first session to build your history and stats."
        />
      ) : (
        recent.map((s) => (
          <Pressable key={s.id} onPress={() => navigation.navigate('SessionDetail', { sessionId: s.id })}>
            <Card>
              <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Row gap={12} style={{ alignItems: 'center', flex: 1 }}>
                  <Icon icon={sessionTypeIcon(s.sessionType)} size={22} color={theme.colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyStrong" numberOfLines={1}>
                      {s.label ?? labelFor(s.sessionType)}
                    </Text>
                    <Text variant="caption" color="textMuted">
                      {friendlyDate(s.startTime)} · {formatDurationLong(s.durationS ?? 0)}
                      {s.totalVolume ? ` · ${Math.round(s.totalVolume).toLocaleString()} kg` : ''}
                      {s.distanceM ? ` · ${(s.distanceM / 1000).toFixed(2)} km` : ''}
                    </Text>
                  </View>
                </Row>
                <Icon icon="core.forward" size={18} color={theme.colors.textFaint} />
              </Row>
            </Card>
          </Pressable>
        ))
      )}
    </Screen>
  );
}

function labelFor(type: string): string {
  return SESSION_TYPE_META.find((m) => m.type === type)?.label ?? 'Session';
}

function friendlyDate(ts: number): string {
  const d = new Date(ts);
  const today = toISODate(new Date());
  const iso = toISODate(d);
  if (iso === today) return 'Today';
  const yest = toISODate(new Date(Date.now() - 86_400_000));
  if (iso === yest) return 'Yesterday';
  return fromISODate(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
