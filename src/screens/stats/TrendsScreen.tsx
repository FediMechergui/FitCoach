import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { LineChart } from '@/components/charts/LineChart';
import { BarChart } from '@/components/charts/BarChart';
import { Row, SectionHeader } from '@/components/ui/misc';
import { trendsData, type TrendsData, type WeekPoint } from '@/repositories/trendsRepo';
import { BODY_TYPE_LABELS } from '@/lib/bodyType';

/**
 * The long-view: 12 weeks of everything, charted week by week — training,
 * nutrition, rest, habits and their footprint on the same timeline. Weeks with
 * no logs plot as zero; charts appear once a signal has any data.
 */
export function TrendsScreen() {
  const theme = useTheme();
  const [data, setData] = useState<TrendsData | null>(null);

  useFocusEffect(
    useCallback(() => {
      setData(trendsData());
    }, [])
  );

  if (!data) return <Screen><Text>Loading…</Text></Screen>;

  const has = (pts: WeekPoint[]) => pts.some((p) => p.samples > 0);
  const line = (pts: WeekPoint[]) => pts.map((p, i) => ({ x: i, y: p.value, label: p.label }));
  const bars = (pts: WeekPoint[]) => pts.map((p) => ({ label: p.label.replace('w', ''), value: p.value }));

  return (
    <Screen>
      <Row gap={12} style={{ alignItems: 'center' }}>
        <Icon icon="stats.progression" size={28} color={theme.colors.primary} />
        <Text variant="h1">Trends — 12 weeks</Text>
      </Row>

      {/* Body */}
      {has(data.weight) && (
        <ChartCard title="Body weight (kg, weekly avg)" color={theme.colors.info}>
          <LineChart data={line(data.weight)} color={theme.colors.info} yFormat={(v) => v.toFixed(0)} />
        </ChartCard>
      )}

      {/* Fat distribution by body type */}
      <SectionHeader title="Fat distribution" />
      <Card accent={theme.colors.warning} style={{ gap: 8 }}>
        <Text variant="bodyStrong">
          {data.bodyType ? BODY_TYPE_LABELS[data.bodyType as keyof typeof BODY_TYPE_LABELS] ?? data.bodyType : 'Body type not set'}
        </Text>
        <Text variant="caption" color="textMuted">
          {data.bodyType === 'endomorph'
            ? 'Endomorph-leaning bodies typically store fat centrally (abdomen first — “android” pattern). Waist trend is your most honest fat-loss signal.'
            : data.bodyType === 'ectomorph'
              ? 'Ectomorph-leaning bodies store fat late and lose it fast; visible changes show up around the midsection last.'
              : 'Mesomorph-leaning bodies distribute gains and losses relatively evenly; the waist-to-hip ratio tracks changes well.'}
          {data.sex === 'female'
            ? ' Female physiology biases storage toward hips/thighs (“gynoid” pattern) — normal and partly protective.'
            : ''}
        </Text>
        <Row style={{ justifyContent: 'space-between' }}>
          <Mini label="Waist" value={data.latestWaist != null ? `${data.latestWaist} cm` : '—'} />
          <Mini label="Hip" value={data.latestHip != null ? `${data.latestHip} cm` : '—'} />
          <Mini label="WHR" value={data.whr != null ? `${data.whr}` : '—'} />
          <Mini
            label="Waist 12w"
            value={data.waistChange12w != null ? `${data.waistChange12w > 0 ? '+' : ''}${data.waistChange12w} cm` : '—'}
          />
        </Row>
        <Text variant="caption" color="textFaint">
          Add waist/hip in Body composition weigh-ins to track this precisely. Spot-reduction
          isn't a thing — distribution is genetic; the deficit chooses the order.
        </Text>
      </Card>

      {/* Nutrition */}
      <SectionHeader title="Nutrition" />
      {has(data.calories) && (
        <ChartCard
          title={`Calories (avg/logged day${data.calorieTarget ? ` · target ${data.calorieTarget}` : ''})`}
          color={theme.colors.calories}
        >
          <LineChart data={line(data.calories)} color={theme.colors.calories} yFormat={(v) => `${Math.round(v)}`} />
        </ChartCard>
      )}
      {has(data.protein) && (
        <ChartCard title="Protein (g, avg/logged day)" color={theme.colors.protein}>
          <LineChart data={line(data.protein)} color={theme.colors.protein} yFormat={(v) => `${Math.round(v)}`} />
        </ChartCard>
      )}
      {has(data.water) && (
        <ChartCard title="Water (L, avg/logged day)" color={theme.colors.water}>
          <LineChart data={line(data.water)} color={theme.colors.water} yFormat={(v) => v.toFixed(1)} />
        </ChartCard>
      )}
      {has(data.caffeine) && (
        <ChartCard title="Caffeine (mg, avg/logged day)" color={theme.colors.caffeine}>
          <LineChart data={line(data.caffeine)} color={theme.colors.caffeine} yFormat={(v) => `${Math.round(v)}`} />
        </ChartCard>
      )}

      {/* Training */}
      <SectionHeader title="Training" />
      {has(data.volume) && (
        <ChartCard title="Lifting volume (kg/week)" color={theme.colors.primary}>
          <BarChart data={bars(data.volume)} color={theme.colors.primary} valueFormat={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : `${Math.round(v)}`)} />
        </ChartCard>
      )}
      {has(data.activeMinutes) && (
        <ChartCard title="Active minutes / week" color={theme.colors.accent}>
          <BarChart data={bars(data.activeMinutes)} color={theme.colors.accent} valueFormat={(v) => `${Math.round(v)}`} />
        </ChartCard>
      )}
      {has(data.steps) && (
        <ChartCard title="Steps (avg/day)" color={theme.colors.accent}>
          <LineChart data={line(data.steps)} color={theme.colors.accent} yFormat={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : `${Math.round(v)}`)} />
        </ChartCard>
      )}

      {/* Rest & recovery */}
      <SectionHeader title="Rest & recovery" />
      {has(data.sleep) && (
        <ChartCard title="Sleep (h, avg/logged night)" color={theme.colors.mindbody}>
          <LineChart data={line(data.sleep)} color={theme.colors.mindbody} yFormat={(v) => v.toFixed(1)} />
        </ChartCard>
      )}
      {has(data.mood) && (
        <ChartCard title="Post-session mood (1–5)" color={theme.colors.meditation}>
          <LineChart data={line(data.mood)} color={theme.colors.meditation} yFormat={(v) => v.toFixed(1)} />
        </ChartCard>
      )}
      {has(data.workHours) && (
        <ChartCard title="Work hours / week" color={theme.colors.info}>
          <BarChart data={bars(data.workHours)} color={theme.colors.info} valueFormat={(v) => `${Math.round(v)}h`} />
        </ChartCard>
      )}

      {/* Habits impact */}
      <SectionHeader title="Habits impact" />
      {has(data.alcohol) && (
        <ChartCard title="Alcohol (g/week)" color={theme.colors.warning}>
          <BarChart data={bars(data.alcohol)} color={theme.colors.warning} valueFormat={(v) => `${Math.round(v)}`} />
        </ChartCard>
      )}
      {has(data.cigarettes) && (
        <ChartCard title="Cigarettes / week" color={theme.colors.warning}>
          <BarChart data={bars(data.cigarettes)} color={theme.colors.warning} valueFormat={(v) => `${Math.round(v)}`} />
        </ChartCard>
      )}
      {has(data.habitMinutes) && (
        <ChartCard title="Tracked-habit minutes / week" color={theme.colors.calisthenics}>
          <BarChart data={bars(data.habitMinutes)} color={theme.colors.calisthenics} valueFormat={(v) => `${Math.round(v)}`} />
        </ChartCard>
      )}

      <Text variant="caption" color="textFaint" center>
        Weeks with nothing logged plot as zero — consistency of logging is itself visible here.
      </Text>
    </Screen>
  );
}

function ChartCard({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <Card accent={color} style={{ gap: 8 }}>
      <Text variant="label" color="textMuted">{title}</Text>
      {children}
    </Card>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text variant="bodyStrong">{value}</Text>
      <Text variant="caption" color="textFaint" style={{ fontSize: 10 }}>{label}</Text>
    </View>
  );
}
