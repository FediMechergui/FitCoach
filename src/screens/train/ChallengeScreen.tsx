import React, { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Row, SectionHeader, Divider, Badge, EmptyState } from '@/components/ui/misc';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatTile } from '@/components/ui/StatTile';
import { PageHero } from '@/components/ui/PageHero';
import { ChallengeWheel } from '@/components/ChallengeWheel';
import {
  DIFFICULTY_COLOR,
  DIFFICULTY_LABEL,
  DIFFICULTY_POINTS,
  CATEGORY_LABEL,
  findChallenge,
} from '@/data/challenges';
import { challengeProgress } from '@/lib/challengeWheel';
import {
  challengeForDate,
  challengeHistory,
  challengeStats,
  measureChallenge,
  catchUpChallengeCompletions,
  spinDailyChallenge,
  wheelForToday,
} from '@/repositories/challengeRepo';
import { isSmokingEnabled } from '@/repositories/smokingRepo';
import { getStack } from '@/repositories/supplementsRepo';
import { getPrayerSettings } from '@/repositories/faithRepo';
import { todayISO } from '@/lib/date';

/**
 * Spin once a day for a challenge you did not choose.
 *
 * The wheel only shows challenges you can actually attempt — the smoke-free day
 * never appears if you don't track smoking, the prayer challenge never appears
 * if prayer tracking is off. An impossible challenge teaches you to ignore the
 * wheel, which kills the whole thing.
 */
export function ChallengeScreen() {
  const theme = useTheme();
  const [tick, setTick] = useState(0);
  const bump = () => setTick((n) => n + 1);

  useFocusEffect(
    useCallback(() => {
      // Completion is checked on arrival, so finishing the challenge out in the
      // world is enough — nothing has to be ticked off by hand. The last week
      // is walked too: a day done but never revisited is still provably done.
      catchUpChallengeCompletions();
      bump();
    }, [])
  );

  const ctx = useMemo(
    () => ({
      enabled: {
        smoking: safe(() => isSmokingEnabled(), false),
        prayer: safe(() => !!getPrayerSettings()?.enabled, false),
        supplements: safe(() => getStack().length > 0, false),
        sleep: true,
        nutrition: true,
      },
    }),
    [tick]
  );

  const today = todayISO();
  const row = useMemo(() => challengeForDate(today), [tick, today]);
  const wheel = useMemo(() => wheelForToday(ctx, today), [ctx, today, tick]);
  const def = row ? findChallenge(row.challengeKey) : null;
  const measure = useMemo(() => (def ? measureChallenge(def, today) : null), [def, today, tick]);
  const stats = useMemo(() => challengeStats(), [tick]);
  const history = useMemo(() => challengeHistory(20), [tick]);

  if (!wheel) {
    return (
      <Screen>
        <EmptyState
          icon="core.target"
          title="No challenges available"
          message="Every challenge needs something to measure. Enable a tracker or log a session and the wheel will have something to offer."
        />
      </Screen>
    );
  }

  const settled = !!row;
  const done = !!row?.completedAt;
  const pct = measure ? challengeProgress(measure.current, measure.target) : 0;

  return (
    <Screen>
      <PageHero
        icon="core.target"
        color={theme.colors.accent}
        title="Daily challenge"
        subtitle="One spin a day. Every challenge is measured from what you actually log — never just ticked."
      />
      <Card style={{ gap: 12, alignItems: 'center' }}>
        <Text variant="h3">{settled ? "Today's challenge" : 'Spin for today'}</Text>
        {!settled && (
          <Text variant="caption" color="textMuted" style={{ textAlign: 'center' }}>
            One spin a day. Whatever it lands on is yours until midnight — that is rather the point.
          </Text>
        )}
        <ChallengeWheel
          segments={wheel.segments}
          winningIndex={wheel.winningIndex}
          settled={settled}
          onPress={() => spinDailyChallenge(ctx, today)}
          onSpinEnd={bump}
        />
      </Card>

      {def && measure && (
        <Card accent={done ? theme.colors.success : DIFFICULTY_COLOR[def.difficulty]} style={{ gap: 10 }}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Row gap={10} style={{ alignItems: 'center', flex: 1 }}>
              <Icon icon={def.icon} size={22} color={DIFFICULTY_COLOR[def.difficulty]} />
              <View style={{ flex: 1 }}>
                <Text variant="h3">{def.label}</Text>
                <Text variant="caption" color="textMuted">
                  {CATEGORY_LABEL[def.category]} · {DIFFICULTY_LABEL[def.difficulty]} ·{' '}
                  {DIFFICULTY_POINTS[def.difficulty]} pts
                </Text>
              </View>
            </Row>
            {done && <Badge label="Done ✓" color={theme.colors.success} />}
          </Row>

          <Text variant="body" color="textMuted">{def.detail}</Text>

          <ProgressBar progress={pct} color={done ? theme.colors.success : DIFFICULTY_COLOR[def.difficulty]} />
          <Row style={{ justifyContent: 'space-between' }}>
            <Text variant="caption" color="textMuted">
              {fmt(measure.current)}
              {def.unit ? ` ${def.unit}` : ''} of {fmt(measure.target)}
              {def.unit ? ` ${def.unit}` : ''}
            </Text>
            <Text variant="caption" color="textFaint">{Math.round(pct * 100)}%</Text>
          </Row>

          <Text variant="caption" color="textFaint">
            {done
              ? 'Completed from your logged data — nothing to tick off.'
              : 'Tracked automatically. Just go and do it; the app will notice.'}
          </Text>
        </Card>
      )}

      <SectionHeader title="Your record" />
      <Row style={{ justifyContent: 'space-between' }}>
        <StatTile icon="core.target" label="Completed" value={`${stats.completed}`} sub={`of ${stats.spun}`} accent={theme.colors.primary} />
        <StatTile icon="core.streak" label="Streak" value={`${stats.streak}`} sub={`best ${stats.bestStreak}`} accent={theme.colors.warning} />
        <StatTile icon="core.pr" label="Points" value={`${stats.points}`} sub="earned" accent={theme.colors.accent} />
      </Row>

      {history.length > 0 && (
        <>
          <SectionHeader title="Recent" />
          <Card style={{ gap: 6 }}>
            {history.map((h, i) => (
              <View key={h.row.id}>
                {i > 0 ? <Divider /> : null}
                <Row style={{ justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 }}>
                  <View style={{ flex: 1 }}>
                    <Text variant="body" numberOfLines={1}>{h.def.label}</Text>
                    <Text variant="caption" color="textFaint">
                      {h.row.date} · {DIFFICULTY_LABEL[h.def.difficulty]}
                    </Text>
                  </View>
                  <Icon
                    icon={h.row.completedAt ? 'core.check' : 'core.close'}
                    size={16}
                    color={h.row.completedAt ? theme.colors.success : theme.colors.textFaint}
                  />
                </Row>
              </View>
            ))}
          </Card>
        </>
      )}
    </Screen>
  );
}

const fmt = (n: number): string => (n >= 1000 ? n.toLocaleString() : `${Math.round(n * 10) / 10}`);

/** A disabled feature must never take the screen down with it. */
function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}
