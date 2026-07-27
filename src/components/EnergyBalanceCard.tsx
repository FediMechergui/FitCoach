import React from 'react';
import { View, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/theme/ThemeProvider';
import { useNutritionStore } from '@/stores/nutritionStore';
import { Card } from './ui/Card';
import { Text } from './ui/Text';
import { Icon } from './ui/Icon';
import { Row, Divider } from './ui/misc';
import { energyBalanceFor } from '@/repositories/energyRepo';
import { trainingLoadFraction } from '@/lib/energyBalance';

/**
 * Daily energy balance: how much you've burned in training, how much is left to
 * eat toward your goal, and — the point — where the "line" is before extra
 * training starts working against the goal you set. Renders nothing until a
 * nutrition goal exists.
 */
export function EnergyBalanceCard({ date }: { date?: string }) {
  const theme = useTheme();
  // Stay current if food is logged while this screen is open / on return to it.
  const food = useNutritionStore((s) => s.food);
  const [tick, setTick] = React.useState(0);
  useFocusEffect(React.useCallback(() => setTick((t) => t + 1), []));
  const bal = React.useMemo(() => {
    try {
      return energyBalanceFor(date);
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, food, tick]);

  if (!bal) return null;

  const over = bal.status === 'over_trained';
  const accent = over
    ? theme.colors.danger
    : bal.status === 'over_eaten'
      ? theme.colors.warning
      : theme.colors.calories;
  const frac = trainingLoadFraction(bal);

  return (
    <Card accent={accent} style={{ gap: 10 }}>
      <Row gap={8} style={{ alignItems: 'center' }}>
        <Icon icon={over ? 'core.warning' : 'nutrition.calories'} size={18} color={accent} />
        <Text variant="h3" style={{ flex: 1 }}>Today's energy balance</Text>
      </Row>

      <Row style={{ justifyContent: 'space-between' }}>
        <View style={{ alignItems: 'center', flex: 1 }}>
          <Text variant="h3" style={{ color: theme.colors.calories }}>{bal.exerciseBurned}</Text>
          <Text variant="caption" color="textMuted">burned (training)</Text>
        </View>
        <View style={{ alignItems: 'center', flex: 1 }}>
          <Text variant="h3">{bal.consumed}</Text>
          <Text variant="caption" color="textMuted">eaten</Text>
        </View>
        <View style={{ alignItems: 'center', flex: 1 }}>
          <Text variant="h3" style={{ color: bal.leftToEat < 0 ? theme.colors.warning : theme.colors.success }}>
            {bal.leftToEat >= 0 ? bal.leftToEat : `+${-bal.leftToEat}`}
          </Text>
          <Text variant="caption" color="textMuted">{bal.leftToEat >= 0 ? 'left to eat' : 'over target'}</Text>
        </View>
      </Row>

      <Divider />

      {/* The "line": training burn against the over-training ceiling. */}
      <View style={{ gap: 4 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text variant="label" color="textMuted">Training load</Text>
          <Text variant="caption" color={over ? 'danger' : 'textMuted'}>
            {bal.exerciseBurned} / {bal.lineKcal} kcal to the line
          </Text>
        </Row>
        <View style={{ height: 8, borderRadius: 4, backgroundColor: theme.colors.surfaceAlt, overflow: 'hidden' }}>
          <View
            style={{
              width: `${Math.round(frac * 100)}%`,
              height: '100%',
              backgroundColor: over ? theme.colors.danger : frac > 0.8 ? theme.colors.warning : theme.colors.success,
            }}
          />
        </View>
      </View>

      <Text variant="caption" color={over ? 'danger' : 'textMuted'}>{bal.message}</Text>
      <Text variant="caption" color="textFaint">
        Your target already assumes everyday activity; logged training counts on top, so this leans
        cautious. The line is where energy left for your body would drop below what your goal needs.
      </Text>
    </Card>
  );
}

/**
 * The four-at-a-glance version for Home: ate · burned · left · restore.
 * "Restore" is how much to eat back to protect the goal (0 unless you've
 * under-eaten or over-trained). Tapping opens the nutrition diary.
 */
export function EnergyBalanceStrip({ onPress }: { onPress?: () => void }) {
  const theme = useTheme();
  // Recompute whenever the day's food/drink changes (logging a meal updates the
  // nutrition store) and whenever the screen regains focus — otherwise this card
  // would compute once on mount and then go stale as you eat.
  const food = useNutritionStore((s) => s.food);
  const beverages = useNutritionStore((s) => s.beverages);
  const nutritionDate = useNutritionStore((s) => s.date);
  const [tick, setTick] = React.useState(0);
  useFocusEffect(React.useCallback(() => setTick((t) => t + 1), []));

  const bal = React.useMemo(() => {
    try {
      return energyBalanceFor();
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [food, beverages, nutritionDate, tick]);

  if (!bal) return null;

  const cells: Array<{ label: string; value: number; color: string; sign?: boolean }> = [
    { label: 'Eaten', value: bal.consumed, color: theme.colors.text },
    { label: 'Burned', value: bal.exerciseBurned, color: theme.colors.calories },
    { label: bal.leftToEat >= 0 ? 'Left' : 'Over', value: Math.abs(bal.leftToEat), color: bal.leftToEat >= 0 ? theme.colors.success : theme.colors.warning },
    { label: 'Restore', value: bal.restoreKcal, color: bal.restoreKcal > 0 ? theme.colors.danger : theme.colors.textFaint },
  ];

  const body = (
    <Card style={{ gap: 8 }}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Row gap={6} style={{ alignItems: 'center' }}>
          <Icon icon="nutrition.calories" size={15} color={theme.colors.calories} />
          <Text variant="label" color="textMuted">Calories today</Text>
        </Row>
        <Text variant="caption" color="textFaint">kcal</Text>
      </Row>
      <Row style={{ justifyContent: 'space-between' }}>
        {cells.map((c) => (
          <View key={c.label} style={{ alignItems: 'center', flex: 1 }}>
            <Text variant="h3" style={{ color: c.color, fontVariant: ['tabular-nums'] }}>{c.value}</Text>
            <Text variant="caption" color="textMuted">{c.label}</Text>
          </View>
        ))}
      </Row>
      {bal.restoreKcal > 0 && (
        <Text variant="caption" color="danger" center>
          Eat back ~{bal.restoreKcal} kcal to protect your goal.
        </Text>
      )}
    </Card>
  );

  return onPress ? <Pressable onPress={onPress}>{body}</Pressable> : body;
}
