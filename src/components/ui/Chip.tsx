import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';
import { Icon } from './Icon';

interface ChipProps {
  label: string;
  icon?: string;
  active?: boolean;
  color?: string;
  onPress?: () => void;
  small?: boolean;
}

export function Chip({ label, icon, active, color, onPress, small }: ChipProps) {
  const theme = useTheme();
  const brand = color ?? theme.colors.primary;
  const body = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingVertical: small ? 5 : 7,
        paddingHorizontal: small ? 10 : 12,
        borderRadius: theme.radius.pill,
        backgroundColor: active ? brand : theme.colors.surfaceAlt,
        borderWidth: 1,
        borderColor: active ? brand : theme.colors.border,
      }}
    >
      {icon ? <Icon icon={icon} size={small ? 12 : 14} color={active ? '#fff' : theme.colors.textMuted} /> : null}
      <Text variant="caption" color={active ? '#fff' : theme.colors.textMuted}>
        {label}
      </Text>
    </View>
  );
  return onPress ? <Pressable onPress={onPress}>{body}</Pressable> : body;
}
