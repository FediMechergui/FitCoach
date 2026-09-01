import React, { useEffect, useRef } from 'react';
import { Animated, View, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';
import { Icon } from './Icon';
import { Rail } from './Meter';

/**
 * The small new 3.0 primitives that don't earn a file each:
 *
 *   Skeleton — shimmer block for first paint, replacing the one-frame pop-in.
 *   EmptyState — one component, three intents; cards stop vanishing silently.
 *   ProvenanceChip — Measured · Derived · Estimated · Your entry, surfacing
 *     the honesty flags the data model already tracks.
 *   Metric — the numeral-first stat tile (v3's StatTile successor).
 */

// ── Skeleton ─────────────────────────────────────────────────────────────────

export function Skeleton({ height = 72, style }: { height?: number; style?: ViewStyle }) {
  const theme = useTheme();
  const pulse = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <Animated.View
      style={[
        {
          height,
          borderRadius: theme.radius.lg,
          backgroundColor: theme.colors.surfaceAlt,
          opacity: pulse,
        },
        style,
      ]}
    />
  );
}

// ── EmptyState ───────────────────────────────────────────────────────────────

export type EmptyIntent = 'invite' | 'quiet' | 'locked';

interface EmptyStateProps {
  intent?: EmptyIntent;
  icon?: string;
  title?: string;
  message: string;
  /** the primary action, for invite/locked intents */
  action?: React.ReactNode;
}

export function EmptyState({ intent = 'invite', icon, title, message, action }: EmptyStateProps) {
  const theme = useTheme();
  if (intent === 'quiet') {
    return (
      <Text variant="caption" color="textFaint" center style={{ paddingVertical: theme.spacing.md }}>
        {message}
      </Text>
    );
  }
  return (
    <View style={{ alignItems: 'center', gap: theme.spacing.md, paddingVertical: theme.spacing.xl }}>
      {icon ? (
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: theme.radius.md,
            backgroundColor: theme.alpha.tint08(theme.colors.primary),
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon icon={icon} size={26} color={theme.colors.primary} />
        </View>
      ) : null}
      {title ? <Text variant="h3">{title}</Text> : null}
      <Text variant="body" color="textMuted" center style={{ maxWidth: 280 }}>
        {message}
      </Text>
      {action}
    </View>
  );
}

// ── ProvenanceChip ───────────────────────────────────────────────────────────

export type Provenance = 'measured' | 'derived' | 'estimated' | 'yours';

const PROVENANCE_LABEL: Record<Provenance, string> = {
  measured: 'Measured',
  derived: 'Derived',
  estimated: 'Estimate',
  yours: 'Your entry',
};

export function ProvenanceChip({ kind }: { kind: Provenance }) {
  const theme = useTheme();
  const tint = kind === 'estimated' ? theme.colors.warning : theme.colors.textMuted;
  return (
    <View
      style={{
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.alpha.tint14(tint),
        alignSelf: 'flex-start',
      }}
    >
      <Text variant="caption" style={{ color: tint, fontSize: 11 }}>
        {PROVENANCE_LABEL[kind]}
      </Text>
    </View>
  );
}

// ── Metric ───────────────────────────────────────────────────────────────────

interface MetricProps {
  value: string;
  label: string;
  /** subordinate line under the label */
  sub?: string;
  accent?: string;
  /** optional progress, rendered as a Rail in the accent colour */
  progress?: { value: number; max: number };
  style?: ViewStyle;
}

/**
 * The stat tile, rebuilt around the numeral. Max two per row at default scale
 * — and one per row at large font scales, which is the caller's duty.
 */
export function Metric({ value, label, sub, accent, progress, style }: MetricProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          ...theme.elevation.e1,
          borderRadius: theme.radius.md,
          padding: theme.spacing.md,
          gap: 4,
          flex: 1,
          ...(accent ? { borderLeftWidth: 3, borderLeftColor: accent } : {}),
        },
        style,
      ]}
    >
      <Text variant="numeralM">{value}</Text>
      <Text variant="label" color="textMuted">
        {label}
      </Text>
      {sub ? (
        <Text variant="caption" color="textFaint">
          {sub}
        </Text>
      ) : null}
      {progress ? (
        <View style={{ marginTop: 4 }}>
          <Rail value={progress.value} max={progress.max} color={accent} height={6} />
        </View>
      ) : null}
    </View>
  );
}
