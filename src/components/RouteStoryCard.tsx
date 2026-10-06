import React from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { Text } from './ui/Text';
import { RealRouteMap, type RouteSegment } from './RealRouteMap';
import type { LatLng } from '@/lib/geo';
import type { StoryTheme } from '@/data/souk';
import { formatClock, formatPaceS } from '@/lib/gpsLaps';

export interface StoryStats {
  title: string;
  dateText: string;
  distanceM: number;
  /** moving time, seconds */
  durationS: number;
  /** seconds per km; null hides the pace */
  paceSPerKm: number | null;
  calories: number | null;
  steps?: number | null;
  /** e.g. "6 × 400 m" for an interval session */
  extra?: string | null;
}

interface Props {
  width: number;
  theme: StoryTheme;
  route: LatLng[];
  stats: StoryStats;
  tiles: boolean;
  marks: boolean;
  showPace: boolean;
  showCalories: boolean;
  segments?: RouteSegment[];
  onMapReady?: () => void;
  unit?: 'metric' | 'imperial';
}

/**
 * The image a finished route is shared as — 9:16, the shape of an Instagram
 * or WhatsApp story. Everything is drawn from the props: no app theme, no
 * screen state, so the capture is the same whatever screen it sits on.
 */
export const RouteStoryCard = React.forwardRef<View, Props>(function RouteStoryCard(
  { width, theme, route, stats, tiles, marks, showPace, showCalories, segments, onMapReady, unit = 'metric' },
  ref
) {
  const height = Math.round((width * 16) / 9);
  const pad = Math.round(width * 0.06);
  const mapH = Math.round(height * 0.5);
  const imperial = unit === 'imperial';
  const dist = imperial ? stats.distanceM / 1609.344 : stats.distanceM / 1000;
  const distUnit = imperial ? 'mi' : 'km';
  const pace = stats.paceSPerKm != null ? (imperial ? stats.paceSPerKm * 1.609344 : stats.paceSPerKm) : null;
  const gid = `story-bg-${theme.key.replace(/[^a-z0-9]/gi, '')}`;

  const cells: Array<{ label: string; value: string }> = [{ label: 'Time', value: formatClock(stats.durationS) }];
  if (showPace && pace) cells.push({ label: `Pace /${distUnit}`, value: formatPaceS(pace) });
  if (showCalories && stats.calories != null) cells.push({ label: 'kcal', value: Math.round(stats.calories).toLocaleString() });
  if (cells.length < 3 && stats.steps) cells.push({ label: 'Steps', value: stats.steps.toLocaleString() });

  return (
    <View ref={ref} collapsable={false} style={{ width, height, borderRadius: 0, overflow: 'hidden', backgroundColor: theme.bottom }}>
      <Svg width={width} height={height} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id={gid} x1="0" y1="0" x2="0.3" y2="1">
            <Stop offset="0" stopColor={theme.top} />
            <Stop offset="1" stopColor={theme.bottom} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={width} height={height} fill={`url(#${gid})`} />
      </Svg>

      <View style={{ paddingHorizontal: pad, paddingTop: pad, gap: Math.round(pad * 0.6), flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="eyebrow" style={{ color: theme.ink, letterSpacing: 3 }}>
            FITCOACH
          </Text>
          <Text variant="caption" style={{ color: theme.muted }}>
            {stats.dateText}
          </Text>
        </View>

        <RealRouteMap
          route={route}
          width={width - pad * 2}
          height={mapH}
          tiles={tiles}
          tint={theme.map}
          line={theme.line}
          marks={marks}
          segments={segments}
          radius={Math.round(width * 0.05)}
          onReady={onMapReady}
        />

        <View style={{ gap: 2 }}>
          <Text variant="label" style={{ color: theme.muted }} numberOfLines={1}>
            {stats.title}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
            <Text variant="display" style={{ color: theme.ink, fontSize: Math.round(width * 0.2), lineHeight: Math.round(width * 0.22), fontVariant: ['tabular-nums'] }}>
              {dist >= 100 ? dist.toFixed(0) : dist.toFixed(2)}
            </Text>
            <Text variant="h2" style={{ color: theme.muted, marginBottom: Math.round(width * 0.03) }}>
              {distUnit}
            </Text>
          </View>
          {stats.extra ? (
            <Text variant="bodyStrong" style={{ color: theme.ink }}>
              {stats.extra}
            </Text>
          ) : null}
        </View>

        <View style={{ flexDirection: 'row', gap: Math.round(pad * 0.5) }}>
          {cells.map((c) => (
            <View key={c.label} style={{ flex: 1, gap: 2 }}>
              <Text variant="h2" style={{ color: theme.ink, fontVariant: ['tabular-nums'] }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                {c.value}
              </Text>
              <Text variant="caption" style={{ color: theme.muted }} numberOfLines={1}>
                {c.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ paddingHorizontal: pad, paddingBottom: Math.round(pad * 0.9), flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text variant="caption" style={{ color: theme.muted }}>
          Tracked on the phone, offline
        </Text>
        <Text variant="caption" style={{ color: theme.muted }}>
          {theme.name}
        </Text>
      </View>
    </View>
  );
});
