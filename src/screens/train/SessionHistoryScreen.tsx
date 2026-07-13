import React, { useCallback, useState } from 'react';
import { View, Pressable, FlatList } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Row, EmptyState } from '@/components/ui/misc';
import type { RootStackParamList } from '@/navigation/types';
import { listSessions } from '@/repositories/sessionRepo';
import { listWalkSessions } from '@/repositories/activityRepo';
import type { Session } from '@/db/schema';
import { sessionTypeIcon } from '@/constants/icon-map';
import { metaFor } from '@/constants/sessionTypes';
import { formatDurationLong, formatDistance } from '@/lib/format';
import { toISODate, fromISODate } from '@/lib/date';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function SessionHistoryScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const [view, setView] = useState<'sessions' | 'walks'>('sessions');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [walks, setWalks] = useState<ReturnType<typeof listWalkSessions>>([]);

  useFocusEffect(
    useCallback(() => {
      setSessions(listSessions({ limit: 200 }));
      setWalks(listWalkSessions(200));
    }, [])
  );

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <View style={{ padding: theme.spacing.lg }}>
        <SegmentedControl
          options={[
            { value: 'sessions', label: 'Sessions', icon: 'nav.train' },
            { value: 'walks', label: 'Walks & Runs', icon: 'cardio.walk' },
          ]}
          value={view}
          onChange={setView}
        />
      </View>

      {view === 'sessions' ? (
        <FlatList
          data={sessions}
          keyExtractor={(s) => `s${s.id}`}
          contentContainerStyle={{ padding: theme.spacing.lg, paddingTop: 0, gap: theme.spacing.sm, paddingBottom: 40 }}
          ListEmptyComponent={<EmptyState icon="core.calendar" title="No sessions yet" />}
          renderItem={({ item }) => {
            const meta = metaFor(item.sessionType);
            return (
              <Pressable onPress={() => navigation.navigate('SessionDetail', { sessionId: item.id })}>
                <Card accent={meta.color}>
                  <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <Row gap={12} style={{ alignItems: 'center', flex: 1 }}>
                      <Icon icon={sessionTypeIcon(item.sessionType)} size={22} color={meta.color} />
                      <View style={{ flex: 1 }}>
                        <Text variant="bodyStrong">{item.label ?? meta.label}</Text>
                        <Text variant="caption" color="textMuted">
                          {friendlyDate(item.startTime)} · {formatDurationLong(item.durationS ?? 0)}
                          {item.totalVolume ? ` · ${Math.round(item.totalVolume).toLocaleString()} kg` : ''}
                        </Text>
                      </View>
                    </Row>
                    <Icon icon="core.forward" size={18} color={theme.colors.textFaint} />
                  </Row>
                </Card>
              </Pressable>
            );
          }}
        />
      ) : (
        <FlatList
          data={walks}
          keyExtractor={(w) => `w${w.id}`}
          contentContainerStyle={{ padding: theme.spacing.lg, paddingTop: 0, gap: theme.spacing.sm, paddingBottom: 40 }}
          ListEmptyComponent={<EmptyState icon="cardio.walk" title="No walks yet" />}
          renderItem={({ item }) => (
            <Card accent={theme.colors.accent}>
              <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Row gap={12} style={{ alignItems: 'center', flex: 1 }}>
                  <Icon icon={item.mode === 'run' ? 'cardio.running' : 'cardio.walk'} size={22} color={theme.colors.accent} />
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyStrong">
                      {item.mode === 'run' ? 'Run' : 'Walk'} · {item.steps.toLocaleString()} steps
                    </Text>
                    <Text variant="caption" color="textMuted">
                      {friendlyDate(item.startTime)} · {formatDurationLong(item.durationS)} · {formatDistance(item.distanceM, 'metric')}
                    </Text>
                  </View>
                </Row>
                <Text variant="caption" color="textMuted">
                  {Math.round(item.caloriesBurned)} kcal
                </Text>
              </Row>
            </Card>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function friendlyDate(ts: number): string {
  const iso = toISODate(new Date(ts));
  const today = toISODate(new Date());
  if (iso === today) return 'Today';
  if (iso === toISODate(new Date(Date.now() - 86_400_000))) return 'Yesterday';
  return fromISODate(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}
