import { requireOptionalNativeModule } from 'expo-modules-core';

/**
 * Hardware step counter — absolute steps since device boot.
 *
 * Loaded with `requireOptionalNativeModule`, which returns null when the native
 * side isn't present. That matters: the JS bundle ships over-the-air to builds
 * that predate this module, so every call site must work without it. On an older
 * APK these helpers simply report "unavailable" and tracking falls back to the
 * pedometer + GPS path.
 */
interface StepCounterNativeModule {
  isAvailable: () => boolean;
  getStepsSinceBoot: () => Promise<number | null>;
}

const Native = requireOptionalNativeModule<StepCounterNativeModule>('StepCounter');

/** True only when the native module AND a hardware step sensor are both present. */
export function hasHardwareStepCounter(): boolean {
  if (!Native) return false;
  try {
    return Native.isAvailable();
  } catch {
    return false;
  }
}

/**
 * Absolute steps counted by the device since it last booted, or null if that
 * can't be read (no native module, no sensor, permission missing, or no reading
 * in time). Never throws.
 *
 * The value survives our process being killed and the CPU sleeping, which is
 * what makes exact session recovery possible: store it at session start, and
 * session steps are always (current − baseline).
 */
export async function getStepsSinceBoot(): Promise<number | null> {
  if (!Native) return null;
  try {
    const value = await Native.getStepsSinceBoot();
    return typeof value === 'number' && isFinite(value) && value >= 0 ? Math.round(value) : null;
  } catch {
    return null;
  }
}
