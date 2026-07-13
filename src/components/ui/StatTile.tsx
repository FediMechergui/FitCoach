import React from 'react';
import { View } from 'react-native';
import { Card } from './Card';
import { Text } from './Text';
import { Icon } from './Icon';
import { useTheme } from '@/theme/ThemeProvider';

interface StatTileProps {
  icon?: string;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
  flex?: number;
}

export function StatTile({ icon, label, value, sub, accent, flex = 1 }: StatTileProps) {
  const theme = useTheme();
  return (
    <Card style={{ flex }} accent={accent}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        {icon ? <Icon icon={icon} size={16} color={accent ?? theme.colors.textMuted} /> : null}
        <Text variant="caption" color="textMuted">
          {label}
        </Text>
      </View>
      <Text variant="h2" style={{ fontVariant: ['tabular-nums'] }}>
        {value}
      </Text>
      {sub ? (
        <Text variant="caption" color="textFaint" style={{ marginTop: 2 }}>
          {sub}
        </Text>
      ) : null}
    </Card>
  );
}
