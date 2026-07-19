import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
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
 * Draws a GPS route as a "circuit" line — an offline, tile-free path shape (the
 * outline of where you ran), like the map thumbnails in running apps. No map
 * tiles are fetched, keeping FitCoach fully offline & private.
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

  const pad = 16;
  const w = Math.max(0, width - pad * 2);
  const h = height - pad * 2;
  const px = (x: number) => pad + x * w;
  const py = (y: number) => pad + y * h;

  const d = norm.points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${px(p.x).toFixed(1)} ${py(p.y).toFixed(1)}`)
    .join(' ');
  const start = norm.points[0];
  const end = norm.points[norm.points.length - 1];

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height }}>
      {width > 0 && (
        <Svg width={width} height={height}>
          {/* soft shadow line under the main path */}
          <Path d={d} stroke={stroke + '33'} strokeWidth={9} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          <Path d={d} stroke={stroke} strokeWidth={3.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          {markers && (
            <>
              <Circle cx={px(start.x)} cy={py(start.y)} r={6} fill={theme.colors.success} stroke="#fff" strokeWidth={2} />
              <Circle cx={px(end.x)} cy={py(end.y)} r={6} fill={theme.colors.danger} stroke="#fff" strokeWidth={2} />
            </>
          )}
        </Svg>
      )}
    </View>
  );
}
