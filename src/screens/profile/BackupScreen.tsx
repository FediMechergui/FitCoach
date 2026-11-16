import React, { useEffect, useState } from 'react';
import { Alert, DevSettings, Share, Switch, View } from 'react-native';
import * as Updates from 'expo-updates';
import { Screen } from '@/components/ui/Screen';
import { PageHero } from '@/components/ui/PageHero';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Row } from '@/components/ui/misc';
import { backupAccount, backupStatus, createBackupAccount, signInBackup, signOutBackup, resetBackupPassword,
  prepareRecoveryKey, savedRecoveryCode, setAutomaticBackup, runBackup, listBackups, downloadBackup,
  applyBackup, deleteCloudBackup, type BackupManifest } from '@/services/backup';
import type { BackupSnapshot } from '@/repositories/backupRepo';

export function BackupScreen() {
  const [account,setAccount]=useState(backupAccount);
  const [status,setStatus]=useState(backupStatus);
  const [email,setEmail]=useState(''); const [password,setPassword]=useState('');
  const [busy,setBusy]=useState(false); const [message,setMessage]=useState('');
  const [code,setCode]=useState(''); const [revealed,setRevealed]=useState<string|null>(null);
  const [versions,setVersions]=useState<BackupManifest[]>([]);
  const [preview,setPreview]=useState<BackupSnapshot|null>(null);
  useEffect(()=>{ const timer=setInterval(()=>setStatus(backupStatus()),2000); return ()=>clearInterval(timer); },[]);
  const action=async(work:()=>Promise<void>)=>{
    setBusy(true);setMessage('');
    try { await work(); setAccount(backupAccount());setStatus(backupStatus()); }
    catch(e) {setMessage(e instanceof Error?e.message:'The operation failed. Please retry.');}
    finally {setBusy(false);}
  };
  const signedIn=async()=>{await signInBackup(email,password);setPassword('');setVersions(await listBackups());setMessage('Signed in. Set up or unlock your recovery key to enable automatic backups.');};
  const restore=()=>{
    if(!preview)return;
    Alert.alert('Replace local data?', 'This replaces your local profile, logs and photos with the previewed backup. Finish any active workout first. An encrypted local safety copy will be saved.',[
      {text:'Cancel',style:'cancel'},
      {text:'Restore backup',style:'destructive',onPress:()=>void action(async()=>{
        await applyBackup(preview);setPreview(null);
        if(__DEV__) DevSettings.reload(); else await Updates.reloadAsync();
      })},
    ]);
  };
  return <Screen>
    <PageHero icon="card.download" title="Backup & account" />
    <Card style={{gap:8}}>
      <Text variant="bodyStrong">Your data, with a recovery copy</Text>
      <Text variant="caption" color="textMuted">FitCoach works without an account. Enable backups to upload an encrypted copy of your profile, health logs, routes and saved photos to Netlify. API keys and account tokens are excluded. Your recovery key is needed on a new phone.</Text>
      <Text variant="caption" color="textMuted">Automatic backup is due every 24 hours. Android chooses when background jobs run; opening FitCoach catches up a missed backup. Uploads use available internet, including mobile data. Three completed backups are kept.</Text>
    </Card>
    {!account ? <Card style={{gap:12}}>
      <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
      <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoComplete="password" />
      <Button title="Sign in" disabled={busy} onPress={()=>void action(signedIn)} />
      <Button title="Create backup account" variant="secondary" disabled={busy} onPress={()=>void action(async()=>{await createBackupAccount(email,password);setPassword('');setMessage('Check your email to verify your account, then sign in here.');})} />
      <Button title="Reset password" variant="ghost" disabled={busy || !email} onPress={()=>void action(async()=>{await resetBackupPassword(email);setMessage('If an account exists, a password-reset link will arrive by email. Your recovery key is still needed to decrypt backups.');})} />
    </Card> : <>
      <Card style={{gap:10}}>
        <Text variant="bodyStrong">{account.email}</Text>
        <Row style={{justifyContent:'space-between',alignItems:'center'}}>
          <Text variant="bodyStrong">Automatic daily backup</Text>
          <Switch accessibilityLabel="Automatic daily backup" value={status.enabled} disabled={busy || status.busy}
            onValueChange={enabled=>void action(async()=>{if(enabled&&!savedRecoveryCode()){setMessage('Set up a recovery key below first.');return;}await setAutomaticBackup(enabled);})} />
        </Row>
        <Text variant="caption" color="textMuted">Last successful backup: {status.lastSuccess?new Date(status.lastSuccess).toLocaleString():'None yet'}</Text>
        {status.busy && <Text variant="caption">Encrypting and uploading…</Text>}
        {status.error && <Text variant="caption" color="warning">{status.error}</Text>}
        <Button title="Back up now" disabled={busy || status.busy || !status.enabled} onPress={()=>void action(async()=>{await runBackup(true);setVersions(await listBackups());setMessage('Backup completed.');})} />
      </Card>
      <Card style={{gap:10}}>
        <Text variant="bodyStrong">Recovery key</Text>
        <Text variant="caption" color="textMuted">Save this key somewhere private, such as your password manager. Resetting your account password cannot replace a lost recovery key.</Text>
        <Input label="Existing recovery key (new phone)" value={code} onChangeText={setCode} autoCapitalize="none" secureTextEntry />
        <Button title={code?'Unlock with recovery key':'Set up / show recovery key'} variant="secondary" disabled={busy} onPress={()=>void action(async()=>{setRevealed(await prepareRecoveryKey(code||undefined));setCode('');})} />
        {revealed && <>
          <Text variant="body" selectable>{revealed}</Text>
          <Button title="Save recovery key…" variant="secondary" onPress={()=>void Share.share({title:'FitCoach recovery key',message:`FitCoach encrypted backup recovery key\n${revealed}\nKeep this private. It is required to restore your backups.`})} />
          <Button title="I saved my key — enable daily backup" disabled={busy} onPress={()=>void action(async()=>{await setAutomaticBackup(true);setRevealed(null);setVersions(await listBackups());setMessage('Daily backups enabled. First backup completed.');})} />
          <Button title="Hide key" variant="ghost" onPress={()=>setRevealed(null)} />
        </>}
      </Card>
      <Card style={{gap:10}}>
        <Text variant="bodyStrong">Restore a backup</Text>
        <Button title="Refresh available backups" variant="secondary" disabled={busy} onPress={()=>void action(async()=>{setVersions(await listBackups());})} />
        {versions.map(version=><View key={version.id} style={{gap:8}}>
          <Text variant="body">{new Date(version.createdAt).toLocaleString()} · {(version.bytes/1024/1024).toFixed(1)} MB</Text>
          <Button title="Download & preview" variant="secondary" disabled={busy} onPress={()=>void action(async()=>{setPreview(await downloadBackup(version));})} />
          <Button title="Delete this cloud backup" variant="ghost" disabled={busy} onPress={()=>Alert.alert('Delete this backup?','Other backups and local data will remain.',[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:()=>void action(async()=>{await deleteCloudBackup(version.id);setVersions(await listBackups());})}])} />
        </View>)}
        {preview && <View style={{gap:10}}>
          <Text variant="bodyStrong">Restore preview</Text>
          <Text variant="body">{String(preview.tables.users[0].name)} · {new Date(preview.createdAt).toLocaleString()}</Text>
          <Text variant="caption">{preview.tables.sessions.length} workouts · {preview.tables.food_entries.length} food records · {preview.tables.walk_sessions.length} outdoor sessions · {Object.keys(preview.media).length} photos</Text>
          <Button title="Replace local data with this backup" disabled={busy} onPress={restore} />
          <Button title="Cancel preview" variant="ghost" onPress={()=>setPreview(null)} />
        </View>}
      </Card>
      <Button title="Sign out & pause backups" variant="ghost" disabled={busy || status.busy} onPress={()=>void action(async()=>{await signOutBackup();setRevealed(null);setPreview(null);setVersions([]);})} />
    </>}
    {!!message && <Text variant="body" accessibilityLiveRegion="polite">{message}</Text>}
    {busy && <Text variant="caption" accessibilityLiveRegion="polite">Working…</Text>}
  </Screen>;
}
