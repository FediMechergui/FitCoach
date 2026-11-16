import { xchacha20poly1305 } from '@noble/ciphers/chacha';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import { gzipSync, gunzipSync, strToU8, strFromU8 } from 'fflate';
import { fromByteArray, toByteArray } from 'base64-js';

export const MAX_BACKUP_BYTES = 24 * 1024 * 1024;
export const MAX_CLEAR_BYTES = 64 * 1024 * 1024;
export const encode64 = fromByteArray;
export const decode64 = toByteArray;
export const digestBytes = (data: Uint8Array) => bytesToHex(sha256(data));
export const recoveryCode = (key: Uint8Array) => bytesToHex(key).match(/.{8}/g)!.join('-');
export function parseRecoveryCode(value: string): Uint8Array {
  const code = value.replace(/[\s-]/g, '').toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(code)) throw new Error('Enter the complete 64-character recovery key.');
  return hexToBytes(code);
}
/** Random nonce is supplied by expo-crypto's native async CSPRNG, never Math.random. */
export function encryptBackup(snapshot: unknown, key: Uint8Array, nonce: Uint8Array): Uint8Array {
  if (key.length !== 32 || nonce.length !== 24) throw new Error('Invalid encryption key or nonce');
  const clear = strToU8(JSON.stringify(snapshot));
  if (clear.length > MAX_CLEAR_BYTES) throw new Error('Backup is larger than the 64 MB uncompressed limit.');
  const compressed = gzipSync(clear, { level: 6 });
  const encrypted = xchacha20poly1305(key, nonce, strToU8('FitCoach backup v1')).encrypt(compressed);
  const output = new Uint8Array(4 + nonce.length + encrypted.length);
  output.set([70, 67, 66, 1]); output.set(nonce, 4); output.set(encrypted, 28);
  if (output.length > MAX_BACKUP_BYTES) throw new Error('Backup exceeds 24 MB. Export large photos separately before reducing photo storage.');
  return output;
}
export function decryptBackup(bytes: Uint8Array, key: Uint8Array): unknown {
  if (bytes.length < 44 || bytes.length > MAX_BACKUP_BYTES || bytes[0] !== 70 || bytes[1] !== 67 || bytes[2] !== 66 || bytes[3] !== 1)
    throw new Error('Unsupported or damaged backup.');
  let compressed: Uint8Array;
  try { compressed = xchacha20poly1305(key, bytes.slice(4, 28), strToU8('FitCoach backup v1')).decrypt(bytes.slice(28)); }
  catch { throw new Error('Recovery key does not match, or the backup is damaged. No data was restored.'); }
  // Gzip's stored size is authenticated as part of the ciphertext; cap allocation before inflation.
  if (compressed.length < 18) throw new Error('Damaged backup');
  const view = new DataView(compressed.buffer, compressed.byteOffset, compressed.byteLength);
  if (view.getUint32(compressed.length - 4, true) > MAX_CLEAR_BYTES) throw new Error('Backup expands beyond the supported limit.');
  const clear = gunzipSync(compressed);
  if (clear.length > MAX_CLEAR_BYTES) throw new Error('Backup expands beyond the supported limit.');
  return JSON.parse(strFromU8(clear));
}
