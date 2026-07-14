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
import { Chip } from '@/components/ui/Chip';
import { StatTile } from '@/components/ui/StatTile';
import { Row, SectionHeader, Divider } from '@/components/ui/misc';
import { useCycleStore } from '@/stores/cycleStore';
import { PHASE_GUIDANCE, CYCLE_SYMPTOMS, computeCycle } from '@/lib/cycle';
import { todayISO, toISODate } from '@/lib/date';

export function CycleScreen() {
  const enabled = useCycleStore((s) => s.enabled);
  const load = useCycleStore((s) => s.load);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return enabled ? <CycleDashboard /> : <CycleSetup />;
}

function CycleSetup() {
  const theme = useTheme();
  const enable = useCycleStore((s) => s.enable);
  const [cycleLen, setCycleLen] = useState('28');
  const [periodLen, setPeriodLen] = useState('5');
  const [lastStart, setLastStart] = useState(todayISO());

  const start = () => {
    enable({
      avgCycleLength: parseInt(cycleLen, 10) || 28,
      avgPeriodLength: parseInt(periodLen, 10) || 5,
      lastPeriodStart: lastStart,
    });
  };

  return (
    <Screen>
      <Row gap={12} style={{ alignItems: 'center' }}>
        <Icon icon="cycle.flower" size={28} color={theme.colors.protein} />
        <Text variant="h1" style={{ flex: 1 }}>Cycle tracking</Text>
      </Row>
      <Text variant="body" color="textMuted">
        Track your menstrual cycle to see how your hormones influence energy, strength and
        recovery — and time training and nutrition to work with your body, not against it.
      </Text>
      <Card style={{ gap: theme.spacing.md }}>
        <Row>
          <View style={{ flex: 1 }}>
            <Input label="Cycle length" value={cycleLen} onChangeText={setCycleLen} suffix="days" keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Period length" value={periodLen} onChangeText={setPeriodLen} suffix="days" keyboardType="numeric" />
          </View>
        </Row>
        <Input label="Last period start (YYYY-MM-DD)" value={lastStart} onChangeText={setLastStart} />
      </Card>
      <Button title="Enable cycle tracking" icon="core.check" color={theme.colors.protein} onPress={start} />
      <Text variant="caption" color="textFaint" center>
        Educational guidance only — not medical or contraceptive advice. Stays on your device.
      </Text>
    </Screen>
  );
}

function CycleDashboard() {
  const theme = useTheme();
  const { state, profile, periods, logStart, disable, load } = useCycleStore();
  const [symptoms, setSymptoms] = useState<string[]>([]);

  if (!state || !profile) {
    return (
      <Screen>
        <Text variant="h2">Set your last period date to see your cycle.</Text>
        <Button title="Log period start today" onPress={() => { logStart(todayISO()); load(); }} />
      </Screen>
    );
  }

  const g = PHASE_GUIDANCE[state.phase];
  const toggleSymptom = (s: string) =>
    setSymptoms((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));

  const logToday = () => {
    logStart(todayISO(), { symptoms: symptoms.length ? symptoms : undefined });
    setSymptoms([]);
  };

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Row gap={10} style={{ alignItems: 'center' }}>
          <Icon icon="cycle.flower" size={26} color={g.color} />
          <Text variant="h1">Cycle</Text>
        </Row>
        <Text variant="caption" color="textMuted">Day {state.dayOfCycle} / {state.cycleLength}</Text>
      </Row>

      {/* Phase card */}
      <Card accent={g.color} style={{ gap: 8 }}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="h2" style={{ color: g.color }}>{g.title} phase</Text>
          {state.inFertileWindow && <Icon icon="cycle.ovulation" size={20} color={theme.colors.accent} />}
        </Row>
        <Text variant="caption" color="textMuted">{g.hormones}</Text>
        <Divider />
        <Row gap={8} style={{ alignItems: 'flex-start' }}>
          <Icon icon="nav.train" size={16} color={g.color} />
          <Text variant="caption" color="textMuted" style={{ flex: 1 }}>{g.training}</Text>
        </Row>
        <Row gap={8} style={{ alignItems: 'flex-start' }}>
          <Icon icon="nav.nutrition" size={16} color={g.color} />
          <Text variant="caption" color="textMuted" style={{ flex: 1 }}>{g.nutrition}</Text>
        </Row>
      </Card>

      <Row>
        <StatTile icon="cycle.calendar" label="Next period" value={`${state.daysUntilNextPeriod}d`} sub={state.nextPeriodDate.slice(5)} accent={theme.colors.protein} />
        <StatTile icon="cycle.ovulation" label="Ovulation" value={state.ovulationDate.slice(5)} sub="predicted" accent={theme.colors.accent} />
      </Row>

      {/* Calendar */}
      <SectionHeader title="This Month" />
      <Card>
        <CycleCalendar
          cycleLength={profile.avgCycleLength}
          periodLength={profile.avgPeriodLength}
          lastPeriodStart={profile.lastPeriodStart!}
        />
        <Row gap={12} style={{ marginTop: 10, flexWrap: 'wrap' }}>
          <Legend color={g.color} label="Period" />
          <Legend color={theme.colors.accent} label="Fertile" />
          <Legend color={theme.colors.warning} label="Ovulation" />
        </Row>
      </Card>

      {/* Log period */}
      <SectionHeader title="Log Period Start" />
      <Card style={{ gap: 10 }}>
        <Text variant="caption" color="textMuted">Tag today's symptoms (optional), then log.</Text>
        <Row gap={6} style={{ flexWrap: 'wrap' }}>
          {CYCLE_SYMPTOMS.map((s) => (
            <Chip key={s} label={s} active={symptoms.includes(s)} color={g.color} onPress={() => toggleSymptom(s)} small />
          ))}
        </Row>
        <Button title="Period started today" icon="cycle.drop" color={theme.colors.protein} onPress={logToday} />
      </Card>

      {/* History */}
      {periods.length > 0 && (
        <>
          <SectionHeader title="History" />
          <Card style={{ gap: 6 }}>
            {periods.slice(0, 8).map((p, idx) => (
              <View key={p.id}>
                {idx > 0 ? <Divider /> : null}
                <Row style={{ justifyContent: 'space-between' }}>
                  <Text variant="body">{p.startDate}</Text>
                  <Text variant="caption" color="textMuted">
                    {p.flow ?? ''}{p.symptoms ? ` · ${(JSON.parse(p.symptoms) as string[]).length} symptoms` : ''}
                  </Text>
                </Row>
              </View>
            ))}
          </Card>
        </>
      )}

      <Button title="Turn off cycle tracking" variant="ghost" color={theme.colors.textMuted} onPress={disable} />
    </Screen>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <Row gap={5} style={{ alignItems: 'center' }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
      <Text variant="caption" color="textFaint">{label}</Text>
    </Row>
  );
}

function CycleCalendar({
  cycleLength,
  periodLength,
  lastPeriodStart,
}: {
  cycleLength: number;
  periodLength: number;
  lastPeriodStart: string;
}) {
  const theme = useTheme();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = (first.getDay() + 6) % 7; // Monday-first
  const todayStr = todayISO();

  const cells: Array<{ iso: string; day: number } | null> = [
    ...Array(leading).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const iso = toISODate(new Date(year, month, i + 1));
      return { iso, day: i + 1 };
    }),
  ];

  // Classify a date using the cycle model.
  const classify = (iso: string): 'period' | 'fertile' | 'ovulation' | null => {
    const st = computeCycle({ lastPeriodStart, cycleLength, periodLength, today: iso });
    if (st.inPeriod) return 'period';
    if (iso === st.ovulationDate) return 'ovulation';
    if (iso >= st.fertileWindow.start && iso <= st.fertileWindow.end) return 'fertile';
    return null;
  };

  const colorFor = (kind: ReturnType<typeof classify>) => {
    switch (kind) {
      case 'period': return theme.colors.protein;
      case 'ovulation': return theme.colors.warning;
      case 'fertile': return theme.colors.accent;
      default: return 'transparent';
    }
  };

  const weeks: Array<Array<{ iso: string; day: number } | null>> = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <View style={{ gap: 4 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <Text key={i} variant="caption" color="textFaint" style={{ width: 32, textAlign: 'center' }}>{d}</Text>
        ))}
      </Row>
      {weeks.map((week, wi) => (
        <Row key={wi} style={{ justifyContent: 'space-between' }}>
          {Array.from({ length: 7 }).map((_, di) => {
            const cell = week[di];
            if (!cell) return <View key={di} style={{ width: 32, height: 32 }} />;
            const kind = classify(cell.iso);
            const bg = colorFor(kind);
            const isToday = cell.iso === todayStr;
            return (
              <View
                key={di}
                style={{
                  width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: bg === 'transparent' ? 'transparent' : bg + '33',
                  borderWidth: isToday ? 2 : bg === 'transparent' ? 0 : 1,
                  borderColor: isToday ? theme.colors.text : bg,
                }}
              >
                <Text variant="caption" color={kind ? 'text' : 'textMuted'}>{cell.day}</Text>
              </View>
            );
          })}
        </Row>
      ))}
    </View>
  );
}
