import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, Line as SvgLine } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from '../ui/Text';

export interface LinePoint {
  x: number; // index or timestamp; only ordering matters
  y: number;
  label?: string;
}

interface LineChartProps {
  data: LinePoint[];
  height?: number;
  color?: string;
  fill?: boolean;
  showDots?: boolean;
  yFormat?: (v: number) => string;
}

/** Minimal responsive line chart on react-native-svg. */
export function LineChart({
  data,
  height = 160,
  color,
  fill = true,
  showDots = true,
  yFormat = (v) => `${Math.round(v)}`,
}: LineChartProps) {
  const theme = useTheme();
  const [width, setWidth] = React.useState(0);
  const stroke = color ?? theme.colors.primary;

  if (data.length === 0) {
    return (
      <View style={{ height, alignItems: 'center', justifyContent: 'center' }}>
        <Text variant="caption" color="textFaint">
          Not enough data yet
        </Text>
      </View>
    );
  }

  const padL = 40;
  const padR = 12;
  const padT = 12;
  const padB = 20;
  const ys = data.map((d) => d.y);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const range = maxY - minY || 1;
  const chartW = Math.max(0, width - padL - padR);
  const chartH = height - padT - padB;

  const xAt = (i: number) =>
    padL + (data.length === 1 ? chartW / 2 : (i / (data.length - 1)) * chartW);
  const yAt = (v: number) => padT + chartH - ((v - minY) / range) * chartH;

  const path = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(1)} ${yAt(d.y).toFixed(1)}`)
    .join(' ');
  const areaPath =
    width > 0
      ? `${path} L ${xAt(data.length - 1).toFixed(1)} ${padT + chartH} L ${xAt(0).toFixed(1)} ${padT + chartH} Z`
      : '';

  const gridVals = [maxY, (maxY + minY) / 2, minY];

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height }}>
      {width > 0 ? (
        <Svg width={width} height={height}>
          {gridVals.map((gv, idx) => (
            <React.Fragment key={idx}>
              <SvgLine
                x1={padL}
                y1={yAt(gv)}
                x2={width - padR}
                y2={yAt(gv)}
                stroke={theme.colors.border}
                strokeWidth={1}
                strokeDasharray="3 5"
              />
            </React.Fragment>
          ))}
          {fill && data.length > 1 ? <Path d={areaPath} fill={stroke + '1F'} /> : null}
          <Path d={path} stroke={stroke} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
          {showDots
            ? data.map((d, i) => (
                <Circle key={i} cx={xAt(i)} cy={yAt(d.y)} r={3} fill={stroke} />
              ))
            : null}
        </Svg>
      ) : null}
      {/* Y-axis labels overlay */}
      <View style={{ position: 'absolute', left: 0, top: 0, height, width: padL - 4 }}>
        {gridVals.map((gv, idx) => (
          <Text
            key={idx}
            variant="caption"
            color="textFaint"
            style={{
              position: 'absolute',
              right: 2,
              top: yAt(gv) - 7,
              fontSize: 10,
            }}
          >
            {yFormat(gv)}
          </Text>
        ))}
      </View>
    </View>
  );
}
