import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Pressable } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Row, Badge } from '@/components/ui/misc';
import {
  HEAT_BAND_COLOR,
  HEAT_BAND_LABEL,
  isReadingFresh,
  weatherAdvice,
  type WeatherContext,
  type WeatherReading,
} from '@/lib/weather';
import { latestReading, saveWeatherReading } from '@/repositories/weatherRepo';
import { fetchLiveWeather } from '@/services/weatherFetch';
import { listConditions } from '@/repositories/conditionsRepo';
import { CONDITION_CATALOGUE } from '@/lib/conditions';
import { currentFastingState } from '@/repositories/faithRepo';

/**
 * Today's weather and what it changes.
 *
 * Works from the last stored reading first, so the card is never blank offline
 * and never blocks on the network. A live fetch refreshes it silently when it
 * can. Manual entry is always one tap away — the physics is the same whether
 * the numbers came from a satellite or a glance at the window, and the card
 * says which.
 */
export function WeatherCard({ plannedActiveMin = 45 }: { plannedActiveMin?: number }) {
  const theme = useTheme();
  const [reading, setReading] = useState<WeatherReading | null>(() => latestReading());
  const [editing, setEditing] = useState(false);
  const [temp, setTemp] = useState('');
  const [hum, setHum] = useState('');
  const [wind, setWind] = useState('');
  const [fetching, setFetching] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Personal context — conditions on file and fasting state.
  const ctx = useMemo<WeatherContext>(() => {
    const keys = new Set(safe(() => listConditions().map((c) => c.conditionKey), [] as string[]));
    const cats = new Set(CONDITION_CATALOGUE.filter((c) => keys.has(c.key)).map((c) => c.category));
    const fasting = safe(() => currentFastingState()?.fasting ?? false, false);
    return {
      plannedActiveMin,
      respiratoryCondition: cats.has('respiratory'),
      cardiacCondition: cats.has('cardiovascular'),
      fasting,
    };
  }, [plannedActiveMin]);

  const refresh = useCallback(async () => {
    setFetching(true);
    const live = await fetchLiveWeather();
    if (live) setReading(live);
    setFetching(false);
  }, []);

  // Refresh once on mount if what we have is stale or missing. Never block.
  useEffect(() => {
    if (!reading || !isReadingFresh(reading)) void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveManual = () => {
    const t = parseFloat(temp.replace(',', '.'));
    if (!Number.isFinite(t)) return;
    const h = parseFloat(hum.replace(',', '.'));
    const w = parseFloat(wind.replace(',', '.'));
    const r: WeatherReading = {
      tempC: t,
      humidityPct: Number.isFinite(h) ? Math.min(100, Math.max(0, h)) : null,
      windKmh: Number.isFinite(w) ? Math.max(0, w) : null,
      observedAt: Date.now(),
      source: 'manual',
    };
    saveWeatherReading(r);
    setReading(r);
    setEditing(false);
  };

  const advice = reading ? weatherAdvice(reading, ctx) : null;
  const stale = reading ? !isReadingFresh(reading) : false;

  return (
    <Card accent={advice ? HEAT_BAND_COLOR[advice.band] : theme.colors.textFaint} style={{ gap: 10 }}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Row gap={10} style={{ alignItems: 'center', flex: 1 }}>
          <Icon icon="weather.thermo" size={22} color={advice ? HEAT_BAND_COLOR[advice.band] : theme.colors.textFaint} />
          <View style={{ flex: 1 }}>
            {reading && advice ? (
              <>
                <Row gap={8} style={{ alignItems: 'baseline' }}>
                  <Text variant="h3">{Math.round(reading.tempC)}°C</Text>
                  {advice.feelsLike !== reading.tempC && (
                    <Text variant="caption" color="textMuted">feels like {Math.round(advice.feelsLike)}°</Text>
                  )}
                  <Badge label={HEAT_BAND_LABEL[advice.band]} color={HEAT_BAND_COLOR[advice.band]} />
                </Row>
                <Text variant="caption" color="textFaint">
                  {reading.source === 'live' ? 'Live' : 'Entered by you'}
                  {reading.humidityPct != null ? ` · ${reading.humidityPct}% humidity` : ''}
                  {reading.windKmh != null && reading.windKmh > 0 ? ` · wind ${reading.windKmh} km/h` : ''}
                  {stale ? ' · a few hours old' : ''}
                </Text>
              </>
            ) : (
              <>
                <Text variant="bodyStrong">Weather</Text>
                <Text variant="caption" color="textMuted">
                  {fetching ? 'Checking…' : 'No reading yet — fetch it, or type it in.'}
                </Text>
              </>
            )}
          </View>
        </Row>
        <Pressable onPress={() => setEditing((v) => !v)} hitSlop={8}>
          <Icon icon="core.edit" size={18} color={theme.colors.textFaint} />
        </Pressable>
      </Row>

      {editing && (
        <View style={{ gap: 8 }}>
          <Row gap={8} style={{ alignItems: 'flex-end' }}>
            <View style={{ flex: 1 }}>
              <Input label="°C" value={temp} onChangeText={setTemp} keyboardType="numeric" placeholder="e.g. 31" />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Humidity %" value={hum} onChangeText={setHum} keyboardType="numeric" placeholder="optional" />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Wind km/h" value={wind} onChangeText={setWind} keyboardType="numeric" placeholder="optional" />
            </View>
          </Row>
          <Row gap={8}>
            <Button title="Save" size="sm" onPress={saveManual} style={{ flex: 1 }} fullWidth={false} />
            <Button title={fetching ? 'Fetching…' : 'Fetch live'} size="sm" variant="secondary" onPress={() => void refresh()} disabled={fetching} style={{ flex: 1 }} fullWidth={false} />
          </Row>
          <Text variant="caption" color="textFaint">
            Live needs location and a connection; the advice is identical either way.
          </Text>
        </View>
      )}

      {advice && (
        <Pressable onPress={() => setExpanded((v) => !v)}>
          <Text variant="body">{advice.headline}</Text>
          {(expanded ? advice.points : advice.points.slice(0, 1)).map((p, i) => (
            <Text key={i} variant="caption" color="textMuted" style={{ marginTop: 4 }}>• {p}</Text>
          ))}
          {advice.points.length > 1 && (
            <Text variant="caption" color="primary" style={{ marginTop: 4 }}>
              {expanded ? 'Less' : `${advice.points.length - 1} more`}
            </Text>
          )}
        </Pressable>
      )}
    </Card>
  );
}

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}
