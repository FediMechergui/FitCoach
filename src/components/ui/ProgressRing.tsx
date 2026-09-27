import React from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Circle, G } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

interface ProgressRingProps {
  /** 0..1 (values >1 are clamped for the arc but can be shown as overflow). */
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  value?: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 12,
  color,
  trackColor,
  label,
  value,
  children,
}: ProgressRingProps) {
  const theme = useTheme();
  const clamped = Math.max(0, Math.min(1, progress));
  const over = progress > 1;
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * clamped;
  const ringColor = over ? theme.colors.warning : color ?? theme.colors.primary;

  const uid = React.useId().replace(/:/g, '');
  const gradId = `ring-grad-${uid}`;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.9} />
            <Stop offset="40%" stopColor={ringColor} stopOpacity={1} />
            <Stop offset="100%" stopColor={over ? '#D32F2F' : ringColor} stopOpacity={0.8} />
          </LinearGradient>
        </Defs>

        <G>
          {/* Subtle outer baseline track */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={trackColor ?? theme.colors.surfaceAlt}
            strokeWidth={strokeWidth}
            fill="none"
          />

          {/* Soft ambient glow underneath the active arc */}
          {clamped > 0.02 && (
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={ringColor}
              strokeOpacity={0.22}
              strokeWidth={strokeWidth + 4}
              fill="none"
              strokeDasharray={`${dash} ${circ}`}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          )}

          {/* Primary active progress arc with gradient */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={`url(#${gradId})`}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </G>
      </Svg>
      {children ?? (

        <View style={{ alignItems: 'center' }}>
          {value ? (
            <Text variant="h2" style={{ fontVariant: ['tabular-nums'] }}>
              {value}
            </Text>
          ) : null}
          {label ? (
            <Text variant="caption" color="textMuted">
              {label}
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
}
