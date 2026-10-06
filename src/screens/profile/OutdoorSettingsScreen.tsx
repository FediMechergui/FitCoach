import React, { useState } from 'react';
import { View, Switch } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { PageHero } from '@/components/ui/PageHero';
import { Row } from '@/components/ui/misc';
import { outdoorSettings, setOutdoorSettings } from '@/repositories/outdoorRepo';
import {
  ACCURACY_LABEL,
  ACCURACY_NOTE,
  HIDE_ENDS_OPTIONS_M,
  SPLIT_OPTIONS_M,
  splitLabel,
  type GpsAccuracy,
  type OutdoorSettings,
} from '@/lib/outdoorSettings';

/**
 * Outdoor & GPS — the parameters behind every tracked walk, run, ride, and
 * every GPS lap inside a session. Changes apply to the next trace started;
 * one already running keeps the receiver settings it began with.
 */
export function OutdoorSettingsScreen() {
  const theme = useTheme();
  const [s, setS] = useState<OutdoorSettings>(outdoorSettings);
  const patch = (p: Partial<OutdoorSettings>) => setS(setOutdoorSettings(p));

  const toggle = (label: string, detail: string, value: boolean, onChange: (v: boolean) => void) => (
    <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
      <View style={{ flex: 1, paddingRight: 10 }}>
        <Text variant="bodyStrong">{label}</Text>
        <Text variant="caption" color="textMuted">
          {detail}
        </Text>
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: theme.colors.outdoor }} />
    </Row>
  );

  return (
    <Screen>
      <PageHero icon="cardio.gps" color={theme.colors.outdoor} eyebrow="Settings" title="Outdoor & GPS" subtitle="How the GPS works while you move, what it tells you on the way, and how a route is drawn and shared." />

      <Card style={{ gap: 10 }}>
        <Text variant="h3">GPS precision</Text>
        <Row gap={8} style={{ flexWrap: 'wrap' }}>
          {(['precise', 'balanced', 'saver'] as GpsAccuracy[]).map((a) => (
            <Chip key={a} label={ACCURACY_LABEL[a]} active={s.accuracy === a} small color={theme.colors.outdoor} onPress={() => patch({ accuracy: a })} />
          ))}
        </Row>
        <Text variant="caption" color="textMuted">
          {ACCURACY_NOTE[s.accuracy]} Applies from the next walk, run or GPS session.
        </Text>
      </Card>

      <Card style={{ gap: 14 }}>
        <Text variant="h3">On the way</Text>
        {toggle('Auto-pause', 'Pause by itself at a crossing or in a vehicle, so standing still is not counted as moving time.', s.autoPause, (v) => patch({ autoPause: v }))}
        {toggle('Split alerts', 'A buzz and a notification at each split, with its pace — felt even with the phone in a pocket.', s.splitAlerts, (v) => patch({ splitAlerts: v }))}
        {s.splitAlerts && (
          <Row gap={8} style={{ flexWrap: 'wrap' }}>
            {SPLIT_OPTIONS_M.map((m) => (
              <Chip key={m} label={m === 1609 ? 'Every mile' : `Every ${m >= 1000 ? `${m / 1000} km` : `${m} m`}`} active={s.splitM === m} small onPress={() => patch({ splitM: m })} />
            ))}
          </Row>
        )}
        {s.splitAlerts && (
          <Text variant="caption" color="textFaint">
            You will hear “{splitLabel(1, s.splitM)} · 5:12 /km”. During GPS laps in a session, the reps speak instead.
          </Text>
        )}
      </Card>

      <Card style={{ gap: 14 }}>
        <Text variant="h3">Maps & sharing</Text>
        {toggle(
          'Real maps',
          'Draw finished routes on OpenStreetMap. The map squares around a route are downloaded, so their servers see the area — nothing else leaves the phone. Off: the offline drawing.',
          s.realMap === 'on',
          (v) => patch({ realMap: v ? 'on' : 'off' })
        )}
        {toggle('Distance markers', '1 km, 2 km… along the line, on screen and on what you share.', s.kmMarkers, (v) => patch({ kmMarkers: v }))}
        <View style={{ gap: 6 }}>
          <Text variant="bodyStrong">Hide where routes start and end</Text>
          <Text variant="caption" color="textMuted">
            On anything you share, the line is cut this far from each end — usually that is your door. The numbers are never cut.
          </Text>
          <Row gap={8} style={{ flexWrap: 'wrap' }}>
            {HIDE_ENDS_OPTIONS_M.map((m) => (
              <Chip key={m} label={m === 0 ? 'Show all' : `${m} m`} active={s.hideEndsM === m} small onPress={() => patch({ hideEndsM: m })} />
            ))}
          </Row>
        </View>
      </Card>
    </Screen>
  );
}
