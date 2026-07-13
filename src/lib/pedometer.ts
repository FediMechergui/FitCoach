/**
 * Accelerometer-based step detector — the fallback pedometer for devices whose
 * hardware step counter is unavailable (spec §3.4). Algorithm:
 *   1. Read accelerometer XYZ (expo-sensors provides ~50Hz).
 *   2. Compute magnitude: mag = sqrt(x² + y² + z²).
 *   3. Low-pass filter (EMA) to smooth high-frequency noise.
 *   4. Detect peaks crossing a dynamic threshold (running mean + k·stdev)
 *      with a refractory period so a single stride isn't double-counted.
 *
 * expo-sensors reports acceleration in units of g; gravity (~1g) is removed by
 * the running-mean baseline, so we detect the oscillation of walking, not tilt.
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
}

export class StepDetector {
  private smoothing: number;
  private sensitivity: number;
  private refractoryMs: number;
  private adaptation: number;

  private filtered = 1; // starts near 1g (device at rest)
  private mean = 1;
  private variance = 0.0025;
  private lastStepTs = 0;
  private rising = false;
  private lastValue = 1;

  steps = 0;

  constructor(opts: StepDetectorOptions = {}) {
    this.smoothing = opts.smoothing ?? 0.6;
    this.sensitivity = opts.sensitivity ?? 1.2;
    this.refractoryMs = opts.refractoryMs ?? 250;
    this.adaptation = opts.adaptation ?? 0.05;
  }

  reset(): void {
    this.steps = 0;
    this.filtered = 1;
    this.mean = 1;
    this.variance = 0.0025;
    this.lastStepTs = 0;
    this.rising = false;
    this.lastValue = 1;
  }

  /**
   * Feed one accelerometer sample. Returns true if this sample completed a step.
   * `timestampMs` should be monotonic (e.g. Date.now() or event timestamp).
   */
  onSample(x: number, y: number, z: number, timestampMs: number): boolean {
    const mag = Math.sqrt(x * x + y * y + z * z);

    // Low-pass filter (exponential moving average).
    this.filtered = this.smoothing * this.filtered + (1 - this.smoothing) * mag;

    // Update adaptive baseline (running mean + variance).
    const delta = this.filtered - this.mean;
    this.mean += this.adaptation * delta;
    this.variance = (1 - this.adaptation) * (this.variance + this.adaptation * delta * delta);
    const stdev = Math.sqrt(Math.max(this.variance, 1e-6));
    const threshold = this.mean + this.sensitivity * stdev;

    let stepped = false;

    // Peak detection: count a step on the falling edge just after a value that
    // crossed the dynamic threshold, respecting the refractory period.
    if (this.filtered > threshold && this.filtered > this.lastValue) {
      this.rising = true;
    } else if (this.rising && this.filtered < this.lastValue) {
      // Just passed a local maximum above threshold → candidate step.
      if (timestampMs - this.lastStepTs >= this.refractoryMs) {
        this.steps += 1;
        this.lastStepTs = timestampMs;
        stepped = true;
      }
      this.rising = false;
    }

    this.lastValue = this.filtered;
    return stepped;
  }
}

/** Default adult stride length (m) as a fraction of height, by gait. */
export function estimateStrideLengthM(heightCm: number, mode: 'walk' | 'run' = 'walk'): number {
  const h = heightCm > 0 ? heightCm : 170;
  const factor = mode === 'run' ? 0.5 : 0.415;
  return (h / 100) * factor;
}

/** Distance (m) from a step count using estimated stride length. */
export function distanceFromSteps(steps: number, heightCm: number, mode: 'walk' | 'run' = 'walk'): number {
  return Math.round(steps * estimateStrideLengthM(heightCm, mode));
}
