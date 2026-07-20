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
import { Row, Badge } from '@/components/ui/misc';
import { RouteMap } from '@/components/RouteMap';
import type { RootStackParamList } from '@/navigation/types';
import { getWalkSession, deleteWalkSession } from '@/repositories/activityRepo';
import { parseRoute } from '@/lib/geo';
import { useUserStore } from '@/stores/userStore';
import { formatDurationLong, formatDistance, formatPace } from '@/lib/format';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type DetailRoute = RouteProp<RootStackParamList, 'WalkDetail'>;

const SOURCE_LABEL = { pedometer: 'Pedometer', accelerometer: 'Accelerometer', gps: 'GPS' } as const;

export function WalkDetailScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<DetailRoute>();
  const unit = useUserStore((s) => s.user?.unitPreference ?? 'metric');
  const session = useMemo(() => getWalkSession(route.params.walkId), [route.params.walkId]);

  if (!session) {
    return (
      <Screen>
        <Text variant="h2">Session not found</Text>
        <Button title="Back" onPress={() => navigation.goBack()} />
      </Screen>
    );
  }

  const path = parseRoute(session.routeJson);
  const isRun = session.mode === 'run';
  const accent = isRun ? theme.colors.outdoor : theme.colors.accent;

  const confirmDelete = () => {
    Alert.alert('Delete this session?', 'It will be removed from your history.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteWalkSession(session.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <Screen>
      <Row gap={12} style={{ alignItems: 'center' }}>
        <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: accent + '22', alignItems: 'center', justifyContent: 'center' }}>
          <Icon icon={isRun ? 'cardio.running' : 'cardio.walk'} size={26} color={accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="h2">{isRun ? 'Run' : 'Walk'}</Text>
          <Text variant="caption" color="textMuted">
            {new Date(session.startTime).toLocaleString(undefined, {
              weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </Text>
        </View>
        <Badge label={SOURCE_LABEL[session.source]} color={session.source === 'gps' ? theme.colors.outdoor : theme.colors.accent} />
      </Row>

      {/* Route map (GPS runs) */}
      {path.length > 1 ? (
        <Card>
          <Row gap={8} style={{ alignItems: 'center', marginBottom: 6 }}>
            <Icon icon="cardio.gps" size={16} color={theme.colors.outdoor} />
            <Text variant="label" color="textMuted">Your route</Text>
          </Row>
          <RouteMap route={path} height={240} />
        </Card>
      ) : (
        <Card accent={theme.colors.textFaint}>
          <Row gap={10} style={{ alignItems: 'flex-start' }}>
            <Icon icon="core.info" size={18} color={theme.colors.textFaint} />
            <Text variant="caption" color="textMuted" style={{ flex: 1 }}>
              No GPS route was recorded for this session. Runs draw a route only when location is
              set to “Allow all the time” (or “While using the app”) — otherwise distance is
              estimated from steps.
            </Text>
          </Row>
        </Card>
      )}

      <Row>
        <StatTile icon="cardio.steps" label="Steps" value={session.steps.toLocaleString()} />
        <StatTile icon="cardio.gps" label="Distance" value={formatDistance(session.distanceM, unit)} accent={theme.colors.outdoor} />
      </Row>
      <Row>
        <StatTile icon="core.timer" label="Time" value={formatDurationLong(session.durationS)} />
        <StatTile icon="nutrition.calories" label="Calories" value={`${Math.round(session.caloriesBurned)}`} sub="kcal" accent={theme.colors.calories} />
      </Row>
      {session.avgPace ? (
        <Row>
          <StatTile icon="cardio.pace" label="Avg pace" value={formatPace(session.avgPace, unit)} />
          <StatTile icon="cardio.marathon" label="Source" value={SOURCE_LABEL[session.source]} />
        </Row>
      ) : null}

      <Button title="Delete session" variant="ghost" icon="core.delete" color={theme.colors.danger} onPress={confirmDelete} />
    </Screen>
  );
}
