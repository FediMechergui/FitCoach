import React from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

interface InputProps extends TextInputProps {
  label?: string;
  suffix?: string;
  multiline?: boolean;
}

export function Input({ label, suffix, multiline, style, ...rest }: InputProps) {
  const theme = useTheme();
  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <Text variant="label" color="textMuted">
          {label}
        </Text>
      ) : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: multiline ? 'flex-start' : 'center',
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
          paddingHorizontal: theme.spacing.md,
        }}
      >
        <TextInput
          placeholderTextColor={theme.colors.textFaint}
          multiline={multiline}
          style={[
            {
              flex: 1,
              color: theme.colors.text,
              fontSize: 15,
              fontWeight: '600',
              paddingVertical: multiline ? 12 : 14,
              minHeight: multiline ? 88 : undefined,
              textAlignVertical: multiline ? 'top' : 'center',
            },
            style,
          ]}
          {...rest}
        />
        {suffix ? (
          <Text variant="label" color="textMuted" style={{ marginLeft: 6 }}>
            {suffix}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
