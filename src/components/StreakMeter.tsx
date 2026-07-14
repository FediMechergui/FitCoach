import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Row } from '@/components/ui/misc';
import type { UsageStreak } from '@/repositories/usageRepo';

const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/**
 * Daily check-in streak meter — a flame, the current streak, a 7-day dot row and
 * progress toward the next milestone. Rewards simply showing up each day.
 */
export function StreakMeter({ streak }: { streak: UsageStreak }) {
  const theme = useTheme();
  const hot = streak.current > 0;
  const flame = hot ? theme.colors.warning : theme.colors.textFaint;
  const toNext = streak.nextMilestone > streak.current ? streak.nextMilestone : streak.current;
  const progress = toNext > 0 ? streak.current / toNext : 1;

  return (
    <Card accent={flame} style={{ gap: theme.spacing.md }}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Row gap={12} style={{ alignItems: 'center' }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              backgroundColor: flame + '22',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon icon="core.streak" size={28} color={flame} />
          </View>
          <View>
            <Row gap={6} style={{ alignItems: 'baseline' }}>
              <Text variant="display" style={{ color: flame }}>{streak.current}</Text>
              <Text variant="body" color="textMuted">day{streak.current === 1 ? '' : 's'}</Text>
            </Row>
            <Text variant="caption" color="textMuted">Daily check-in streak</Text>
          </View>
        </Row>
        <View style={{ alignItems: 'flex-end' }}>
          <Row gap={4} style={{ alignItems: 'center' }}>
            <Icon icon="core.pr" size={14} color={theme.colors.textMuted} />
            <Text variant="label" color="textMuted">Best {streak.longest}</Text>
          </Row>
          <Text variant="caption" color="textFaint">{streak.totalDays} days total</Text>
        </View>
      </Row>

      {/* 7-day dots */}
      <Row style={{ justifyContent: 'space-between' }}>
        {streak.last7.map((d, i) => (
          <View key={d.date} style={{ alignItems: 'center', gap: 4 }}>
            <View
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: d.opened ? flame : theme.colors.surfaceAlt,
                borderWidth: d.isToday ? 2 : 0,
                borderColor: theme.colors.text,
              }}
            >
              {d.opened ? (
                <Icon icon="core.streak" size={14} color="#fff" />
              ) : (
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.textFaint }} />
              )}
            </View>
            <Text variant="caption" color={d.isToday ? 'text' : 'textFaint'} style={{ fontSize: 10 }}>
              {DOW[(new Date(d.date).getDay() + 6) % 7]}
            </Text>
          </View>
        ))}
      </Row>

      {/* Milestone progress */}
      {streak.nextMilestone > streak.current && (
        <View style={{ gap: 4 }}>
          <ProgressBar progress={progress} color={flame} height={6} />
          <Text variant="caption" color="textFaint">
            {streak.nextMilestone - streak.current} more day
            {streak.nextMilestone - streak.current === 1 ? '' : 's'} to a {streak.nextMilestone}-day streak
            {streak.openedToday ? '' : ' · open the app today to keep it alive'}
          </Text>
        </View>
      )}
    </Card>
  );
}
