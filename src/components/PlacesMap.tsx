import React, { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';
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
 * landmarks, drawn as faint dots with a few named, and every place you have
 * marked is a dot in the colour of its kind. It is enough to see where your
 * places are — and it works in a basement gym with no signal.
 */

/** Seats named on the map; the rest are unlabelled dots, to keep it readable. */
const NAMED = new Set(['tunis', 'bizerte', 'nabeul', 'sousse', 'sfax', 'kairouan', 'gabes', 'gafsa', 'tozeur', 'tataouine', 'kef', 'medenine']);

interface Props {
  places: Array<{ id: number; kind: string; latitude: number | null; longitude: number | null; isHome?: boolean }>;
  me?: LatLng | null;
  height?: number;
}

export function PlacesMap({ places, me, height = 300 }: Props) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);

  const marks = width
    ? places
        .map((p) => (p.latitude != null && p.longitude != null ? { p, at: projectToMap(p.latitude, p.longitude, width, height) } : null))
        .filter((m): m is { p: Props['places'][number]; at: { x: number; y: number } } => !!m && !!m.at)
    : [];
  const here = width && me ? projectToMap(me[0], me[1], width, height) : null;
  const off = places.filter((p) => p.latitude != null && p.longitude != null).length - marks.length;

  return (
    <View style={{ gap: 6 }}>
      <View
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        style={{ height, borderRadius: theme.radius.md, backgroundColor: theme.colors.surfaceAlt, overflow: 'hidden' }}
      >
        {width > 0 && (
          <Svg width={width} height={height}>
            <G>
              {GOVERNORATES.map((g) => {
                const at = projectToMap(g.at[0], g.at[1], width, height);
                if (!at) return null;
                return (
                  <G key={g.key}>
                    <Circle cx={at.x} cy={at.y} r={2.2} fill={theme.colors.textFaint} opacity={0.7} />
                    {NAMED.has(g.key) ? (
                      <SvgText x={at.x + 5} y={at.y + 3.5} fontSize={11} fill={theme.colors.textFaint}>
                        {g.name}
                      </SvgText>
                    ) : null}
                  </G>
                );
              })}
              {marks.map(({ p, at }) => {
                const color = findPlaceKind(p.kind).color;
                return (
                  <G key={p.id}>
                    <Circle cx={at.x} cy={at.y} r={p.isHome ? 10 : 8} fill={color} opacity={0.22} />
                    <Circle cx={at.x} cy={at.y} r={p.isHome ? 5 : 4} fill={color} stroke={theme.colors.bg} strokeWidth={1.5} />
                  </G>
                );
              })}
              {here ? (
                <G>
                  <Circle cx={here.x} cy={here.y} r={9} fill="none" stroke={theme.colors.text} strokeWidth={1.5} opacity={0.8} />
                  <Circle cx={here.x} cy={here.y} r={2.5} fill={theme.colors.text} />
                </G>
              ) : null}
            </G>
          </Svg>
        )}
      </View>
      <Text variant="caption" color="textFaint">
        Drawn on your phone, north up, from coordinates alone. Grey dots are the seats of the governorates
        {here ? '; the ring is you' : ''}
        {off > 0 ? `; ${off} place${off === 1 ? ' is' : 's are'} outside Tunisia and not drawn` : ''}.
      </Text>
    </View>
  );
}
