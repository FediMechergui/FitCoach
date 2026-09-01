import * as Font from 'expo-font';

/**
 * The brand faces, loaded at boot from bundled assets (they ship OTA like any
 * other asset — expo-font's native side has been in the APK since v1, unused
 * until now).
 *
 * Loading is best-effort by design: if anything goes wrong the flag stays
 * false, Text applies no fontFamily, and the whole app renders in the system
 * face with the same sizes and weights — degraded, never broken. That is also
 * why variants keep their fontWeight even though each family file is a single
 * weight: the weight is the fallback's hierarchy.
 */

let loaded = false;

export function fontsLoaded(): boolean {
  return loaded;
}

export async function loadBrandFonts(): Promise<void> {
  try {
    await Font.loadAsync({
      'SpaceGrotesk-Medium': require('../../assets/fonts/SpaceGrotesk-Medium.ttf'),
      'SpaceGrotesk-SemiBold': require('../../assets/fonts/SpaceGrotesk-SemiBold.ttf'),
      'SpaceGrotesk-Bold': require('../../assets/fonts/SpaceGrotesk-Bold.ttf'),
      'Inter-Regular': require('../../assets/fonts/Inter-Regular.ttf'),
      'Inter-Medium': require('../../assets/fonts/Inter-Medium.ttf'),
      'Inter-SemiBold': require('../../assets/fonts/Inter-SemiBold.ttf'),
    });
    loaded = true;
  } catch {
    // System face it is. Nothing else changes.
    loaded = false;
  }
}
