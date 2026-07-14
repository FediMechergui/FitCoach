import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import type { RefObject } from 'react';
import type { View } from 'react-native';

/**
 * Capture a rendered view (the athlete card) to a PNG and let the user share or
 * save it. Requires an explicit user action; media-library save asks the OS
 * permission at call time.
 */
export async function exportCardPng(
  ref: RefObject<View>,
  opts: { save?: boolean } = {}
): Promise<string | null> {
  if (!ref.current) return null;
  const uri = await captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile' });

  if (opts.save) {
    const perm = await MediaLibrary.requestPermissionsAsync();
    if (perm.granted) {
      await MediaLibrary.saveToLibraryAsync(uri);
    }
  }

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'image/png',
      dialogTitle: 'Share your athlete card',
      UTI: 'public.png',
    });
  }
  return uri;
}
