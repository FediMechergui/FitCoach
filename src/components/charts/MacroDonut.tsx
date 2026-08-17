import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from '../ui/Text';
import { macroEnergyShares } from '@/lib/foodMath';

interface MacroDonutProps {
  protein: number; // grams
  carbs: number; // grams, fibre included (as on every label)
  fat: number;
  /** grams of fibre, already counted inside `carbs` — carved out as its own slice */
  fiber?: number;
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerValue?: string;
}

/**
 * Macro breakdown ring chart — calorie share of protein / carbs / fibre / fat.
 * The split itself is `macroEnergyShares` in lib/foodMath (pure, tested);
 * fibre is carved out of the carb slice there, never added on top.
 */
export function MacroDonut({
  protein,
  carbs,
  fat,
  fiber = 0,
  size = 140,
  strokeWidth = 16,
  centerLabel,
  centerValue,
}: MacroDonutProps) {
  const theme = useTheme();
  const shares = macroEnergyShares({ protein, carbs, fat, fiber });

  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;

  // Fibre sits beside carbs, because that is where it came from.
  const segments = [
    { frac: shares.protein, color: theme.colors.protein },
    { frac: shares.carbs, color: theme.colors.carbs },
    { frac: shares.fiber, color: theme.colors.fiber },
    { frac: shares.fat, color: theme.colors.fat },
  ];

  let offset = 0;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={theme.colors.surfaceAlt}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {segments.map((s, i) => {
          const dash = circ * s.frac;
          const gap = circ - dash;
          const el = (
            <Circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={s.color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
          offset += dash;
          return el;
        })}
      </Svg>
      <View style={{ alignItems: 'center' }}>
        {centerValue ? <Text variant="h2">{centerValue}</Text> : null}
        {centerLabel ? (
          <Text variant="caption" color="textMuted">
            {centerLabel}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
