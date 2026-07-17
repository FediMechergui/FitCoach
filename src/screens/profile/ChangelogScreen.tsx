import React from 'react';
import { View } from 'react-native';
import * as Updates from 'expo-updates';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Row, Badge } from '@/components/ui/misc';
import { CHANGELOG } from '@/data/changelog';

export function ChangelogScreen() {
  const theme = useTheme();

  return (
    <Screen>
      <Row gap={12} style={{ alignItems: 'center' }}>
        <Icon icon="card.star" size={26} color={theme.colors.primary} />
        <Text variant="h1">What's new</Text>
      </Row>

      {CHANGELOG.map((entry, i) => (
        <Card key={entry.version} accent={i === 0 ? theme.colors.primary : theme.colors.border} style={{ gap: 8 }}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Row gap={8} style={{ alignItems: 'center' }}>
              <Text variant="h3">v{entry.version}</Text>
              {i === 0 && <Badge label="Current" color={theme.colors.success} />}
            </Row>
            <Text variant="caption" color="textFaint">{entry.date}</Text>
          </Row>
          <Text variant="bodyStrong" color="textMuted">{entry.title}</Text>
          {entry.highlights.map((h, j) => (
            <Row key={j} gap={8} style={{ alignItems: 'flex-start' }}>
              <Icon icon="core.check" size={14} color={i === 0 ? theme.colors.primary : theme.colors.textFaint} />
              <Text variant="caption" color="textMuted" style={{ flex: 1 }}>{h}</Text>
            </Row>
          ))}
        </Card>
      ))}

      <View style={{ alignItems: 'center', paddingVertical: 8 }}>
        <Text variant="caption" color="textFaint">
          Runtime {Updates.runtimeVersion ?? '—'}
          {Updates.updateId ? ` · update ${Updates.updateId.slice(0, 8)}` : ' · bundled build'}
        </Text>
      </View>
    </Screen>
  );
}
