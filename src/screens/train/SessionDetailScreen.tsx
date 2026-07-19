import React, { useMemo } from 'react';
import { View, Alert } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { StatTile } from '@/components/ui/StatTile';
import { Row, Divider } from '@/components/ui/misc';
import type { RootStackParamList } from '@/navigation/types';
import { deleteSession, getSessionDetail } from '@/repositories/sessionRepo';
import { metaFor, MOOD_EMOJI } from '@/constants/sessionTypes';
import { formatDurationLong, formatDistance, formatPace, formatDuration } from '@/lib/format';
import type { SetEntry } from '@/db/schema';
import { useUserStore } from '@/stores/userStore';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type DetailRoute = RouteProp<RootStackParamList, 'SessionDetail'>;

/** Human-readable one-liner for a logged set (reps/weight, or time/distance). */
function describeSet(s: SetEntry): string {
  const parts: string[] = [];
  if (s.weightKg != null) parts.push(`${s.weightKg} kg`);
  if (s.reps != null) parts.push(`${s.reps} reps`);
  if (s.durationS != null) parts.push(formatDuration(s.durationS));
  if (s.distanceM != null) parts.push(`${(s.distanceM / 1000).toFixed(2)} km`);
  if (s.rpe != null) parts.push(`RPE ${s.rpe}`);
  return parts.join(' · ') || '—';
}

export function SessionDetailScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<DetailRoute>();
  const unit = useUserStore((s) => s.user?.unitPreference ?? 'metric');
  const detail = useMemo(() => getSessionDetail(route.params.sessionId), [route.params.sessionId]);
  const { session, logs } = detail;
  const meta = metaFor(session.sessionType);
  const isLifting = meta.flow === 'lifting';

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
      <Row gap={12} style={{ alignItems: 'center' }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 16,
            backgroundColor: meta.color + '22',
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

      {isLifting && logs.length > 0 && (
        <Card style={{ gap: 12 }}>
          <Text variant="h3">Exercises</Text>
          {logs.map((lv, idx) => (
            <View key={lv.log.id} style={{ gap: 6 }}>
              {idx > 0 ? <Divider /> : null}
              <Row gap={8} style={{ alignItems: 'center' }}>
                <Icon icon={lv.iconKey} size={18} color={theme.colors.primary} />
                <Text variant="bodyStrong">{lv.exerciseName}</Text>
              </Row>
              {lv.sets.map((s) => (
                <Row key={s.id} style={{ paddingLeft: 26, alignItems: 'center' }}>
                  <Text variant="caption" color="textFaint" style={{ width: 30 }}>
                    #{s.setNumber}
                  </Text>
                  <Text variant="body" style={{ flex: 1 }}>
                    {describeSet(s)}
                  </Text>
                  {s.isPr ? <Icon icon="core.pr" size={15} color={theme.colors.warning} /> : null}
                </Row>
              ))}
            </View>
          ))}
        </Card>
      )}

      <Button title="Delete Session" variant="ghost" icon="core.delete" onPress={confirmDelete} color={theme.colors.danger} />
    </Screen>
  );
}
