import React from 'react';
import { Linking } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { EVIDENCE, EVIDENCE_REVIEWED } from '@/data/evidence';
export function EvidenceScreen() {
  return <Screen><Text variant="h2">How your numbers work</Text><Text color="textMuted">Recorded values, estimates and app scores have different meanings. Source review: {EVIDENCE_REVIEWED}.</Text>
    {EVIDENCE.map(item => <Card key={item.id} style={{gap:10}}><Text variant="h3">{item.title}</Text><Text color="primary">{item.kind}</Text><Text>{item.formula}</Text><Text variant="caption">Inputs: {item.inputs}</Text><Text variant="caption">Applies to: {item.population}</Text><Text color="textMuted">{item.limitations}</Text>{item.sources.map(source => <Button key={source.url} title={source.title} variant="secondary" size="sm" onPress={() => void Linking.openURL(source.url)} />)}</Card>)}
  </Screen>;
}
