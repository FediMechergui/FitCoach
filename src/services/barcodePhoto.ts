import { bytesFromBase64, decodeBarcode, type DecodeResult } from '@/lib/barcodeDecode';

/**
 * A photograph of a barcode, read on the phone.
 *
 * The JPEG is unpacked by a decoder written in plain JavaScript (jpeg-js), so
 * nothing was added to the build and nothing leaves the device: no model, no
 * request. It never throws — a picture that cannot be unpacked, or is too
 * large to unpack safely, is simply "not read", and the screen falls back to
 * the model or to typing.
 */

export type PhotoReading =
  | { ok: true; result: DecodeResult; width: number; height: number; ms: number }
  | { ok: false; reason: 'unreadable' | 'too-large' | 'no-barcode'; ms: number };

/** Past this the unpacked picture would not fit comfortably in memory on a modest phone. */
const MAX_MEGAPIXELS = 26;

interface Decoded {
  width: number;
  height: number;
  data: Uint8Array;
}

export async function readBarcodeOnDevice(base64Jpeg: string): Promise<PhotoReading> {
  const started = Date.now();
  // Let the screen draw "Reading…" before the work begins: unpacking a
  // photograph holds the thread for a moment.
  await new Promise<void>((resolve) => setTimeout(resolve, 40));
  try {
    // Loaded here, not at the top of the file: if the decoder could not load
    // on some device, that is one feature lost, not a screen that fails to open.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const decode = require('jpeg-js/lib/decoder') as (
      bytes: Uint8Array,
      opts: { useTArray: boolean; formatAsRGBA: boolean; maxResolutionInMP: number; maxMemoryUsageInMB: number; tolerantDecoding: boolean }
    ) => Decoded;
    let image: Decoded;
    try {
      image = decode(bytesFromBase64(base64Jpeg), {
        useTArray: true,
        formatAsRGBA: true,
        maxResolutionInMP: MAX_MEGAPIXELS,
        maxMemoryUsageInMB: 400,
        tolerantDecoding: true,
      });
    } catch (e) {
      const big = e instanceof Error && /maxResolutionInMP|maxMemoryUsageInMB/i.test(e.message);
      return { ok: false, reason: big ? 'too-large' : 'unreadable', ms: Date.now() - started };
    }
    const result = decodeBarcode(image.data, image.width, image.height);
    const ms = Date.now() - started;
    return result ? { ok: true, result, width: image.width, height: image.height, ms } : { ok: false, reason: 'no-barcode', ms };
  } catch {
    return { ok: false, reason: 'unreadable', ms: Date.now() - started };
  }
}
