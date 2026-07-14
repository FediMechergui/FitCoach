import React, { useCallback, useState } from 'react';
import { View, Pressable } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { StatTile } from '@/components/ui/StatTile';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { LineChart } from '@/components/charts/LineChart';
import { BarChart } from '@/components/charts/BarChart';
import { CalendarHeatmap } from '@/components/charts/CalendarHeatmap';
import { Row, SectionHeader, EmptyState, Divider } from '@/components/ui/misc';
import {
  currentStreak,
  muscleGroupBalance,
  personalRecords,
  sessionTypeCounts,
  trainingCalendar,
  weeklyVolume,
  type PRRow,
} from '@/repositories/statsRepo';
import { listSessions } from '@/repositories/sessionRepo';
import { weighInHistory } from '@/repositories/userRepo';
import { weeklyStepAverage } from '@/repositories/coachRepo';
import { smokingCorrelation, smokingImpact } from '@/repositories/smokingRepo';
import { sleepSummary } from '@/repositories/sleepRepo';
import { alcoholImpact } from '@/repositories/alcoholRepo';
import { computeBodyComp } from '@/lib/bodyComposition';
import { useUserStore } from '@/stores/userStore';
import { metaFor } from '@/constants/sessionTypes';
import { SESSION_TYPE_COLORS } from '@/theme';
import { daysAgoISO } from '@/lib/date';
import { formatWeight } from '@/lib/format';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function StatsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const unit = useUserStore((s) => s.user?.unitPreference ?? 'metric');
  const [data, setData] = useState(() => loadStats());

  useFocusEffect(
    useCallback(() => {
      setData(loadStats());
    }, [])
  );

  const {
    weekSessions,
    weekVolume,
    weekCalories,
    weekMinutes,
    streak,
    calendar,
    volumeByWeek,
    typeCounts,
    weightSeries,
    prs,
    muscle,
    stepAvg,
    smoking,
    smokeCorr,
    sleep,
    bodyComp,
    alcohol,
  } = data;

  const hasData =
    weekSessions > 0 || weightSeries.length > 0 || calendar.some((d) => d.count > 0) || !!smoking;

  if (!hasData) {
    return (
      <Screen>
        <Text variant="h1">Stats</Text>
        <EmptyState
          icon="stats.progression"
          title="Your insights will appear here"
          message="Log a few sessions, weigh-ins and meals and FitCoach will chart your progress."
        />
      </Screen>
    );
  }

  const muscleEntries = Object.entries(muscle).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxMuscle = Math.max(1, ...muscleEntries.map((m) => m[1]));

  return (
    <Screen>
      <Text variant="h1">Stats</Text>

      {/* This week */}
      <Row>
        <StatTile icon="nav.train" label="Sessions" value={`${weekSessions}`} sub="this week" />
        <StatTile icon="core.streak" label="Streak" value={`${streak}`} sub="days" accent={theme.colors.warning} />
      </Row>
      <Row>
        <StatTile icon="stats.volume" label="Volume" value={`${Math.round(weekVolume / 1000)}k`} sub="kg this wk" accent={theme.colors.primary} />
        <StatTile icon="nutrition.calories" label="Burned" value={`${Math.round(weekCalories)}`} sub="kcal this wk" accent={theme.colors.calories} />
        <StatTile icon="core.timer" label="Active" value={`${Math.round(weekMinutes)}`} sub="min this wk" accent={theme.colors.accent} />
      </Row>

      {/* Consistency heatmap */}
      <SectionHeader title="Consistency" />
      <Card>
        <Row gap={8} style={{ alignItems: 'center', marginBottom: 12 }}>
          <Icon icon="stats.heatmap" size={18} color={theme.colors.accent} />
          <Text variant="caption" color="textMuted">Last 12 weeks · {calendar.filter((d) => d.count > 0).length} active days</Text>
        </Row>
        <CalendarHeatmap data={calendar} />
      </Card>

      {/* Weekly volume */}
      {volumeByWeek.length > 0 && (
        <>
          <SectionHeader title="Weekly Volume" />
          <Card>
            <BarChart
              data={volumeByWeek.map((w) => ({
                label: w.weekStart.slice(5),
                value: w.volume,
              }))}
              color={theme.colors.primary}
              valueFormat={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : `${Math.round(v)}`)}
            />
          </Card>
        </>
      )}

      {/* Session-type breakdown */}
      {Object.keys(typeCounts).length > 0 && (
        <>
          <SectionHeader title="Session Mix" />
          <Card style={{ gap: 10 }}>
            {Object.entries(typeCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => {
                const total = Object.values(typeCounts).reduce((s, c) => s + c, 0);
                return (
                  <View key={type} style={{ gap: 4 }}>
                    <Row style={{ justifyContent: 'space-between' }}>
                      <Row gap={6} style={{ alignItems: 'center' }}>
                        <Icon icon={metaFor(type as never).icon} size={14} color={SESSION_TYPE_COLORS[type]} />
                        <Text variant="caption" color="textMuted">{metaFor(type as never).label}</Text>
                      </Row>
                      <Text variant="caption" color="textMuted">{count}</Text>
                    </Row>
                    <ProgressBar progress={count / total} color={SESSION_TYPE_COLORS[type]} height={6} />
                  </View>
                );
              })}
          </Card>
        </>
      )}

      {/* Weight trend */}
      {weightSeries.length >= 2 && (
        <>
          <SectionHeader title="Body Weight" />
          <Card>
            <LineChart
              data={weightSeries}
              color={theme.colors.info}
              yFormat={(v) => (unit === 'imperial' ? `${Math.round(v * 2.205)}` : `${v.toFixed(0)}`)}
            />
            <Text variant="caption" color="textFaint" center style={{ marginTop: 6 }}>
              Latest: {formatWeight(weightSeries[weightSeries.length - 1].y, unit)}
            </Text>
          </Card>
        </>
      )}

      {/* Muscle balance */}
      {muscleEntries.length > 0 && (
        <>
          <SectionHeader title="Muscle-Group Balance" />
          <Card style={{ gap: 10 }}>
            {muscleEntries.map(([group, vol]) => (
              <View key={group} style={{ gap: 4 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Text variant="caption" color="textMuted" style={{ textTransform: 'capitalize' }}>{group}</Text>
                  <Text variant="caption" color="textFaint">{Math.round(vol).toLocaleString()}</Text>
                </Row>
                <ProgressBar progress={vol / maxMuscle} color={theme.colors.calisthenics} height={6} />
              </View>
            ))}
          </Card>
        </>
      )}

      {/* Steps + recovery */}
      <SectionHeader title="Activity & Recovery" />
      <Row>
        <StatTile icon="cardio.steps" label="Avg steps" value={stepAvg.toLocaleString()} sub="per day (7d)" accent={theme.colors.accent} />
        <StatTile icon="sleep.moon" label="Avg sleep" value={sleep.avg7d != null ? `${sleep.avg7d}h` : '—'} sub="per night (7d)" accent={theme.colors.mindbody} />
        <StatTile icon="alcohol.beer" label="Alcohol" value={`${Math.round(alcohol.weekGrams)}g`} sub="this week" accent={theme.colors.warning} />
      </Row>

      {/* Body composition */}
      {bodyComp && (bodyComp.bodyFatPct != null || bodyComp.normalizedFFMI != null) && (
        <>
          <SectionHeader title="Body Composition" />
          <Row>
            {bodyComp.bodyFatPct != null && (
              <StatTile icon="stats.bodyFat" label="Body fat" value={`${bodyComp.bodyFatPct}%`} accent={theme.colors.warning} />
            )}
            {bodyComp.leanMassKg != null && (
              <StatTile icon="strength.dumbbell" label="Lean mass" value={`${bodyComp.leanMassKg}kg`} accent={theme.colors.primary} />
            )}
            {bodyComp.normalizedFFMI != null && (
              <StatTile icon="stats.progression" label="FFMI" value={`${bodyComp.normalizedFFMI}`} accent={theme.colors.accent} />
            )}
          </Row>
        </>
      )}

      {/* Smoking impact (opt-in) */}
      {smoking && (
        <>
          <SectionHeader title="Smoking Impact" action="Details" onAction={() => navigation.navigate('Smoking')} />
          <Pressable onPress={() => navigation.navigate('Smoking')}>
            <Card accent={smoking.smokeFreeStreak > 0 ? theme.colors.accent : theme.colors.warning} style={{ gap: 12 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Row gap={8} style={{ alignItems: 'center' }}>
                  <Icon icon="smoking.cigarette" size={18} color={theme.colors.warning} />
                  <Text variant="bodyStrong">~{smoking.avgPerDay}/day this week</Text>
                </Row>
                <Text variant="caption" color="textMuted">{smoking.currency}{smoking.moneyWeek.toFixed(2)} · {Math.round(smoking.lifeMinutesWeek / 60 * 10) / 10}h life (est.)</Text>
              </Row>
              <Divider />
              <Row gap={10} style={{ alignItems: 'center' }}>
                <Icon icon="smoking.lungs" size={18} color={theme.colors.info} />
                <Text variant="caption" color="textMuted" style={{ flex: 1 }}>
                  Estimated −{smoking.aerobicPenaltyPct}% aerobic capacity · +{smoking.restingHrElevationBpm} bpm resting HR
                </Text>
              </Row>
              {smokeCorr && smokeCorr.avgStepsSmokeDays !== null && smokeCorr.avgStepsCleanDays !== null && (
                <Row gap={10} style={{ alignItems: 'center' }}>
                  <Icon icon="cardio.steps" size={18} color={theme.colors.accent} />
                  <Text variant="caption" color="textMuted" style={{ flex: 1 }}>
                    Your steps: {smokeCorr.avgStepsSmokeDays.toLocaleString()} on smoke days vs{' '}
                    {smokeCorr.avgStepsCleanDays.toLocaleString()} smoke-free
                    {smokeCorr.avgStepsCleanDays > smokeCorr.avgStepsSmokeDays
                      ? ` (+${Math.round(((smokeCorr.avgStepsCleanDays - smokeCorr.avgStepsSmokeDays) / Math.max(1, smokeCorr.avgStepsSmokeDays)) * 100)}%)`
                      : ''}
                  </Text>
                </Row>
              )}
            </Card>
          </Pressable>
        </>
      )}

      {/* PRs */}
      {prs.length > 0 && (
        <>
          <SectionHeader title="Personal Records" />
          <Card style={{ gap: 8 }}>
            {prs.slice(0, 10).map((pr: PRRow, idx) => (
              <View key={`${pr.exerciseName}-${idx}`}>
                {idx > 0 ? <Divider /> : null}
                <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Row gap={8} style={{ alignItems: 'center', flex: 1 }}>
                    <Icon icon="core.pr" size={18} color={theme.colors.warning} />
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyStrong" numberOfLines={1}>{pr.exerciseName}</Text>
                      <Text variant="caption" color="textFaint">{pr.date} · est. 1RM {pr.est1RM} kg</Text>
                    </View>
                  </Row>
                  <Text variant="body" color="textMuted">
                    {pr.weightKg}kg × {pr.reps}
                  </Text>
                </Row>
              </View>
            ))}
          </Card>
        </>
      )}
    </Screen>
  );
}

function loadStats() {
  const weekSessionsList = listSessions({ since: daysAgoISO(6) });
  const weekVolume = weekSessionsList.reduce((s, x) => s + (x.totalVolume ?? 0), 0);
  const weekCalories = weekSessionsList.reduce((s, x) => s + (x.caloriesBurned ?? 0), 0);
  const weekMinutes = weekSessionsList.reduce((s, x) => s + (x.durationS ?? 0), 0) / 60;

  const weights = weighInHistory()
    .filter((w) => new Date(w.date).getTime() >= Date.now() - 180 * 86_400_000)
    .map((w, i) => ({ x: i, y: w.weightKg, label: w.date }));

  return {
    weekSessions: weekSessionsList.length,
    weekVolume,
    weekCalories,
    weekMinutes,
    streak: currentStreak(),
    calendar: trainingCalendar(84),
    volumeByWeek: weeklyVolume(8),
    typeCounts: sessionTypeCounts(30),
    weightSeries: weights,
    prs: personalRecords(20),
    muscle: muscleGroupBalance(30),
    stepAvg: weeklyStepAverage(),
    smoking: smokingImpact(),
    smokeCorr: smokingCorrelation(30),
    sleep: sleepSummary(),
    alcohol: alcoholImpact(),
    bodyComp: (() => {
      const w = weighInHistory();
      const last = w[w.length - 1];
      if (!last) return null;
      return computeBodyComp({
        weightKg: last.weightKg,
        heightCm: userHeight(),
        bodyFatPct: last.bodyFatPct,
        fatMassKg: last.fatMassKg,
        muscleMassKg: last.muscleMassKg,
        bodyWaterPct: last.bodyWaterPct,
        boneMassKg: last.boneMassKg,
      });
    })(),
  };
}

function userHeight(): number | null {
  return useUserStore.getState().user?.heightCm ?? null;
}
