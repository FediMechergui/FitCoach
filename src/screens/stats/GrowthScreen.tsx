import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { BarChart } from '@/components/charts/BarChart';
import { Row, SectionHeader, Divider, Badge, EmptyState } from '@/components/ui/misc';
import { growthReport, type GrowthReport } from '@/repositories/growthRepo';
import {
  GROWTH_STATUS_COLOR,
  GROWTH_STATUS_LABEL,
  OPTIMAL_SETS_MAX,
  OPTIMAL_SETS_MIN,
} from '@/lib/growth';
import { MUSCLE_LABELS } from '@/data/exercises';
import { fmtNum } from '@/lib/format';

export function GrowthScreen() {
  const theme = useTheme();
  const [report, setReport] = useState<GrowthReport | null>(null);

  useFocusEffect(
    useCallback(() => {
      setReport(growthReport());
    }, [])
  );

  if (!report) return <Screen><Text>Loading…</Text></Screen>;

  const trained = report.muscles.filter((m) => m.avgSetsPerWeek4w > 0);
  const { gates } = report;

  if (trained.length === 0) {
    return (
      <Screen>
        <Text variant="h1">Muscle growth</Text>
        <EmptyState
          icon="stats.muscleMap"
          title="No strength training logged yet"
          message="Log a few lifting sessions and FitCoach will score each muscle's growth conditions."
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Row gap={12} style={{ alignItems: 'center' }}>
        <Icon icon="stats.muscleMap" size={28} color={theme.colors.accent} />
        <Text variant="h1">Muscle growth</Text>
      </Row>
      <Text variant="body" color="textMuted">
        An honest readout: how closely your real logs match the conditions research ties to
        hypertrophy — volume (10–20 hard sets/muscle/week), progressive overload, recovery,
        protein and sleep. No invented numbers.
      </Text>

      {/* Growth gates */}
      <SectionHeader title="Growth conditions" />
      <Card style={{ gap: 10 }}>
        <GateRow
          ok={gates.proteinOk}
          label="Protein ≥ 1.6 g/kg"
          detail={gates.proteinGPerKg != null ? `${fmtNum(gates.proteinGPerKg ?? 0)} g/kg (7d avg)` : 'no nutrition logs this week'}
        />
        <Divider />
        <GateRow
          ok={gates.sleepOk}
          label="Sleep ≥ 7 h"
          detail={gates.avgSleep != null ? `${fmtNum(gates.avgSleep ?? 0)} h avg` : 'no sleep logs this week'}
        />
        <Divider />
        <GateRow
          ok={gates.calorieOk}
          label="Not in a harsh deficit"
          detail={gates.calorieOk ? 'energy supports growth' : 'eating far below target — expect maintenance at best'}
        />
      </Card>

      {/* Realistic rate */}
      <Card accent={theme.colors.accent}>
        <Row gap={10} style={{ alignItems: 'flex-start' }}>
          <Icon icon="stats.progression" size={20} color={theme.colors.accent} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">
              Realistic gain at your level: {report.gainRange.min}–{report.gainRange.max} kg muscle / month
            </Text>
            <Text variant="caption" color="textMuted">
              {report.gainRange.label} · training age ~{report.trainingAgeMonths} months. Population
              averages under good conditions — a range, not a promise.
            </Text>
          </View>
        </Row>
      </Card>

      {/* Per-muscle scores */}
      <SectionHeader title="Per muscle (last 4 weeks)" />
      {trained.map((m) => {
        const color = GROWTH_STATUS_COLOR[m.status];
        return (
          <Card key={m.muscle} accent={color} style={{ gap: 8 }}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Text variant="h3">{MUSCLE_LABELS[m.muscle] ?? m.muscle}</Text>
              <Badge label={GROWTH_STATUS_LABEL[m.status]} color={color} />
            </Row>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text variant="caption" color="textMuted">
                ~{fmtNum(m.avgSetsPerWeek4w)} sets/wk (this week: {m.setsThisWeek})
              </Text>
              <Text variant="caption" color="textMuted">
                growth zone {OPTIMAL_SETS_MIN}–{OPTIMAL_SETS_MAX}
              </Text>
            </Row>
            {/* Sets bar against the 10–20 band */}
            <ProgressBar progress={m.avgSetsPerWeek4w / OPTIMAL_SETS_MAX} color={color} />
            <Row style={{ justifyContent: 'space-between' }}>
              <MiniScore label="Volume" value={m.volumeScore} />
              <MiniScore label="Overload" value={m.overloadScore} />
              <MiniScore label="Recovery" value={m.recoveryScore} />
              <MiniScore label="Score" value={m.score} bold />
            </Row>
            {m.overloadTrendPct != null && (
              <Text variant="caption" color={m.overloadTrendPct >= 0 ? 'success' : 'warning'}>
                Volume trend: {m.overloadTrendPct >= 0 ? '+' : ''}{m.overloadTrendPct}% vs previous 2 weeks
              </Text>
            )}
            {m.notes.slice(0, 2).map((n, i) => (
              <Text key={i} variant="caption" color="textFaint">• {n}</Text>
            ))}
          </Card>
        );
      })}

      {/* Weekly total sets */}
      <SectionHeader title="Total hard sets per week" />
      <Card>
        <BarChart
          data={report.weeklySetSeries.map((w) => ({ label: w.weekLabel, value: w.sets }))}
          color={theme.colors.primary}
          valueFormat={(v) => (v > 0 ? `${Math.round(v)}` : '')}
        />
      </Card>

      <Text variant="caption" color="textFaint" center>
        Visible hypertrophy typically needs 8–12+ weeks of these conditions held consistently.
      </Text>
    </Screen>
  );
}

function GateRow({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  const theme = useTheme();
  return (
    <Row gap={10} style={{ alignItems: 'center' }}>
      <Icon icon={ok ? 'core.check' : 'core.info'} size={18} color={ok ? theme.colors.success : theme.colors.warning} />
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong">{label}</Text>
        <Text variant="caption" color="textMuted">{detail}</Text>
      </View>
    </Row>
  );
}

function MiniScore({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text variant={bold ? 'h3' : 'bodyStrong'}>{value}</Text>
      <Text variant="caption" color="textFaint" style={{ fontSize: 10 }}>{label}</Text>
    </View>
  );
}
