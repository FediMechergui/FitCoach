import { requireOptionalNativeModule } from 'expo-modules-core';

/** Low-power motion observations. Hardware counts cover periods when the sensor
 * was activated; Android force-stop or process loss can leave unmeasured gaps.
 */
interface StepCounterNativeModule {
  alwaysOnStatus?: () => AlwaysOnStatus;
  setAlwaysOn?: (enabled:boolean) => boolean;
  resumeAlwaysOn?: () => void;
  stopIdleMonitoring?: () => void;
  stepHistory?: () => Array<{date:string;steps:number}>;
  startMonitoring?: () => boolean;
  dailySteps?: () => { date: string; steps: number; updatedAt: number; observedTotal: number };
  setGpsVehicleFilter?: (active: boolean) => void;
  startStepService?: () => boolean;
  stopStepService?: () => boolean;
  readMotion?: () => { kind: string; confidence: number; at: number };
  startMotionRecognition?: () => Promise<boolean>;
  stopMotionRecognition?: () => Promise<boolean>;
  isAvailable: () => boolean;
  getStepsSinceBoot: () => Promise<number | null>;
}

const Native = requireOptionalNativeModule<StepCounterNativeModule>('StepCounter');
export interface AlwaysOnStatus { enabled:boolean; running:boolean; available:boolean; permission:boolean; motionAvailable:boolean; error:string|null }
export function alwaysOnStatus(): AlwaysOnStatus {
  try { return Native?.alwaysOnStatus?.() ?? {enabled:false,running:false,available:false,permission:false,motionAvailable:false,error:'Install the 4.1 APK to use always-on detection.'}; }
  catch { return {enabled:false,running:false,available:false,permission:false,motionAvailable:false,error:'Activity detection is unavailable.'}; }
}
export function setAlwaysOn(enabled:boolean):void {
  if (!Native?.setAlwaysOn) throw new Error('Install the 4.1 APK to use always-on detection.');
  Native.setAlwaysOn(enabled);
}
export function resumeAlwaysOn():void { try { Native?.resumeAlwaysOn?.(); } catch { /* show inactive status; never claim coverage */ } }
export function stopIdleMonitoring():void { try { Native?.stopIdleMonitoring?.(); } catch { /* optional module */ } }
export function nativeStepHistory():Array<{date:string;steps:number}> { try { return Native?.stepHistory?.() ?? []; } catch { return []; } }

export function startStepMonitoring(): boolean { try { return Native?.startMonitoring?.() ?? false; } catch { return false; } }
export function nativeDailySteps() { try { return Native?.dailySteps?.() ?? null; } catch { return null; } }
export function setGpsVehicleFilter(active: boolean) { try { Native?.setGpsVehicleFilter?.(active); } catch { /* optional module */ } }
export function startStepService(): boolean { try { return Native?.startStepService?.() ?? false; } catch { return false; } }
export function stopStepService(): void { try { Native?.stopStepService?.(); } catch { /* already stopped */ } }
export async function readMotion() { try { return Native?.readMotion?.() ?? null; } catch { return null; } }
export async function startMotionRecognition(): Promise<boolean> { try { return await Native?.startMotionRecognition?.() ?? false; } catch { return false; } }
export async function stopMotionRecognition(): Promise<void> { try { await Native?.stopMotionRecognition?.(); } catch { /* optional */ } }

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
