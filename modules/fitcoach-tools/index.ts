import { requireOptionalNativeModule } from 'expo-modules-core';
interface Tools {
  healthAvailable(): boolean;
  requestHealthPermissions(): Promise<boolean>;
  healthSummary(start:number,end:number): Promise<{steps:number|null;sleepMs:number|null;start:number;end:number}>;
  exportWorkout(id:string,start:number,end:number,title:string): Promise<boolean>;
  updateWidget(summary:string,updated:string): void;
  pinWidget(): boolean;
  isWifi(): boolean;
  prepareOcr(): Promise<boolean>;
  readText(uri: string): Promise<{ text: string; blocks: Array<{ text: string; lines: string[] }> }>;
  speech(): Promise<string | null>;
  pickPdf(): Promise<string[] | null>;
}
const native = requireOptionalNativeModule<Tools>('FitCoachTools');
export function nativeTools(): Tools {
  if (!native) throw new Error('Install the FitCoach 4.1 APK to use this device feature.');
  return native;
}
