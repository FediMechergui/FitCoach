import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
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
import type { RootStackParamList } from '@/navigation/types';
import { useWalkStore } from '@/stores/walkStore';
import { useUserStore } from '@/stores/userStore';
import { useLivePedometer } from '@/hooks/usePedometer';
import { distanceFromSteps } from '@/lib/pedometer';
import { walkCalories } from '@/lib/met';
import { formatDuration, formatDistance, formatPace } from '@/lib/format';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type WalkRoute = RouteProp<RootStackParamList, 'Walk'>;

export function WalkScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<WalkRoute>();
  const initialMode = route.params?.mode ?? 'walk';

  const walk = useWalkStore();
  const user = useUserStore((s) => s.user);
  const weightKg = useUserStore((s) => s.currentWeightKg) ?? 75;
  const heightCm = user?.heightCm ?? 175;

  const [hardwareAvailable, setHardwareAvailable] = useState<boolean | null>(null);
  const [summary, setSummary] = useState<{ steps: number; distanceM: number; calories: number; durationS: number } | null>(null);

  useEffect(() => {
    Pedometer.isAvailableAsync().then(setHardwareAvailable).catch(() => setHardwareAvailable(false));
  }, []);

  useLivePedometer(walk.active);

  const distanceM = distanceFromSteps(walk.steps, heightCm, walk.mode);
  const calories = walkCalories({ weightKg, distanceM, durationSec: walk.elapsedS, steps: walk.steps });
  const pace = distanceM > 0 && walk.elapsedS > 0 ? walk.elapsedS / (distanceM / 1000) : null;
  const unit = user?.unitPreference ?? 'metric';

  const start = () => {
    setSummary(null);
    walk.start(initialMode, hardwareAvailable ? 'pedometer' : 'accelerometer');
  };
  const stop = () => {
    const result = walk.stop();
    if (result) setSummary(result);
  };

  if (summary) {
    return (
      <Screen>
        <View style={{ alignItems: 'center', gap: 6, paddingVertical: theme.spacing.md }}>
          <Icon icon="core.check" size={48} color={theme.colors.accent} />
          <Text variant="h1">{initialMode === 'run' ? 'Run' : 'Walk'} saved</Text>
        </View>
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
          label={hardwareAvailable === false ? 'Accelerometer' : 'Pedometer'}
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

      {hardwareAvailable === false && (
        <Text variant="caption" color="textFaint" center>
          Hardware step counter unavailable — using the accelerometer peak-detection
          fallback. Keep the screen on for best accuracy.
        </Text>
      )}

      {!walk.active ? (
        <Button title={`Start ${initialMode === 'run' ? 'Run' : 'Walk'}`} icon="core.start" size="lg" onPress={start} color={theme.colors.accent} />
      ) : (
        <Button title="Finish" icon="core.end" size="lg" onPress={stop} color={theme.colors.danger} />
      )}
    </Screen>
  );
}
