import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { PageHero } from '@/components/ui/PageHero';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Rail } from '@/components/ui/Meter';
import { Row, Divider } from '@/components/ui/misc';
import { EmptyState, Skeleton } from '@/components/ui/misc3';
import { RankCrest } from '@/components/RankCrest';
import { RankBodygraph } from '@/components/RankBodygraph';
import { rankSnapshot, FORM_WINDOW_DAYS, type RankSnapshot, type RankedLift } from '@/repositories/ranksRepo';
import { PILLARS, PILLAR_LABEL, RANK_TIERS, placeScore, DIVISION_LABEL } from '@/lib/ranks';
import { MUSCLE_LABELS } from '@/data/exercises';
import type { RootStackParamList } from '@/navigation/types';


type Nav = NativeStackNavigationProp<RootStackParamList>;
type Tab = 'lifts' | 'body' | 'ladder';

/**
 * Strength ranks — the Carthage ladder.
 *
 * One crest for the lifter, one per lift, and the body shaded by what each
 * muscle has earned. Every number here is a multiple of bodyweight read
 * against a standard; the screen says where the standard comes from and what
 * the next division would take, in kilograms.
 */
export function RanksScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const [snap, setSnap] = useState<RankSnapshot | null>(null);
  const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState<Tab>('lifts');

  useFocusEffect(
    useCallback(() => {
      try {
        setSnap(rankSnapshot());
        setFailed(false);
      } catch (e) {
        console.warn('[ranks] failed to read:', e);
        setFailed(true);
      }
    }, [])
  );

  const hero = (
    <PageHero
      icon="card.star"
      color={theme.colors.warning}
      eyebrow="The Carthage ladder"
      title="Strength ranks"
      subtitle="Your lifts, as multiples of your bodyweight, read against a standard."
    />
  );

  if (failed) {
    return (
      <Screen>
        {hero}
        <EmptyState icon="core.warning" title="Ranks could not be read" message="Nothing is lost. Come back to this page and it will try again." />
      </Screen>
    );
  }

  if (!snap) {
    return (
      <Screen>
        {hero}
        <Skeleton height={170} />
        <Skeleton height={90} />
        <Skeleton height={90} />
      </Screen>
    );
  }

  if (!snap.hasBodyweight) {
    return (
      <Screen>
        {hero}
        <EmptyState
          icon="stats.weight"
          title="A rank needs your weight"
          message="A rank is a multiple of bodyweight, so it starts with a weigh-in. Log one and every lift you have recorded is ranked at once."
          action={<Button title="Log a weigh-in" icon="stats.weight" fullWidth={false} onPress={() => navigation.navigate('Body')} />}
        />
        <LadderCard />
      </Screen>
    );
  }

  if (snap.lifts.length === 0) {
    return (
      <Screen>
        {hero}
        <EmptyState
          icon="strength.barbell"
          title="No ranked lift yet"
          message="Log a set of bench, squat, deadlift, overhead press, a row, pull-ups or dips — with weight and reps — and it takes its place on the ladder."
          action={<Button title="Open the library" icon="core.list" fullWidth={false} onPress={() => navigation.navigate('ExerciseLibrary', { pick: false })} />}
        />
        <LadderCard />
      </Screen>
    );
  }

  const overall = snap.overall ?? snap.peak;
  const onPeak = !snap.overall && !!snap.peak;

  return (
    <Screen>
      {hero}

      {overall && (
        <Card raised style={{ gap: 14, overflow: 'hidden' }}>
          {/* Gradual opacity radial glow behind the 96px Rank Crest */}
          <Svg width="100%" height="100%" style={{ position: 'absolute' }}>
            <Defs>
              <RadialGradient id="overall-crest-glow" cx="18%" cy="28%" r="48%">
                <Stop offset="0%" stopColor={overall.placement.tier.color} stopOpacity={0.32} />
                <Stop offset="55%" stopColor={overall.placement.tier.color} stopOpacity={0.08} />
                <Stop offset="100%" stopColor="transparent" stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#overall-crest-glow)" />
          </Svg>

          <Row gap={16} style={{ alignItems: 'center', zIndex: 1 }}>
            <RankCrest tier={overall.placement.tier} division={overall.placement.division} size={96} muted={onPeak} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="eyebrow" color="textMuted">
                {onPeak ? 'Your peak' : overall.provisional ? 'Provisional' : 'Overall'}
              </Text>
              <Text variant="h1">{overall.placement.label}</Text>
              <Text variant="caption" color="textMuted">
                {overall.placement.tier.local} · score {overall.placement.score.toFixed(1)} of 100
              </Text>
            </View>
          </Row>

          {overall.placement.nextLabel ? (
            <View style={{ gap: 5, zIndex: 1 }}>
              <Rail value={overall.placement.progress} max={1} color={overall.placement.tier.color} height={6} />
              <Row style={{ justifyContent: 'space-between' }}>
                <Text variant="caption" color="textMuted">
                  {Math.round(overall.placement.progress * 100)}% through {overall.placement.label}
                </Text>
                <Text variant="caption" color="textFaint">
                  next · {overall.placement.nextLabel}
                </Text>
              </Row>
            </View>
          ) : (
            <Text variant="caption" color="textMuted" style={{ zIndex: 1 }}>
              The top of the ladder. There is nothing above this.
            </Text>
          )}

          <Row gap={8} style={{ zIndex: 1 }}>
            {PILLARS.map((p) => {
              const s = overall.pillars[p];
              const place = s != null ? placeScore(s) : null;
              return (
                <View
                  key={p}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    gap: 2,
                    paddingVertical: 8,
                    borderRadius: theme.radius.sm,
                    backgroundColor: place ? theme.alpha.tint14(place.tier.color) : theme.colors.surfaceAlt,
                    borderWidth: 1,
                    borderColor: place ? theme.alpha.tint22(place.tier.color) : theme.colors.border,
                    borderTopColor: place ? theme.alpha.tint22('#FFFFFF') : theme.colors.border,
                  }}
                >
                  <Text variant="eyebrow" color="textMuted" style={{ letterSpacing: 1.2 }}>
                    {PILLAR_LABEL[p]}
                  </Text>
                  <Text variant="label" color={place ? 'text' : 'textFaint'} numberOfLines={1}>
                    {place ? `${place.tier.name} ${DIVISION_LABEL[place.division]}` : 'not yet'}
                  </Text>
                </View>
              );
            })}
          </Row>

          <Text variant="caption" color="textFaint" style={{ zIndex: 1 }}>

            {onPeak
              ? `Nothing ranked in the last ${FORM_WINDOW_DAYS} days, so this is the best you ever logged. Lift again and the ladder shows your form.`
              : overall.provisional
                ? `Ranked on ${PILLARS.length - overall.missing.length} of ${PILLARS.length} pillars. Log a ${overall.missing.map((m) => PILLAR_LABEL[m].toLowerCase()).join(' and a ')} lift and the rank stops being a sketch.`
                : `The mean of your best lift in each pillar, from the last ${FORM_WINDOW_DAYS} days, at ${snap.bodyweightKg.toFixed(1)} kg.`}
          </Text>
        </Card>
      )}

      <SegmentedControl
        value={tab}
        onChange={(v) => setTab(v as Tab)}
        options={[
          { value: 'lifts', label: `Lifts · ${snap.lifts.length}` },
          { value: 'body', label: 'Body' },
          { value: 'ladder', label: 'Ladder' },
        ]}
      />

      {tab === 'lifts' &&
        snap.lifts.map((l) => <LiftRow key={l.slug} lift={l} onPress={() => navigation.navigate('ExerciseStats', { exerciseId: l.exerciseId, name: l.name })} />)}

      {tab === 'body' && (
        <Card style={{ gap: 12 }}>
          <Text variant="h3">Shaded by rank</Text>
          <RankBodygraph muscles={snap.muscles} />
          <Divider />
          {Object.entries(snap.muscles)
            .sort((a, b) => b[1] - a[1])
            .map(([m, s]) => {
              const p = placeScore(s);
              return (
                <Row key={m} style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Row gap={8} style={{ alignItems: 'center' }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: p.tier.color }} />
                    <Text variant="body">{MUSCLE_LABELS[m] ?? m}</Text>
                  </Row>
                  <Text variant="label" color="textMuted">
                    {p.label}
                  </Text>
                </Row>
              );
            })}
          <Text variant="caption" color="textFaint">
            A muscle wears the tier of the best ranked lift that trains it. Grey means no ranked lift has spoken for it yet — not that it is weak.
          </Text>
        </Card>
      )}

      {tab === 'ladder' && <LadderCard current={overall?.placement.tierIndex} />}

      <Text variant="caption" color="textFaint" center>
        The standards are FitCoach's own table, set from published strength standards. They are a yardstick, not a census: this app knows one lifter, you.
      </Text>
    </Screen>
  );
}

function LiftRow({ lift, onPress }: { lift: RankedLift; onPress: () => void }) {
  const theme = useTheme();
  const p = lift.placement;
  return (
    <Card accent={p.tier.color} onPress={onPress} style={{ gap: 10 }}>
      <Row gap={12} style={{ alignItems: 'center' }}>
        <RankCrest tier={p.tier} division={p.division} size={52} muted={!lift.inForm} />
        <View style={{ flex: 1 }}>
          <Text variant="h3" numberOfLines={2}>
            {lift.name}
          </Text>
          <Text variant="caption" color="textMuted">
            {p.label} · {lift.standardLabel} standard
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text variant="numeralM">{lift.oneRmKg.toFixed(1)}</Text>
          <Text variant="caption" color="textFaint">
            kg est. 1RM
          </Text>
        </View>
      </Row>

      <Rail value={p.progress} max={1} color={p.tier.color} height={5} />
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="caption" color="textMuted" style={{ flex: 1 }}>
          {lift.toNextKg != null && p.nextLabel ? `+${lift.toNextKg} kg for ${p.nextLabel}` : 'Top of the ladder'}
        </Text>
        <Row gap={4} style={{ alignItems: 'center' }}>
          {!lift.inForm && <Icon icon="core.timer" size={12} color={theme.colors.textFaint} />}
          <Text variant="caption" color="textFaint">
            {lift.inForm
              ? lift.peakOneRmKg > lift.oneRmKg
                ? `peak ${lift.peakOneRmKg.toFixed(1)} kg`
                : 'at your peak'
              : `last lifted ${lift.lastDate}`}
          </Text>
        </Row>
      </Row>
    </Card>
  );
}

function LadderCard({ current }: { current?: number }) {
  const theme = useTheme();
  return (
    <Card style={{ gap: 12 }}>
      <Text variant="h3">Eight rungs, from the ground up</Text>
      {[...RANK_TIERS].reverse().map((t) => {
        const i = RANK_TIERS.indexOf(t);
        const here = current === i;
        return (
          <Row
            key={t.key}
            gap={12}
            style={{
              alignItems: 'center',
              padding: 8,
              borderRadius: theme.radius.md,
              backgroundColor: here ? theme.alpha.tint14(t.color) : 'transparent',
            }}
          >
            <RankCrest tier={t} size={40} showDivision={false} />
            <View style={{ flex: 1 }}>
              <Row gap={6} style={{ alignItems: 'baseline' }}>
                <Text variant="bodyStrong">{t.name}</Text>
                <Text variant="caption" color="textFaint">
                  {t.local} · from {t.floor}
                </Text>
                {here && (
                  <Text variant="caption" color="textMuted">
                    · you
                  </Text>
                )}
              </Row>
              <Text variant="caption" color="textMuted">
                {t.origin}
              </Text>
            </View>
          </Row>
        );
      })}
      <Text variant="caption" color="textFaint">
        Each rung has three divisions, III to I. A floor is where a rung begins, not its average.
      </Text>
    </Card>
  );
}
