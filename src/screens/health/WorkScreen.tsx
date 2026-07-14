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
import { BarChart } from '@/components/charts/BarChart';
import { Row, SectionHeader } from '@/components/ui/misc';
import { useWorkStore } from '@/stores/workStore';
import { rangeMinutes, minutesToHM } from '@/lib/time';

const FOCUS_LABELS = ['Scattered', 'Low', 'Okay', 'Focused', 'Deep work'];

export function WorkScreen() {
  const theme = useTheme();
  const { summary, today, load, log } = useWorkStore();
  const [start, setStart] = useState(today?.startTime ?? '09:00');
  const [end, setEnd] = useState(today?.endTime ?? '17:30');
  const [breakMin, setBreakMin] = useState(String(today?.breakMinutes ?? 60));
  const [quality, setQuality] = useState<number | null>(today?.quality ?? null);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const span = rangeMinutes(start, end);
  const worked = span != null ? Math.max(0, span - (parseFloat(breakMin) || 0)) : null;

  const save = () => {
    log({ startTime: start, endTime: end, breakMinutes: parseFloat(breakMin) || 0, quality });
  };

  return (
    <Screen>
      <Row gap={12} style={{ alignItems: 'center' }}>
        <Icon icon="work.briefcase" size={28} color={theme.colors.info} />
        <Text variant="h1">Work hours</Text>
      </Row>
      <Text variant="body" color="textMuted">
        Log your work day as a time range. Long hours quietly compete with sleep and recovery —
        seeing them next to your training makes the trade-offs visible.
      </Text>

      <Card style={{ gap: theme.spacing.md }}>
        <View style={{ alignItems: 'center' }}>
          <Text variant="display" style={{ color: theme.colors.info }}>
            {worked != null ? minutesToHM(worked) : '—'}
          </Text>
          <Text variant="caption" color="textMuted">worked today</Text>
        </View>
        <Row>
          <View style={{ flex: 1 }}>
            <Input label="Start" value={start} onChangeText={setStart} placeholder="09:00" keyboardType="numbers-and-punctuation" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="End" value={end} onChangeText={setEnd} placeholder="17:30" keyboardType="numbers-and-punctuation" />
          </View>
          <View style={{ width: 90 }}>
            <Input label="Break" value={breakMin} onChangeText={setBreakMin} suffix="min" keyboardType="numeric" />
          </View>
        </Row>
        <View>
          <Text variant="label" color="textMuted" style={{ marginBottom: 6 }}>Focus quality</Text>
          <Row style={{ justifyContent: 'space-between' }}>
            {FOCUS_LABELS.map((label, i) => (
              <Pressable key={i} onPress={() => setQuality(i + 1)} style={{ alignItems: 'center', flex: 1 }}>
                <Icon icon="work.focus" size={20} color={quality === i + 1 ? theme.colors.info : theme.colors.surfaceAlt} />
                <Text variant="caption" color={quality === i + 1 ? 'text' : 'textFaint'} style={{ fontSize: 8 }}>{label}</Text>
              </Pressable>
            ))}
          </Row>
        </View>
        <Button title="Save work day" icon="core.check" color={theme.colors.info} onPress={save} disabled={worked == null} />
      </Card>

      {summary && (
        <>
          <Row>
            <StatTile icon="work.clock" label="Today" value={minutesToHM(summary.todayMinutes)} accent={theme.colors.info} />
            <StatTile icon="core.calendar" label="This week" value={`${Math.round(summary.weekMinutes / 60 * 10) / 10}h`} sub={`${summary.weekDaysWorked} days`} accent={theme.colors.primary} />
            <StatTile icon="stats.progression" label="Avg day" value={minutesToHM(summary.avgMinutesPerWorkday)} accent={theme.colors.accent} />
          </Row>

          <SectionHeader title="Last 7 Days" />
          <Card>
            <BarChart
              data={summary.series.map((d) => ({ label: d.date.slice(8), value: Math.round(d.minutes / 6) / 10 }))}
              color={theme.colors.info}
              valueFormat={(v) => (v > 0 ? `${v}h` : '')}
            />
          </Card>
          {summary.avgMinutesPerWorkday > 9 * 60 && (
            <Text variant="caption" color="textFaint" center>
              You're averaging over 9h/day. Guard your sleep and training time — that's where long
              work weeks usually take their toll.
            </Text>
          )}
        </>
      )}
    </Screen>
  );
}
