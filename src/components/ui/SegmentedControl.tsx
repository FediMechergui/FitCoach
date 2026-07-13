import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';
import { Icon } from './Icon';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  scrollable?: boolean;
  accent?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  scrollable,
  accent,
}: SegmentedControlProps<T>) {
  const theme = useTheme();
  const brand = accent ?? theme.colors.primary;

  const pills = options.map((opt) => {
    const active = opt.value === value;
    return (
      <Pressable
        key={opt.value}
        onPress={() => onChange(opt.value)}
        style={{
          flex: scrollable ? undefined : 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          paddingVertical: 10,
          paddingHorizontal: 14,
          borderRadius: theme.radius.md,
          backgroundColor: active ? brand : 'transparent',
        }}
      >
        {opt.icon ? (
          <Icon icon={opt.icon} size={16} color={active ? '#fff' : theme.colors.textMuted} />
        ) : null}
        <Text variant="label" color={active ? '#fff' : theme.colors.textMuted}>
          {opt.label}
        </Text>
      </Pressable>
    );
  });

  const container = {
    flexDirection: 'row' as const,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 4,
    gap: 4,
  };

  if (scrollable) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={container}>{pills}</View>
      </ScrollView>
    );
  }
  return <View style={container}>{pills}</View>;
}
