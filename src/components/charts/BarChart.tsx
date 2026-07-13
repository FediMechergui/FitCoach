import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from '../ui/Text';

export interface Bar {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: Bar[];
  height?: number;
  color?: string;
  valueFormat?: (v: number) => string;
}

/** Simple vertical bar chart using flex-height Views (no SVG needed). */
export function BarChart({ data, height = 160, color, valueFormat }: BarChartProps) {
  const theme = useTheme();
  const max = Math.max(1, ...data.map((d) => d.value));

  if (data.length === 0) {
    return (
      <View style={{ height, alignItems: 'center', justifyContent: 'center' }}>
        <Text variant="caption" color="textFaint">
          Not enough data yet
        </Text>
      </View>
    );
  }

  return (
    <View style={{ height, flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
      {data.map((d, i) => {
        const h = Math.max(2, (d.value / max) * (height - 28));
        return (
          <View key={i} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
            {valueFormat && d.value > 0 ? (
              <Text variant="caption" color="textFaint" style={{ fontSize: 9 }}>
                {valueFormat(d.value)}
              </Text>
            ) : null}
            <View
              style={{
                width: '80%',
                height: h,
                borderRadius: 6,
                backgroundColor: d.color ?? color ?? theme.colors.primary,
              }}
            />
            <Text variant="caption" color="textFaint" style={{ fontSize: 10 }} numberOfLines={1}>
              {d.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
