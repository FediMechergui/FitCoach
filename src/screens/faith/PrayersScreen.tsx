import React, { useCallback, useEffect, useState } from 'react';
import { View, Linking, Switch } from 'react-native';
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
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Row, SectionHeader, Divider, EmptyState } from '@/components/ui/misc';
import { PageHero } from '@/components/ui/PageHero';
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

/**
 * Every state has a door.
 *
 * The first version had exactly one path in (GPS granted) and none out: a
 * denied permission was a silent no-op, a user outside the seven preset
 * cities had no way to enter where they are, `enabled` was only ever written
 * as true, and the Hanafi Asr factor lived fully implemented in the math with
 * no control anywhere. This screen now distinguishes never-asked, denied,
 * and denied-permanently (Open settings), takes typed coordinates, owns a
 * real off switch, and asks the one fiqh question the calculation has.
 */
export function PrayersScreen() {
  const theme = useTheme();
  const [settings, setSettings] = useState<PrayerSettings | null>(null);
  const [times, setTimes] = useState<PrayerTimes | null>(null);
  const [locating, setLocating] = useState(false);
  const [permStatus, setPermStatus] = useState<string | null>(null);
  const [canAskAgain, setCanAskAgain] = useState(true);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [latInput, setLatInput] = useState('');
  const [lngInput, setLngInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);
  const [tick, setTick] = useState(0); // refresh countdown every 30s

  const reload = useCallback(() => {
    setSettings(getPrayerSettings() ?? null);
    setTimes(todaysPrayerTimes());
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
      // Re-read the permission on every focus, so granting it in system
      // settings and coming back is reflected without another tap.
      Location.getForegroundPermissionsAsync()
        .then((p) => {
          setPermStatus(p.status);
          setCanAskAgain(p.canAskAgain);
        })
        .catch(() => {});
    }, [reload])
  );

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  const hasLocation = settings?.latitude != null && settings?.longitude != null;

  const useGps = async () => {
    setLocating(true);
    setGpsError(null);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      setPermStatus(perm.status);
      setCanAskAgain(perm.canAskAgain);
      if (!perm.granted) {
        // Permanent denial gets its own explain card below; a soft "not now"
        // gets one honest line instead of silence.
        if (perm.canAskAgain) {
          setGpsError('Location was not allowed. Try again any time — or set your place below, the times are just as exact.');
        }
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      upsertPrayerSettings({
        enabled: true,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        locationName: 'Current location',
      });
      reload();
    } catch {
      setGpsError('GPS did not answer — it may be switched off. A city or typed coordinates below work without it.');
    } finally {
      setLocating(false);
    }
  };

  const pickCity = (c: (typeof CITY_PRESETS)[number]) => {
    upsertPrayerSettings({ enabled: true, latitude: c.lat, longitude: c.lng, locationName: c.name });
    reload();
  };

  const saveManual = () => {
    const lat = parseFloat(latInput.replace(',', '.'));
    const lng = parseFloat(lngInput.replace(',', '.'));
    if (!Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lng) || Math.abs(lng) > 180) {
      setManualError('Latitude runs −90…90, longitude −180…180.');
      return;
    }
    setManualError(null);
    upsertPrayerSettings({
      enabled: true,
      latitude: lat,
      longitude: lng,
      locationName: nameInput.trim() || 'Custom location',
    });
    setManualOpen(false);
    reload();
  };

  const next = times ? nextPrayer(times) : null;
  const deniedForGood = permStatus === 'denied' && !canAskAgain;
  void tick;

  return (
    <Screen>
      <PageHero icon="faith.crescent" color={theme.colors.meditation} title="Prayer times" subtitle="Calculated fully offline from the sun's position at your location. Times can differ a couple of minutes from your local mosque — follow the adhan where it matters." />

      {/* Location setup */}
      <SectionHeader title="Location" />
      <Card style={{ gap: 10 }}>
        {hasLocation && (
          <Row gap={8} style={{ alignItems: 'center' }}>
            <Icon icon="faith.location" size={16} color={theme.colors.accent} />
            <Text variant="body">
              {settings!.locationName ?? `${settings!.latitude!.toFixed(2)}, ${settings!.longitude!.toFixed(2)}`}
            </Text>
          </Row>
        )}
        {!deniedForGood && (
          <Button
            title={locating ? 'Locating…' : 'Use my location (GPS)'}
            icon="faith.location"
            variant="secondary"
            onPress={useGps}
            loading={locating}
          />
        )}
        {deniedForGood && (
          <Card accent={theme.colors.warning} style={{ gap: 8 }}>
            <Text variant="caption" color="textMuted">
              Location is turned off for FitCoach at the system level, so the app cannot even ask.
              Everything still works — pick a city or type coordinates below, or allow location in
              settings and come back.
            </Text>
            <Button
              title="Open system settings"
              variant="secondary"
              size="sm"
              icon="core.settings"
              onPress={() => Linking.openSettings()}
            />
          </Card>
        )}
        {gpsError && (
          <Text variant="caption" style={{ color: theme.colors.warning }}>
            {gpsError}
          </Text>
        )}
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
          <Chip
            label="Coordinates…"
            small
            active={manualOpen}
            onPress={() => setManualOpen((v) => !v)}
          />
        </Row>
        {manualOpen && (
          <View style={{ gap: 8 }}>
            <Row>
              <View style={{ flex: 1 }}>
                <Input label="Latitude" value={latInput} onChangeText={setLatInput} placeholder="36.81" keyboardType="numbers-and-punctuation" />
              </View>
              <View style={{ flex: 1 }}>
                <Input label="Longitude" value={lngInput} onChangeText={setLngInput} placeholder="10.18" keyboardType="numbers-and-punctuation" />
              </View>
            </Row>
            <Input label="Name (optional)" value={nameInput} onChangeText={setNameInput} placeholder="Home" />
            {manualError && (
              <Text variant="caption" style={{ color: theme.colors.warning }}>
                {manualError}
              </Text>
            )}
            <Button title="Save location" size="sm" onPress={saveManual} disabled={!latInput || !lngInput} />
          </View>
        )}
      </Card>

      {/* Method — picking one is an act of setup, so it also switches the feature on
          once there is a location to compute from. */}
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
              upsertPrayerSettings({ method: m.key, ...(hasLocation ? { enabled: true } : {}) });
              reload();
            }}
          />
        ))}
      </Row>

      {/* Asr convention — the one fiqh question the math actually has. */}
      <SectionHeader title="Asr convention" />
      <SegmentedControl
        options={[
          { value: '1', label: 'Standard' },
          { value: '2', label: 'Hanafi' },
        ]}
        value={settings?.asrFactor === 2 ? '2' : '1'}
        onChange={(v) => {
          upsertPrayerSettings({ asrFactor: v === '2' ? 2 : 1 });
          reload();
        }}
        accent={theme.colors.meditation}
      />
      <Text variant="caption" color="textFaint">
        Standard (Shafiʿi, Maliki, Hanbali): Asr when a shadow equals its object. Hanafi: at twice
        the object — later in the afternoon.
      </Text>

      {/* The off switch — enabled used to be written once and never again. */}
      {hasLocation && (
        <Card>
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text variant="bodyStrong">Show prayers across FitCoach</Text>
              <Text variant="caption" color="textMuted">
                The Home check-in card, prayer challenges and Ramadan timings follow this switch.
                Your location and method are kept either way.
              </Text>
            </View>
            <Switch
              value={!!settings?.enabled}
              onValueChange={(v) => {
                upsertPrayerSettings({ enabled: v });
                reload();
              }}
              trackColor={{ false: theme.colors.surfaceAlt, true: theme.alpha.tint22(theme.colors.meditation) }}
              thumbColor={settings?.enabled ? theme.colors.meditation : theme.colors.textFaint}
            />
          </Row>
        </Card>
      )}

      {/* Today's times — and an honest name for each way they can be absent. */}
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
      ) : hasLocation && !settings?.enabled ? (
        <EmptyState
          icon="faith.crescent"
          title="Prayers are switched off"
          message="Your location and method are kept. Flip the switch above and today's times return instantly."
        />
      ) : (
        <EmptyState
          icon="faith.location"
          title="No location yet"
          message="Prayer times are computed from the sun at your coordinates — use GPS, pick a city, or type coordinates above."
        />
      )}
    </Screen>
  );
}
