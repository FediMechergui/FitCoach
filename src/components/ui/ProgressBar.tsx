import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

interface ProgressBarProps {
  progress: number; // 0..1
  color?: string;
  height?: number;
  trackColor?: string;
}

export function ProgressBar({ progress, color, height = 8, trackColor }: ProgressBarProps) {
  const theme = useTheme();
  const clamped = Math.max(0, Math.min(1, progress));
  const over = progress > 1;
  return (
    <View
      style={{
        height,
        borderRadius: height,
        backgroundColor: trackColor ?? theme.colors.surfaceAlt,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          height: '100%',
          width: `${clamped * 100}%`,
          borderRadius: height,
          backgroundColor: over ? theme.colors.warning : color ?? theme.colors.primary,
        }}
      />
    </View>
  );
}
