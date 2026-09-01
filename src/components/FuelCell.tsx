import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Arc, Rail } from '@/components/ui/Meter';
import { Row } from '@/components/ui/misc';

/**
 * The Fuel cell — one progress grammar where v2 had three.
 *
 * The old Home stacked a big ring, two mini rings and a four-tile strip within
 * two hundred vertical pixels, each with its own visual language. This is one
 * cell: the day's calorie Arc as the hero numeral, and Water / Steps / Protein
 * as Rails beside it. Same component family as everywhere else in 3.0, same
 * overflow honesty: past the target the Arc hatches on in caution and the
 * number switches to "+n over" — the figure never lies while the fill clamps.
 */
export function FuelCell({
  calConsumed,
  calTarget,
  water,
  waterGoal,
  waterExtraMl,
  steps,
  stepGoal,
  protein,
  proteinGoal,
  onPress,
}: {
  calConsumed: number;
  calTarget: number;
  water: number;
  waterGoal: number;
  waterExtraMl: number;
  steps: number;
  stepGoal: number;
  protein: number;
  proteinGoal: number;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const over = Math.max(0, Math.round(calConsumed - calTarget));
  const left = Math.max(0, Math.round(calTarget - calConsumed));

  return (
    <Card onPress={onPress}>
      <Row gap={theme.spacing.lg} style={{ alignItems: 'center' }}>
        <Arc value={calConsumed} max={calTarget} size={132} strokeWidth={11} color={theme.colors.calories}>
          <View style={{ alignItems: 'center' }}>
            <Text
              variant="numeralM"
              style={{ fontSize: 30, lineHeight: 34, color: over > 0 ? theme.colors.warning : theme.colors.text }}
            >
              {over > 0 ? `+${over.toLocaleString()}` : left.toLocaleString()}
            </Text>
            <Text variant="caption" color="textMuted">
              {over > 0 ? 'kcal over' : 'kcal left'}
            </Text>
          </View>
        </Arc>

        <View style={{ flex: 1, gap: theme.spacing.md }}>
          <FuelRail
            label="Water"
            value={`${(water / 1000).toFixed(1)} / ${(waterGoal / 1000).toFixed(1)} L`}
            sub={waterExtraMl > 0 ? `+${(waterExtraMl / 1000).toFixed(1)} for the heat` : undefined}
            progress={water}
            max={waterGoal}
            color={theme.colors.water}
          />
          <FuelRail
            label="Steps"
            value={`${steps.toLocaleString()} / ${stepGoal.toLocaleString()}`}
            progress={steps}
            max={stepGoal}
            color={theme.colors.accent}
          />
          <FuelRail
            label="Protein"
            value={`${Math.round(protein)} / ${proteinGoal} g`}
            progress={protein}
            max={proteinGoal}
            color={theme.colors.protein}
          />
        </View>
      </Row>
    </Card>
  );
}

function FuelRail({
  label,
  value,
  sub,
  progress,
  max,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  progress: number;
  max: number;
  color: string;
}) {
  const theme = useTheme();
  return (
    <View style={{ gap: 4 }}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Text variant="eyebrow" color="textMuted">
          {label}
        </Text>
        <Text variant="label" style={{ fontVariant: ['tabular-nums'] }}>
          {value}
        </Text>
      </Row>
      <Rail value={progress} max={max} color={color} height={7} />
      {sub ? (
        <Text variant="caption" color="textFaint" style={{ fontSize: 11 }}>
          {sub}
        </Text>
      ) : null}
    </View>
  );
}
