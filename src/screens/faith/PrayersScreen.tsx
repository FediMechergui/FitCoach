import React, { useCallback, useEffect, useState } from 'react';
import { View, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Chip } from '@/components/ui/Chip';
import { Row, SectionHeader, Divider } from '@/components/ui/misc';
import {
  getPrayerSettings,
  todaysPrayerTimes,
  upsertPrayerSettings,
} from '@/repositories/faithRepo';
import {
  CITY_PRESETS,
  nextPrayer,
  PRAYER_METHODS,
  PRAYER_NAMES,
  type PrayerTimes,
} from '@/lib/prayers';
import { minutesToHM } from '@/lib/time';
import type { PrayerSettings } from '@/db/schema';

export function PrayersScreen() {
  const theme = useTheme();
  const [settings, setSettings] = useState<PrayerSettings | null>(null);
  const [times, setTimes] = useState<PrayerTimes | null>(null);
  const [locating, setLocating] = useState(false);
  const [tick, setTick] = useState(0); // refresh countdown every 30s

  const reload = useCallback(() => {
    setSettings(getPrayerSettings() ?? null);
    setTimes(todaysPrayerTimes());
  }, []);

  useFocusEffect(useCallback(() => reload(), [reload]));

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  const useGps = async () => {
    setLocating(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.granted) {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        upsertPrayerSettings({
          enabled: true,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          locationName: 'Current location',
        });
        reload();
      }
    } catch {
      // GPS unavailable — city presets still work.
    } finally {
      setLocating(false);
    }
  };

  const pickCity = (c: (typeof CITY_PRESETS)[number]) => {
    upsertPrayerSettings({ enabled: true, latitude: c.lat, longitude: c.lng, locationName: c.name });
    reload();
  };

  const next = times ? nextPrayer(times) : null;
  void tick;

  return (
    <Screen>
      <Row gap={12} style={{ alignItems: 'center' }}>
        <Icon icon="faith.crescent" size={28} color={theme.colors.meditation} />
        <Text variant="h1">Prayer times</Text>
      </Row>
      <Text variant="body" color="textMuted">
        Calculated fully offline from the sun's position at your location. Times can differ a
        couple of minutes from your local mosque — follow the adhan where it matters.
      </Text>

      {/* Location setup */}
      <SectionHeader title="Location" />
      <Card style={{ gap: 10 }}>
        {settings?.latitude != null && (
          <Row gap={8} style={{ alignItems: 'center' }}>
            <Icon icon="faith.location" size={16} color={theme.colors.accent} />
            <Text variant="body">
              {settings.locationName ?? `${settings.latitude.toFixed(2)}, ${settings.longitude?.toFixed(2)}`}
            </Text>
          </Row>
        )}
        <Button
          title={locating ? 'Locating…' : 'Use my location (GPS)'}
          icon="faith.location"
          variant="secondary"
          onPress={useGps}
          loading={locating}
        />
        <Text variant="caption" color="textMuted">Or pick a city:</Text>
        <Row gap={6} style={{ flexWrap: 'wrap' }}>
          {CITY_PRESETS.map((c) => (
            <Chip
              key={c.name}
              label={c.name}
              small
              active={settings?.locationName === c.name}
              onPress={() => pickCity(c)}
            />
          ))}
        </Row>
      </Card>

      {/* Method */}
      <SectionHeader title="Calculation method" />
      <Row gap={6} style={{ flexWrap: 'wrap' }}>
        {PRAYER_METHODS.map((m) => (
          <Chip
            key={m.key}
            label={m.label}
            small
            active={(settings?.method ?? 'tunisia') === m.key}
            color={theme.colors.meditation}
            onPress={() => {
              upsertPrayerSettings({ method: m.key });
              reload();
            }}
          />
        ))}
      </Row>

      {/* Today's times */}
      {times && next ? (
        <>
          <Card accent={theme.colors.meditation} style={{ gap: 6 }}>
            <Text variant="caption" color="textMuted">Next prayer</Text>
            <Row style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Text variant="h1" style={{ color: theme.colors.meditation }}>{next.label}</Text>
              <Text variant="h2" style={{ fontVariant: ['tabular-nums'] }}>{next.time}</Text>
            </Row>
            <Text variant="caption" color="textMuted">in {minutesToHM(next.minutesUntil)}</Text>
          </Card>

          <SectionHeader title="Today" />
          <Card style={{ gap: 8 }}>
            {PRAYER_NAMES.map((p, i) => (
              <View key={p.key}>
                {i > 0 ? <Divider /> : null}
                <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Row gap={10} style={{ alignItems: 'center' }}>
                    <Icon icon={p.icon} size={18} color={next.key === p.key ? theme.colors.meditation : theme.colors.textMuted} />
                    <Text variant={next.key === p.key ? 'bodyStrong' : 'body'} color={next.key === p.key ? theme.colors.meditation : theme.colors.text}>
                      {p.label}
                    </Text>
                  </Row>
                  <Text variant="mono">{times[p.key]}</Text>
                </Row>
              </View>
            ))}
          </Card>
        </>
      ) : (
        <Text variant="caption" color="textFaint" center>
          Set a location above to see today's times.
        </Text>
      )}
    </Screen>
  );
}
