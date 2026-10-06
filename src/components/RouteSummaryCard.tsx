import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/ThemeProvider';
import { Card } from './ui/Card';
import { Text } from './ui/Text';
import { Icon } from './ui/Icon';
import { Button } from './ui/Button';
import { Row } from './ui/misc';
import { RealRouteMap, type RouteSegment } from './RealRouteMap';
import { RealMapConsent } from './RealMapConsent';
import { outdoorSettings } from '@/repositories/outdoorRepo';
import type { LatLng } from '@/lib/geo';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * Where a finished route lives on screen: the map (real once agreed to, the
 * offline drawing otherwise), the distance on it, any GPS laps picked out,
 * and the way to share it. The app's own screens show the whole line — the
 * privacy trim applies only to what leaves the phone.
 */
export function RouteSummaryCard({
  route,
  distanceLabel,
  share,
  segments,
  height = 260,
  title = 'Your route',
}: {
  route: LatLng[];
  distanceLabel: string | null;
  /** what to share; omit to show the map only */
  share?: { kind: 'walk' | 'session'; id: number };
  segments?: RouteSegment[];
  height?: number;
  title?: string;
}) {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const [settings, setSettings] = useState(outdoorSettings);
  if (route.length < 2) return null;
  const tint = theme.dark ? 'dark' : 'light';

  return (
    <>
      {settings.realMap === 'unset' && <RealMapConsent onAnswer={() => setSettings(outdoorSettings())} />}
      <Card style={{ gap: 10 }}>
        <Row gap={8} style={{ alignItems: 'center' }}>
          <Icon icon="cardio.gps" size={16} color={theme.colors.outdoor} />
          <Text variant="label" color="textMuted" style={{ flex: 1 }}>
            {title}
          </Text>
          {segments && segments.length > 0 ? (
            <Text variant="caption" color="textFaint">
              {segments.length} GPS rep{segments.length === 1 ? '' : 's'} in gold
            </Text>
          ) : null}
        </Row>
        <RealRouteMap
          route={route}
          height={height}
          tiles={settings.realMap === 'on'}
          tint={tint}
          marks={settings.kmMarkers}
          distanceLabel={distanceLabel}
          segments={segments}
          radius={14}
        />
        {share && (
          <Button
            title="Share to a story"
            icon="card.share"
            size="sm"
            color={theme.colors.outdoor}
            onPress={() => navigation.navigate('RouteShare', share)}
          />
        )}
      </Card>
    </>
  );
}
