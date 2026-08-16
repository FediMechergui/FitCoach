/**
 * What today's weather does to today's training — and how far to trust it.
 *
 * ── The physiology, briefly ──
 * Heat is the one environmental factor that reliably kills athletes, and it
 * does so through a mechanism the app already tracks the edges of: sweat.
 * Above roughly 25 °C the body sheds heat almost entirely by evaporation, and
 * humidity is what decides whether that works — at 32 °C and 80% humidity the
 * air is already nearly saturated and sweat drips instead of evaporating. That
 * is why "feels like" figures exist, and why plain air temperature is a poor
 * guide to risk. Sweat rate in the heat can exceed a litre an hour, which is
 * why hydration targets move first.
 *
 * Cold is the mirror image: below ~10 °C muscles are stiffer at the start of a
 * session, warm-up matters more, and wind strips heat off exposed skin faster
 * than the thermometer suggests (wind chill). Cold-air breathing also irritates
 * airways in some people, which is worth flagging for anyone with a respiratory
 * condition on file.
 *
 * ── What is modelled and what is not ──
 * Everything here is a function of temperature, humidity and wind — three
 * numbers the user can type from any weather app if the live fetch is off or
 * offline. The heat index is a standard regression, not a guess. The knock-on
 * effects (hydration, calorie burn, pacing) are stated as adjustments with
 * their basis, and they are advisory: the app never silently rewrites a logged
 * calorie or a target. Every function is pure so it can be tested cold.
 */

export interface WeatherReading {
  /** air temperature, °C */
  tempC: number;
  /** relative humidity 0–100; null when unknown */
  humidityPct: number | null;
  /** wind speed, km/h; null when unknown */
  windKmh: number | null;
  /** epoch ms the reading is from */
  observedAt: number;
  /** where the numbers came from — the UI says so */
  source: 'live' | 'manual';
}

/**
 * Heat index ("feels like") in °C, per the NOAA Rothfusz regression, valid for
 * T ≥ 27 °C and RH ≥ 40%. Below that range the air temperature is returned
 * unchanged, which is the convention: the correction only matters when
 * evaporation starts to fail. With humidity unknown, temperature is returned
 * as-is — better honest than a made-up humidity.
 */
export function heatIndexC(tempC: number, humidityPct: number | null): number {
  if (humidityPct == null || tempC < 27 || humidityPct < 40) return tempC;
  const T = tempC * 1.8 + 32; // regression is in °F
  const R = humidityPct;
  let hi =
    -42.379 +
    2.04901523 * T +
    10.14333127 * R -
    0.22475541 * T * R -
    0.00683783 * T * T -
    0.05481717 * R * R +
    0.00122874 * T * T * R +
    0.00085282 * T * R * R -
    0.00000199 * T * T * R * R;
  // Standard adjustment for low humidity at high heat.
  if (R < 13 && T >= 80 && T <= 112) hi -= ((13 - R) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17);
  return Math.round(((hi - 32) / 1.8) * 10) / 10;
}

/**
 * Wind chill in °C (Environment Canada / NWS formula), valid for T ≤ 10 °C and
 * wind ≥ 4.8 km/h. Outside that, air temperature is returned.
 */
export function windChillC(tempC: number, windKmh: number | null): number {
  if (windKmh == null || tempC > 10 || windKmh < 4.8) return tempC;
  const v = Math.pow(windKmh, 0.16);
  return Math.round((13.12 + 0.6215 * tempC - 11.37 * v + 0.3965 * tempC * v) * 10) / 10;
}

/** The single "feels like" number: heat index when hot, wind chill when cold. */
export function feelsLikeC(w: Pick<WeatherReading, 'tempC' | 'humidityPct' | 'windKmh'>): number {
  if (w.tempC >= 27) return heatIndexC(w.tempC, w.humidityPct);
  if (w.tempC <= 10) return windChillC(w.tempC, w.windKmh);
  return w.tempC;
}

export type HeatBand = 'cold' | 'cool' | 'ideal' | 'warm' | 'hot' | 'extreme';

/**
 * Bands on the FEELS-LIKE figure. The thresholds follow the widely used
 * heat-index guidance (caution from ~27, extreme caution ~32, danger ~41) and
 * the cold end follows where warm-up and airway effects start to matter.
 */
export function heatBand(feelsLike: number): HeatBand {
  if (feelsLike < 5) return 'cold';
  if (feelsLike < 12) return 'cool';
  if (feelsLike < 24) return 'ideal';
  if (feelsLike < 30) return 'warm';
  if (feelsLike < 38) return 'hot';
  return 'extreme';
}

export const HEAT_BAND_LABEL: Record<HeatBand, string> = {
  cold: 'Cold',
  cool: 'Cool',
  ideal: 'Ideal',
  warm: 'Warm',
  hot: 'Hot',
  extreme: 'Extreme heat',
};

export const HEAT_BAND_COLOR: Record<HeatBand, string> = {
  cold: '#4FC3F7',
  cool: '#4F8CFF',
  ideal: '#33D9A6',
  warm: '#FFB454',
  hot: '#FF8A3D',
  extreme: '#FF5D5D',
};

/**
 * How much harder sweat has to work because of humidity, as a multiplier on
 * fluid needs. 1.0 in dry air, rising toward 1.4 in saturated air.
 *
 * This is the piece "feels like" does NOT capture. The heat index already
 * raises the apparent temperature for humidity, but two days at the same
 * feels-like are not equal for sweat: at 60% humidity evaporation still
 * removes heat efficiently, at 90% almost none of the sweat evaporates, so the
 * body pours out more of it for less cooling. Fluid loss is therefore driven by
 * humidity ON TOP OF the temperature effect, not merely through it. Below 20 °C
 * it barely matters (you aren't sweating much to begin with), so the term only
 * engages in warmth.
 */
export function humiditySweatFactor(tempC: number, humidityPct: number | null): number {
  if (humidityPct == null || tempC < 20) return 1;
  // Ramp from no effect at 40% RH to +40% at 100% RH, scaled in over 20–26 °C.
  const humidityRamp = clamp((humidityPct - 40) / 60, 0, 1);
  const warmthRamp = clamp((tempC - 20) / 6, 0, 1);
  return 1 + 0.4 * humidityRamp * warmthRamp;
}

/**
 * Extra fluid to drink today, ml, on top of the base goal.
 *
 * Sweat losses rise steeply with heat: roughly an extra 250–500 ml per hour of
 * activity in warm conditions, up to a litre or more an hour in genuine heat —
 * and MORE again when humidity stops that sweat evaporating (see
 * humiditySweatFactor). The figure is per-day, scaled by planned activity
 * minutes, and capped so a hot day cannot demand an absurd total. Cold adds
 * nothing to the target (though thirst is blunted in cold, which the note
 * mentions).
 */
export function extraWaterMl(
  feelsLike: number,
  plannedActiveMin: number,
  humidity?: { tempC: number; humidityPct: number | null }
): number {
  if (feelsLike < 24) return 0;
  const hours = Math.max(0.5, plannedActiveMin / 60);
  let perHour: number;
  if (feelsLike < 30) perHour = 250;
  else if (feelsLike < 38) perHour = 500;
  else perHour = 750;
  // Resting sweat rises too on a genuinely hot day, so there's a floor even
  // with no training planned.
  const restingBonus = feelsLike >= 30 ? 300 : feelsLike >= 24 ? 150 : 0;
  const humid = humidity ? humiditySweatFactor(humidity.tempC, humidity.humidityPct) : 1;
  return Math.min(3000, Math.round((perHour * hours + restingBonus) * humid));
}

/**
 * Multiplier on the calorie cost of a session in this weather.
 *
 * Both extremes raise energy cost: heat through cardiovascular strain and
 * sweating, cold through shivering thermogenesis and heavier clothing. The
 * effects are modest — a few percent to perhaps ten — and are surfaced as a
 * note next to the estimate, NOT baked into logged calories. Rewriting a
 * session's calories on the basis of a weather reading the user might have
 * typed wrong would corrupt the log for a second-order effect.
 */
export function calorieCostMultiplier(feelsLike: number): number {
  if (feelsLike >= 38) return 1.1;
  if (feelsLike >= 30) return 1.06;
  if (feelsLike >= 24) return 1.03;
  if (feelsLike < 0) return 1.08;
  if (feelsLike < 5) return 1.05;
  return 1;
}

/**
 * How much slower to expect endurance pace, as a percentage. Aerobic
 * performance degrades measurably from the mid-20s and sharply past the
 * mid-30s; humidity worsens it independently, because a runner who cannot
 * shed heat has to slow down to stop core temperature climbing. This is for
 * setting expectations, so a slower run in heat is read as the weather and not
 * as lost fitness.
 */
export function pacePenaltyPct(
  feelsLike: number,
  humidity?: { tempC: number; humidityPct: number | null }
): number {
  let base: number;
  if (feelsLike < 22) base = 0;
  else if (feelsLike < 27) base = 3;
  else if (feelsLike < 32) base = 7;
  else if (feelsLike < 38) base = 12;
  else base = 20;
  if (!humidity || base === 0) return base;
  // Humid air adds up to ~5 points on top of the heat penalty.
  const extra = (humiditySweatFactor(humidity.tempC, humidity.humidityPct) - 1) * 12.5;
  return Math.round(base + extra);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export interface WeatherAdvice {
  band: HeatBand;
  feelsLike: number;
  headline: string;
  points: string[];
  /** true when the sensible advice is not to train hard outdoors right now */
  cautionOutdoors: boolean;
}

export interface WeatherContext {
  /** planned or typical training minutes today */
  plannedActiveMin: number;
  /** does the user have a respiratory condition on file (asthma etc.)? */
  respiratoryCondition?: boolean;
  /** is the user currently fasting (no fluid intake window)? */
  fasting?: boolean;
  /** cardiovascular condition on file */
  cardiacCondition?: boolean;
}

/**
 * The advice, assembled from the bands and the user's own context. Wording is
 * specific to what changes, not a generic "stay hydrated".
 */
export function weatherAdvice(w: WeatherReading, ctx: WeatherContext): WeatherAdvice {
  const fl = feelsLikeC(w);
  const band = heatBand(fl);
  const points: string[] = [];
  let headline: string;
  let cautionOutdoors = false;
  const hum = { tempC: w.tempC, humidityPct: w.humidityPct };
  const water = extraWaterMl(fl, ctx.plannedActiveMin, hum);
  const pace = pacePenaltyPct(fl, hum);
  const humid = w.humidityPct != null && w.humidityPct >= 60;
  const veryHumid = w.humidityPct != null && w.humidityPct >= 80;

  switch (band) {
    case 'extreme':
      headline = 'Extreme heat — move hard training indoors or to dawn.';
      cautionOutdoors = true;
      points.push(`Feels like ${fl}°C${veryHumid ? ` at ${w.humidityPct}% humidity` : ''}. Sweat can no longer cool you effectively — heat illness risk is real, not theoretical.`);
      points.push(`Drink about ${water} ml more than usual today, with salt in it.`);
      points.push(`Expect endurance pace to be ~${pace}% slower; that is the weather, not lost fitness.`);
      break;
    case 'hot':
      headline = 'Hot — shorten, slow down, and drink ahead of thirst.';
      cautionOutdoors = fl >= 34;
      points.push(`Feels like ${fl}°C${veryHumid ? ` at ${w.humidityPct}% humidity — sweat is barely evaporating, so you lose more of it for less cooling` : humid ? ' with high humidity, so sweat evaporates poorly' : ''}.`);
      points.push(`Add roughly ${water} ml of fluid today, more if you sweat heavily. Salt matters as much as water.`);
      points.push(`Endurance pace ~${pace}% slower is normal today. Keep hard sets, but rest longer between them.`);
      break;
    case 'warm':
      headline = 'Warm — a good day to train, with a little more water.';
      points.push(`Feels like ${fl}°C${veryHumid ? ` and humid (${w.humidityPct}%)` : ''}. Add about ${water} ml of fluid across the day.`);
      if (pace > 0) points.push(`Long endurance efforts may run ~${pace}% slower than in cool weather.`);
      break;
    case 'ideal':
      headline = 'Ideal conditions — nothing to adjust.';
      points.push(`Feels like ${fl}°C. This is the weather personal bests happen in.`);
      break;
    case 'cool':
      headline = 'Cool — warm up properly, then enjoy it.';
      points.push(`Feels like ${fl}°C. Muscles start stiffer; give the warm-up an extra five minutes before anything heavy or fast.`);
      break;
    case 'cold':
      headline = 'Cold — longer warm-up, layers, and watch the airways.';
      points.push(`Feels like ${fl}°C${w.windKmh && w.windKmh >= 20 ? ' in the wind' : ''}. Do the full warm-up indoors if you can — cold muscle plus a heavy lift or a sprint is how strains happen.`);
      points.push('Thirst is blunted in cold; you still lose fluid through breathing. Drink on schedule, not on feel.');
      if (fl < 0) points.push('Cover exposed skin. Wind chill below zero can frostnip fingers and ears within the length of a session.');
      break;
  }

  // Personal context layers on top.
  if (ctx.respiratoryCondition && (band === 'cold' || band === 'cool')) {
    points.push('You have a respiratory condition on file: cold dry air can trigger symptoms. Breathe through a buff or scarf, and keep a reliever to hand.');
  }
  if (ctx.cardiacCondition && (band === 'hot' || band === 'extreme')) {
    points.push('You have a cardiovascular condition on file: heat adds real strain to the heart. Keep intensity moderate today and stop early if anything feels off.');
    cautionOutdoors = true;
  }
  if (ctx.fasting && water > 0) {
    points.push(`You are fasting, so the extra ${water} ml has to fit inside your eating window — front-load fluid when it opens, and consider training closer to that window in this heat.`);
    if (band === 'hot' || band === 'extreme') cautionOutdoors = true;
  }

  return { band, feelsLike: fl, headline, points, cautionOutdoors };
}

/** Is a reading recent enough to act on? Weather from this morning is not weather now. */
export function isReadingFresh(w: WeatherReading, now = Date.now(), maxAgeMs = 3 * 3_600_000): boolean {
  return now - w.observedAt <= maxAgeMs;
}
