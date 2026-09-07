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
import { ChallengeWheel, type WheelAction } from '@/components/ChallengeWheel';
import {
  DIFFICULTY_COLOR,
  DIFFICULTY_LABEL,
  DIFFICULTY_POINTS,
  CATEGORY_LABEL,
  findChallenge,
} from '@/data/challenges';
import { challengeProgress, FREE_SPINS_PER_DAY, RESPIN_COST } from '@/lib/challengeWheel';
import {
  challengeForDate,
  challengeHistory,
  challengeStats,
  measureChallenge,
  catchUpChallengeCompletions,
  spinDailyChallenge,
  spinStatus,
  wheelForToday,
} from '@/repositories/challengeRepo';
import { isSmokingEnabled } from '@/repositories/smokingRepo';
import { getStack } from '@/repositories/supplementsRepo';
import { getPrayerSettings } from '@/repositories/faithRepo';
import { todayISO } from '@/lib/date';

/**
 * Spin for a challenge you did not choose.
 *
 * Two spins a day are free — the first for the challenge, the second for the
 * one time it is genuinely not the day for it. Every spin after that is
 * bought with ten points from what the challenges have earned, so a re-spin
 * is a decision with a price rather than a reflex. A completed challenge is
 * banked and cannot be spun away.
 *
 * The wheel only shows challenges you can actually attempt — the smoke-free day
 * never appears if you don't track smoking, the prayer challenge never appears
 * if prayer tracking is off. An impossible challenge teaches you to ignore the
 * wheel, which kills the whole thing.
 */
export function ChallengeScreen() {
  const theme = useTheme();
  const [tick, setTick] = useState(0);
  const [spinning, setSpinning] = useState(false);
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
  const status = useMemo(() => spinStatus(today), [tick, today]);
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

  // A settled wheel must rest on the challenge that was PERSISTED, not on
  // whatever a wheel rebuilt now would land on. Enabling or disabling a
  // tracker after the spin reshuffles the segments; if the day's challenge
  // fell out of the eight, it takes the last seat so the pointer tells the truth.
  const shown = (() => {
    if (!row) return { segments: wheel.segments, winningIndex: wheel.winningIndex };
    const idx = wheel.segments.findIndex((c) => c.key === row.challengeKey);
    if (idx >= 0) return { segments: wheel.segments, winningIndex: idx };
    if (!def) return { segments: wheel.segments, winningIndex: wheel.winningIndex };
    const segments = [...wheel.segments.slice(0, -1), def];
    return { segments, winningIndex: segments.length - 1 };
  })();

  // ── The spin button: what the next spin costs, or why there is none ──
  const freeWord = status.freeLeft === 1 ? 'spin' : 'spins';
  const action: WheelAction | null = (() => {
    if (spinning) return null;
    if (!settled) return { label: 'Spin the wheel', sub: `${FREE_SPINS_PER_DAY} free spins today` };
    if (!status.ok) {
      if (status.reason === 'completed') return null;
      return {
        label: 'Spin again',
        sub: `${RESPIN_COST} points a spin`,
        disabled: true,
        hint: `You have ${status.balance}. Complete this challenge and the points come with it.`,
      };
    }
    if (status.free) return { label: 'Spin again', sub: `free · ${status.freeLeft} free ${freeWord} left today` };
    return { label: 'Spin again', sub: `${RESPIN_COST} points · you have ${status.balance}` };
  })();

  const spinCopy = (() => {
    if (spinning) return 'Turning…';
    if (!settled)
      return `Two spins a day cost nothing. If the first is not the one, spin once more; a third costs ${RESPIN_COST} points from what the challenges have earned.`;
    if (done) return 'Done and banked. The wheel rests until tomorrow.';
    if (status.ok && status.free) return `Not the one? One more spin is free today. After that, each costs ${RESPIN_COST} points.`;
    if (status.ok) return `The free spins are used. Another costs ${RESPIN_COST} points, and what it lands on replaces this one.`;
    return `The free spins are used and a paid spin needs ${RESPIN_COST} points. Finish this one instead — it pays ${def ? DIFFICULTY_POINTS[def.difficulty] : RESPIN_COST}.`;
  })();

  const usedFree = Math.min(status.used, FREE_SPINS_PER_DAY);
  const paid = Math.max(0, status.used - FREE_SPINS_PER_DAY);

  return (
    <Screen>
      <PageHero
        icon="core.target"
        color={theme.colors.accent}
        title="Daily challenge"
        subtitle={`Two spins a day, free; a third costs ${RESPIN_COST} points. Every challenge is measured from what you actually log — never just ticked.`}
      />
      <Card style={{ gap: 12, alignItems: 'center' }}>
        <Text variant="h3">{settled ? "Today's challenge" : 'Spin for today'}</Text>
        <Text variant="caption" color="textMuted" style={{ textAlign: 'center' }}>
          {spinCopy}
        </Text>
        <ChallengeWheel
          segments={shown.segments}
          winningIndex={shown.winningIndex}
          settled={settled}
          action={action}
          onSpin={() => {
            const r = spinDailyChallenge(ctx, today);
            if (!r) return null;
            setSpinning(true);
            // Land on the wedge the screen is showing for that key; the repo's
            // index is the fallback for a wheel rebuilt in between.
            const idx = shown.segments.findIndex((c) => c.key === r.row.challengeKey);
            return idx >= 0 ? idx : r.index;
          }}
          onSpinEnd={() => {
            setSpinning(false);
            bump();
          }}
        />
        {/* The day's spin ledger: the free ones as pips, then the price. */}
        <Row gap={6} style={{ alignItems: 'center' }}>
          {Array.from({ length: FREE_SPINS_PER_DAY }, (_, i) => (
            <View
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: i < usedFree ? theme.colors.textFaint : theme.colors.accent,
              }}
            />
          ))}
          <Text variant="caption" color="textFaint">
            {usedFree === 0 ? `${FREE_SPINS_PER_DAY} free spins` : `${usedFree} of ${FREE_SPINS_PER_DAY} free spins used`}
            {paid > 0 ? ` · ${paid} paid` : ''}
            {` · then ${RESPIN_COST} pts each`}
          </Text>
        </Row>
      </Card>

      {def && measure && !spinning && (
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
        <StatTile icon="core.target" label="Completed" value={`${stats.completed}`} sub={`of ${stats.spun} days`} accent={theme.colors.primary} />
        <StatTile icon="core.streak" label="Streak" value={`${stats.streak}`} sub={`best ${stats.bestStreak}`} accent={theme.colors.warning} />
        <StatTile
          icon="core.pr"
          label="Points"
          value={`${stats.balance}`}
          sub={stats.spent > 0 ? `${stats.spent} spent on spins` : 'to spend'}
          accent={theme.colors.accent}
        />
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
