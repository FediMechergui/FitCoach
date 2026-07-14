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
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { BarChart } from '@/components/charts/BarChart';
import { Row, SectionHeader, Divider } from '@/components/ui/misc';
import { useSleepStore } from '@/stores/sleepStore';
import { sleepTrainingCorrelation } from '@/repositories/sleepRepo';
import { assessNight, SLEEP_QUALITY_LABELS } from '@/lib/sleep';
import { rangeMinutes, minutesToHM, minutesToHours } from '@/lib/time';

const HOUR_OPTIONS = [4, 5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 10];

export function SleepScreen() {
  const theme = useTheme();
  const { summary, lastNight, load, log, logRange } = useSleepStore();
  const [mode, setMode] = useState<'quick' | 'range'>('quick');
  const [hours, setHours] = useState(lastNight ?? 8);
  const [bedtime, setBedtime] = useState('23:30');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [quality, setQuality] = useState<number | null>(null);
  const [correlation, setCorrelation] = useState(() => sleepTrainingCorrelation(30));

  useFocusEffect(
    useCallback(() => {
      load();
      setCorrelation(sleepTrainingCorrelation(30));
    }, [load])
  );

  const rangeMins = rangeMinutes(bedtime, wakeTime);
  const effectiveHours = mode === 'range' && rangeMins != null ? minutesToHours(rangeMins) : hours;

  const save = () => {
    if (mode === 'range') logRange(bedtime, wakeTime, quality);
    else log(hours, quality);
    setCorrelation(sleepTrainingCorrelation(30));
  };

  const assessment = assessNight(effectiveHours);
  const perfPct = summary ? Math.round(summary.performanceFactor * 100) : 100;

  return (
    <Screen>
      <Row gap={12} style={{ alignItems: 'center' }}>
        <Icon icon="sleep.moon" size={28} color={theme.colors.mindbody} />
        <Text variant="h1">Sleep</Text>
      </Row>

      {/* Log last night */}
      <Card style={{ gap: theme.spacing.md }}>
        <Text variant="h3">How did you sleep?</Text>
        <SegmentedControl
          options={[
            { value: 'quick', label: 'Quick hours' },
            { value: 'range', label: 'Bedtime → wake' },
          ]}
          value={mode}
          onChange={setMode}
          accent={theme.colors.mindbody}
        />
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Text variant="display" style={{ color: theme.colors.mindbody }}>
            {mode === 'range' && rangeMins != null ? minutesToHM(rangeMins) : `${hours}h`}
          </Text>
          <Text variant="caption" color={assessment.status === 'optimal' ? 'success' : 'warning'}>
            {mode === 'range' && rangeMins == null ? 'Enter times as HH:MM' : assessment.label}
          </Text>
        </View>

        {mode === 'quick' ? (
          <Row gap={6} style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
            {HOUR_OPTIONS.map((h) => (
              <Pressable key={h} onPress={() => setHours(h)}>
                <View
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: theme.radius.md,
                    backgroundColor: hours === h ? theme.colors.mindbody : theme.colors.surfaceAlt,
                  }}
                >
                  <Text variant="label" color={hours === h ? '#fff' : theme.colors.textMuted}>
                    {h}h
                  </Text>
                </View>
              </Pressable>
            ))}
          </Row>
        ) : (
          <Row>
            <View style={{ flex: 1 }}>
              <Input label="Bedtime" value={bedtime} onChangeText={setBedtime} placeholder="23:30" keyboardType="numbers-and-punctuation" />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Wake time" value={wakeTime} onChangeText={setWakeTime} placeholder="07:00" keyboardType="numbers-and-punctuation" />
            </View>
          </Row>
        )}
        <View>
          <Text variant="label" color="textMuted" style={{ marginBottom: 6 }}>Quality</Text>
          <Row style={{ justifyContent: 'space-between' }}>
            {SLEEP_QUALITY_LABELS.map((label, i) => (
              <Pressable key={i} onPress={() => setQuality(i + 1)} style={{ alignItems: 'center', flex: 1 }}>
                <Icon
                  icon="sleep.quality"
                  size={22}
                  color={quality === i + 1 ? theme.colors.mindbody : theme.colors.surfaceAlt}
                />
                <Text variant="caption" color={quality === i + 1 ? 'text' : 'textFaint'} style={{ fontSize: 9 }}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </Row>
        </View>
        <Button
          title="Save last night"
          icon="core.check"
          color={theme.colors.mindbody}
          onPress={save}
          disabled={mode === 'range' && rangeMins == null}
        />
      </Card>

      {/* Summary */}
      {summary && (
        <>
          <Row>
            <StatTile icon="sleep.bed" label="Avg (7d)" value={summary.avg7d != null ? `${summary.avg7d}h` : '—'} accent={theme.colors.mindbody} />
            <StatTile icon="sleep.debt" label="Sleep debt" value={`${summary.debt7d}h`} sub="vs 8h target" accent={theme.colors.warning} />
            <StatTile icon="stats.progression" label="Readiness" value={`${perfPct}%`} sub="performance" accent={perfPct >= 95 ? theme.colors.success : theme.colors.warning} />
          </Row>

          <SectionHeader title="Last 7 Nights" />
          <Card>
            <BarChart
              data={summary.series.map((d) => ({ label: d.date.slice(8), value: d.hours }))}
              color={theme.colors.mindbody}
              valueFormat={(v) => (v > 0 ? `${v}` : '')}
            />
          </Card>
        </>
      )}

      {/* Correlation with training */}
      {(correlation.goodSleepAvgSessionCal !== null || correlation.poorSleepAvgSessionCal !== null) && (
        <>
          <SectionHeader title="Sleep vs Your Training" />
          <Card style={{ gap: 10 }}>
            <Text variant="caption" color="textMuted">
              Average session calories on the days after good vs poor sleep — from your own logs.
            </Text>
            {correlation.goodSleepAvgSessionCal !== null && (
              <Row style={{ justifyContent: 'space-between' }}>
                <Row gap={8} style={{ alignItems: 'center' }}>
                  <Icon icon="sleep.quality" size={16} color={theme.colors.success} />
                  <Text variant="body">After ≥7h sleep</Text>
                </Row>
                <Text variant="bodyStrong">{correlation.goodSleepAvgSessionCal} kcal</Text>
              </Row>
            )}
            {correlation.poorSleepAvgSessionCal !== null && (
              <>
                <Divider />
                <Row style={{ justifyContent: 'space-between' }}>
                  <Row gap={8} style={{ alignItems: 'center' }}>
                    <Icon icon="sleep.debt" size={16} color={theme.colors.warning} />
                    <Text variant="body">After &lt;6h sleep</Text>
                  </Row>
                  <Text variant="bodyStrong">{correlation.poorSleepAvgSessionCal} kcal</Text>
                </Row>
              </>
            )}
          </Card>
        </>
      )}

      <Text variant="caption" color="textFaint" center>
        Sleep is your #1 recovery lever — it drives strength, fat loss and mood more than almost
        anything else you track.
      </Text>
    </Screen>
  );
}
