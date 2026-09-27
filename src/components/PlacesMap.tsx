import React, { useState } from 'react';
import { View } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Circle,
  Path,
  G,
  Line,
  Text as SvgText,
} from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from '@/components/ui/Text';
import { GOVERNORATES } from '@/data/governorates';
import { findPlaceKind } from '@/data/placeKinds';
import { projectToMap } from '@/lib/places';
import type { LatLng } from '@/lib/geo';

/**
 * A map of Tunisia without a map.
 *
 * No tiles, no network: the twenty-four seats of the governorates are the
 * landmarks. Remodeled as an artistic Mediterranean nautical chart:
 * a projected eastern coastline trace, cartographic coordinate grid, an authentic
 * windrose compass, and jewel-like place markers with glowing radar rings.
 */

/** Seats named on the map; the rest are unlabelled dots to keep it readable. */
const NAMED = new Set([
  'tunis',
  'bizerte',
  'nabeul',
  'sousse',
  'sfax',
  'kairouan',
  'gabes',
  'gafsa',
  'tozeur',
  'tataouine',
  'kef',
  'medenine',
]);

/**
 * The seats that sit on or near the sea, north to south. The line drawn through
 * them is a guide for the eye, not a surveyed coastline: it joins towns.
 */
const COAST_KEYS = ['bizerte', 'ariana', 'tunis', 'ben-arous', 'nabeul', 'sousse', 'monastir', 'mahdia', 'sfax', 'gabes', 'medenine'];

interface Props {
  places: Array<{
    id: number;
    kind: string;
    latitude: number | null;
    longitude: number | null;
    isHome?: boolean;
  }>;
  me?: LatLng | null;
  height?: number;
}

export function PlacesMap({ places, me, height = 300 }: Props) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);

  const marks = width
    ? places
        .map((p) =>
          p.latitude != null && p.longitude != null
            ? { p, at: projectToMap(p.latitude, p.longitude, width, height) }
            : null
        )
        .filter(
          (m): m is { p: Props['places'][number]; at: { x: number; y: number } } =>
            !!m && !!m.at
        )
    : [];

  const here = width && me ? projectToMap(me[0], me[1], width, height) : null;
  const off =
    places.filter((p) => p.latitude != null && p.longitude != null).length -
    marks.length;

  // Projected coastal line from real governorate anchors
  const coastPath = React.useMemo(() => {
    if (!width) return '';
    const govMap = new Map(GOVERNORATES.map((g) => [g.key, g.at]));
    const pts = COAST_KEYS.map((k) => govMap.get(k))
      .filter((at): at is [number, number] => !!at)
      .map(([lat, lon]) => projectToMap(lat, lon, width, height))
      .filter((p): p is { x: number; y: number } => !!p);

    if (pts.length < 2) return '';
    return pts
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(' ');
  }, [width, height]);

  // Compass rose center coordinates (top right)
  const compassX = width > 120 ? width - 34 : 0;
  const compassY = 34;

  return (
    <View style={{ gap: 6 }}>
      <View
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        style={{
          height,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.surfaceAlt,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
      >
        {width > 0 && (
          <Svg width={width} height={height}>
            <Defs>
              <RadialGradient id="map-radar" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={theme.colors.primary} stopOpacity={0.4} />
                <Stop offset="100%" stopColor={theme.colors.primary} stopOpacity={0} />
              </RadialGradient>
              <LinearGradient id="coast-glow" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor={theme.colors.primary} stopOpacity={0.35} />
                <Stop offset="100%" stopColor={theme.colors.primary} stopOpacity={0.1} />
              </LinearGradient>
            </Defs>

            <G>
              {/* 1. Subtle Cartographic Coordinate Gridlines */}
              <Line
                x1={0}
                y1={height * 0.25}
                x2={width}
                y2={height * 0.25}
                stroke={theme.colors.border}
                strokeOpacity={0.3}
                strokeDasharray="2, 6"
              />
              <Line
                x1={0}
                y1={height * 0.5}
                x2={width}
                y2={height * 0.5}
                stroke={theme.colors.border}
                strokeOpacity={0.3}
                strokeDasharray="2, 6"
              />
              <Line
                x1={0}
                y1={height * 0.75}
                x2={width}
                y2={height * 0.75}
                stroke={theme.colors.border}
                strokeOpacity={0.3}
                strokeDasharray="2, 6"
              />
              <Line
                x1={width * 0.33}
                y1={0}
                x2={width * 0.33}
                y2={height}
                stroke={theme.colors.border}
                strokeOpacity={0.3}
                strokeDasharray="2, 6"
              />
              <Line
                x1={width * 0.66}
                y1={0}
                x2={width * 0.66}
                y2={height}
                stroke={theme.colors.border}
                strokeOpacity={0.3}
                strokeDasharray="2, 6"
              />

              {/* 2. Projected Coastal Shoreline Contour */}
              {coastPath ? (
                <>
                  <Path
                    d={coastPath}
                    stroke="url(#coast-glow)"
                    strokeWidth={5}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d={coastPath}
                    stroke={theme.colors.primary}
                    strokeOpacity={0.25}
                    strokeWidth={1.2}
                    fill="none"
                    strokeDasharray="3, 3"
                    strokeLinecap="round"
                  />
                </>
              ) : null}

              {/* 3. Nautical Windrose / Compass Rose in Corner */}
              {compassX > 0 && (
                <G opacity={0.65}>
                  <Circle
                    cx={compassX}
                    cy={compassY}
                    r={16}
                    fill="none"
                    stroke={theme.colors.textFaint}
                    strokeOpacity={0.4}
                    strokeWidth={1}
                    strokeDasharray="1.5, 3"
                  />
                  {/* North needle tip */}
                  <Path
                    d={`M ${compassX} ${compassY - 14} L ${compassX - 3.5} ${compassY} L ${compassX} ${compassY - 2} Z`}
                    fill={theme.colors.primary}
                  />
                  <Path
                    d={`M ${compassX} ${compassY - 14} L ${compassX + 3.5} ${compassY} L ${compassX} ${compassY - 2} Z`}
                    fill={theme.colors.primaryDark ?? theme.colors.primary}
                    opacity={0.65}
                  />
                  {/* South needle */}
                  <Path
                    d={`M ${compassX} ${compassY + 14} L ${compassX - 3} ${compassY} L ${compassX} ${compassY + 2} Z`}
                    fill={theme.colors.textFaint}
                    opacity={0.6}
                  />
                  <Path
                    d={`M ${compassX} ${compassY + 14} L ${compassX + 3} ${compassY} L ${compassX} ${compassY + 2} Z`}
                    fill={theme.colors.textFaint}
                    opacity={0.35}
                  />
                  {/* Cardinal 'N' label */}
                  <SvgText
                    x={compassX}
                    y={compassY - 17}
                    fontSize={11}
                    fontWeight="800"
                    fill={theme.colors.primary}
                    textAnchor="middle"
                  >
                    N
                  </SvgText>
                </G>
              )}

              {/* 4. Governorates Landmarks */}
              {GOVERNORATES.map((g) => {
                const at = projectToMap(g.at[0], g.at[1], width, height);
                if (!at) return null;
                const isNamed = NAMED.has(g.key);
                return (
                  <G key={g.key}>
                    <Circle
                      cx={at.x}
                      cy={at.y}
                      r={isNamed ? 2.6 : 1.8}
                      fill={isNamed ? theme.colors.textMuted : theme.colors.textFaint}
                      opacity={isNamed ? 0.85 : 0.45}
                    />
                    {isNamed ? (
                      <SvgText
                        x={at.x + 5}
                        y={at.y + 3.5}
                        fontSize={11}
                        fontWeight="600"
                        fill={theme.colors.textMuted}
                      >
                        {g.name}
                      </SvgText>
                    ) : null}
                  </G>
                );
              })}

              {/* 5. User-Marked Places (Jewel Beads with Aura) */}
              {marks.map(({ p, at }) => {
                const color = findPlaceKind(p.kind).color;
                return (
                  <G key={p.id}>
                    {/* Glowing outer aura */}
                    <Circle
                      cx={at.x}
                      cy={at.y}
                      r={p.isHome ? 12 : 9}
                      fill={color}
                      opacity={0.28}
                    />
                    {/* Crisp boundary ring */}
                    <Circle
                      cx={at.x}
                      cy={at.y}
                      r={p.isHome ? 6.5 : 5}
                      fill={color}
                      stroke={theme.colors.bg}
                      strokeWidth={1.6}
                    />
                    {/* Specular highlight glint */}
                    <Circle
                      cx={at.x - 1.2}
                      cy={at.y - 1.2}
                      r={1.2}
                      fill="#FFFFFF"
                      opacity={0.8}
                    />
                  </G>
                );
              })}

              {/* 6. Current User Position Radar Pulse */}
              {here ? (
                <G>
                  <Circle
                    cx={here.x}
                    cy={here.y}
                    r={16}
                    fill="url(#map-radar)"
                  />
                  <Circle
                    cx={here.x}
                    cy={here.y}
                    r={12}
                    fill="none"
                    stroke={theme.colors.primary}
                    strokeWidth={1}
                    strokeOpacity={0.5}
                    strokeDasharray="2, 2"
                  />
                  <Circle
                    cx={here.x}
                    cy={here.y}
                    r={5}
                    fill={theme.colors.primary}
                    stroke="#FFFFFF"
                    strokeWidth={1.8}
                  />
                </G>
              ) : null}
            </G>
          </Svg>
        )}
      </View>
      <Text variant="caption" color="textFaint">
        Drawn on your phone, north up, from coordinates alone. Grey dots are the seats of the governorates
        {here ? '; the pulsing ring is you' : ''}
        {off > 0 ? `; ${off} place${off === 1 ? ' is' : 's are'} outside Tunisia and not drawn` : ''}.
      </Text>
    </View>
  );
}

