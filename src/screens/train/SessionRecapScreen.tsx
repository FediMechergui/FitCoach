import React, { useMemo } from 'react';
import { View } from 'react-native';
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
import type { RootStackParamList } from '@/navigation/types';
import { getSessionDetail } from '@/repositories/sessionRepo';
import { metaFor, MOOD_EMOJI } from '@/constants/sessionTypes';
import { formatDurationLong, formatDistance, formatPace } from '@/lib/format';
import { useUserStore } from '@/stores/userStore';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type RecapRoute = RouteProp<RootStackParamList, 'SessionRecap'>;

export function SessionRecapScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<RecapRoute>();
  const unit = useUserStore((s) => s.user?.unitPreference ?? 'metric');
  const detail = useMemo(() => getSessionDetail(route.params.sessionId), [route.params.sessionId]);
  const { session, logs } = detail;
  const meta = metaFor(session.sessionType);
  const isLifting = meta.flow === 'lifting';
  const prCount = route.params.prCount ?? 0;

  return (
    <Screen>
      <View style={{ alignItems: 'center', gap: 6, paddingVertical: theme.spacing.md }}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 24,
            backgroundColor: meta.color + '22',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon icon="core.check" size={40} color={meta.color} />
        </View>
        <Text variant="h1">Nice work!</Text>
        <Text variant="body" color="textMuted">
          {meta.label} session complete
        </Text>
        {prCount > 0 && (
          <Badge label={`${prCount} new PR${prCount === 1 ? '' : 's'} 🏆`} color={theme.colors.warning} />
        )}
      </View>

      <Row>
        <StatTile icon="core.timer" label="Duration" value={formatDurationLong(session.durationS ?? 0)} />
        <StatTile
          icon="nutrition.calories"
          label="Calories"
          value={`${Math.round(session.caloriesBurned ?? 0)}`}
          sub="kcal (est.)"
          accent={theme.colors.calories}
        />
      </Row>

      {isLifting && (
        <Row>
          <StatTile
            icon="stats.volume"
            label="Total volume"
            value={`${Math.round(session.totalVolume ?? 0).toLocaleString()}`}
            sub="kg"
            accent={theme.colors.primary}
          />
          <StatTile icon="strength.dumbbell" label="Exercises" value={`${logs.length}`} />
        </Row>
      )}

      {!isLifting && session.distanceM ? (
        <Row>
          <StatTile
            icon="cardio.gps"
            label="Distance"
            value={formatDistance(session.distanceM, unit)}
            accent={theme.colors.outdoor}
          />
          <StatTile icon="cardio.pace" label="Pace" value={formatPace(session.pace, unit)} />
        </Row>
      ) : null}

      {meta.flow === 'mindbody' && (session.moodBefore || session.moodAfter) && (
        <Card>
          <Text variant="h3" style={{ marginBottom: 8 }}>
            Mood check-in
          </Text>
          <Row style={{ justifyContent: 'space-around', alignItems: 'center' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 34 }}>{session.moodBefore ? MOOD_EMOJI[session.moodBefore - 1] : '—'}</Text>
              <Text variant="caption" color="textMuted">
                Before
              </Text>
            </View>
            <Icon icon="core.forward" color={theme.colors.textFaint} />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 34 }}>{session.moodAfter ? MOOD_EMOJI[session.moodAfter - 1] : '—'}</Text>
              <Text variant="caption" color="textMuted">
                After
              </Text>
            </View>
          </Row>
        </Card>
      )}

      {isLifting && logs.length > 0 && (
        <Card style={{ gap: 10 }}>
          <Text variant="h3">Exercises</Text>
          {logs.map((lv) => {
            const sets = lv.sets.filter((s) => s.completed).length;
            const top = Math.max(0, ...lv.sets.map((s) => s.weightKg ?? 0));
            const hasPr = lv.sets.some((s) => s.isPr);
            return (
              <Row key={lv.log.id} style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Row gap={8} style={{ alignItems: 'center', flex: 1 }}>
                  <Icon icon={lv.iconKey} size={18} color={theme.colors.primary} />
                  <Text variant="body" numberOfLines={1} style={{ flex: 1 }}>
                    {lv.exerciseName}
                  </Text>
                  {hasPr ? <Icon icon="core.pr" size={16} color={theme.colors.warning} /> : null}
                </Row>
                <Text variant="caption" color="textMuted">
                  {sets} set{sets === 1 ? '' : 's'}
                  {top > 0 ? ` · top ${top} kg` : ''}
                </Text>
              </Row>
            );
          })}
        </Card>
      )}

      <Button title="Done" icon="core.check" onPress={() => navigation.navigate('Main')} />
    </Screen>
  );
}
