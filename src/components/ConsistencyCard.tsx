import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Rail } from '@/components/ui/Meter';
import { Row } from '@/components/ui/misc';
import type { UsageStreak } from '@/repositories/usageRepo';

const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/**
 * One consistency story instead of two adjacent unlabeled streaks.
 *
 * v2 kept a training-days count in the header and a separate, second-largest-
 * card check-in meter below it — two numbers, no relationship, one of them
 * dead for most of the app's life. This merges them: training days and
 * check-in days side by side as labelled numerals, the 7-day dot row, and the
 * milestone Rail. Streaks here celebrate presence; nothing in this card can
 * threaten loss, because "a slip just restarts the counter, no shame attached"
 * is load-bearing copy.
 */
export function ConsistencyCard({
  usage,
  trainingStreak,
  restDays,
  onToggleRest,
}: {
  usage: UsageStreak;
  trainingStreak: number;
  /** ISO dates flagged as rest — shown as a moon in the week, never as a miss */
  restDays?: Set<string>;
  /** flips today's rest flag; when given, the card offers the switch */
  onToggleRest?: () => void;
}) {
  const theme = useTheme();
  const hot = usage.current > 0;
  const flame = hot ? theme.colors.warning : theme.colors.textFaint;
  const toNext = usage.nextMilestone > usage.current ? usage.nextMilestone : usage.current;

  return (
    <Card accent={flame} style={{ gap: theme.spacing.md }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="eyebrow" color="textMuted">
            Training
          </Text>
          <Row gap={6} style={{ alignItems: 'baseline' }}>
            <Text variant="numeralM" style={{ fontSize: 28, lineHeight: 32, color: theme.colors.primary }}>
              {trainingStreak}
            </Text>
            <Text variant="caption" color="textMuted">
              day{trainingStreak === 1 ? '' : 's'}
            </Text>
          </Row>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="eyebrow" color="textMuted">
            Check-in
          </Text>
          <Row gap={6} style={{ alignItems: 'baseline' }}>
            <Text variant="numeralM" style={{ fontSize: 28, lineHeight: 32, color: flame }}>
              {usage.current}
            </Text>
            <Text variant="caption" color="textMuted">
              day{usage.current === 1 ? '' : 's'}
            </Text>
          </Row>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 2 }}>
          <Row gap={4} style={{ alignItems: 'center' }}>
            <Icon icon="core.pr" size={13} color={theme.colors.textMuted} />
            <Text variant="label" color="textMuted">
              Best {usage.longest}
            </Text>
          </Row>
          <Text variant="caption" color="textFaint">
            {usage.totalDays} days total
          </Text>
        </View>
      </Row>

      {/* The week, as quiet dots rather than seven solid flames. */}
      <Row style={{ justifyContent: 'space-between' }}>
        {usage.last7.map((d) => {
          const rest = !!restDays?.has(d.date);
          const tint = rest ? theme.colors.mindbody : flame;
          return (
          <View key={d.date} style={{ alignItems: 'center', gap: 4 }}>
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: rest || d.opened ? theme.alpha.tint22(tint) : theme.colors.surfaceAlt,
                borderWidth: d.isToday ? 1.5 : 1,
                borderColor: d.isToday ? tint : rest || d.opened ? theme.alpha.tint22(tint) : theme.colors.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {rest ? <Icon icon="sleep.moon" size={11} color={tint} /> : d.opened ? <Icon icon="core.check" size={11} color={flame} /> : null}
            </View>
            <Text variant="caption" color={d.isToday ? 'textMuted' : 'textFaint'} style={{ fontSize: 11 }}>
              {DOW[(new Date(d.date).getDay() + 6) % 7]}
            </Text>
          </View>
          );
        })}
      </Row>

      {/* Rest is a decision, not a miss — and the streak knows the difference. */}
      {onToggleRest && (
        <Pressable onPress={onToggleRest} hitSlop={6}>
          <Row gap={8} style={{ alignItems: 'center' }}>
            <Icon
              icon={restDays?.has(usage.last7[usage.last7.length - 1]?.date ?? '') ? 'core.checkFilled' : 'core.checkEmpty'}
              size={18}
              color={restDays?.has(usage.last7[usage.last7.length - 1]?.date ?? '') ? theme.colors.mindbody : theme.colors.textFaint}
            />
            <Text variant="caption" color="textMuted" style={{ flex: 1 }}>
              {restDays?.has(usage.last7[usage.last7.length - 1]?.date ?? '')
                ? 'Today is a rest day — streaks carry across it, and the coach will not nag.'
                : 'Make today a rest day? The streak carries across it instead of breaking.'}
            </Text>
          </Row>
        </Pressable>
      )}

      <View style={{ gap: 4 }}>
        <Rail value={usage.current} max={toNext} color={flame} height={6} />
        <Text variant="caption" color="textFaint">
          {usage.nextMilestone > usage.current
            ? `${usage.nextMilestone - usage.current} more day${usage.nextMilestone - usage.current === 1 ? '' : 's'} to a ${usage.nextMilestone}-day streak`
            : 'Milestone reached — the next one starts now'}
        </Text>
      </View>
    </Card>
  );
}
