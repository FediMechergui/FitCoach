import React from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Circle, Path, G } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './ui/Text';
import { fitRoute, normalizeRoute, type LatLng } from '@/lib/geo';

interface RouteMapProps {
  route: LatLng[];
  height?: number;
  color?: string;
  /** show start/end pins */
  markers?: boolean;
}

/**
 * Draws a GPS route as a "circuit" line — an offline, tile-free path shape
 * with a soft glow, a start beacon and a finish pin.
 *
 * Three rules this component must keep, each of which it once broke:
 *
 *  1. EVERY HOOK RUNS ON EVERY RENDER. A live walk starts with no route and
 *     gains one fix at a time, so this component moves from "waiting" to
 *     "drawing" while mounted. A hook placed after the waiting return ran in
 *     one state and not the other, and React threw the moment the second fix
 *     arrived — the walk screen died exactly when it had something to draw.
 *  2. ONE SCALE FOR BOTH AXES. The route keeps its true proportions.
 *  3. GRADIENTS IN USER SPACE. A gradient measured against the path's own
 *     bounding box has nothing to measure on a perfectly straight street (the
 *     box has no height), and the line is simply not painted.
 */
export function RouteMap({ route, height = 200, color, markers = true }: RouteMapProps) {
  const theme = useTheme();
  const [width, setWidth] = React.useState(0);
  const uid = React.useId().replace(/:/g, '');
  const stroke = color ?? theme.colors.outdoor;

  const pad = 18;
  const pts = React.useMemo(() => {
    const norm = normalizeRoute(route);
    return norm && width > 0 ? fitRoute(norm.points, width, height, pad) : null;
  }, [route, width, height]);

  const gradId = `route-grad-${uid}`;
  const beaconId = `route-beacon-${uid}`;

  // The same outer view in both states, so the width is measured before the
  // first fix arrives and the line appears without a blank frame.
  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height, justifyContent: 'center' }}>
      {!pts ? (
        <Text variant="caption" color="textFaint" center>
          {route.length < 2 ? 'Waiting for GPS fixes to trace your route…' : 'Not enough movement yet to draw a route.'}
        </Text>
      ) : (
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id={gradId} gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={width} y2={height}>
              <Stop offset="0%" stopColor={theme.colors.success} />
              <Stop offset="60%" stopColor={stroke} />
              <Stop offset="100%" stopColor={theme.colors.warning} />
            </LinearGradient>
            <RadialGradient id={beaconId} cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={theme.colors.success} stopOpacity={0.6} />
              <Stop offset="100%" stopColor={theme.colors.success} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <RoutePaths pts={pts} stroke={stroke} gradId={gradId} beaconId={beaconId} markers={markers} />
        </Svg>
      )}
    </View>
  );
}

function RoutePaths({
  pts,
  stroke,
  gradId,
  beaconId,
  markers,
}: {
  pts: Array<{ x: number; y: number }>;
  stroke: string;
  gradId: string;
  beaconId: string;
  markers: boolean;
}) {
  const theme = useTheme();
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const start = pts[0];
  const end = pts[pts.length - 1];
  return (
    <G>
      {/* a wide, faint pass in the plain colour: visible whatever the gradient does */}
      <Path d={d} stroke={stroke} strokeOpacity={0.14} strokeWidth={14} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      <Path d={d} stroke={`url(#${gradId})`} strokeOpacity={0.35} strokeWidth={7} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      <Path d={d} stroke={`url(#${gradId})`} strokeWidth={3.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />

      {markers && (
        <>
          <Circle cx={start.x} cy={start.y} r={12} fill={`url(#${beaconId})`} />
          <Circle cx={start.x} cy={start.y} r={5} fill={theme.colors.success} stroke="#FFFFFF" strokeWidth={1.8} />
          <Circle cx={end.x} cy={end.y} r={8} fill="none" stroke={theme.colors.danger} strokeWidth={1} strokeOpacity={0.4} />
          <Circle cx={end.x} cy={end.y} r={5} fill={theme.colors.danger} stroke="#FFFFFF" strokeWidth={1.8} />
        </>
      )}
    </G>
  );
}
