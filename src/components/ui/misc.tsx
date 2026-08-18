import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';
import { Icon } from './Icon';

/**
 * A section title with an optional action at the right edge.
 *
 * Rhythm: the screen lays children out with a uniform 16 gap, which would put
 * a header exactly as far from the section above as from its own content — so
 * nothing reads as a group. The header therefore takes extra room above and
 * pulls its content closer beneath (a negative bottom margin subtracts from
 * the parent's gap), giving roughly 24 above / 12 below everywhere at once.
 */
export function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: theme.spacing.sm,
        marginBottom: -theme.spacing.xs,
      }}
    >
      <Text variant="h3">{title}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <Text variant="label" color="primary">
            {action}
          </Text>
          <Icon icon="core.forward" size={14} color={theme.colors.primary} />
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
