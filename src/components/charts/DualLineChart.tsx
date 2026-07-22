import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, Line as SvgLine } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from '../ui/Text';
import { Row } from '../ui/misc';

export interface DualPoint {
  date: string;
  expected: number | null;
  actual: number | null;
}

interface Props {
  data: DualPoint[];
  height?: number;
  expectedColor?: string;
  actualColor?: string;
  expectedLabel?: string;
  actualLabel?: string;
  unit?: string;
}

/**
 * Two-line chart: the modelled trajectory (dashed) against what was actually
 * measured (solid, with dots). Gaps in either series are skipped rather than
 * interpolated — a missing weigh-in should look missing, not invented.
 */
export function DualLineChart({
  data,
  height = 180,
  expectedColor,
  actualColor,
  expectedLabel = 'Expected',
  actualLabel = 'Actual',
  unit = '',
}: Props) {
  const theme = useTheme();
  const [width, setWidth] = React.useState(0);
  const exp = expectedColor ?? theme.colors.textFaint;
  const act = actualColor ?? theme.colors.primary;

  const values = data.flatMap((d) => [d.expected, d.actual]).filter((v): v is number => v != null);
  if (values.length === 0) {
    return (
      <View style={{ height, alignItems: 'center', justifyContent: 'center' }}>
        <Text variant="caption" color="textFaint">Not enough data yet</Text>
      </View>
    );
  }

  const padL = 42;
  const padR = 10;
  const padT = 10;
  const padB = 18;
  let minY = Math.min(...values);
  let maxY = Math.max(...values);
  if (maxY - minY < 0.5) {
    // Flat series still deserves a readable band.
    minY -= 0.5;
    maxY += 0.5;
  }
  const range = maxY - minY || 1;
  const chartW = Math.max(0, width - padL - padR);
  const chartH = height - padT - padB;

  const xAt = (i: number) => padL + (data.length === 1 ? chartW / 2 : (i / (data.length - 1)) * chartW);
  const yAt = (v: number) => padT + chartH - ((v - minY) / range) * chartH;

  /** Build a path that breaks on nulls instead of drawing through them. */
  const pathFor = (pick: (d: DualPoint) => number | null) => {
    let d = '';
    let pen = false;
    data.forEach((pt, i) => {
      const v = pick(pt);
      if (v == null) {
        pen = false;
        return;
      }
      d += `${pen ? 'L' : 'M'} ${xAt(i).toFixed(1)} ${yAt(v).toFixed(1)} `;
      pen = true;
    });
    return d.trim();
  };

  const grid = [maxY, (maxY + minY) / 2, minY];
  const fmt = (v: number) => (Math.abs(v) >= 100 ? String(Math.round(v)) : String(Math.round(v * 10) / 10));

  return (
    <View>
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height }}>
        {width > 0 && (
          <Svg width={width} height={height}>
            {grid.map((gv, i) => (
              <SvgLine
                key={i}
                x1={padL}
                y1={yAt(gv)}
                x2={width - padR}
                y2={yAt(gv)}
                stroke={theme.colors.border}
                strokeWidth={1}
                strokeDasharray="3 5"
              />
            ))}
            {/* expected — dashed, muted */}
            <Path d={pathFor((d) => d.expected)} stroke={exp} strokeWidth={2} fill="none" strokeDasharray="5 4" strokeLinejoin="round" />
            {/* actual — solid, with markers */}
            <Path d={pathFor((d) => d.actual)} stroke={act} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
            {data.map((pt, i) => (pt.actual != null ? <Circle key={i} cx={xAt(i)} cy={yAt(pt.actual)} r={3} fill={act} /> : null))}
          </Svg>
        )}
        <View style={{ position: 'absolute', left: 0, top: 0, height, width: padL - 4 }}>
          {grid.map((gv, i) => (
            <Text key={i} variant="caption" color="textFaint" style={{ position: 'absolute', right: 2, top: yAt(gv) - 7, fontSize: 10 }}>
              {fmt(gv)}
            </Text>
          ))}
        </View>
      </View>
      <Row gap={14} style={{ justifyContent: 'center', marginTop: 4 }}>
        <Row gap={5} style={{ alignItems: 'center' }}>
          <View style={{ width: 14, height: 2, backgroundColor: act }} />
          <Text variant="caption" color="textMuted">{actualLabel}</Text>
        </Row>
        <Row gap={5} style={{ alignItems: 'center' }}>
          <View style={{ width: 14, height: 2, backgroundColor: exp, opacity: 0.8 }} />
          <Text variant="caption" color="textFaint">{expectedLabel}{unit ? ` (${unit})` : ''}</Text>
        </Row>
      </Row>
    </View>
  );
}
