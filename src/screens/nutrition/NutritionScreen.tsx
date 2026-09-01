import React, { useCallback, useMemo, useState } from 'react';
import { View, Pressable } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Arc, Rail } from '@/components/ui/Meter';
import { FuelRail } from '@/components/FuelCell';
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
import { MealRoutineBar } from '@/components/MealRoutineBar';
import { DigestionCard, MealDigestionLine } from '@/components/DigestionCard';
import { mealsFromEntries } from '@/lib/digestion';
import { weatherAdjustedWaterGoal } from '@/repositories/weatherRepo';
import { recentSmokeEvents } from '@/repositories/smokingRepo';
import { addDays, todayISO } from '@/lib/date';
import { recommendedFiberG } from '@/lib/calories';
import { clockOf } from '@/lib/eatenAt';
import { Sheet } from '@/components/ui/Sheet';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { toast } from '@/components/ui/Toast';
import type { FoodEntry } from '@/db/schema';

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
  const { date, food, beverages, setDate, refresh, removeFood, addDrink, removeDrink, editFood, restoreFood, snapshotFood } =
    useNutritionStore();
  const goal = useUserStore((s) => s.goal);
  // Every diary row for the day, flattened, as digestion inputs.
  const digestMeals = useMemo(
    () => mealsFromEntries(food ? (Object.values(food.byMeal) as Array<typeof food.byMeal.breakfast>).flat() : []),
    [food]
  );
  const smokingEnabled = useSmokingStore((s) => s.enabled);
  const smokingToday = useSmokingStore((s) => s.today);
  const smokes = useMemo(() => recentSmokeEvents(), [smokingEnabled, smokingToday]);
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
  const fiberTarget = recommendedFiberG(calTarget);
  // Weather adds to the base goal on hot days; only today's reading applies.
  const waterAdj = useMemo(
    () => (date === todayISO() ? weatherAdjustedWaterGoal(goal?.waterGoalMl ?? 2500) : { totalMl: goal?.waterGoalMl ?? 2500, extraMl: 0, feelsLike: null }),
    [goal, date, food]
  );
  const waterGoal = waterAdj.totalMl;
  const water = beverages?.hydrationMl ?? 0;
  const caffeine = beverages?.caffeineMg ?? 0;
  const caffeineLimit = goal?.caffeineSoftLimitMg ?? 400;

  // ── The diary's broken promise, kept at last: entries edit in place. ──
  const [editing, setEditing] = useState<FoodEntry | null>(null);
  const [editQty, setEditQty] = useState('1');
  const [editSlot, setEditSlot] = useState<MealType>('breakfast');
  const [editTime, setEditTime] = useState('12:00');

  const openEdit = (e: FoodEntry) => {
    setEditing(e);
    setEditQty(String(e.quantity ?? 1));
    setEditSlot(e.mealType as MealType);
    setEditTime(clockOf(e.createdAt));
  };

  const saveEdit = () => {
    if (!editing) return;
    const qty = parseFloat(editQty.replace(',', '.'));
    // The time stays anchored to the day being viewed.
    const m = /^(\d{1,2}):(\d{2})$/.exec(editTime.trim());
    const eatenAt = m
      ? new Date(`${date}T${String(Math.min(23, parseInt(m[1], 10))).padStart(2, '0')}:${m[2]}:00`).getTime()
      : undefined;
    editFood(editing.id, {
      quantity: Number.isFinite(qty) && qty > 0 ? qty : undefined,
      mealType: editSlot,
      eatenAt: eatenAt && Number.isFinite(eatenAt) ? eatenAt : undefined,
    });
    setEditing(null);
  };

  /** Delete with the door held open — the row is captured whole, and Undo
      puts it back exactly, id aside. */
  const undoableRemove = (id: number) => {
    const snap = snapshotFood(id);
    removeFood(id);
    setEditing(null);
    if (snap) {
      toast({
        message: `Removed ${snap.logMode === 'honest' ? (snap.freeTextDescription ?? 'entry') : snap.foodName}`,
        actionLabel: 'Undo',
        onAction: () => restoreFood(snap),
      });
    }
  };

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

      {/* The day's fuel — the same Arc-and-rails grammar Home speaks. */}
      <Card>
        <Row gap={theme.spacing.lg} style={{ alignItems: 'center' }}>
          <Arc value={cal} max={calTarget} size={132} strokeWidth={11} color={theme.colors.calories}>
            <View style={{ alignItems: 'center' }}>
              <Text
                variant="numeralM"
                style={{ fontSize: 30, lineHeight: 34, color: cal > calTarget ? theme.colors.warning : theme.colors.text }}
              >
                {cal > calTarget
                  ? `+${Math.round(cal - calTarget).toLocaleString()}`
                  : Math.max(0, Math.round(calTarget - cal)).toLocaleString()}
              </Text>
              <Text variant="caption" color="textMuted">
                {cal > calTarget ? 'kcal over' : 'kcal left'}
              </Text>
            </View>
          </Arc>
          <View style={{ flex: 1, gap: theme.spacing.sm }}>
            <FuelRail label="Protein" value={`${Math.round(food?.protein ?? 0)} / ${goal?.proteinG ?? 0} g`} progress={food?.protein ?? 0} max={goal?.proteinG ?? 0} color={theme.colors.protein} />
            <FuelRail label="Carbs" value={`${Math.round(food?.carbs ?? 0)} / ${goal?.carbsG ?? 0} g`} progress={food?.carbs ?? 0} max={goal?.carbsG ?? 0} color={theme.colors.carbs} />
            <FuelRail label="Fat" value={`${Math.round(food?.fat ?? 0)} / ${goal?.fatG ?? 0} g`} progress={food?.fat ?? 0} max={goal?.fatG ?? 0} color={theme.colors.fat} />
            <FuelRail label="Fibre" value={`${Math.round(food?.fiber ?? 0)} / ${fiberTarget} g`} progress={food?.fiber ?? 0} max={fiberTarget} color={theme.colors.fiber} />
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
          <View style={{ marginBottom: 10 }}>
            <FuelRail
              label="Water"
              value={`${(water / 1000).toFixed(2)} / ${(waterGoal / 1000).toFixed(1)} L`}
              sub={waterAdj.extraMl > 0 ? `+${(waterAdj.extraMl / 1000).toFixed(1)} for the heat` : undefined}
              progress={water}
              max={waterGoal}
              color={theme.colors.water}
            />
          </View>
          <Row gap={6}>
            {WATER_QUICK_ADD.map((ml) => (
              <Pressable key={ml} onPress={() => addDrink('water', { volumeMl: ml })} style={{ flex: 1 }}>
                <View style={{ paddingVertical: 8, borderRadius: theme.radius.sm, backgroundColor: theme.alpha.tint22(theme.colors.water), alignItems: 'center' }}>
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
        <Rail value={caffeine} max={caffeineLimit} color={theme.colors.caffeine} height={7} />
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

      {/*
        Whole-day routines. Saving a day rather than a single meal is what makes
        a fasting window re-usable: the split across the eating window is the
        thing worth keeping, not any one plate.
      */}
      <MealRoutineBar mealType={null} date={date} onChanged={refresh} />

      {/* Is the last meal out of the way? Today only — yesterday's lunch is not a training question. */}
      {date === todayISO() && <DigestionCard meals={digestMeals} smokes={smokes} smokingEnabled={smokingEnabled} />}

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
            <MealRoutineBar mealType={meal} date={date} onChanged={refresh} />
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
                      {/* Tap a row to edit it — quantity, meal slot, eaten-at. */}
                      <Pressable style={{ flex: 1 }} onPress={() => openEdit(e)}>
                        <Row gap={6} style={{ alignItems: 'center' }}>
                          <Text variant="body" numberOfLines={1} style={{ flexShrink: 1 }}>
                            {e.logMode === 'honest' ? e.freeTextDescription : e.foodName}
                          </Text>
                          {e.isEstimated ? <Badge label="est." color={theme.colors.warning} /> : null}
                        </Row>
                        <Text variant="caption" color="textFaint">
                          {clockOf(e.createdAt)} · {Math.round(e.calories)} kcal · P{Math.round(e.proteinG)} C{Math.round(e.carbsG)} F{Math.round(e.fatG)} Fb{Math.round(e.fiberG)}
                        </Text>
                        {/* Only today's meals have a live digestion clock; a past day's is history. */}
                        {date === todayISO() && e.calories >= 20 && (
                          <MealDigestionLine meal={mealsFromEntries([e])[0]} />
                        )}
                      </Pressable>
                      <Pressable onPress={() => undoableRemove(e.id)} hitSlop={8}>
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
      {/* ── Edit a logged entry ── */}
      <Sheet visible={editing != null} onClose={() => setEditing(null)}>
        {editing ? (
          <View style={{ gap: theme.spacing.md }}>
            <Text variant="eyebrow" color="textMuted">
              Edit entry
            </Text>
            <Text variant="h3" numberOfLines={2}>
              {editing.logMode === 'honest' ? (editing.freeTextDescription ?? 'Honest log') : editing.foodName}
            </Text>
            {editing.logMode === 'precise' ? (
              <Input
                label={`Quantity${editing.servingSize ? ` · servings of ${editing.servingSize}` : ''}`}
                value={editQty}
                onChangeText={setEditQty}
                keyboardType="numeric"
                helper="Macros and micronutrients rescale with it."
              />
            ) : (
              <Text variant="caption" color="textFaint">
                An honest-log estimate has no serving to rescale — move it or remove it.
              </Text>
            )}
            <View>
              <Text variant="label" color="textMuted" style={{ marginBottom: 6 }}>
                Meal
              </Text>
              <SegmentedControl
                options={MEAL_TYPES.map((m) => ({ value: m, label: MEAL_LABELS[m] }))}
                value={editSlot}
                onChange={setEditSlot}
              />
            </View>
            <Input
              label="Eaten at"
              value={editTime}
              onChangeText={setEditTime}
              placeholder="13:30"
              keyboardType="numbers-and-punctuation"
              helper="The digestion clock reads this time."
            />
            <Button title="Save changes" onPress={saveEdit} />
            <Button title="Remove entry" variant="ghost" onPress={() => undoableRemove(editing.id)} />
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}

