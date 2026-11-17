import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { Button } from './ui/Button';
export function EvidenceLink() {
  const navigation = useNavigation();
  return <Button title="How calculated · sources and limits" variant="ghost" size="sm" onPress={() => navigation.navigate('Evidence')} />;
}
