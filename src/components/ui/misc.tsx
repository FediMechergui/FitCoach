import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';
import { Icon } from './Icon';

export function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
      }}
    >
      <Text variant="h3">{title}</Text>
      {action ? (
        <Pressable onPress={onAction}>
          <Text variant="label" color="primary">
            {action}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function EmptyState({
  icon = 'core.info',
  title,
  message,
}: {
  icon?: string;
  title: string;
  message?: string;
}) {
  const theme = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: theme.spacing.xxl, gap: 8 }}>
      <Icon icon={icon} size={40} color={theme.colors.textFaint} />
      <Text variant="h3" color="textMuted" center>
        {title}
      </Text>
      {message ? (
        <Text variant="body" color="textFaint" center style={{ maxWidth: 260 }}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}

export function Divider() {
  const theme = useTheme();
  return <View style={{ height: 1, backgroundColor: theme.colors.border, marginVertical: 4 }} />;
}

export function Row({
  children,
  gap = 12,
  style,
}: {
  children: React.ReactNode;
  gap?: number;
  style?: object;
}) {
  return <View style={[{ flexDirection: 'row', gap }, style]}>{children}</View>;
}

export function Badge({ label, color }: { label: string; color?: string }) {
  const theme = useTheme();
  const c = color ?? theme.colors.accent;
  return (
    <View
      style={{
        backgroundColor: c + '22',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: theme.radius.sm,
      }}
    >
      <Text variant="caption" color={c}>
        {label}
      </Text>
    </View>
  );
}
