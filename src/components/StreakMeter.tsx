import React from 'react';
import { View } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Path,
  Circle,
  G,
} from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Row } from '@/components/ui/misc';
import type { UsageStreak } from '@/repositories/usageRepo';

const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/**
 * Artistic multi-layered SVG flame with outer embers and inner radiant hearth.
 */
function ArtisticFlameSvg({
  size = 32,
  hot = true,
  color,
}: {
  size?: number;
  hot?: boolean;
  color?: string;
}) {
  const theme = useTheme();
  const flameBase = color ?? (hot ? '#FF6D00' : theme.colors.textFaint);
  const flameTip = hot ? '#FFD54F' : theme.colors.surface3;
  const flameCore = hot ? '#FFF8E1' : theme.colors.surfaceAlt;
  const flameAura = hot ? '#FF3D00' : 'transparent';

  const uid = React.useId().replace(/:/g, '');
  const gradOuter = `flame-out-${uid}`;
  const gradMid = `flame-mid-${uid}`;
  const gradCore = `flame-core-${uid}`;
  const radAura = `flame-aura-${uid}`;

  return (
    <Svg width={size} height={size} viewBox="0 0 36 36">
      <Defs>
        <RadialGradient id={radAura} cx="50%" cy="60%" r="50%">
          <Stop offset="0%" stopColor={flameAura} stopOpacity={hot ? 0.45 : 0} />
          <Stop offset="100%" stopColor={flameAura} stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id={gradOuter} x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0%" stopColor={flameBase} />
          <Stop offset="65%" stopColor={hot ? '#FFA000' : flameTip} />
          <Stop offset="100%" stopColor={flameTip} />
        </LinearGradient>
        <LinearGradient id={gradMid} x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0%" stopColor={hot ? '#FF9100' : theme.colors.textFaint} />
          <Stop offset="100%" stopColor={hot ? '#FFECB3' : flameTip} />
        </LinearGradient>
        <LinearGradient id={gradCore} x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0%" stopColor={hot ? '#FFE082' : flameTip} />
          <Stop offset="100%" stopColor={flameCore} />
        </LinearGradient>
      </Defs>

      <G>
        {/* Ambient radial aura glow */}
        {hot && <Circle cx="18" cy="20" r="14" fill={`url(#${radAura})`} />}

        {/* Floating incandescent spark embers */}
        {hot && (
          <>
            <Circle cx="8.5" cy="14" r="1" fill="#FFD54F" opacity={0.75} />
            <Circle cx="28.5" cy="16" r="1.2" fill="#FFA000" opacity={0.65} />
            <Circle cx="19.5" cy="3" r="1.1" fill="#FFE082" opacity={0.9} />
            <Circle cx="25" cy="7.5" r="0.8" fill="#FFCA28" opacity={0.7} />
          </>
        )}

        {/* 1. Outer sculpted flame silhouette */}
        <Path
          d="M 18 4 C 19 8, 26 13, 27 20 C 28 27.5, 23.5 32, 18 33 C 12.5 32, 8 27.5, 9 20 C 9.8 14.5, 14 10, 16 7 C 16.5 10, 18 11.5, 18.5 11.5 C 17.5 8.5, 17 6, 18 4 Z"
          fill={`url(#${gradOuter})`}
        />

        {/* 2. Secondary mid-tongue fire petal */}
        <Path
          d="M 18 13 C 20.5 16, 23 20.5, 22 25.5 C 21 29, 19.5 30.5, 18 30.5 C 16.5 30.5, 15 29, 14 25.5 C 13 20.5, 15.5 16, 18 13 Z"
          fill={`url(#${gradMid})`}
        />

        {/* 3. Luminous white-hot core hearth */}
        <Path
          d="M 18 20 C 19.5 22, 20.5 24.5, 19.8 27.5 C 19.3 29, 18.6 29.5, 18 29.5 C 17.4 29.5, 16.7 29, 16.2 27.5 C 15.5 24.5, 16.5 22, 18 20 Z"
          fill={`url(#${gradCore})`}
        />
      </G>
    </Svg>
  );
}

/**
 * Daily check-in streak meter — an artistic flame, the current streak,
 * a 7-day dot row and progress toward the next milestone.
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
        <Row gap={14} style={{ alignItems: 'center' }}>
          {/* Artistic Flame Emblem Container */}
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 18,
              backgroundColor: theme.alpha.tint08(flame),
              borderWidth: 1.5,
              borderColor: theme.alpha.tint22(flame),
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: hot ? '#FF6D00' : 'transparent',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.35,
              shadowRadius: 8,
            }}
          >
            <ArtisticFlameSvg size={36} hot={hot} color={flame} />
          </View>
          <View>
            <Row gap={6} style={{ alignItems: 'baseline' }}>
              <Text variant="display" style={{ color: flame, fontWeight: '800' }}>
                {streak.current}
              </Text>
              <Text variant="body" color="textMuted">
                day{streak.current === 1 ? '' : 's'}
              </Text>
            </Row>
            <Text variant="caption" color="textMuted">
              Daily check-in streak
            </Text>
          </View>
        </Row>
        <View style={{ alignItems: 'flex-end' }}>
          <Row gap={5} style={{ alignItems: 'center' }}>
            <Icon icon="core.pr" size={15} color={theme.colors.textMuted} />
            <Text variant="label" color="textMuted">
              Best {streak.longest}
            </Text>
          </Row>
          <Text variant="caption" color="textFaint">
            {streak.totalDays} days total
          </Text>
        </View>
      </Row>

      {/* 7-day dots */}
      <Row style={{ justifyContent: 'space-between' }}>
        {streak.last7.map((d) => (
          <View key={d.date} style={{ alignItems: 'center', gap: 6 }}>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: d.opened ? flame : theme.colors.surfaceAlt,
                borderWidth: d.isToday ? 2 : 1,
                borderColor: d.isToday
                  ? theme.colors.primary
                  : d.opened
                    ? flame
                    : theme.colors.border,
                shadowColor: d.opened ? flame : 'transparent',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
              }}
            >
              {d.opened ? (
                <ArtisticFlameSvg size={16} hot={true} color="#FFFFFF" />
              ) : (
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: theme.colors.textFaint,
                    opacity: 0.6,
                  }}
                />
              )}
            </View>
            <Text
              variant="caption"
              color={d.isToday ? 'text' : 'textFaint'}
              style={{ fontSize: 11, fontWeight: d.isToday ? '700' : '400' }}
            >
              {DOW[(new Date(d.date).getDay() + 6) % 7]}
            </Text>
          </View>
        ))}
      </Row>

      {/* Milestone progress */}
      {streak.nextMilestone > streak.current && (
        <View style={{ gap: 5 }}>
          <ProgressBar progress={progress} color={flame} height={6} />
          <Text variant="caption" color="textFaint">
            {streak.nextMilestone - streak.current} more day
            {streak.nextMilestone - streak.current === 1 ? '' : 's'} to a{' '}
            {streak.nextMilestone}-day streak
            {streak.openedToday ? '' : ' · open the app today to keep it alive'}
          </Text>
        </View>
      )}
    </Card>
  );
}

