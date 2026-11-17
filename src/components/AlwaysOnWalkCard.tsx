import React, { useEffect, useState } from 'react';
import { Alert, Linking, Platform, Switch } from 'react-native';
import { Pedometer } from 'expo-sensors';
import { Card } from './ui/Card';
import { Text } from './ui/Text';
import { Button } from './ui/Button';
import { Row } from './ui/misc';
import { alwaysOnStatus, resumeAlwaysOn, setAlwaysOn } from '../../modules/step-counter';
import { requestNotificationPermission } from '@/services/sessionNotifications';
import { registerBackgroundSteps, syncTodaySteps } from '@/services/backgroundSteps';

export function AlwaysOnWalkCard() {
  const [status,setStatus]=useState(alwaysOnStatus);
  const [busy,setBusy]=useState(false);
  const [details,setDetails]=useState(false);
  useEffect(()=>{const timer=setInterval(()=>setStatus(alwaysOnStatus()),2000);return()=>clearInterval(timer);},[]);
  const toggle=async(enabled:boolean)=>{
    setBusy(true);
    try {
      if(enabled){
        const permission=await Pedometer.requestPermissionsAsync();
        if(!permission.granted)throw new Error('Allow Physical activity in Android settings to detect steps.');
        await requestNotificationPermission();
      }
      setAlwaysOn(enabled);
      await registerBackgroundSteps();
      await syncTodaySteps();
      setStatus(alwaysOnStatus());
    } catch(e){Alert.alert('Walk detection',(e as Error).message);}
    finally{setBusy(false);}
  };
  return <Card style={{gap:10}}>
    <Row style={{alignItems:'center',justifyContent:'space-between'}}>
      <Text variant="h3" style={{flex:1}}>Always-on walk detection</Text>
      <Switch accessibilityLabel="Always-on walk detection" value={status.enabled} disabled={busy||Platform.OS!=='android'||(!status.available&&!status.enabled)} onValueChange={value=>void toggle(value)}/>
    </Row>
    <Text color={status.enabled&&status.running?'primary':'textMuted'}>{status.enabled ? status.running ? 'On · counting observed steps' : 'Enabled · currently stopped' : 'Off · start a walk when you need tracking'}</Text>
    <Text variant="caption" color="textMuted">Counts daily steps in the background without GPS. Start a walk to record a timed session or route.</Text>
    {!status.available&&<Text color="warning">{Platform.OS==='android'?'This device does not have an available hardware step counter.': 'Always-on detection is available in the Android app.'}</Text>}
    {status.enabled&&!status.permission&&<Text color="warning">Physical activity permission is missing. Detection is stopped.</Text>}
    {status.enabled&&status.running&&!status.motionAvailable&&<Text variant="caption" color="warning">Motion classification is unavailable. Sensor steps can include false detections; vehicle filtering is limited.</Text>}
    {status.enabled&&status.error&&<Text variant="caption" color="warning">{status.error}</Text>}
    {status.enabled&&!status.running&&<Button title="Resume detection" size="sm" variant="secondary" onPress={()=>{resumeAlwaysOn();setStatus(alwaysOnStatus());}}/>}
    <Button title={details?'Hide detection details':'How background detection works'} size="sm" variant="ghost" onPress={()=>setDetails(value=>!value)}/>
    {details&&<Text variant="caption" color="textMuted">Uses the phone’s low-power step sensor and excludes recognized vehicle movement. Classification can be wrong. Android battery restrictions, force-stop or a restart can leave gaps. Detection resumes after reboot when Android allows it, or when you reopen FitCoach. Missing steps are never invented. Turning this off keeps completed records and an explicitly started walk.</Text>}
    {Platform.OS==='android'&&(details||(status.enabled&&!status.running))&&<Button title="Android permissions & battery settings" size="sm" variant="ghost" onPress={()=>void Linking.openSettings().catch(()=>Alert.alert('Settings','Open Android Settings → Apps → FitCoach.'))}/>}
  </Card>;
}
