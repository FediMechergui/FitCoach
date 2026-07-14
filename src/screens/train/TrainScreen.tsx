import React, { useCallback, useState } from 'react';
import { View, Pressable } from 'react-native';
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

  useFocusEffect(
    useCallback(() => {
      resume();
      setRecent(listSessions({ limit: 8 }));
    }, [resume])
  );

  const quickStart = (type: (typeof SESSION_TYPE_META)[number]) => {
    begin(type.type);
    const id = useSessionStore.getState().activeId!;
    navigation.navigate('ActiveSession', { sessionId: id });
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

      <SectionHeader title="Quick Start" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md }}>
        {SESSION_TYPE_META.map((m) => (
          <Pressable
            key={m.type}
            onPress={() => quickStart(m)}
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
