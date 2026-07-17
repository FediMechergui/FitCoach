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
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Pressable } from 'react-native';
import {
  trendsData,
  type Granularity,
  type TrendsData,
  type WeekPoint,
} from '@/repositories/trendsRepo';
import { BODY_TYPE_LABELS } from '@/lib/bodyType';
import { fmtNum } from '@/lib/format';

/**
 * The long-view: 12 weeks of everything, charted week by week — training,
 * nutrition, rest, habits and their footprint on the same timeline. Weeks with
 * no logs plot as zero; charts appear once a signal has any data.
 */
export function TrendsScreen() {
  const theme = useTheme();
  const [granularity, setGranularity] = useState<Granularity>('weekly');
  const [page, setPage] = useState(0);
  const [data, setData] = useState<TrendsData | null>(null);

  const reload = useCallback(
    (g: Granularity, p: number) => setData(trendsData({ granularity: g, page: p })),
    []
  );

  useFocusEffect(
    useCallback(() => {
      reload(granularity, page);
    }, [reload, granularity, page])
  );

  if (!data) return <Screen><Text>Loading…</Text></Screen>;

  const has = (pts: WeekPoint[]) => pts.some((p) => p.samples > 0);
  const line = (pts: WeekPoint[]) => pts.map((p, i) => ({ x: i, y: p.value, label: p.label }));
  // Bar labels: day-of-month for daily, week-start day/month for weekly.
  const bars = (pts: WeekPoint[]) =>
    pts.map((p) => ({ label: granularity === 'daily' ? p.label.slice(0, 2) : p.label, value: p.value }));
  const per = granularity === 'daily' ? 'day' : 'week';

  return (
    <Screen>
      <Row gap={12} style={{ alignItems: 'center' }}>
        <Icon icon="stats.progression" size={28} color={theme.colors.primary} />
        <Text variant="h1">Trends</Text>
      </Row>

      {/* Granularity + time navigation */}
      <SegmentedControl
        options={[
          { value: 'daily', label: 'Daily (14 days)' },
          { value: 'weekly', label: 'Weekly (12 weeks)' },
        ]}
        value={granularity}
        onChange={(g) => {
          setGranularity(g);
          setPage(0);
        }}
      />
      <Card>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Pressable onPress={() => setPage(page + 1)} hitSlop={10} style={{ padding: 4 }}>
            <Icon icon="core.back" size={22} color={theme.colors.primary} />
          </Pressable>
          <View style={{ alignItems: 'center' }}>
            <Text variant="bodyStrong">{data.rangeLabel}</Text>
            <Text variant="caption" color="textFaint">
              {page === 0 ? 'latest' : `${page} window${page === 1 ? '' : 's'} back`} · per {per}
            </Text>
          </View>
          <Pressable
            onPress={() => setPage(Math.max(0, page - 1))}
            hitSlop={10}
            style={{ padding: 4, opacity: page === 0 ? 0.3 : 1 }}
            disabled={page === 0}
          >
            <Icon icon="core.forward" size={22} color={theme.colors.primary} />
          </Pressable>
        </Row>
      </Card>

      {/* Body */}
      {has(data.weight) && (
        <ChartCard title={`Body weight (kg, avg per ${per})`} color={theme.colors.info}>
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
          <Mini label="Waist" value={data.latestWaist != null ? `${fmtNum(data.latestWaist)} cm` : '—'} />
          <Mini label="Hip" value={data.latestHip != null ? `${fmtNum(data.latestHip)} cm` : '—'} />
          <Mini label="WHR" value={data.whr != null ? `${fmtNum(data.whr)}` : '—'} />
          <Mini
            label="Waist Δ (window)"
            value={data.waistChange12w != null ? `${data.waistChange12w > 0 ? '+' : ''}${fmtNum(data.waistChange12w)} cm` : '—'}
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
        <ChartCard title={`Lifting volume (kg / ${per})`} color={theme.colors.primary}>
          <BarChart data={bars(data.volume)} color={theme.colors.primary} valueFormat={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : `${Math.round(v)}`)} />
        </ChartCard>
      )}
      {has(data.activeMinutes) && (
        <ChartCard title={`Active minutes / ${per}`} color={theme.colors.accent}>
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
        <ChartCard title={`Work hours / ${per}`} color={theme.colors.info}>
          <BarChart data={bars(data.workHours)} color={theme.colors.info} valueFormat={(v) => `${Math.round(v)}h`} />
        </ChartCard>
      )}

      {/* Habits impact */}
      <SectionHeader title="Habits impact" />
      {has(data.alcohol) && (
        <ChartCard title={`Alcohol (g / ${per})`} color={theme.colors.warning}>
          <BarChart data={bars(data.alcohol)} color={theme.colors.warning} valueFormat={(v) => `${Math.round(v)}`} />
        </ChartCard>
      )}
      {has(data.cigarettes) && (
        <ChartCard title={`Cigarettes / ${per}`} color={theme.colors.warning}>
          <BarChart data={bars(data.cigarettes)} color={theme.colors.warning} valueFormat={(v) => `${Math.round(v)}`} />
        </ChartCard>
      )}
      {has(data.habitMinutes) && (
        <ChartCard title={`Tracked-habit minutes / ${per}`} color={theme.colors.calisthenics}>
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
