import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from '../ui/Text';

interface MacroDonutProps {
  protein: number; // grams
  carbs: number;
  fat: number;
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerValue?: string;
}

/** Macro breakdown ring chart (calorie-share of P/C/F). */
export function MacroDonut({
  protein,
  carbs,
  fat,
  size = 140,
  strokeWidth = 16,
  centerLabel,
  centerValue,
}: MacroDonutProps) {
  const theme = useTheme();
  const pC = protein * 4;
  const cC = carbs * 4;
  const fC = fat * 9;
  const total = pC + cC + fC || 1;

  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;

  const segments = [
    { frac: pC / total, color: theme.colors.protein },
    { frac: cC / total, color: theme.colors.carbs },
    { frac: fC / total, color: theme.colors.fat },
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
