import React, { useCallback, useMemo, useState } from 'react';
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
import type { AlcoholType } from '@/db/schema';
import { useAlcoholStore } from '@/stores/alcoholStore';
import { ALCOHOL_PRESETS, computeDrink, bacLabel } from '@/lib/alcohol';

const TYPES: AlcoholType[] = ['beer', 'wine', 'spirit', 'cocktail', 'other'];

export function AlcoholScreen() {
  const theme = useTheme();
  const { today, impact, load, add, remove } = useAlcoholStore();
  const [type, setType] = useState<AlcoholType>('beer');
  const [volume, setVolume] = useState(String(ALCOHOL_PRESETS.beer.defaultVolumeMl));
  const [abv, setAbv] = useState(String(ALCOHOL_PRESETS.beer.defaultAbv));

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const selectType = (t: AlcoholType) => {
    setType(t);
    setVolume(String(ALCOHOL_PRESETS[t].defaultVolumeMl));
    setAbv(String(ALCOHOL_PRESETS[t].defaultAbv));
  };

  const preview = useMemo(
    () => computeDrink(type, parseFloat(volume) || 0, parseFloat(abv) || 0),
    [type, volume, abv]
  );

  const save = () => add(type, parseFloat(volume) || 0, parseFloat(abv) || 0, ALCOHOL_PRESETS[type].label);

  const overLimit = impact ? impact.weekGrams > impact.weeklyLimitG : false;

  return (
    <Screen>
      <Row gap={12} style={{ alignItems: 'center' }}>
        <Icon icon="alcohol.beer" size={28} color={theme.colors.warning} />
        <Text variant="h1">Alcohol</Text>
      </Row>

      {/* Logger */}
      <Card style={{ gap: theme.spacing.md }}>
        <Text variant="h3">Log a drink</Text>
        <Row gap={6} style={{ flexWrap: 'wrap' }}>
          {TYPES.map((t) => (
            <Pressable key={t} onPress={() => selectType(t)} style={{ flexGrow: 1 }}>
              <View
                style={{
                  paddingVertical: 10,
                  borderRadius: theme.radius.md,
                  backgroundColor: type === t ? theme.colors.warning : theme.colors.surfaceAlt,
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <Icon icon={ALCOHOL_PRESETS[t].icon} size={20} color={type === t ? '#fff' : theme.colors.textMuted} />
                <Text variant="caption" color={type === t ? '#fff' : theme.colors.textMuted} style={{ fontSize: 9 }}>
                  {ALCOHOL_PRESETS[t].label}
                </Text>
              </View>
            </Pressable>
          ))}
        </Row>
        <Row>
          <View style={{ flex: 1 }}>
            <Input label="Volume" value={volume} onChangeText={setVolume} suffix="ml" keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label={`ABV (${ALCOHOL_PRESETS[type].abvRange[0]}–${ALCOHOL_PRESETS[type].abvRange[1]}%)`} value={abv} onChangeText={setAbv} suffix="%" keyboardType="numeric" />
          </View>
        </Row>
        <Row style={{ justifyContent: 'space-around' }}>
          <Mini label="Alcohol" value={`${preview.grams}g`} />
          <Mini label="Std drinks" value={`${preview.standardDrinks}`} />
          <Mini label="Calories" value={`${preview.totalCalories}`} />
        </Row>
        <Button title="Add drink" icon="core.add" color={theme.colors.warning} onPress={save} />
      </Card>

      {/* Today + BAC */}
      {impact && (
        <>
          <Row>
            <StatTile icon="alcohol.other" label="Today" value={`${impact.todayGrams}g`} sub={`${impact.todayDrinks} drinks`} accent={theme.colors.warning} />
            <StatTile icon="nutrition.calories" label="Alcohol kcal" value={`${impact.todayCalories}`} sub="today" accent={theme.colors.calories} />
            <StatTile icon="alcohol.bac" label="Est. peak BAC" value={`${impact.estimatedPeakBAC.toFixed(3)}%`} sub={`${bacLabel(impact.estimatedPeakBAC)}`} accent={impact.estimatedPeakBAC >= 0.05 ? theme.colors.danger : theme.colors.textMuted} />
          </Row>

          {impact.estimatedPeakBAC > 0 && (
            <Card accent={theme.colors.info}>
              <Text variant="caption" color="textMuted">
                Estimated peak BAC ≈ {impact.estimatedPeakBAC.toFixed(3)}% (Widmark). Roughly{' '}
                {impact.hoursToSober}h to return to zero. Estimate only — never use to decide if you're fit to drive.
              </Text>
            </Card>
          )}

          {/* Weekly */}
          <SectionHeader title="This Week" />
          <Card style={{ gap: 10 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text variant="bodyStrong">{impact.weekGrams}g · {impact.weekDrinks} std drinks</Text>
              <Badge label={overLimit ? 'Over guideline' : `${impact.dryDays7d} dry days`} color={overLimit ? theme.colors.danger : theme.colors.success} />
            </Row>
            <ProgressBar progress={impact.weekGrams / impact.weeklyLimitG} color={overLimit ? theme.colors.danger : theme.colors.warning} />
            <Text variant="caption" color="textFaint">
              Low-risk guideline ≈ {impact.weeklyLimitG}g/week · {impact.weekCalories} kcal from alcohol this week.
              Alcohol suppresses muscle protein synthesis and deep sleep, blunting recovery.
            </Text>
          </Card>

          <Card>
            <BarChart
              data={impact.series.map((d) => ({ label: d.date.slice(8), value: d.grams }))}
              color={theme.colors.warning}
              valueFormat={(v) => (v > 0 ? `${Math.round(v)}` : '')}
            />
          </Card>
        </>
      )}

      {/* Today entries */}
      {today && today.entries.length > 0 && (
        <Card style={{ gap: 6 }}>
          <Text variant="label" color="textMuted">Today's drinks</Text>
          {today.entries.map((e, idx) => (
            <View key={e.id}>
              {idx > 0 ? <Divider /> : null}
              <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Row gap={8} style={{ alignItems: 'center' }}>
                  <Icon icon={ALCOHOL_PRESETS[e.type].icon} size={16} color={theme.colors.textMuted} />
                  <Text variant="caption" color="textMuted">
                    {ALCOHOL_PRESETS[e.type].label} · {Math.round(e.volumeMl)}ml @ {e.abvPct}% · {e.alcoholGrams}g
                  </Text>
                </Row>
                <Pressable onPress={() => remove(e.id)} hitSlop={8}>
                  <Icon icon="core.close" size={14} color={theme.colors.textFaint} />
                </Pressable>
              </Row>
            </View>
          ))}
        </Card>
      )}
    </Screen>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      <Text variant="bodyStrong">{value}</Text>
      <Text variant="caption" color="textFaint">{label}</Text>
    </View>
  );
}
