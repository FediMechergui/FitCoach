import * as Location from 'expo-location';
import { saveWeatherReading } from '@/repositories/weatherRepo';
import type { WeatherReading } from '@/lib/weather';

/**
 * Fetch current conditions for wherever the phone is.
 *
 * Open-Meteo is used because it needs no API key and no account, which keeps
 * the app free of secrets and the user free of sign-ups. The request carries
 * only rounded coordinates — nothing that identifies the user — and the result
 * is stored locally, so everything downstream keeps working offline from the
 * last reading.
 *
 * Location is best-effort: the last known position is preferred (instant, no
 * GPS spin-up), falling back to a fresh low-accuracy fix. If the app was never
 * granted location, or there is no network, this returns null and the UI
 * offers manual entry instead. It never throws into the caller.
 */

const ENDPOINT = 'https://api.open-meteo.com/v1/forecast';

interface OpenMeteoCurrent {
  temperature_2m?: number;
  relative_humidity_2m?: number;
  wind_speed_10m?: number;
  time?: string;
}

export async function fetchLiveWeather(): Promise<WeatherReading | null> {
  try {
    const perm = await Location.getForegroundPermissionsAsync();
    if (!perm.granted) return null;

    const pos =
      (await Location.getLastKnownPositionAsync({ maxAge: 30 * 60_000 })) ??
      (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }));
    if (!pos) return null;

    // Two decimals ≈ 1 km — plenty for weather, and not a precise home address.
    const lat = pos.coords.latitude.toFixed(2);
    const lon = pos.coords.longitude.toFixed(2);
    const url =
      `${ENDPOINT}?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,wind_speed_10m&wind_speed_unit=kmh&timezone=auto`;

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    let res: Response;
    try {
      res = await fetch(url, { signal: ctrl.signal });
    } finally {
      clearTimeout(timer);
    }
    if (!res.ok) return null;
    const json = (await res.json()) as { current?: OpenMeteoCurrent };
    const c = json.current;
    if (!c || typeof c.temperature_2m !== 'number') return null;

    const reading: WeatherReading = {
      tempC: Math.round(c.temperature_2m * 10) / 10,
      humidityPct: typeof c.relative_humidity_2m === 'number' ? Math.round(c.relative_humidity_2m) : null,
      windKmh: typeof c.wind_speed_10m === 'number' ? Math.round(c.wind_speed_10m) : null,
      observedAt: Date.now(),
      source: 'live',
    };
    saveWeatherReading(reading);
    return reading;
  } catch {
    // Offline, denied, timed out — all read as "no live reading"; the UI falls
    // back to the last stored one or to manual entry.
    return null;
  }
}
