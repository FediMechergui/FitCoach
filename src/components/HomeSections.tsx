import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { homeLayout, type HomeSectionId } from '@/repositories/homeLayoutRepo';
import { useTheme } from '@/theme/ThemeProvider';
export function HomeSection({children}: {id:HomeSectionId;children:React.ReactNode}) {
  const theme=useTheme();return React.Children.toArray(children).length ? <View style={{gap:theme.spacing.lg}}>{children}</View> : null;
}
export function HomeSections({children}: {children:React.ReactNode}) {
  const [layout,setLayout]=useState(homeLayout);const theme=useTheme();
  useFocusEffect(useCallback(()=>{setLayout(homeLayout());},[]));
  const elements=React.Children.toArray(children).filter(React.isValidElement) as React.ReactElement<{id:HomeSectionId}>[];
  const ids=[...layout.order.filter(id=>layout.pinned.includes(id)),...layout.order.filter(id=>!layout.pinned.includes(id))];
  return <View style={{gap:theme.spacing.lg}}>{ids.filter(id=>!layout.hidden.includes(id)).map(id=>elements.find(element=>element.props.id===id))}</View>;
}
