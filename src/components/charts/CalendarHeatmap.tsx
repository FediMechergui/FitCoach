import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from '../ui/Text';
import type { DayActivity } from '@/repositories/statsRepo';

interface CalendarHeatmapProps {
  data: DayActivity[]; // chronological, oldest first
  color?: string;
}

/** GitHub-style consistency heatmap (spec §3.3). Renders week columns. */
export function CalendarHeatmap({ data, color }: CalendarHeatmapProps) {
  const theme = useTheme();
  const brand = color ?? theme.colors.accent;
  const max = Math.max(1, ...data.map((d) => d.count));

  // Pad the front so the first column starts on a Monday.
  const first = data[0];
  const leadingBlanks = first ? (new Date(first.date).getDay() + 6) % 7 : 0;
  const cells: Array<DayActivity | null> = [
    ...Array(leadingBlanks).fill(null),
    ...data,
  ];

  const weeks: Array<Array<DayActivity | null>> = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const cellColor = (count: number) => {
    if (count <= 0) return theme.colors.surfaceAlt;
    const intensity = 0.35 + 0.65 * (count / max);
    return brand +
      Math.round(intensity * 255)
        .toString(16)
        .padStart(2, '0');
  };

  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 3 }}>
        {weeks.map((week, wi) => (
          <View key={wi} style={{ gap: 3 }}>
            {Array.from({ length: 7 }).map((_, di) => {
              const cell = week[di];
              return (
                <View
                  key={di}
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 3,
                    backgroundColor: cell ? cellColor(cell.count) : 'transparent',
                  }}
                />
              );
            })}
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
        <Text variant="caption" color="textFaint" style={{ fontSize: 10 }}>
          Less
        </Text>
        {[0, 0.4, 0.7, 1].map((f, i) => (
          <View
            key={i}
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              backgroundColor: f === 0 ? theme.colors.surfaceAlt : brand + Math.round((0.35 + 0.65 * f) * 255).toString(16).padStart(2, '0'),
            }}
          />
        ))}
        <Text variant="caption" color="textFaint" style={{ fontSize: 10 }}>
          More
        </Text>
      </View>
    </View>
  );
}
