import React, { useCallback, useMemo, useState } from 'react';
import { View, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Row, Badge } from '@/components/ui/misc';
import { BadgeSvg } from '@/components/BadgeSvg';
import { ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES, type AchievementDef } from '@/data/achievements';
import { achievementStats, type AchievementStats } from '@/repositories/achievementsRepo';
import { evaluateAchievement, type AchievementProgress } from '@/lib/achievementRules';

export function AchievementsScreen() {
  const theme = useTheme();
  const [stats, setStats] = useState<AchievementStats | null>(null);
  // Categories are collapsible so we never mount all 100 badge SVGs at once
  // (first category open by default).
  const [open, setOpen] = useState<Record<number, boolean>>({ 1: true });

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

  return (
    <Screen>
      <Row gap={12} style={{ alignItems: 'center' }}>
        <Icon icon="card.trophy" size={28} color={theme.colors.warning} />
        <Text variant="h1" style={{ flex: 1 }}>Achievements</Text>
      </Row>

      {/* Overall progress */}
      <Card accent={theme.colors.warning} style={{ gap: 8 }}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="h2">{unlockedCount}<Text variant="h3" color="textMuted"> / {ACHIEVEMENTS.length}</Text></Text>
          <Text variant="caption" color="textMuted">badges unlocked</Text>
        </Row>
        <ProgressBar progress={unlockedCount / ACHIEVEMENTS.length} color={theme.colors.warning} />
        <Text variant="caption" color="textFaint">
          Progress toward badges is read from your own data. A few event-based badges (like
          exporting your card) unlock when you do them.
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
            {isOpen && items.map(({ def, p }) => <AchievementRow key={def.id} def={def} p={p} />)}
          </View>
        );
      })}

      <Text variant="caption" color="textFaint" center style={{ marginTop: 4 }}>
        100 badges across 10 categories — grounded in your real streaks, workouts, nutrition,
        sleep and health data.
      </Text>
    </Screen>
  );
}

function AchievementRow({ def, p }: { def: AchievementDef; p: AchievementProgress }) {
  const theme = useTheme();
  const pct = p.target > 0 ? Math.min(1, p.current / p.target) : 0;
  const nice = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

  return (
    <Card
      accent={p.unlocked ? theme.colors.success : undefined}
      style={{ gap: 8, opacity: p.unlocked ? 1 : 0.96 }}
    >
      <Row gap={12} style={{ alignItems: 'center' }}>
        {/* Badge art — full colour when unlocked, dimmed when locked */}
        <View style={{ opacity: p.unlocked ? 1 : 0.35 }}>
          <BadgeSvg svg={def.svg} size={48} />
        </View>
        <View style={{ flex: 1 }}>
          <Row gap={6} style={{ alignItems: 'center' }}>
            <Text variant="bodyStrong" style={{ flexShrink: 1 }}>{def.name}</Text>
            {p.unlocked && <Icon icon="core.check" size={16} color={theme.colors.success} />}
          </Row>
          <Text variant="caption" color="textMuted">{def.criteria}</Text>
        </View>
        {p.unlocked ? (
          <Badge label="Unlocked" color={theme.colors.success} />
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
        <Text variant="caption" color="textFaint">Unlocks when you do it — not auto-tracked yet.</Text>
      )}
    </Card>
  );
}
