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
import { WeatherCard } from '@/components/WeatherCard';
import { latestReading } from '@/repositories/weatherRepo';
import { weatherAdvice, HEAT_BAND_COLOR, HEAT_BAND_LABEL } from '@/lib/weather';
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
  const calories = walkCalories({
    weightKg,
    distanceM,
    durationSec: walk.elapsedS,
    activeSec: walk.activeS,
    steps: walk.steps,
  });
  // Pace from MOVING time, so pausing at a crossing doesn't make you look slower.
  const pace = distanceM > 0 && walk.activeS > 0 ? walk.activeS / (distanceM / 1000) : null;
  const unit = user?.unitPreference ?? 'metric';

  const start = () => {
    setSummary(null);
    warnedNoGps.current = false;
    walk.start(initialMode);
  };

  // Permissions resolve a moment after start (the dialogs and GPS handshake run
  // in the background so the UI isn't blocked). Warn once, when we actually know
  // GPS didn't come up — rather than guessing before the answer exists.
  const warnedNoGps = React.useRef(false);
  React.useEffect(() => {
    if (!walk.active || warnedNoGps.current) return;
    const p = walk.permissions;
    if (p && !p.gps) {
      warnedNoGps.current = true;
      Alert.alert(
        'Location off — no route map',
        'This session is being tracked by steps only. To draw your route and keep tracking with the screen off, enable Location for FitCoach (“Allow all the time”, or at least “While using the app”) in Android Settings → Apps → FitCoach → Permissions.'
      );
    }
  }, [walk.active, walk.permissions]);
  const stop = () => {
    const routeAtStop = walk.route;
    const result = walk.stop();
    if (result) setSummary({ ...result, route: routeAtStop });
  };

  const perms = walk.permissions;
  // The two things that make background tracking real, shown separately so it's
  // obvious which channel is live.
  const hwActive = walk.source === 'pedometer' || !!perms?.hardware;
  const gpsActive = walk.usingGps || !!perms?.gps;

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
          {walk.active && walk.elapsedS - walk.activeS > 30 && (
            <Text variant="caption" color="textMuted">
              {formatDuration(walk.activeS)} moving · {formatDuration(walk.elapsedS - walk.activeS)} paused
            </Text>
          )}
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

      {/* Auto-pause banner */}
      {walk.active && walk.paused && (
        <Card accent={theme.colors.warning}>
          <Row gap={10} style={{ alignItems: 'center' }}>
            <Icon icon="core.info" size={18} color={theme.colors.warning} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong" style={{ color: theme.colors.warning }}>Auto-paused</Text>
              <Text variant="caption" color="textMuted">
                {walk.pauseReason || 'No movement detected.'} It resumes on its own as soon as you start moving again.
              </Text>
            </View>
          </Row>
        </Card>
      )}

      {/* Tracking status — the two channels that make background tracking work */}
      {walk.active && (
        <Card accent={hwActive && gpsActive ? theme.colors.success : theme.colors.warning}>
          <View style={{ gap: 8 }}>
            <SourceRow
              ok={hwActive}
              label="Hardware step counter"
              detail={
                hwActive
                  ? 'Reading the device step-counter sensor. Keeps counting with the screen off and catches up the moment you return.'
                  : perms
                    ? 'Not active — using the accelerometer, which only counts while the app is open. Enable “Physical activity” for FitCoach in Android settings.'
                    : 'Connecting…'
              }
            />
            <SourceRow
              ok={gpsActive}
              label="GPS route tracking"
              detail={
                gpsActive
                  ? 'Foreground service running — records your path and distance even with the app closed or killed. Steps keep climbing from measured distance.'
                  : perms
                    ? 'Not active — set Location to “Allow all the time” so tracking survives the screen going off.'
                    : 'Connecting…'
              }
            />
          </View>
        </Card>
      )}

      {perms && !perms.notifications && walk.active && (
        <Text variant="caption" color="textFaint" center>
          Notifications are off — enable them for FitCoach to see the session in your
          notification bar.
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

      {/*
        The one activity that is always outdoors, so the weather matters most
        here. Before you start: is it safe, and what pace to expect. During: a
        one-line reminder, since heat advice matters more at minute 40 than at
        minute 0.
      */}
      {!walk.active ? (
        <WeatherCard plannedActiveMin={initialMode === 'run' ? 40 : 60} />
      ) : (
        <WalkWeatherLine />
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

/** One tracking channel's live status: green when it's actually running. */
function SourceRow({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  const theme = useTheme();
  const color = ok ? theme.colors.success : theme.colors.warning;
  return (
    <Row gap={10} style={{ alignItems: 'flex-start' }}>
      <Icon icon={ok ? 'core.check' : 'core.info'} size={17} color={color} />
      <View style={{ flex: 1 }}>
        <Text variant="label" style={{ color }}>{label}</Text>
        <Text variant="caption" color="textMuted">{detail}</Text>
      </View>
    </Row>
  );
}

/**
 * A single line while moving: the band, and the one thing to remember. Reads
 * the stored reading only — no fetch mid-session, the foreground service is
 * busy enough.
 */
function WalkWeatherLine() {
  const theme = useTheme();
  const reading = latestReading();
  if (!reading) return null;
  const advice = weatherAdvice(reading, { plannedActiveMin: 45 });
  if (advice.band === 'ideal' || advice.band === 'cool') return null;
  return (
    <Row gap={8} style={{ alignItems: 'center', paddingHorizontal: 4 }}>
      <Icon icon="weather.thermo" size={14} color={HEAT_BAND_COLOR[advice.band]} />
      <Text variant="caption" color="textMuted" style={{ flex: 1 }} numberOfLines={2}>
        {HEAT_BAND_LABEL[advice.band]}, feels like {Math.round(advice.feelsLike)}° — {advice.points[0]}
      </Text>
    </Row>
  );
}
