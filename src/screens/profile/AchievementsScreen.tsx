import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Row, Badge } from '@/components/ui/misc';
import { PageHero } from '@/components/ui/PageHero';
import { BadgeSvg } from '@/components/BadgeSvg';
import { ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES, type AchievementDef } from '@/data/achievements';

import { achievementStats, type AchievementStats } from '@/repositories/achievementsRepo';
import { evaluateAchievement, type AchievementProgress } from '@/lib/achievementRules';
import { kvGet } from '@/repositories/kvRepo';
import { KV_SHOWCASE, toggleShowcase } from '@/repositories/progressionRepo';
import { sanitizeShowcase, SHOWCASE_SLOTS } from '@/lib/progression';
import { toast } from '@/components/ui/Toast';

export function AchievementsScreen() {
  const theme = useTheme();
  const [stats, setStats] = useState<AchievementStats | null>(null);
  // Categories are collapsible so we never mount every badge image at once
  // (first category open by default).
  const [open, setOpen] = useState<Record<number, boolean>>({ 1: true });
  const [pinned, setPinned] = useState<number[]>([]);

  useFocusEffect(
    useCallback(() => {
      try {
        setStats(achievementStats());
      } catch (e) {
        console.warn('[achievements] failed to load stats:', e);
        setStats(null);
      }
    }, [])
  );

  const evaluated = useMemo(() => {
    // If stats failed to load, still show every badge (criteria-only) rather than a blank screen.
    if (!stats) {
      return ACHIEVEMENTS.map((a) => ({ def: a, p: { current: 0, target: 1, unlocked: false, tracked: false } }));
    }
    return ACHIEVEMENTS.map((a) => ({ def: a, p: evaluateAchievement(a, stats) }));
  }, [stats]);

  const unlockedCount = evaluated.filter((e) => e.p.unlocked).length;
  const unlockedIds = useMemo(() => evaluated.filter((e) => e.p.unlocked).map((e) => e.def.id), [evaluated]);

  // The pins are a choice, kept in the key-value store and re-checked against
  // what is actually unlocked every time they are read.
  useEffect(() => {
    setPinned(sanitizeShowcase(kvGet<unknown>(KV_SHOWCASE), new Set(unlockedIds)));
  }, [unlockedIds]);

  const togglePin = (id: number, name: string) => {
    const was = pinned.includes(id);
    const next = toggleShowcase(id, unlockedIds);
    setPinned(next);
    toast({ message: was ? `Unpinned "${name}"` : `Pinned "${name}" to your profile` });
  };

  return (
    <Screen>
      <PageHero icon="card.trophy" color={theme.colors.warning} title="Achievements" />

      {/* Overall progress */}
      <Card accent={theme.colors.warning} style={{ gap: 8 }}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="h2">{unlockedCount}<Text variant="h3" color="textMuted"> / {ACHIEVEMENTS.length}</Text></Text>
          <Text variant="caption" color="textMuted">badges unlocked</Text>
        </Row>
        <ProgressBar progress={unlockedCount / ACHIEVEMENTS.length} color={theme.colors.warning} />
        <Text variant="caption" color="textFaint">
          Progress toward badges is read from your own data. Tap the pin on a badge you have earned to
          show it on your profile — up to {SHOWCASE_SLOTS}.
        </Text>
      </Card>

      {ACHIEVEMENT_CATEGORIES.map((catName, i) => {
        const cat = i + 1;
        const items = evaluated.filter((e) => e.def.category === cat);
        const done = items.filter((e) => e.p.unlocked).length;
        const isOpen = !!open[cat];
        return (
          <View key={cat} style={{ gap: theme.spacing.sm }}>
            <Pressable onPress={() => setOpen((o) => ({ ...o, [cat]: !o[cat] }))}>
              <Row style={{ justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 }}>
                <Text variant="h3" style={{ flex: 1 }}>{catName}</Text>
                <Text variant="caption" color={done === items.length ? 'success' : 'textMuted'}>
                  {done}/{items.length}
                </Text>
                <Icon icon={isOpen ? 'core.back' : 'core.forward'} size={16} color={theme.colors.textFaint} />
              </Row>
            </Pressable>
            {isOpen &&
              items.map(({ def, p }) => (
                <AchievementRow key={def.id} def={def} p={p} pinned={pinned.includes(def.id)} onPin={() => togglePin(def.id, def.name)} />
              ))}
          </View>
        );
      })}

      <Text variant="caption" color="textFaint" center style={{ marginTop: 4 }}>
        {ACHIEVEMENTS.length} badges across {ACHIEVEMENT_CATEGORIES.length} categories — grounded in
        your real streaks, workouts, nutrition, sleep, self-care, faith and health data.
      </Text>
    </Screen>
  );
}

function AchievementRow({ def, p, pinned, onPin }: { def: AchievementDef; p: AchievementProgress; pinned: boolean; onPin: () => void }) {
  const theme = useTheme();
  const pct = p.target > 0 ? Math.min(1, p.current / p.target) : 0;
  const nice = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
  const auraId = `badge-aura-${def.id}`;

  return (
    <Card
      accent={p.unlocked ? theme.colors.success : undefined}
      style={{
        gap: 8,
        opacity: p.unlocked ? 1 : 0.88,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: p.unlocked ? theme.alpha.tint22(theme.colors.success) : theme.colors.border,
      }}
    >
      {p.unlocked && (
        <Svg width="100%" height="100%" style={{ position: 'absolute' }}>
          <Defs>
            <RadialGradient id={auraId} cx="12%" cy="30%" r="45%">
              <Stop offset="0%" stopColor={theme.colors.success} stopOpacity={0.25} />
              <Stop offset="60%" stopColor={theme.colors.success} stopOpacity={0.04} />
              <Stop offset="100%" stopColor="transparent" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill={`url(#${auraId})`} />
        </Svg>
      )}

      <Row gap={12} style={{ alignItems: 'center', zIndex: 1 }}>
        {/* The medal (pre-rendered PNG): full colour once earned; dimmed, with a lock, until then */}
        <View style={{ width: 56, height: 56, alignItems: 'center', justifyContent: 'center' }}>
          <View
            style={{
              opacity: p.unlocked ? 1 : 0.28,
              shadowColor: p.unlocked ? '#000000' : 'transparent',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.35,
              shadowRadius: 5,
            }}
          >
            <BadgeSvg id={def.id} svg={def.svg} size={56} />
          </View>
          {!p.unlocked && (
            <View
              style={{
                position: 'absolute',
                right: -2,
                bottom: -2,
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: theme.colors.surfaceAlt,
                borderWidth: 1,
                borderColor: theme.colors.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon icon="core.lock" size={11} color={theme.colors.textFaint} />
            </View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Row gap={6} style={{ alignItems: 'center' }}>
            <Text variant="bodyStrong" style={{ flexShrink: 1 }}>{def.name}</Text>
            {p.unlocked && <Icon icon="core.check" size={16} color={theme.colors.success} />}
          </Row>
          <Text variant="caption" color="textMuted">{def.criteria}</Text>
        </View>
        {p.unlocked ? (
          <Pressable onPress={onPin} hitSlop={10} accessibilityRole="button" accessibilityLabel={pinned ? 'Unpin from profile' : 'Pin to profile'}>
            <Badge label={pinned ? 'Pinned' : 'Pin'} color={pinned ? theme.colors.warning : theme.colors.success} />
          </Pressable>
        ) : p.tracked ? (
          <Text variant="caption" color="textMuted" style={{ fontVariant: ['tabular-nums'] }}>
            {nice(p.current)}/{nice(p.target)}
          </Text>
        ) : (
          <Icon icon="core.info" size={16} color={theme.colors.textFaint} />
        )}
      </Row>
      {/* Progress bar only for tracked, not-yet-unlocked badges */}
      {!p.unlocked && p.tracked && <ProgressBar progress={pct} color={theme.colors.warning} height={5} />}
      {!p.unlocked && !p.tracked && (
        <Text variant="caption" color="textFaint">Not measured yet — the app cannot see this one, so it stays locked for now.</Text>
      )}
    </Card>
  );
}

