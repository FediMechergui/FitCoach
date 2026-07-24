import React, { useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { MacroDonut } from '@/components/charts/MacroDonut';
import { Row, SectionHeader, Divider, Badge } from '@/components/ui/misc';
import type { RootStackParamList } from '@/navigation/types';
import { MEAL_TYPES, type MealType } from '@/db/schema';
import { useNutritionStore } from '@/stores/nutritionStore';
import { useUserStore } from '@/stores/userStore';
import { useSmokingStore } from '@/stores/smokingStore';
import { currentFastingState } from '@/repositories/faithRepo';
import { dayMicros } from '@/repositories/microsRepo';
import { microGaps } from '@/lib/micros';
import { minutesToHM } from '@/lib/time';
import type { FastingState } from '@/lib/fasting';
import { BEVERAGE_PRESETS, WATER_QUICK_ADD } from '@/data/beverages';
import { mealIcon } from '@/constants/icon-map';
import { addDays, todayISO } from '@/lib/date';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snacks',
};

export function NutritionScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const { date, food, beverages, setDate, refresh, removeFood, addDrink, removeDrink } = useNutritionStore();
  const goal = useUserStore((s) => s.goal);
  const smokingEnabled = useSmokingStore((s) => s.enabled);
  const smokingToday = useSmokingStore((s) => s.today);
  const smokingImpact = useSmokingStore((s) => s.impact);
  const addCig = useSmokingStore((s) => s.add);
  const undoCig = useSmokingStore((s) => s.undo);
  const loadSmoking = useSmokingStore((s) => s.load);
  const [fasting, setFasting] = React.useState<FastingState | null>(null);
  const [microGapCount, setMicroGapCount] = React.useState(0);
  const [microHasData, setMicroHasData] = React.useState(false);
  const sex = useUserStore((s) => s.user?.sex ?? 'male');

  useFocusEffect(
    useCallback(() => {
      refresh();
      loadSmoking();
      setFasting(currentFastingState());
      const m = dayMicros(date);
      setMicroHasData(m.foodEntriesWithMicros > 0 || m.supplementCount > 0);
      setMicroGapCount(microGaps(m.totals, sex).length);
    }, [refresh, loadSmoking, date, sex])
  );

  const calTarget = goal?.calorieTarget ?? 2200;
  const cal = food?.calories ?? 0;
  const waterGoal = goal?.waterGoalMl ?? 2500;
  const water = beverages?.hydrationMl ?? 0;
  const caffeine = beverages?.caffeineMg ?? 0;
  const caffeineLimit = goal?.caffeineSoftLimitMg ?? 400;

  const isToday = date === todayISO();
  const dateLabel = isToday
    ? 'Today'
    : new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <Screen>
      {/* Date navigator */}
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Pressable onPress={() => setDate(addDays(date, -1))} hitSlop={8}>
          <Icon icon="core.back" size={24} color={theme.colors.textMuted} />
        </Pressable>
        <Text variant="h2">{dateLabel}</Text>
        <Pressable onPress={() => setDate(addDays(date, 1))} hitSlop={8} disabled={isToday}>
          <Icon icon="core.forward" size={24} color={isToday ? theme.colors.surfaceAlt : theme.colors.textMuted} />
        </Pressable>
      </Row>

      {/* Fasting banner */}
      {fasting && isToday && (
        <Pressable onPress={() => navigation.navigate('Fasting')}>
          <Card accent={fasting.fasting ? theme.colors.warning : theme.colors.success}>
            <Row gap={10} style={{ alignItems: 'center' }}>
              <Icon icon="faith.fasting" size={20} color={fasting.fasting ? theme.colors.warning : theme.colors.success} />
              <Text variant="bodyStrong" style={{ flex: 1 }}>
                {fasting.fasting
                  ? `Fasting — ${fasting.nextLabel.toLowerCase()} at ${fasting.nextTime}`
                  : `Eating window — fast begins at ${fasting.nextTime}`}
              </Text>
              <Text variant="caption" color="textMuted">{minutesToHM(fasting.minutesUntilNext)}</Text>
            </Row>
          </Card>
        </Pressable>
      )}

      {/* Calorie + macro dashboard */}
      <Card>
        <Row style={{ justifyContent: 'space-around', alignItems: 'center' }}>
          <MacroDonut
            protein={food?.protein ?? 0}
            carbs={food?.carbs ?? 0}
            fat={food?.fat ?? 0}
            centerValue={`${Math.round(cal)}`}
            centerLabel={`/ ${calTarget}`}
          />
          <View style={{ gap: 12, flex: 1, paddingLeft: 16 }}>
            <MacroRow label="Protein" value={food?.protein ?? 0} target={goal?.proteinG ?? 0} color={theme.colors.protein} />
            <MacroRow label="Carbs" value={food?.carbs ?? 0} target={goal?.carbsG ?? 0} color={theme.colors.carbs} />
            <MacroRow label="Fat" value={food?.fat ?? 0} target={goal?.fatG ?? 0} color={theme.colors.fat} />
          </View>
        </Row>
      </Card>

      {/* Diet plan generator */}
      <Pressable onPress={() => navigation.navigate('DietPlan')}>
        <Card accent={theme.colors.calories}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Row gap={10} style={{ alignItems: 'center', flex: 1 }}>
              <Icon icon="nutrition.calories" size={20} color={theme.colors.calories} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">Diet plan</Text>
                <Text variant="caption" color="textMuted">
                  Auto-build a day of meals that hits your macros — shuffle for variety
                </Text>
              </View>
            </Row>
            <Icon icon="core.forward" size={18} color={theme.colors.textFaint} />
          </Row>
        </Card>
      </Pressable>

      {/* Special-programme meals — loggable with real macros & micros */}
      <Pressable onPress={() => navigation.navigate('ProgrammeMeals')}>
        <Card accent={theme.colors.accent}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Row gap={10} style={{ alignItems: 'center', flex: 1 }}>
              <Icon icon="mindbody.special" size={20} color={theme.colors.accent} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">Programme meals</Text>
                <Text variant="caption" color="textMuted">
                  Eat like a legionary, a monk or a hero — log any meal with real macros & micros
                </Text>
              </View>
            </Row>
            <Icon icon="core.forward" size={18} color={theme.colors.textFaint} />
          </Row>
        </Card>
      </Pressable>

      {/* Micronutrients & supplements */}
      <Pressable onPress={() => navigation.navigate('Micronutrients')}>
        <Card accent={theme.colors.accent}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Row gap={10} style={{ alignItems: 'center', flex: 1 }}>
              <Icon icon="micro.vitamins" size={20} color={theme.colors.accent} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">Micronutrients & supplements</Text>
                <Text variant="caption" color="textMuted">
                  {microHasData
                    ? microGapCount > 0
                      ? `${microGapCount} vitamin/mineral${microGapCount === 1 ? '' : 's'} running low today`
                      : 'On track across vitamins & minerals'
                    : 'Log whole foods or pills to see vitamins & minerals'}
                </Text>
              </View>
            </Row>
            <Icon icon="core.forward" size={18} color={theme.colors.textFaint} />
          </Row>
        </Card>
      </Pressable>

      {/* Water + caffeine */}
      <Row>
        <Card style={{ flex: 1 }}>
          <Row gap={8} style={{ alignItems: 'center', marginBottom: 8 }}>
            <ProgressRing progress={water / waterGoal} size={44} strokeWidth={5} color={theme.colors.water}>
              <Icon icon="nutrition.water" size={16} color={theme.colors.water} />
            </ProgressRing>
            <View>
              <Text variant="bodyStrong">{(water / 1000).toFixed(2)} L</Text>
              <Text variant="caption" color="textMuted">of {(waterGoal / 1000).toFixed(1)} L</Text>
            </View>
          </Row>
          <Row gap={6}>
            {WATER_QUICK_ADD.map((ml) => (
              <Pressable key={ml} onPress={() => addDrink('water', { volumeMl: ml })} style={{ flex: 1 }}>
                <View style={{ paddingVertical: 8, borderRadius: theme.radius.sm, backgroundColor: theme.colors.water + '22', alignItems: 'center' }}>
                  <Text variant="caption" color={theme.colors.water}>+{ml}</Text>
                </View>
              </Pressable>
            ))}
          </Row>
        </Card>
      </Row>

      <Card>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Row gap={8} style={{ alignItems: 'center' }}>
            <Icon icon="nutrition.caffeine" size={18} color={theme.colors.caffeine} />
            <Text variant="bodyStrong">Caffeine</Text>
          </Row>
          <Text variant="body" color={caffeine > caffeineLimit ? 'warning' : 'textMuted'}>
            {Math.round(caffeine)} / {caffeineLimit} mg
          </Text>
        </Row>
        <ProgressBar progress={caffeine / caffeineLimit} color={theme.colors.caffeine} />
        <Row gap={6} style={{ marginTop: 10 }}>
          {(['coffee', 'tea', 'energy_drink', 'soda'] as const).map((t) => (
            <Pressable key={t} onPress={() => addDrink(t)} style={{ flex: 1 }}>
              <View style={{ paddingVertical: 8, borderRadius: theme.radius.sm, backgroundColor: theme.colors.surfaceAlt, alignItems: 'center', gap: 2 }}>
                <Icon icon={BEVERAGE_PRESETS[t].icon} size={18} color={theme.colors.caffeine} />
                <Text variant="caption" color="textFaint" style={{ fontSize: 9 }}>{BEVERAGE_PRESETS[t].label}</Text>
              </View>
            </Pressable>
          ))}
        </Row>
      </Card>

      {/* Smoking quick-tracker (opt-in, today only) */}
      {smokingEnabled && isToday && (
        <Pressable onPress={() => navigation.navigate('Smoking')}>
          <Card accent={theme.colors.warning}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Row gap={10} style={{ alignItems: 'center', flex: 1 }}>
                <Icon icon="smoking.cigarette" size={20} color={theme.colors.warning} />
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong">
                    {smokingToday} cigarette{smokingToday === 1 ? '' : 's'} today
                  </Text>
                  <Text variant="caption" color="textMuted">
                    {smokingImpact
                      ? `${smokingImpact.currency}${smokingImpact.moneyWeek.toFixed(2)} this week · tap for impact`
                      : 'Tap to see impact'}
                  </Text>
                </View>
              </Row>
              <Row gap={8}>
                <Pressable onPress={() => undoCig()} hitSlop={6}>
                  <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: theme.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
                    <Text variant="h3" color="textMuted">−</Text>
                  </View>
                </Pressable>
                <Pressable onPress={() => addCig(1)} hitSlop={6}>
                  <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: theme.colors.warning, alignItems: 'center', justifyContent: 'center' }}>
                    <Text variant="h3" color="#fff">+</Text>
                  </View>
                </Pressable>
              </Row>
            </Row>
          </Card>
        </Pressable>
      )}

      {/* Meals */}
      {MEAL_TYPES.map((meal) => {
        const entries = food?.byMeal[meal] ?? [];
        const mealCals = entries.reduce((s, e) => s + e.calories, 0);
        return (
          <View key={meal} style={{ gap: theme.spacing.sm }}>
            <SectionHeader
              title={`${MEAL_LABELS[meal]}${mealCals ? ` · ${Math.round(mealCals)} kcal` : ''}`}
              action="Add"
              onAction={() => navigation.navigate('AddFood', { meal })}
            />
            {entries.length === 0 ? (
              <Pressable onPress={() => navigation.navigate('AddFood', { meal })}>
                <Card style={{ borderStyle: 'dashed' }}>
                  <Row gap={10} style={{ alignItems: 'center' }}>
                    <Icon icon={mealIcon(meal)} size={20} color={theme.colors.textFaint} />
                    <Text variant="body" color="textFaint">Log {MEAL_LABELS[meal].toLowerCase()}</Text>
                  </Row>
                </Card>
              </Pressable>
            ) : (
              <Card style={{ gap: 8 }}>
                {entries.map((e, idx) => (
                  <View key={e.id}>
                    {idx > 0 ? <Divider /> : null}
                    <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flex: 1 }}>
                        <Row gap={6} style={{ alignItems: 'center' }}>
                          <Text variant="body" numberOfLines={1} style={{ flexShrink: 1 }}>
                            {e.logMode === 'honest' ? e.freeTextDescription : e.foodName}
                          </Text>
                          {e.isEstimated ? <Badge label="est." color={theme.colors.warning} /> : null}
                        </Row>
                        <Text variant="caption" color="textFaint">
                          {Math.round(e.calories)} kcal · P{Math.round(e.proteinG)} C{Math.round(e.carbsG)} F{Math.round(e.fatG)}
                        </Text>
                      </View>
                      <Pressable onPress={() => removeFood(e.id)} hitSlop={8}>
                        <Icon icon="core.close" size={16} color={theme.colors.textFaint} />
                      </Pressable>
                    </Row>
                  </View>
                ))}
              </Card>
            )}
          </View>
        );
      })}

      {/* Logging adherence */}
      {food && food.honestCount + food.preciseCount > 0 && (
        <Card>
          <Text variant="label" color="textMuted" style={{ marginBottom: 4 }}>
            Logging style today
          </Text>
          <Text variant="body">
            {food.preciseCount} precise · {food.honestCount} honest-log
          </Text>
          <Text variant="caption" color="textFaint" style={{ marginTop: 2 }}>
            Consistency matters more than precision — a logged day beats a perfect-but-skipped one.
          </Text>
        </Card>
      )}

      {/* Recent drinks */}
      {beverages && beverages.entries.length > 0 && (
        <Card style={{ gap: 6 }}>
          <Text variant="label" color="textMuted">Drinks today</Text>
          {beverages.entries.slice(0, 8).map((b) => (
            <Row key={b.id} style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Row gap={8} style={{ alignItems: 'center' }}>
                <Icon icon={BEVERAGE_PRESETS[b.type].icon} size={16} color={theme.colors.textMuted} />
                <Text variant="caption" color="textMuted">
                  {BEVERAGE_PRESETS[b.type].label} · {Math.round(b.volumeMl)} ml{b.caffeineMg ? ` · ${Math.round(b.caffeineMg)} mg` : ''}
                </Text>
              </Row>
              <Pressable onPress={() => removeDrink(b.id)} hitSlop={8}>
                <Icon icon="core.close" size={14} color={theme.colors.textFaint} />
              </Pressable>
            </Row>
          ))}
        </Card>
      )}
    </Screen>
  );
}

function MacroRow({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  return (
    <View style={{ gap: 4 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text variant="caption" color="textMuted">{label}</Text>
        <Text variant="caption" color="textMuted">
          {Math.round(value)}/{target}g
        </Text>
      </Row>
      <ProgressBar progress={target ? value / target : 0} color={color} height={6} />
    </View>
  );
}
