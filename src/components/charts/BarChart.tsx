import React, { useRef } from 'react';
import { ScrollView, View } from 'react-native';
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
  /** the narrowest a column may go before the chart scrolls instead (dp) */
  minBarWidth?: number;
}

/**
 * Simple vertical bar chart using flex-height Views (no SVG needed).
 *
 * Columns have a real minimum width. A month of data used to squeeze thirty
 * flex-1 columns into one card — ~10 dp each, so two-digit value labels
 * wrapped into vertical rubble and every date truncated to "..". Below the
 * minimum the chart becomes horizontally scrollable and starts at its most
 * recent end; with room to spare the columns stretch to fill exactly as
 * before.
 */
export function BarChart({ data, height = 160, color, valueFormat, minBarWidth = 26 }: BarChartProps) {
  const theme = useTheme();
  const scroll = useRef<ScrollView>(null);
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
    <ScrollView
      ref={scroll}
      horizontal
      showsHorizontalScrollIndicator={false}
      bounces={false}
      // History reads oldest→newest, so land on now, not thirty days ago.
      onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <View style={{ height, flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
        {data.map((d, i) => {
          const h = Math.max(2, (d.value / max) * (height - 28));
          return (
            <View key={i} style={{ flex: 1, minWidth: minBarWidth, alignItems: 'center', gap: 4 }}>
              {valueFormat && d.value > 0 ? (
                <Text variant="caption" color="textFaint" style={{ fontSize: 9 }} numberOfLines={1}>
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
    </ScrollView>
  );
}
