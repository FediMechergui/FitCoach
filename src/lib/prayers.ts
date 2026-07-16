/**
 * Prayer-time calculation — fully offline, standard astronomical method (the
 * same approach as PrayTimes.org): sun declination + equation of time from the
 * Julian date, then hour angles for each twilight angle.
 *
 * Times are returned as 'HH:MM' local strings using the device's UTC offset.
 * This is calculation, not authority — mosques/ministries can differ by a few
 * minutes; a method setting covers the major conventions.
 */

export type PrayerMethodKey = 'mwl' | 'isna' | 'egypt' | 'umm_al_qura' | 'tunisia' | 'karachi';

export interface PrayerMethod {
  key: PrayerMethodKey;
  label: string;
  fajrAngle: number;
  /** either an angle below horizon, or minutes after Maghrib */
  isha: { angle?: number; minutesAfterMaghrib?: number };
}

export const PRAYER_METHODS: PrayerMethod[] = [
  { key: 'tunisia', label: 'Tunisia (Ministry)', fajrAngle: 18, isha: { angle: 18 } },
  { key: 'mwl', label: 'Muslim World League', fajrAngle: 18, isha: { angle: 17 } },
  { key: 'isna', label: 'ISNA (N. America)', fajrAngle: 15, isha: { angle: 15 } },
  { key: 'egypt', label: 'Egyptian Authority', fajrAngle: 19.5, isha: { angle: 17.5 } },
  { key: 'umm_al_qura', label: 'Umm al-Qura (Makkah)', fajrAngle: 18.5, isha: { minutesAfterMaghrib: 90 } },
  { key: 'karachi', label: 'Univ. of Karachi', fajrAngle: 18, isha: { angle: 18 } },
];

export function findMethod(key: string): PrayerMethod {
  return PRAYER_METHODS.find((m) => m.key === key) ?? PRAYER_METHODS[0];
}

export interface PrayerTimes {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

export const PRAYER_NAMES: Array<{ key: keyof PrayerTimes; label: string; icon: string }> = [
  { key: 'fajr', label: 'Fajr', icon: 'faith.dawn' },
  { key: 'sunrise', label: 'Sunrise', icon: 'faith.sunrise' },
  { key: 'dhuhr', label: 'Dhuhr', icon: 'faith.sun' },
  { key: 'asr', label: 'Asr', icon: 'faith.afternoon' },
  { key: 'maghrib', label: 'Maghrib', icon: 'faith.sunset' },
  { key: 'isha', label: 'Isha', icon: 'faith.night' },
];

// ── degree-based trig helpers ────────────────────────────────────────────────
const D2R = Math.PI / 180;
const dsin = (d: number) => Math.sin(d * D2R);
const dcos = (d: number) => Math.cos(d * D2R);
const dtan = (d: number) => Math.tan(d * D2R);
const darcsin = (x: number) => Math.asin(Math.min(1, Math.max(-1, x))) / D2R;
const darccos = (x: number) => Math.acos(Math.min(1, Math.max(-1, x))) / D2R;
const darctan2 = (y: number, x: number) => Math.atan2(y, x) / D2R;
const fixAngle = (a: number) => ((a % 360) + 360) % 360;
const fixHour = (h: number) => ((h % 24) + 24) % 24;

function julianDate(year: number, month: number, day: number): number {
  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
}

/** Sun declination (°) and equation of time (hours) for a Julian date. */
function sunPosition(jd: number): { declination: number; equation: number } {
  const D = jd - 2451545.0;
  const g = fixAngle(357.529 + 0.98560028 * D);
  const q = fixAngle(280.459 + 0.98564736 * D);
  const L = fixAngle(q + 1.915 * dsin(g) + 0.02 * dsin(2 * g));
  const e = 23.439 - 0.00000036 * D;
  const RA = fixHour(darctan2(dcos(e) * dsin(L), dcos(L)) / 15);
  const equation = q / 15 - RA;
  const declination = darcsin(dsin(e) * dsin(L));
  // normalize equation into [-12, 12]
  let eq = equation;
  if (eq > 12) eq -= 24;
  if (eq < -12) eq += 24;
  return { declination, equation: eq };
}

/** Hour-angle offset (hours from midday) for the sun at `angle`° below horizon. */
function hourAngle(angle: number, lat: number, decl: number): number | null {
  const cosH = (-dsin(angle) - dsin(lat) * dsin(decl)) / (dcos(lat) * dcos(decl));
  if (cosH < -1 || cosH > 1) return null; // sun never reaches this angle (high latitudes)
  return darccos(cosH) / 15;
}

function toHM(hours: number): string {
  const h = fixHour(hours);
  let hh = Math.floor(h);
  let mm = Math.round((h - hh) * 60);
  if (mm === 60) {
    mm = 0;
    hh = (hh + 1) % 24;
  }
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export interface PrayerInputs {
  date: Date;
  latitude: number;
  longitude: number;
  /** UTC offset in hours (default: device offset for that date) */
  tzOffsetHours?: number;
  method?: PrayerMethodKey;
  /** Asr shadow factor: 1 = Standard (Shafi), 2 = Hanafi */
  asrFactor?: 1 | 2;
}

export function computePrayerTimes(input: PrayerInputs): PrayerTimes {
  const { date, latitude, longitude } = input;
  const tz = input.tzOffsetHours ?? -date.getTimezoneOffset() / 60;
  const method = findMethod(input.method ?? 'tunisia');
  const asrFactor = input.asrFactor ?? 1;

  const jd = julianDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const { declination: decl, equation: eqt } = sunPosition(jd + 0.5 - longitude / 360);

  const dhuhr = fixHour(12 + tz - longitude / 15 - eqt);

  const sunAngle = 0.833; // atmospheric refraction + solar radius
  const tSunrise = hourAngle(sunAngle, latitude, decl);
  const tFajr = hourAngle(method.fajrAngle, latitude, decl);
  const tIsha = method.isha.angle != null ? hourAngle(method.isha.angle, latitude, decl) : null;

  // Asr: shadow factor method
  const asrAngle = -darctan2(1, asrFactor + dtan(Math.abs(latitude - decl)));
  const tAsr = hourAngle(asrAngle, latitude, decl);

  const sunrise = tSunrise != null ? dhuhr - tSunrise : dhuhr - 6;
  const maghrib = tSunrise != null ? dhuhr + tSunrise : dhuhr + 6;
  const fajr = tFajr != null ? dhuhr - tFajr : sunrise - 1.5;
  const isha =
    method.isha.minutesAfterMaghrib != null
      ? maghrib + method.isha.minutesAfterMaghrib / 60
      : tIsha != null
        ? dhuhr + tIsha
        : maghrib + 1.5;
  const asr = tAsr != null ? dhuhr + tAsr : dhuhr + 3.5;

  return {
    fajr: toHM(fajr),
    sunrise: toHM(sunrise),
    dhuhr: toHM(dhuhr),
    asr: toHM(asr),
    maghrib: toHM(maghrib),
    isha: toHM(isha),
  };
}

/** The next prayer after `now` (minutes-of-day), wrapping to tomorrow's Fajr. */
export function nextPrayer(
  times: PrayerTimes,
  now: Date = new Date()
): { key: keyof PrayerTimes; label: string; time: string; minutesUntil: number } {
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const order: Array<{ key: keyof PrayerTimes; label: string }> = [
    { key: 'fajr', label: 'Fajr' },
    { key: 'dhuhr', label: 'Dhuhr' },
    { key: 'asr', label: 'Asr' },
    { key: 'maghrib', label: 'Maghrib' },
    { key: 'isha', label: 'Isha' },
  ];
  for (const p of order) {
    const [h, m] = times[p.key].split(':').map(Number);
    const t = h * 60 + m;
    if (t > nowMin) return { ...p, time: times[p.key], minutesUntil: t - nowMin };
  }
  // Past Isha → tomorrow's Fajr
  const [h, m] = times.fajr.split(':').map(Number);
  return { key: 'fajr', label: 'Fajr', time: times.fajr, minutesUntil: 24 * 60 - nowMin + h * 60 + m };
}

/** A few Tunisian city presets for manual setup (no GPS needed). */
export const CITY_PRESETS: Array<{ name: string; lat: number; lng: number }> = [
  { name: 'Tunis', lat: 36.8065, lng: 10.1815 },
  { name: 'Sfax', lat: 34.7406, lng: 10.7603 },
  { name: 'Sousse', lat: 35.8256, lng: 10.6369 },
  { name: 'Kairouan', lat: 35.6781, lng: 10.0963 },
  { name: 'Bizerte', lat: 37.2744, lng: 9.8739 },
  { name: 'Gabès', lat: 33.8815, lng: 10.0982 },
  { name: 'Mecca', lat: 21.4225, lng: 39.8262 },
];
