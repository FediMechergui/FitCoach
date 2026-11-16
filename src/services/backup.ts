import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { captureSnapshot, validateSnapshot, restoreSnapshot, type BackupSnapshot } from '@/repositories/backupRepo';
import { kvGet, kvSetStrict } from '@/repositories/kvRepo';
import { initDatabase } from '@/db/bootstrap';
import { encryptBackup, decryptBackup, encode64, decode64, digestBytes, recoveryCode, parseRecoveryCode } from '@/lib/backupCrypto';

export const BACKUP_ORIGIN = 'https://fitcoach-private-backups.netlify.app';
export const BACKUP_TASK = 'fitcoach-daily-backup';
const SESSION_KEY = 'fitcoach.backup.session';
const DAY = 24 * 60 * 60 * 1000;
const CHUNK = 512 * 1024;
interface AccountSession { id: string; email: string; accessToken: string; refreshToken: string; expiresAt: number }
export interface BackupManifest { id: string; createdAt: number; schema: number; keyId: string; bytes: number;
  sha256: string; chunks: Array<{size: number; sha256: string}> }
export interface BackupStatus { enabled: boolean; lastSuccess?: number; lastAttempt?: number; error?: string; busy?: boolean }
export function backupAccount(): AccountSession | null {
  try { const raw = SecureStore.getItem(SESSION_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
const statusKey = (id: string) => `backup.status.${id}`;
const keyName = (id: string) => `fitcoach.backup.key.${id}`;
export function backupStatus(): BackupStatus {
  const account = backupAccount();
  const saved = account ? kvGet<BackupStatus>(statusKey(account.id)) ?? { enabled: false } : { enabled: false };
  // A persisted busy flag can survive a killed process. Only this runtime's
  // actual upload may disable retry; the previous attempt/error remains visible.
  return { ...saved, busy: running !== null };
}
function saveStatus(id: string, patch: Partial<BackupStatus>) {
  kvSetStrict(statusKey(id), { ...(kvGet<BackupStatus>(statusKey(id)) ?? {enabled: false}), ...patch });
}
async function request(path: string, init: RequestInit = {}): Promise<any> {
  const abort = new AbortController(); const timeout = setTimeout(() => abort.abort(), 30_000);
  try {
    const result = await fetch(`${BACKUP_ORIGIN}${path}`, { ...init, signal: abort.signal });
    const text = await result.text();
    let data: any; try { data = text ? JSON.parse(text) : {}; } catch { throw new Error('Backup service is unavailable. Try again later.'); }
    if (!result.ok) throw new Error(data.error_description || data.msg || data.error?.message || data.error || `Backup service returned ${result.status}`);
    return data;
  } finally { clearTimeout(timeout); }
}
const jsonPost = (body: unknown): RequestInit => ({method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
export async function createBackupAccount(email: string, password: string): Promise<void> {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) throw new Error('Enter a valid email address.');
  if (password.length < 12) throw new Error('Use a password with at least 12 characters.');
  await request('/.netlify/identity/signup', jsonPost({email:email.trim(),password}));
}
export async function signInBackup(email: string, password: string): Promise<void> {
  const token = await request('/.netlify/identity/token', { method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body: new URLSearchParams({grant_type:'password',username:email.trim(),password}).toString() });
  const user = await request('/.netlify/identity/user', {headers:{Authorization:`Bearer ${token.access_token}`}});
  if (!user.id || !token.refresh_token) throw new Error('Could not verify this account.');
  const session: AccountSession = {id:user.id,email:user.email,accessToken:token.access_token,refreshToken:token.refresh_token,expiresAt:Date.now()+Number(token.expires_in)*1000};
  await SecureStore.setItemAsync(SESSION_KEY,JSON.stringify(session));
  // Existing key + explicit enable preference are preserved on this device.
  await registerDailyBackup();
}
export async function resetBackupPassword(email: string): Promise<void> {
  await request('/.netlify/identity/recover', jsonPost({email:email.trim()}));
}
let refreshing: Promise<AccountSession> | null = null;
async function authenticated(): Promise<AccountSession> {
  const current = backupAccount();
  if (!current) throw new Error('Sign in to your backup account.');
  if (current.expiresAt > Date.now()+60_000) return current;
  refreshing ??= (async () => {
    const token = await request('/.netlify/identity/token', {method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body:new URLSearchParams({grant_type:'refresh_token',refresh_token:current.refreshToken}).toString()});
    const next = {...current,accessToken:token.access_token,refreshToken:token.refresh_token ?? current.refreshToken,expiresAt:Date.now()+Number(token.expires_in)*1000};
    if (backupAccount()?.id !== current.id) throw new Error('Backup account changed.');
    await SecureStore.setItemAsync(SESSION_KEY,JSON.stringify(next));
    return next;
  })().finally(() => {refreshing=null;});
  return refreshing;
}
async function api(path: string, init: RequestInit = {}): Promise<any> {
  const account = await authenticated();
  return request(`/api/backups${path}`, {...init,headers:{...init.headers,Authorization:`Bearer ${account.accessToken}`}});
}
export async function listBackups(): Promise<BackupManifest[]> { return api(''); }
export function savedRecoveryCode(): string | null {
  const account = backupAccount(); if (!account) return null;
  const encoded = SecureStore.getItem(keyName(account.id)); return encoded ? recoveryCode(decode64(encoded)) : null;
}
export async function prepareRecoveryKey(code?: string): Promise<string> {
  const account = await authenticated();
  const existing = await listBackups();
  const stored = savedRecoveryCode();
  const key = code ? parseRecoveryCode(code) : stored ? parseRecoveryCode(stored) : await Crypto.getRandomBytesAsync(32);
  if (existing.length && !existing.some(b => b.keyId === digestBytes(key))) throw new Error('Enter the recovery key for your existing backups before enabling this phone.');
  await SecureStore.setItemAsync(keyName(account.id),encode64(key));
  return recoveryCode(key);
}
export async function setAutomaticBackup(enabled: boolean): Promise<void> {
  const account = backupAccount(); if (!account) throw new Error('Sign in first.');
  if (enabled && !savedRecoveryCode()) throw new Error('Save your recovery key first.');
  saveStatus(account.id,{enabled});
  if (enabled) { await registerDailyBackup(); await runBackup(true); }
  else await BackgroundFetch.unregisterTaskAsync(BACKUP_TASK).catch(() => {});
}
export async function signOutBackup(): Promise<void> {
  const session = backupAccount();
  if (session) saveStatus(session.id,{enabled:false,busy:false});
  await SecureStore.deleteItemAsync(SESSION_KEY);
  await BackgroundFetch.unregisterTaskAsync(BACKUP_TASK).catch(() => {});
}

async function withMedia(snapshot: BackupSnapshot): Promise<BackupSnapshot> {
  let bytes = 0;
  for (const [table,column] of [['profile_photos','uri'],['custom_foods','image_uri']]) {
    for (const row of snapshot.tables[table]) {
      const uri = row[column]; if (typeof uri !== 'string' || !uri.startsWith('file://')) continue;
      if (!(uri.startsWith(FileSystem.documentDirectory ?? '\u0000') || uri.startsWith(FileSystem.cacheDirectory ?? '\u0000'))) throw new Error('A photo is outside FitCoach storage. Re-select it before backing up.');
      const info = await FileSystem.getInfoAsync(uri);
      if (!info.exists) throw new Error('A saved photo is missing. Remove or replace it before backing up.');
      bytes += info.size ?? 0;
      if (bytes > 20 * 1024 * 1024) throw new Error('Photos exceed the 20 MB backup media limit. Your existing cloud backups are unchanged.');
      const id = `media${Object.keys(snapshot.media).length}`;
      snapshot.media[id] = await FileSystem.readAsStringAsync(uri,{encoding:FileSystem.EncodingType.Base64});
      row[column] = `backup-media:${id}`;
    }
  }
  return snapshot;
}
let running: Promise<void> | null = null;
export async function runBackup(force = false): Promise<void> {
  if (running) return running;
  const account = backupAccount(); if (!account) return;
  const state = backupStatus();
  if (!state.enabled || (!force && ((state.lastSuccess ?? 0) > Date.now()-DAY || (state.lastAttempt ?? 0) > Date.now()-5*60_000))) return;
  running = (async () => {
    saveStatus(account.id,{busy:true,lastAttempt:Date.now(),error:undefined});
    try {
      const encoded = SecureStore.getItem(keyName(account.id));
      if (!encoded) throw new Error('Recovery key is missing. Unlock backups with your saved key.');
      const key=decode64(encoded);
      const snapshot=await withMedia(captureSnapshot());
      const bytes=encryptBackup(snapshot,key,await Crypto.getRandomBytesAsync(24));
      const parts: Uint8Array[]=[];
      for(let offset=0;offset<bytes.length;offset+=CHUNK) parts.push(bytes.slice(offset,offset+CHUNK));
      const manifest: BackupManifest=await api('',jsonPost({schema:snapshot.schema,keyId:digestBytes(key),sha256:digestBytes(bytes),chunks:parts.map(p=>({size:p.length,sha256:digestBytes(p)}))}));
      for(let i=0;i<parts.length;i++) {
        if(backupAccount()?.id!==account.id) throw new Error('Backup stopped because the account changed.');
        await api(`/${manifest.id}/${i}`,{...jsonPost({data:encode64(parts[i])}),method:'PUT'});
      }
      await api(`/${manifest.id}`,{method:'POST'});
      saveStatus(account.id,{busy:false,lastSuccess:Date.now(),error:undefined});
    } catch(error) {
      saveStatus(account.id,{busy:false,error:error instanceof Error ? error.message : 'Backup failed. Retry when connected.'});
      throw error;
    }
  })().finally(()=>{running=null;});
  return running;
}
export async function downloadBackup(manifest: BackupManifest): Promise<BackupSnapshot> {
  const code=savedRecoveryCode(); if(!code) throw new Error('Enter your recovery key first.');
  const key=parseRecoveryCode(code);
  if(digestBytes(key)!==manifest.keyId) throw new Error('This backup needs a different recovery key.');
  if(!Number.isInteger(manifest.bytes) || manifest.bytes>24*1024*1024 || manifest.bytes<44 || manifest.chunks.length>48) throw new Error('Invalid backup size.');
  const bytes=new Uint8Array(manifest.bytes); let offset=0;
  for(let i=0;i<manifest.chunks.length;i++) {
    const part=decode64((await api(`/${manifest.id}/${i}`)).data);
    if(part.length!==manifest.chunks[i].size || digestBytes(part)!==manifest.chunks[i].sha256) throw new Error('Download failed its integrity check.');
    bytes.set(part,offset); offset+=part.length;
  }
  if(offset!==bytes.length || digestBytes(bytes)!==manifest.sha256) throw new Error('Backup is incomplete or damaged.');
  return validateSnapshot(decryptBackup(bytes,key));
}
export async function applyBackup(snapshot: BackupSnapshot): Promise<void> {
  validateSnapshot(snapshot);
  const account=backupAccount(); const code=savedRecoveryCode();
  if(!account || !code) throw new Error('Sign in and unlock backups first.');
  const directory=`${FileSystem.documentDirectory}backup-restore/`;
  await FileSystem.makeDirectoryAsync(directory,{intermediates:true});
  // A local encrypted safety copy is made before touching any record.
  const safety=encryptBackup(await withMedia(captureSnapshot()),parseRecoveryCode(code),await Crypto.getRandomBytesAsync(24));
  await FileSystem.writeAsStringAsync(`${directory}safety.fcb`,encode64(safety),{encoding:FileSystem.EncodingType.Base64});
  const staged=JSON.parse(JSON.stringify(snapshot)) as BackupSnapshot;
  const run=Crypto.randomUUID(); let total=0;
  for(const [table,column] of [['profile_photos','uri'],['custom_foods','image_uri']]) for(const row of staged.tables[table]) {
    const value=row[column]; if(typeof value!=='string' || !value.startsWith('backup-media:')) continue;
    const id=value.slice(13); const data=staged.media[id];
    if(!/^media\d+$/.test(id) || typeof data!=='string') throw new Error('Backup photo is missing.');
    total+=data.length; if(total>30*1024*1024) throw new Error('Backup photos exceed the supported limit.');
    const uri=`${directory}${run}-${id}.jpg`;
    await FileSystem.writeAsStringAsync(uri,data,{encoding:FileSystem.EncodingType.Base64}); row[column]=uri;
  }
  restoreSnapshot(staged);
  saveStatus(account.id,{lastSuccess:Date.now(),error:undefined,busy:false});
}
export async function deleteCloudBackup(id: string): Promise<void> { await api(`/${id}`,{method:'DELETE'}); }
export async function registerDailyBackup(): Promise<void> {
  if(!backupAccount() || !backupStatus().enabled) return;
  try { if(!await TaskManager.isTaskRegisteredAsync(BACKUP_TASK)) await BackgroundFetch.registerTaskAsync(BACKUP_TASK,{minimumInterval:DAY/1000,stopOnTerminate:false,startOnBoot:true}); }
  catch { /* App-open catch-up remains available; status UI explains OS scheduling. */ }
}
TaskManager.defineTask(BACKUP_TASK,async()=>{
  try { initDatabase(); await runBackup(); return BackgroundFetch.BackgroundFetchResult.NewData; }
  catch { return BackgroundFetch.BackgroundFetchResult.Failed; }
});
