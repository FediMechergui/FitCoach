import React from 'react';
import { View, Image } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Path, Circle, G, Line, Text as SvgText } from 'react-native-svg';
import { Text } from './ui/Text';
import type { LatLng } from '@/lib/geo';
import {
  TILE_DP,
  TILE_PROVIDER,
  distanceMarks,
  fitViewport,
  markSpacingM,
  project,
  routePath,
  type MapViewport,
} from '@/lib/mapTiles';
import { routeDistanceM } from '@/lib/geo';
import { loadTiles } from '@/services/mapTiles';
import type { MapStyle } from '@/lib/outdoorSettings';

/** What each look lays over the map, and what is drawn when there is no map. */
export const MAP_TINT: Record<MapStyle, { base: string; veil: string | null; veilOpacity: number; grid: string; ink: string; chip: string }> = {
  dark: { base: '#0B1220', veil: '#070C14', veilOpacity: 0.58, grid: '#1C2A3D', ink: '#FFFFFF', chip: 'rgba(7,12,20,0.78)' },
  light: { base: '#EDE8DE', veil: null, veilOpacity: 0, grid: '#D6CFC2', ink: '#14202E', chip: 'rgba(255,255,255,0.86)' },
  warm: { base: '#2A1D14', veil: '#3A2414', veilOpacity: 0.34, grid: '#4A3424', ink: '#FFF6E8', chip: 'rgba(42,29,20,0.8)' },
};

export interface RouteSegment {
  /** point indices into the route */
  from: number;
  to: number;
  label?: string;
}

interface Props {
  route: LatLng[];
  height: number;
  /** fixed width (the story card); measured from the layout when omitted */
  width?: number;
  /** draw real map tiles under the route — only when the user has agreed */
  tiles: boolean;
  tint?: MapStyle;
  /** the line's gradient: start, middle, end */
  line?: [string, string, string];
  /** 1 km, 2 km… markers along the line */
  marks?: boolean;
  /** a chip with the total distance, e.g. "8.42 km" */
  distanceLabel?: string | null;
  /** GPS laps to pick out along the line */
  segments?: RouteSegment[];
  radius?: number;
  /** called once every tile has loaded or failed — the moment a capture is safe */
  onReady?: () => void;
}

/**
 * A route on a real map — or, without tiles, on a quiet grid in the same
 * colours, so the drawing works offline and before anyone has agreed to the
 * map server seeing the area. Every hook runs on every render (RouteMap's
 * first rule, learned the hard way), and the map never stretches the route.
 */
export function RealRouteMap({
  route,
  height,
  width: fixedWidth,
  tiles,
  tint = 'dark',
  line = ['#33D9A6', '#4F8CFF', '#FF8663'],
  marks = true,
  distanceLabel,
  segments,
  radius = 18,
  onReady,
}: Props) {
  const [measured, setMeasured] = React.useState(0);
  const width = fixedWidth ?? measured;
  const uid = React.useId().replace(/:/g, '');
  const look = MAP_TINT[tint];

  const vp: MapViewport | null = React.useMemo(
    () => (width > 0 ? fitViewport(route, width, height, { pad: 34 }) : null),
    [route, width, height]
  );

  const [files, setFiles] = React.useState<Record<string, string | null>>({});
  const [loaded, setLoaded] = React.useState(0);
  const readyFired = React.useRef(false);
  const tileKeys = vp && tiles ? vp.tiles.map((t) => t.key).join(',') : '';

  React.useEffect(() => {
    readyFired.current = false;
    setLoaded(0);
    if (!vp || !tiles) {
      setFiles({});
      return;
    }
    let alive = true;
    void loadTiles(vp.tiles).then((f) => {
      if (alive) setFiles(f);
    });
    return () => {
      alive = false;
    };
    // tileKeys carries everything that changes which tiles are needed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tileKeys]);

  const present = vp && tiles ? vp.tiles.filter((t) => files[t.key]) : [];
  const fetched = vp && tiles ? vp.tiles.every((t) => t.key in files) : true;
  const done = !vp || !tiles || (fetched && loaded >= present.length);

  React.useEffect(() => {
    if (done && !readyFired.current) {
      readyFired.current = true;
      onReady?.();
    }
  }, [done, onReady]);
  // Never hold a capture hostage to a tile that will not finish.
  React.useEffect(() => {
    const t = setTimeout(() => {
      if (!readyFired.current) {
        readyFired.current = true;
        onReady?.();
      }
    }, 9000);
    return () => clearTimeout(t);
  }, [tileKeys, onReady]);

  const d = vp ? routePath(vp, route) : '';
  const totalM = React.useMemo(() => routeDistanceM(route), [route]);
  const marksList = React.useMemo(
    () => (vp && marks ? distanceMarks(route, markSpacingM(totalM)) : []),
    [vp, marks, route, totalM]
  );
  const start = vp && route.length ? project(vp, route[0]) : null;
  const end = vp && route.length ? project(vp, route[route.length - 1]) : null;
  const gradId = `rrm-${uid}`;

  return (
    <View
      onLayout={fixedWidth ? undefined : (e) => setMeasured(e.nativeEvent.layout.width)}
      style={{ width: fixedWidth, height, borderRadius: radius, overflow: 'hidden', backgroundColor: look.base }}
    >
      {vp && tiles
        ? present.map((t) => (
            <Image
              key={t.key}
              source={{ uri: files[t.key]! }}
              onLoadEnd={() => setLoaded((n) => n + 1)}
              style={{ position: 'absolute', left: t.left, top: t.top, width: TILE_DP, height: TILE_DP }}
            />
          ))
        : null}
      {vp && tiles && look.veil ? (
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: look.veil, opacity: look.veilOpacity }} />
      ) : null}

      {width > 0 && (
        <Svg width={width} height={height} style={{ position: 'absolute', left: 0, top: 0 }}>
          <Defs>
            <LinearGradient id={gradId} gradientUnits="userSpaceOnUse" x1={start?.x ?? 0} y1={start?.y ?? 0} x2={end?.x ?? width} y2={end?.y ?? height}>
              <Stop offset="0%" stopColor={line[0]} />
              <Stop offset="55%" stopColor={line[1]} />
              <Stop offset="100%" stopColor={line[2]} />
            </LinearGradient>
          </Defs>

          {/* Offline, a quiet grid stands in for the streets. */}
          {!tiles &&
            Array.from({ length: 9 }).map((_, i) => (
              <G key={i}>
                <Line x1={(width / 8) * i} y1={0} x2={(width / 8) * i} y2={height} stroke={look.grid} strokeWidth={1} />
                <Line x1={0} y1={(height / 8) * i} x2={width} y2={(height / 8) * i} stroke={look.grid} strokeWidth={1} />
              </G>
            ))}

          {vp ? (
            <G>
              {/* casing: the line stays legible on any street under it */}
              <Path d={d} stroke={tint === 'light' ? '#FFFFFF' : '#000000'} strokeOpacity={0.55} strokeWidth={9} fill="none" strokeLinejoin="round" strokeLinecap="round" />
              <Path d={d} stroke={`url(#${gradId})`} strokeWidth={5} fill="none" strokeLinejoin="round" strokeLinecap="round" />

              {segments?.map((sg, i) => {
                const part = route.slice(Math.max(0, sg.from), Math.min(route.length, sg.to + 1));
                if (part.length < 2) return null;
                return <Path key={i} d={routePath(vp, part)} stroke="#FFD166" strokeWidth={4} fill="none" strokeLinejoin="round" strokeLinecap="round" />;
              })}

              {marksList.map((m) => {
                const p = project(vp, m.at);
                const label = m.m % 1000 === 0 ? String(m.m / 1000) : (m.m / 1000).toFixed(1);
                return (
                  <G key={m.m}>
                    <Circle cx={p.x} cy={p.y} r={10} fill={tint === 'light' ? '#14202E' : '#FFFFFF'} stroke={line[1]} strokeWidth={2} />
                    <SvgText x={p.x} y={p.y + 4} fontSize={11} fontWeight="700" textAnchor="middle" fill={tint === 'light' ? '#FFFFFF' : '#0B1220'}>
                      {label}
                    </SvgText>
                  </G>
                );
              })}

              {start && <Circle cx={start.x} cy={start.y} r={7} fill={line[0]} stroke="#FFFFFF" strokeWidth={2.5} />}
              {end && <Circle cx={end.x} cy={end.y} r={7} fill={line[2]} stroke="#FFFFFF" strokeWidth={2.5} />}
            </G>
          ) : null}
        </Svg>
      )}

      {!vp && width > 0 ? (
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
          <Text variant="caption" style={{ color: look.ink, opacity: 0.7 }}>
            {route.length < 2 ? 'No route was recorded for this one.' : 'Not enough movement to draw a route.'}
          </Text>
        </View>
      ) : null}

      {distanceLabel ? (
        <View style={{ position: 'absolute', left: 12, bottom: 12, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: look.chip }}>
          <Text variant="label" style={{ color: look.ink, fontVariant: ['tabular-nums'] }}>
            {distanceLabel}
          </Text>
        </View>
      ) : null}

      {/* OpenStreetMap's licence asks for this on every map drawn from its tiles. */}
      {tiles ? (
        <View style={{ position: 'absolute', right: 8, bottom: 6 }}>
          <Text variant="caption" style={{ color: look.ink, opacity: 0.75 }}>
            {TILE_PROVIDER.attribution}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
