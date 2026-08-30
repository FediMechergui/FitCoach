/**
 * Accelerometer-based step detector — the fallback pedometer for devices whose
 * hardware step counter is unavailable (spec §3.4). Algorithm:
 *   1. Read accelerometer XYZ (expo-sensors provides ~50Hz).
 *   2. Compute magnitude: mag = sqrt(x² + y² + z²).
 *   3. Low-pass filter (EMA) to smooth high-frequency noise.
 *   4. Detect peaks crossing a dynamic threshold (running mean + k·stdev)
 *      with a refractory period so a single stride isn't double-counted.
 *   5. Credit a peak only if it is **big enough** and **rhythmic** (below).
 *
 * expo-sensors reports acceleration in units of g; gravity (~1g) is removed by
 * the running-mean baseline, so we detect the oscillation of walking, not tilt.
 *
 * ── Why steps 4 and 5 aren't enough on their own ──
 * The threshold at step 4 is *adaptive*: it tracks the running mean and standard
 * deviation, so when the phone is nearly still the bar drops until ordinary
 * sensor noise clears it. Turning on the spot, fidgeting, or a phone jostling in
 * a bag then reads as a stride, which is where the phantom steps come from.
 *
 * Two properties separate real walking from any of that:
 *   • **Amplitude.** A footfall sends a distinct 0.2–1.5 g shock through the
 *     body. Rotation and fidgeting produce an order of magnitude less, so a
 *     minimum peak-to-trough swing rules them out without touching real gait.
 *   • **Periodicity.** Gait is a metronome — consecutive strides land within a
 *     few percent of the same interval. Noise is irregular. Requiring a run of
 *     evenly-spaced peaks before crediting anything means an isolated bump, or a
 *     burst of shaking, never becomes a step.
 *
 * The warm-up costs nothing: the buffered candidates are credited in full the
 * moment the rhythm is established, so the first strides of a walk still count.
 */

export interface StepDetectorOptions {
  /** EMA smoothing factor for the low-pass filter (0..1, higher = smoother). */
  smoothing?: number;
  /** Peak threshold = mean + sensitivity × stdev. */
  sensitivity?: number;
  /** Minimum ms between steps (caps cadence ~4 steps/s). */
  refractoryMs?: number;
  /** Adaptation rate for the running mean/variance baseline. */
  adaptation?: number;
  /** Minimum peak-to-trough swing (g) for a footfall to be credible. */
  minAmplitude?: number;
  /** Consecutive evenly-spaced peaks required before any are credited. */
  warmupSteps?: number;
  /** How much a stride interval may differ from the previous one (fraction). */
  rhythmTolerance?: number;
}

/** Slower than this between peaks and it isn't a continuous gait any more. ms. */
export const MAX_STEP_INTERVAL_MS = 2000;

export class StepDetector {
  private smoothing: number;
  private sensitivity: number;
  private refractoryMs: number;
  private adaptation: number;
  private minAmplitude: number;
  private warmupSteps: number;
  private rhythmTolerance: number;

  private filtered = 1; // starts near 1g (device at rest)
  private mean = 1;
  private variance = 0.0025;
  private lastStepTs = 0;
  private rising = false;
  private lastValue = 1;
  /** lowest filtered value since the last peak — the other half of the swing */
  private trough = 1;
  /** rhythmic candidates seen but not yet credited */
  private pending = 0;
  /** interval between the last two accepted peaks, for the rhythm test */
  private lastInterval = 0;
  /** true once a run of even strides has proved this is really walking */
  private warm = false;

  steps = 0;

  constructor(opts: StepDetectorOptions = {}) {
    this.smoothing = opts.smoothing ?? 0.6;
    this.sensitivity = opts.sensitivity ?? 1.2;
    this.refractoryMs = opts.refractoryMs ?? 250;
    this.adaptation = opts.adaptation ?? 0.05;
    // Tuned against vehicle noise: potholes and engine vibration produce small,
    // uneven swings. A real footfall moves the sensor harder (≥0.13 g swing),
    // keeps a tighter beat (±35%), and needs four even strides to prove itself.
    this.minAmplitude = opts.minAmplitude ?? 0.13;
    this.warmupSteps = opts.warmupSteps ?? 4;
    this.rhythmTolerance = opts.rhythmTolerance ?? 0.35;
  }

  reset(): void {
    this.steps = 0;
    this.filtered = 1;
    this.mean = 1;
    this.variance = 0.0025;
    this.lastStepTs = 0;
    this.rising = false;
    this.lastValue = 1;
    this.trough = 1;
    this.pending = 0;
    this.lastInterval = 0;
    this.warm = false;
  }

  /** Drop the rhythm streak — the next stride starts a fresh warm-up. */
  private breakRhythm(timestampMs: number): void {
    this.pending = 1;
    this.lastInterval = 0;
    this.warm = false;
    this.lastStepTs = timestampMs;
  }

  /**
   * Feed one accelerometer sample. Returns **how many steps this sample
   * credited** — normally 0 or 1, but the sample that completes the warm-up
   * credits the whole buffered run at once so the start of a walk isn't lost.
   * `timestampMs` should be monotonic (e.g. Date.now() or event timestamp).
   */
  onSample(x: number, y: number, z: number, timestampMs: number): number {
    const mag = Math.sqrt(x * x + y * y + z * z);

    // Low-pass filter (exponential moving average).
    this.filtered = this.smoothing * this.filtered + (1 - this.smoothing) * mag;
    if (this.filtered < this.trough) this.trough = this.filtered;

    // Update adaptive baseline (running mean + variance).
    const delta = this.filtered - this.mean;
    this.mean += this.adaptation * delta;
    this.variance = (1 - this.adaptation) * (this.variance + this.adaptation * delta * delta);
    const stdev = Math.sqrt(Math.max(this.variance, 1e-6));
    const threshold = this.mean + this.sensitivity * stdev;

    let credited = 0;

    // Peak detection: a step candidate is the falling edge just after a value
    // that crossed the dynamic threshold, respecting the refractory period.
    if (this.filtered > threshold && this.filtered > this.lastValue) {
      this.rising = true;
    } else if (this.rising && this.filtered < this.lastValue) {
      const interval = timestampMs - this.lastStepTs;
      const amplitude = this.lastValue - this.trough;
      this.rising = false;
      this.trough = this.filtered; // start measuring the next swing from here

      if (interval < this.refractoryMs) {
        // Too soon to be a separate stride — the same footfall ringing.
      } else if (amplitude < this.minAmplitude) {
        // Real enough to clear the adaptive threshold, far too small to be a
        // footfall: rotation, fidgeting, a phone shifting in a bag. Note the
        // stride clock is NOT touched — a sub-amplitude blip between two real
        // footfalls must not make the real ones look off-beat.
        this.pending = 0;
      } else if (this.lastStepTs === 0 || interval > MAX_STEP_INTERVAL_MS) {
        // First peak, or such a long gap that the previous rhythm is irrelevant.
        this.breakRhythm(timestampMs);
      } else if (
        this.lastInterval > 0 &&
        Math.abs(interval - this.lastInterval) > this.lastInterval * this.rhythmTolerance
      ) {
        // Arrived, but off-beat — noise rather than the metronome of a gait.
        this.breakRhythm(timestampMs);
      } else {
        this.lastInterval = interval;
        this.lastStepTs = timestampMs;
        this.pending += 1;
        if (this.warm) {
          credited = this.pending;
          this.pending = 0;
        } else if (this.pending >= this.warmupSteps) {
          // Rhythm proved — bank the whole run, including the strides that were
          // only provisional while we waited.
          this.warm = true;
          credited = this.pending;
          this.pending = 0;
        }
        this.steps += credited;
      }
    }

    this.lastValue = this.filtered;
    return credited;
  }
}

/** Daily step goal used by the Home rings and the live walk notification. */
export const DAILY_STEP_GOAL = 8000;

/**
 * Step length as a fraction of height.
 *
 * The textbook constants — 0.415 of your height walking, 0.5 running — are for
 * ONE speed each: a comfortable ~100 steps/min walk and a steady ~155 spm jog.
 * Step length is not fixed, though; it grows with cadence and speed. Stride out
 * at 125 spm and you cover noticeably more ground per step than the constant
 * assumes, so a brisk walk measured by steps alone always came back short —
 * and therefore slow.
 *
 * When cadence is known the factor is interpolated around the reference; when
 * it is not, the constants stand exactly as before.
 */
export const STRIDE_REFERENCE = {
  walk: { factor: 0.415, cadence: 100, min: 0.36, max: 0.5 },
  run: { factor: 0.5, cadence: 155, min: 0.44, max: 0.65 },
} as const;

export function strideFactorFor(mode: 'walk' | 'run', cadenceSpm?: number | null): number {
  const ref = STRIDE_REFERENCE[mode];
  if (cadenceSpm == null || !Number.isFinite(cadenceSpm) || cadenceSpm <= 0) return ref.factor;
  // ~0.3 % more step length per 1 % more cadence, clamped to human bounds.
  const ratio = cadenceSpm / ref.cadence;
  const scaled = ref.factor * (1 + (ratio - 1) * 0.35);
  return Math.min(ref.max, Math.max(ref.min, scaled));
}

/** Default adult stride length (m) as a fraction of height, by gait and cadence. */
export function estimateStrideLengthM(
  heightCm: number,
  mode: 'walk' | 'run' = 'walk',
  cadenceSpm?: number | null
): number {
  const h = heightCm > 0 ? heightCm : 170;
  return (h / 100) * strideFactorFor(mode, cadenceSpm);
}

/** Distance (m) from a step count using estimated stride length. */
export function distanceFromSteps(
  steps: number,
  heightCm: number,
  mode: 'walk' | 'run' = 'walk',
  cadenceSpm?: number | null
): number {
  return Math.round(steps * estimateStrideLengthM(heightCm, mode, cadenceSpm));
}

/** Steps from a covered distance (the inverse of distanceFromSteps). */
export function stepsFromDistance(
  distanceM: number,
  heightCm: number,
  mode: 'walk' | 'run' = 'walk',
  cadenceSpm?: number | null
): number {
  const stride = estimateStrideLengthM(heightCm, mode, cadenceSpm);
  return stride > 0 ? Math.round(distanceM / stride) : 0;
}

/** Steps from a duration when distance is unknown, using a typical cadence. */
export function stepsFromDuration(durationSec: number, mode: 'walk' | 'run' = 'walk'): number {
  const stepsPerMin = mode === 'run' ? 160 : 110; // typical run vs walk cadence
  return Math.round((durationSec / 60) * stepsPerMin);
}
