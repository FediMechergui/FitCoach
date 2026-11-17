import React, { useState } from 'react';
import { Switch } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Row } from '@/components/ui/misc';
import { HOME_SECTIONS, homeLayout, saveHomeLayout, type HomeLayout } from '@/repositories/homeLayoutRepo';
export function HomeLayoutScreen() {
  const [layout,setLayout]=useState(homeLayout);
  const save=(next:HomeLayout)=>{saveHomeLayout(next);setLayout(next);};
  return <Screen><Text variant="h2">Make Home yours</Text><Text color="textMuted">Pin important sections to the top, change their order, or hide them. Hiding a section preserves its records. Optional trackers still need to be enabled in their own settings.</Text>
    {layout.order.map((id,index)=><Card key={id} style={{gap:8}}><Row style={{justifyContent:'space-between',alignItems:'center'}}><Text variant="bodyStrong">{HOME_SECTIONS.find(s=>s.id===id)?.label}</Text><Switch accessibilityLabel={`Show ${id}`} value={!layout.hidden.includes(id)} onValueChange={value=>save({...layout,hidden:value?layout.hidden.filter(x=>x!==id):[...layout.hidden,id]})}/></Row><Row><Button title={layout.pinned.includes(id)?'Unpin':'Pin'} size="sm" fullWidth={false} variant="secondary" onPress={()=>save({...layout,pinned:layout.pinned.includes(id)?layout.pinned.filter(x=>x!==id):[...layout.pinned,id]})}/><Button title="Up" size="sm" fullWidth={false} variant="ghost" disabled={index===0} onPress={()=>{const order=[...layout.order];[order[index-1],order[index]]=[order[index],order[index-1]];save({...layout,order});}}/><Button title="Down" size="sm" fullWidth={false} variant="ghost" disabled={index===layout.order.length-1} onPress={()=>{const order=[...layout.order];[order[index+1],order[index]]=[order[index],order[index+1]];save({...layout,order});}}/></Row></Card>)}
    <Button title="Restore default Home layout" variant="secondary" onPress={()=>save({order:HOME_SECTIONS.map(s=>s.id),hidden:[],pinned:[]})}/>
  </Screen>;
}
