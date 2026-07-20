import React, { useEffect, useState } from 'react';
import { View, Alert } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pedometer } from 'expo-sensors';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { StatTile } from '@/components/ui/StatTile';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Row, Badge } from '@/components/ui/misc';
import { RouteMap } from '@/components/RouteMap';
import type { RootStackParamList } from '@/navigation/types';
import { useWalkStore } from '@/stores/walkStore';
import { useUserStore } from '@/stores/userStore';
import { useLiveWalk } from '@/hooks/usePedometer';
import { walkCalories } from '@/lib/met';
import type { LatLng } from '@/lib/geo';
import { formatDuration, formatDistance, formatPace } from '@/lib/format';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type WalkRoute = RouteProp<RootStackParamList, 'Walk'>;

const SOURCE_LABEL = { pedometer: 'Pedometer', accelerometer: 'Accelerometer', gps: 'GPS' } as const;

export function WalkScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<WalkRoute>();
  const initialMode = route.params?.mode ?? 'walk';

  const walk = useWalkStore();
  const user = useUserStore((s) => s.user);
  const weightKg = useUserStore((s) => s.currentWeightKg) ?? 75;

  const [hardwareAvailable, setHardwareAvailable] = useState<boolean | null>(null);
  const [summary, setSummary] = useState<{ steps: number; distanceM: number; calories: number; durationS: number; route: LatLng[] } | null>(null);

  useEffect(() => {
    Pedometer.isAvailableAsync().then(setHardwareAvailable).catch(() => setHardwareAvailable(false));
  }, []);

  // Reconnect to a session that kept running while the app was backgrounded.
  useFocusEffect(
    React.useCallback(() => {
      walk.resume();
    }, [])
  );

  useLiveWalk(walk.active);

  const distanceM = walk.distanceM;
  const calories = walkCalories({ weightKg, distanceM, durationSec: walk.elapsedS, steps: walk.steps });
  const pace = distanceM > 0 && walk.elapsedS > 0 ? walk.elapsedS / (distanceM / 1000) : null;
  const unit = user?.unitPreference ?? 'metric';

  const start = async () => {
    setSummary(null);
    await walk.start(initialMode);
    // If a run couldn't start GPS, say so loudly instead of silently counting steps.
    const perms = useWalkStore.getState().permissions;
    if (initialMode === 'run' && perms && !perms.gps) {
      Alert.alert(
        'Location off — no route map',
        'This run is being tracked by steps only. To draw your route, enable Location for FitCoach (set it to “Allow all the time”, or at least “While using the app”) in Android Settings → Apps → FitCoach → Permissions, then start the run again.'
      );
    }
  };
  const stop = () => {
    const routeAtStop = walk.route;
    const result = walk.stop();
    if (result) setSummary({ ...result, route: routeAtStop });
  };

  const perms = walk.permissions;
  const hardwareSource = walk.source === 'pedometer';

  if (summary) {
    return (
      <Screen>
        <View style={{ alignItems: 'center', gap: 6, paddingVertical: theme.spacing.md }}>
          <Icon icon="core.check" size={48} color={theme.colors.accent} />
          <Text variant="h1">{initialMode === 'run' ? 'Run' : 'Walk'} saved</Text>
        </View>
        {summary.route.length > 1 && (
          <Card>
            <Text variant="label" color="textMuted" style={{ marginBottom: 6 }}>Your route</Text>
            <RouteMap route={summary.route} height={220} />
          </Card>
        )}
        <Row>
          <StatTile icon="cardio.steps" label="Steps" value={summary.steps.toLocaleString()} />
          <StatTile icon="cardio.gps" label="Distance" value={formatDistance(summary.distanceM, unit)} accent={theme.colors.outdoor} />
        </Row>
        <Row>
          <StatTile icon="core.timer" label="Time" value={formatDuration(summary.durationS)} />
          <StatTile icon="nutrition.calories" label="Calories" value={`${summary.calories}`} sub="kcal" accent={theme.colors.calories} />
        </Row>
        <Button title="Done" onPress={() => navigation.navigate('Main')} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="h1">{initialMode === 'run' ? 'Run' : 'Walk'}</Text>
        <Badge
          label={walk.active ? SOURCE_LABEL[walk.source] : hardwareAvailable === false ? 'Accelerometer' : 'Pedometer'}
          color={hardwareAvailable === false ? theme.colors.warning : theme.colors.accent}
        />
      </Row>

      <Card>
        <View style={{ alignItems: 'center', gap: theme.spacing.md }}>
          <ProgressRing
            progress={walk.active ? (walk.steps % 1000) / 1000 : 0}
            size={200}
            strokeWidth={16}
            color={theme.colors.accent}
          >
            <View style={{ alignItems: 'center' }}>
              <Text variant="display" style={{ fontVariant: ['tabular-nums'] }}>
                {walk.steps.toLocaleString()}
              </Text>
              <Text variant="caption" color="textMuted">
                steps
              </Text>
            </View>
          </ProgressRing>
          <Text variant="h2" style={{ fontVariant: ['tabular-nums'] }}>
            {formatDuration(walk.elapsedS)}
          </Text>
        </View>
      </Card>

      <Row>
        <StatTile icon="cardio.gps" label="Distance" value={formatDistance(distanceM, unit)} accent={theme.colors.outdoor} />
        <StatTile icon="cardio.pace" label="Pace" value={formatPace(pace, unit)} />
        <StatTile icon="nutrition.calories" label="Calories" value={`${calories}`} accent={theme.colors.calories} />
      </Row>

      {/* Live GPS route (runs) */}
      {walk.active && walk.usingGps && (
        <Card>
          <Row gap={8} style={{ alignItems: 'center', marginBottom: 6 }}>
            <Icon icon="cardio.gps" size={16} color={theme.colors.outdoor} />
            <Text variant="label" color="textMuted">Live route</Text>
          </Row>
          <RouteMap route={walk.route} height={200} />
        </Card>
      )}

      {/* Tracking status */}
      {walk.active && (
        <Card accent={walk.usingGps || hardwareSource ? theme.colors.success : theme.colors.warning}>
          <Row gap={10} style={{ alignItems: 'flex-start' }}>
            <Icon
              icon={walk.usingGps || hardwareSource ? 'core.check' : 'core.info'}
              size={18}
              color={walk.usingGps || hardwareSource ? theme.colors.success : theme.colors.warning}
            />
            <Text variant="caption" color="textMuted" style={{ flex: 1 }}>
              {walk.usingGps
                ? 'GPS route tracking active — a persistent notification keeps the session running and recording your path even with the app closed or the screen off. Return here to finish.'
                : hardwareSource
                  ? 'Hardware step counter active — steps keep counting with the screen off and catch up the moment you come back. A notification stays in your bar until you finish.'
                  : 'Accelerometer mode — keep the app open and the screen on for accurate counting. A notification stays in your bar until you finish.'}
            </Text>
          </Row>
        </Card>
      )}

      {perms && !perms.notifications && walk.active && (
        <Text variant="caption" color="textFaint" center>
          Notifications are off — enable them for FitCoach to see the session in your
          notification bar.
        </Text>
      )}

      {perms && initialMode === 'run' && !perms.gps && walk.active && (
        <Text variant="caption" color="warning" center>
          Route mapping needs location set to “Allow all the time”. Enable it in Android settings
          to draw your run as a circuit — distance is estimated from steps meanwhile.
        </Text>
      )}

      {!walk.active && perms && !perms.motion && (
        <Text variant="caption" color="warning" center>
          Motion permission was denied. Enable “Physical activity” for FitCoach in Android settings to count steps.
        </Text>
      )}

      {hardwareAvailable === false && !walk.active && (
        <Text variant="caption" color="textFaint" center>
          No hardware step counter detected — FitCoach will use GPS distance and the accelerometer.
        </Text>
      )}

      {!walk.active ? (
        <Button
          title={walk.starting ? 'Starting…' : `Start ${initialMode === 'run' ? 'Run' : 'Walk'}`}
          icon="core.start"
          size="lg"
          onPress={start}
          disabled={walk.starting}
          color={theme.colors.accent}
        />
      ) : (
        <Button title="Finish" icon="core.end" size="lg" onPress={stop} color={theme.colors.danger} />
      )}
    </Screen>
  );
}
