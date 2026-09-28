import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { offImageAllowed } from '@/lib/foodTile';

/**
 * Photographs of foods, kept in the app's own storage.
 *
 * The picker hands back a file in the cache, which the system may clear at any
 * time; a picture is therefore copied into the document directory and THAT
 * address is kept. A picture from Open Food Facts is downloaded once, here,
 * and shown from the phone from then on. Nothing in this file ever throws:
 * a picture that cannot be kept is simply not kept.
 */

const DIR = `${FileSystem.documentDirectory ?? ''}food-photos/`;

async function ensureDir(): Promise<void> {
  await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
}

const stamp = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;

export type PickResult = { ok: true; uri: string } | { ok: false; reason: 'cancelled' | 'denied' | 'blocked' | 'failed' };

/** Take or choose a picture, cropped square and kept in the app's storage. */
export async function pickFoodPhoto(fromCamera: boolean): Promise<PickResult> {
  try {
    const perm = fromCamera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return { ok: false, reason: perm.canAskAgain ? 'denied' : 'blocked' };
    const opts: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      // A thumbnail is all this is ever shown as.
      quality: 0.35,
    };
    const picked = fromCamera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (picked.canceled || !picked.assets[0]?.uri) return { ok: false, reason: 'cancelled' };
    await ensureDir();
    const dest = `${DIR}${stamp()}.jpg`;
    await FileSystem.copyAsync({ from: picked.assets[0].uri, to: dest });
    return { ok: true, uri: dest };
  } catch {
    return { ok: false, reason: 'failed' };
  }
}

/**
 * Download a product picture from Open Food Facts and keep it. Refuses any
 * address that is not one of Open Food Facts' own image servers over https.
 * Returns null when there is no picture to keep.
 */
export async function keepOffImage(url: string | null | undefined): Promise<string | null> {
  if (!offImageAllowed(url)) return null;
  try {
    await ensureDir();
    const dest = `${DIR}off-${stamp()}.jpg`;
    const res = await FileSystem.downloadAsync(url, dest);
    if (res.status !== 200) {
      await FileSystem.deleteAsync(dest, { idempotent: true });
      return null;
    }
    const info = await FileSystem.getInfoAsync(dest);
    // An empty file, or something far too large to be a thumbnail, is not kept.
    if (!info.exists || !('size' in info) || info.size < 200 || info.size > 3_000_000) {
      await FileSystem.deleteAsync(dest, { idempotent: true });
      return null;
    }
    return dest;
  } catch {
    return null;
  }
}

/** Delete a picture this app stored. Anything outside its own folder is left alone. */
export async function removeFoodPhoto(uri: string | null | undefined): Promise<void> {
  if (!uri || !uri.startsWith(DIR)) return;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // a picture that would not delete is a few kilobytes, not a problem
  }
}

export const PICK_REASON: Record<Exclude<PickResult, { ok: true }>['reason'], string | null> = {
  cancelled: null,
  denied: 'That was not allowed, so no picture was added. The food is saved without one.',
  blocked: 'Pictures are switched off for FitCoach. Turn the permission on in settings to add one.',
  failed: 'The picture could not be kept. Try again, or save the food without one.',
};
