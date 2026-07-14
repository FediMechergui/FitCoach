import React, { useCallback, useState } from 'react';
import { View, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatTile } from '@/components/ui/StatTile';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { BarChart } from '@/components/charts/BarChart';
import { Row, SectionHeader, Divider, Badge } from '@/components/ui/misc';
import { useHabitsStore } from '@/stores/habitsStore';
import { habitCorrelation, habitDailySeries } from '@/repositories/habitsRepo';
import { HABIT_CATALOGUE, findHabit, timeEquivalents, type HabitImpact } from '@/lib/habits';
import type { HabitProfile } from '@/db/schema';

export function HabitsScreen() {
  const theme = useTheme();
  const { profiles, impacts, load, enable, disable, add, undo } = useHabitsStore();

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const enabledKeys = new Set(profiles.map((p) => p.habitKey));
  const available = HABIT_CATALOGUE.filter((h) => !enabledKeys.has(h.key));

  return (
    <Screen>
      <Row gap={12} style={{ alignItems: 'center' }}>
        <Icon icon="habits.generic" size={28} color={theme.colors.mindbody} />
        <Text variant="h1">Habits</Text>
      </Row>
      <Text variant="body" color="textMuted">
        Track habits you want to understand or change. FitCoach shows the honest impact — the
        time it costs and how it maps onto your own sleep and training — without judgment.
      </Text>

      {/* Active habits */}
      {profiles.map((p) => (
        <ActiveHabitCard
          key={p.habitKey}
          profile={p}
          impact={impacts[p.habitKey] ?? null}
          onAdd={(input) => add(p.habitKey, input)}
          onUndo={() => undo(p.habitKey)}
          onDisable={() => disable(p.habitKey)}
        />
      ))}

      {/* Add a habit */}
      {available.length > 0 && (
        <>
          <SectionHeader title="Track a new habit" />
          {available.map((h) => (
            <Pressable key={h.key} onPress={() => enable(h.key)}>
              <Card>
                <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Row gap={12} style={{ alignItems: 'center', flex: 1 }}>
                    <Icon icon={h.icon} size={22} color={h.color} />
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyStrong">{h.label}</Text>
                      <Text variant="caption" color="textMuted">{h.blurb}</Text>
                    </View>
                  </Row>
                  <Icon icon="core.add" size={20} color={theme.colors.primary} />
                </Row>
              </Card>
            </Pressable>
          ))}
        </>
      )}

      <Text variant="caption" color="textFaint" center>
        Private and on-device. Streaks are encouragement — a slip just restarts the counter, no
        shame attached.
      </Text>
    </Screen>
  );
}

function ActiveHabitCard({
  profile,
  impact,
  onAdd,
  onUndo,
  onDisable,
}: {
  profile: HabitProfile;
  impact: HabitImpact | null;
  onAdd: (input: { quantity?: number; minutes?: number; trigger?: string }) => void;
  onUndo: () => void;
  onDisable: () => void;
}) {
  const theme = useTheme();
  const def = findHabit(profile.habitKey);
  const color = def?.color ?? theme.colors.mindbody;
  const isDuration = profile.kind === 'duration';
  const [minutes, setMinutes] = useState('15');
  const [showEvidence, setShowEvidence] = useState(false);

  const [correlation] = useState(() => habitCorrelation(profile.habitKey, 30));
  const [series] = useState(() => habitDailySeries(profile.habitKey, 21));

  if (!impact) return null;
  const equivalents = timeEquivalents(impact.yearHoursProjected);

  return (
    <Card accent={color} style={{ gap: theme.spacing.md }}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Row gap={10} style={{ alignItems: 'center', flex: 1 }}>
          <Icon icon={def?.icon ?? 'habits.generic'} size={22} color={color} />
          <Text variant="h3" style={{ flex: 1 }}>{profile.label}</Text>
        </Row>
        {impact.freeStreak > 0 && (
          <Badge label={`${impact.freeStreak}-day free`} color={theme.colors.success} />
        )}
      </Row>

      {/* Logger */}
      {isDuration ? (
        <Row style={{ alignItems: 'flex-end' }}>
          <View style={{ flex: 1 }}>
            <Input label="Minutes" value={minutes} onChangeText={setMinutes} keyboardType="numeric" />
          </View>
          <Button
            title="Log"
            size="sm"
            color={color}
            onPress={() => onAdd({ minutes: parseFloat(minutes) || 0 })}
            style={{ flex: 1 }}
            fullWidth={false}
          />
        </Row>
      ) : (
        <Row>
          <Button title={`+1 ${def?.unit ?? 'time'}`} icon="core.add" size="sm" color={color} onPress={() => onAdd({})} style={{ flex: 2 }} fullWidth={false} />
          <Button title="Undo" size="sm" variant="secondary" onPress={onUndo} style={{ flex: 1 }} fullWidth={false} />
        </Row>
      )}

      {/* Today vs target */}
      {impact.dailyTarget != null && (
        <View style={{ gap: 4 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text variant="caption" color="textMuted">Today</Text>
            <Text variant="caption" color={impact.overTarget ? 'danger' : 'textMuted'}>
              {isDuration ? `${impact.todayMinutes} min` : `${impact.todayCount}×`} / {impact.dailyTarget}{isDuration ? ' min' : '×'} cap
            </Text>
          </Row>
          <ProgressBar
            progress={impact.dailyTarget ? (isDuration ? impact.todayMinutes : impact.todayCount) / impact.dailyTarget : 0}
            color={impact.overTarget ? theme.colors.danger : color}
          />
        </View>
      )}

      {/* Impact tiles */}
      <Row>
        <StatTile icon="habits.time" label="This week" value={impact.weekMinutes >= 60 ? `${Math.round(impact.weekMinutes / 60 * 10) / 10}h` : `${impact.weekMinutes}m`} sub={isDuration ? '' : `${impact.weekCount}×`} accent={color} />
        <StatTile icon="habits.free" label="Free days" value={`${impact.freeDays7d}/7`} sub={`best ${impact.bestFreeStreak}d`} accent={theme.colors.success} />
        <StatTile icon="smoking.life" label="Per year" value={`${impact.yearHoursProjected}h`} sub="at this rate" accent={theme.colors.warning} />
      </Row>

      {equivalents.length > 0 && (
        <Text variant="caption" color="textFaint">
          That projected time ≈ {equivalents.join(' · ')}.
        </Text>
      )}

      {/* Late-night flag (sleep displacement) */}
      {impact.lateNightShare > 0.3 && (
        <Row gap={8} style={{ alignItems: 'center' }}>
          <Icon icon="sleep.moon" size={16} color={theme.colors.mindbody} />
          <Text variant="caption" color="textMuted" style={{ flex: 1 }}>
            {Math.round(impact.lateNightShare * 100)}% of these happen late at night — the most
            likely way this is costing you sleep.
          </Text>
        </Row>
      )}

      {/* Correlation with own data */}
      {correlation && (correlation.avgSleepWithHabit !== null || correlation.avgSessionCalWithHabit !== null) && (
        <>
          <Divider />
          <Text variant="label" color="textMuted">Your data: days with vs without</Text>
          {correlation.avgSleepWithHabit !== null && correlation.avgSleepWithout !== null && (
            <Row style={{ justifyContent: 'space-between' }}>
              <Text variant="caption" color="textMuted">Avg sleep</Text>
              <Text variant="caption">
                {correlation.avgSleepWithHabit}h with · {correlation.avgSleepWithout}h without
              </Text>
            </Row>
          )}
          {correlation.avgSessionCalWithHabit !== null && correlation.avgSessionCalWithout !== null && (
            <Row style={{ justifyContent: 'space-between' }}>
              <Text variant="caption" color="textMuted">Avg session kcal</Text>
              <Text variant="caption">
                {correlation.avgSessionCalWithHabit} with · {correlation.avgSessionCalWithout} without
              </Text>
            </Row>
          )}
          <Text variant="caption" color="textFaint">
            Observational — over {correlation.windowDays} days ({correlation.daysWithHabit} with, {correlation.daysWithout} without).
          </Text>
        </>
      )}

      {/* Trend */}
      <BarChart data={series.map((d) => ({ label: d.date.slice(8), value: d.value }))} color={color} valueFormat={(v) => (v > 0 ? `${Math.round(v)}` : '')} />

      {/* Honest evidence */}
      <Pressable onPress={() => setShowEvidence((s) => !s)}>
        <Row gap={6} style={{ alignItems: 'center' }}>
          <Icon icon="core.info" size={15} color={theme.colors.textMuted} />
          <Text variant="caption" color="primary">
            {showEvidence ? 'Hide' : 'What does the evidence actually say?'}
          </Text>
        </Row>
      </Pressable>
      {showEvidence && def && (
        <Text variant="caption" color="textMuted">{def.evidence}</Text>
      )}

      <Pressable onPress={onDisable}>
        <Text variant="caption" color="textFaint" center>Stop tracking this habit</Text>
      </Pressable>
    </Card>
  );
}
