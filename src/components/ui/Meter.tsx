import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * One progress grammar, two forms.
 *
 * v2 grew three visual grammars for progress within two hundred vertical
 * pixels. v3 has exactly one, in two forms: the Arc, reserved for a day's few
 * primaries, and the Rail, everywhere else.
 *
 * The shared overflow language is the honesty rule: past 100% the fill does
 * not clamp while the number tells the truth, and the number does not lie
 * while the fill clamps. The base fills completely and an overflow segment in
 * the caution colour renders the excess (capped at 50% of the track so a
 * 300%-of-target day stays legible); labelling it "+n over" is the caller's
 * side of the contract.
 */

interface RailProps {
  /** 0..∞ — values past `max` render the overflow segment */
  value: number;
  max: number;
  color?: string;
  height?: number;
  /** override the overflow colour (defaults to the caution token) */
  overflowColor?: string;
}

export function Rail({ value, max, color, height = 8, overflowColor }: RailProps) {
  const theme = useTheme();
  const fill = color ?? theme.colors.primary;
  const safeMax = max > 0 ? max : 1;
  const frac = Math.max(0, value / safeMax);
  const base = Math.min(1, frac);
  // Overflow expressed as a share of the track, capped so extremes stay legible.
  const over = Math.min(0.5, Math.max(0, frac - 1) / 2);

  return (
    <View
      style={{
        height,
        borderRadius: height / 2,
        backgroundColor: theme.alpha.tint08(fill),
        overflow: 'hidden',
        flexDirection: 'row',
      }}
    >
      <View
        style={{
          width: `${base * 100}%`,
          backgroundColor: fill,
          borderRadius: height / 2,
        }}
      />
      {over > 0 && (
        <View
          style={{
            width: `${over * 100}%`,
            backgroundColor: overflowColor ?? theme.colors.warning,
            opacity: 0.9,
            borderTopRightRadius: height / 2,
            borderBottomRightRadius: height / 2,
            marginLeft: 1,
          }}
        />
      )}
    </View>
  );
}

interface ArcProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  /** what sits in the middle — a numeral, a label */
  children?: React.ReactNode;
}

export function Arc({ value, max, size = 120, strokeWidth = 10, color, children }: ArcProps) {
  const theme = useTheme();
  const fill = color ?? theme.colors.primary;
  const safeMax = max > 0 ? max : 1;
  const frac = Math.max(0, value / safeMax);
  const base = Math.min(1, frac);
  const over = Math.min(0.5, Math.max(0, frac - 1) / 2);

  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const gap = 0.02 * c; // breathing room between base and overflow

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={theme.alpha.tint08(fill)}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={fill}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${base * c} ${c}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        {over > 0 && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={theme.colors.warning}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${over * c} ${c}`}
            strokeDashoffset={-(base * c + gap)}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
      </Svg>
      {children}
    </View>
  );
}
