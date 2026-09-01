import React, { useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

interface InputProps extends TextInputProps {
  label?: string;
  suffix?: string;
  multiline?: boolean;
  /** the three things v2 never had, one · a message that marks the field wrong */
  error?: string;
  /** two · quiet guidance under the field */
  helper?: string;
}

/**
 * 3.0 adds the third thing too: a 2px Lume focus ring, so the active field is
 * visible — to everyone, and especially under TalkBack and keyboards.
 */
export function Input({ label, suffix, multiline, error, helper, style, ...rest }: InputProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const borderColor = error
    ? theme.colors.danger
    : focused
      ? theme.colors.primary
      : theme.colors.border;

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
          borderRadius: theme.radius.sm,
          borderWidth: focused || error ? 2 : 1,
          borderColor,
          paddingHorizontal: theme.spacing.md,
          // Keep the text from shifting when the border thickens.
          margin: focused || error ? 0 : 1,
        }}
      >
        <TextInput
          placeholderTextColor={theme.colors.textFaint}
          multiline={multiline}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
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
      {error ? (
        <Text variant="caption" color="danger">
          {error}
        </Text>
      ) : helper ? (
        <Text variant="caption" color="textFaint">
          {helper}
        </Text>
      ) : null}
    </View>
  );
}
