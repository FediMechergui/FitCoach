import React from 'react';
import { View } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Circle,
  Path,
  G,
} from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './ui/Text';
import { normalizeRoute, type LatLng } from '@/lib/geo';

interface RouteMapProps {
  route: LatLng[];
  height?: number;
  color?: string;
  /** show start/end pins */
  markers?: boolean;
}

/**
 * Draws a GPS route as an artistic neon "circuit" line — an offline, tile-free
 * path shape with luminous multi-pass glow, radiant start beacon, and finish jewel.
 */
export function RouteMap({ route, height = 200, color, markers = true }: RouteMapProps) {
  const theme = useTheme();
  const [width, setWidth] = React.useState(0);
  const stroke = color ?? theme.colors.outdoor;
  const norm = normalizeRoute(route);

  if (!norm) {
    return (
      <View style={{ height, alignItems: 'center', justifyContent: 'center' }}>
        <Text variant="caption" color="textFaint">
          Waiting for GPS fixes to trace your route…
        </Text>
      </View>
    );
  }

  const pad = 18;
  const w = Math.max(0, width - pad * 2);
  const h = height - pad * 2;
  const px = (x: number) => pad + x * w;
  const py = (y: number) => pad + y * h;

  const d = norm.points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${px(p.x).toFixed(1)} ${py(p.y).toFixed(1)}`)
    .join(' ');
  const start = norm.points[0];
  const end = norm.points[norm.points.length - 1];

  const uid = React.useId().replace(/:/g, '');
  const gradId = `route-grad-${uid}`;

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height }}>
      {width > 0 && (
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor={theme.colors.success} />
              <Stop offset="60%" stopColor={stroke} />
              <Stop offset="100%" stopColor={theme.colors.warning} />
            </LinearGradient>
            <RadialGradient id="beacon-pulse" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={theme.colors.success} stopOpacity={0.6} />
              <Stop offset="100%" stopColor={theme.colors.success} stopOpacity={0} />
            </RadialGradient>
          </Defs>

          <G>
            {/* Pass 1: Broad ambient neon aura */}
            <Path
              d={d}
              stroke={stroke}
              strokeOpacity={0.12}
              strokeWidth={14}
              fill="none"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* Pass 2: Medium soft luminescence */}
            <Path
              d={d}
              stroke={`url(#${gradId})`}
              strokeOpacity={0.35}
              strokeWidth={7}
              fill="none"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* Pass 3: Crisp high-contrast core vector line */}
            <Path
              d={d}
              stroke={`url(#${gradId})`}
              strokeWidth={3.5}
              fill="none"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {markers && (
              <>
                {/* Start Marker: Luminous green beacon */}
                <Circle
                  cx={px(start.x)}
                  cy={py(start.y)}
                  r={12}
                  fill="url(#beacon-pulse)"
                />
                <Circle
                  cx={px(start.x)}
                  cy={py(start.y)}
                  r={8}
                  fill="none"
                  stroke={theme.colors.success}
                  strokeWidth={1}
                  strokeOpacity={0.5}
                  strokeDasharray="2, 2"
                />
                <Circle
                  cx={px(start.x)}
                  cy={py(start.y)}
                  r={5}
                  fill={theme.colors.success}
                  stroke="#FFFFFF"
                  strokeWidth={1.8}
                />

                {/* End Marker: Glowing crimson/warning destination pin */}
                <Circle
                  cx={px(end.x)}
                  cy={py(end.y)}
                  r={8}
                  fill="none"
                  stroke={theme.colors.danger}
                  strokeWidth={1}
                  strokeOpacity={0.4}
                />
                <Circle
                  cx={px(end.x)}
                  cy={py(end.y)}
                  r={5}
                  fill={theme.colors.danger}
                  stroke="#FFFFFF"
                  strokeWidth={1.8}
                />
              </>
            )}
          </G>
        </Svg>
      )}
    </View>
  );
}

