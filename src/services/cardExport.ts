import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import type { RefObject } from 'react';
import type { View } from 'react-native';

/**
 * Capture a rendered view (the athlete card) to a PNG and let the user share or
 * save it. Requires an explicit user action; media-library save asks the OS
 * permission at call time.
 *
 * Returns what actually happened, so the screen can tell the user — a denied
 * permission is not an error, and "shared" vs "saved" is worth knowing.
 */
export type CardExportResult =
  | { ok: true; uri: string; saved: boolean; shared: boolean }
  | { ok: false; reason: 'no-view' | 'permission-denied' | 'error'; message?: string };

export async function exportCardPng(
  ref: RefObject<View>,
  opts: { save?: boolean } = {}
): Promise<CardExportResult> {
  if (!ref.current) return { ok: false, reason: 'no-view' };
  try {
    const uri = await captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile' });

    let saved = false;
    if (opts.save) {
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (!perm.granted) return { ok: false, reason: 'permission-denied' };
      await MediaLibrary.saveToLibraryAsync(uri);
      saved = true;
    }

    let shared = false;
    if (!opts.save && (await Sharing.isAvailableAsync())) {
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Share your athlete card',
        UTI: 'public.png',
      });
      shared = true;
    }
    return { ok: true, uri, saved, shared };
  } catch (e) {
    return { ok: false, reason: 'error', message: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * The image picker hands back a URI in the app's CACHE directory, which the OS
 * may clear at any time — after which the card would silently show a blank
 * square. Copy the picked photo into the app's own document directory, keyed
 * by month, and store THAT. Falls back to the original URI if the copy fails,
 * which is no worse than before.
 */
export async function persistProfilePhoto(sourceUri: string, month: string): Promise<string> {
  try {
    const dir = `${FileSystem.documentDirectory}profile-photos/`;
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    const dest = `${dir}${month}.jpg`;
    // copyAsync will not overwrite; remove any previous photo for the month first.
    const info = await FileSystem.getInfoAsync(dest);
    if (info.exists) await FileSystem.deleteAsync(dest, { idempotent: true });
    await FileSystem.copyAsync({ from: sourceUri, to: dest });
    return dest;
  } catch {
    return sourceUri;
  }
}

/** True when a stored photo URI still points at a file that exists. */
export async function photoStillExists(uri: string | null): Promise<boolean> {
  if (!uri) return false;
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return !!info.exists;
  } catch {
    return false;
  }
}
