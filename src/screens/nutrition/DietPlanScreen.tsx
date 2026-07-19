import React, { useMemo, useState } from 'react';
import { View, Pressable, Alert, ScrollView } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Row, SectionHeader, Divider } from '@/components/ui/misc';
import { useUserStore } from '@/stores/userStore';
import { useNutritionStore } from '@/stores/nutritionStore';
import {
  generateDietPlan,
  DIET_STYLES,
  type DietStyle,
  type DietPlan,
  type PlanMeal,
} from '@/lib/dietPlan';
import { FOOD_DB } from '@/data/foods';
import { mealIcon } from '@/constants/icon-map';

export function DietPlanScreen() {
  const theme = useTheme();
  const goal = useUserStore((s) => s.goal);
  const addPrecise = useNutritionStore((s) => s.addPrecise);

  const target = useMemo(
    () => ({
      calories: goal?.calorieTarget ?? 2200,
      protein: goal?.proteinG ?? 150,
      carbs: goal?.carbsG ?? 220,
      fat: goal?.fatG ?? 70,
    }),
    [goal]
  );

  const [style, setStyle] = useState<DietStyle>('balanced');
  const [meals, setMeals] = useState(4);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9));

  const plan: DietPlan = useMemo(
    () => generateDietPlan(target, { style, meals, seed }),
    [target, style, meals, seed]
  );

  const logMeal = (meal: PlanMeal) => {
    for (const item of meal.items) {
      const food = FOOD_DB.find((f) => f.id === item.id);
      addPrecise({
        mealType: meal.key,
        foodName: item.name,
        quantity: item.servings,
        servingSize: item.serving,
        calories: food?.calories ?? item.calories,
        proteinG: food?.protein ?? item.protein,
        carbsG: food?.carbs ?? item.carbs,
        fatG: food?.fat ?? item.fat,
        fiberG: food?.fiber ?? 0,
        micros: food?.micros,
      });
    }
    Alert.alert('Added to diary ✓', `${meal.label}: ${meal.items.length} item${meal.items.length === 1 ? '' : 's'} logged.`);
  };

  const logAll = () => {
    for (const meal of plan.meals) logMeal(meal);
  };

  const pct = (got: number, tgt: number) => (tgt > 0 ? Math.round((got / tgt) * 100) : 0);

  return (
    <Screen>
      <Row gap={12} style={{ alignItems: 'center' }}>
        <Icon icon="nutrition.calories" size={26} color={theme.colors.calories} />
        <Text variant="h1" style={{ flex: 1 }}>Diet plan</Text>
      </Row>
      <Text variant="body" color="textMuted">
        A day of meals built to hit your targets. Tap “Shuffle” for a fresh combination with the
        same macros, switch the style, or log a meal straight to your diary.
      </Text>

      {/* Target summary */}
      <Card accent={theme.colors.calories}>
        <Row style={{ justifyContent: 'space-between' }}>
          <TargetPill label="kcal" got={plan.totals.calories} target={target.calories} color={theme.colors.calories} />
          <TargetPill label="P" got={plan.totals.protein} target={target.protein} color={theme.colors.protein} />
          <TargetPill label="C" got={plan.totals.carbs} target={target.carbs} color={theme.colors.carbs} />
          <TargetPill label="F" got={plan.totals.fat} target={target.fat} color={theme.colors.fat} />
        </Row>
        <Text variant="caption" color="textFaint" center style={{ marginTop: 8 }}>
          Plan hits {pct(plan.totals.calories, target.calories)}% of calories · {pct(plan.totals.protein, target.protein)}% protein
        </Text>
      </Card>

      {/* Controls */}
      <SectionHeader title="Style" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
        {DIET_STYLES.map((s) => {
          const on = style === s.key;
          return (
            <Pressable key={s.key} onPress={() => setStyle(s.key)}>
              <View
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: theme.radius.md,
                  backgroundColor: on ? theme.colors.calories : theme.colors.surfaceAlt,
                  borderWidth: 1,
                  borderColor: on ? theme.colors.calories : theme.colors.border,
                  minWidth: 120,
                }}
              >
                <Text variant="bodyStrong" color={on ? '#fff' : theme.colors.text}>{s.label}</Text>
                <Text variant="caption" color={on ? '#fff' : theme.colors.textFaint}>{s.blurb}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <Row style={{ marginTop: theme.spacing.sm }}>
        <View style={{ flex: 1 }}>
          <SegmentedControl
            options={[{ value: '3', label: '3 meals' }, { value: '4', label: '4 meals' }]}
            value={String(meals)}
            onChange={(v) => setMeals(Number(v))}
          />
        </View>
        <Button
          title="Shuffle"
          icon="stats.progression"
          onPress={() => setSeed(Math.floor(Math.random() * 1e9))}
          fullWidth={false}
        />
      </Row>

      {/* Meals */}
      {plan.meals.map((meal) => (
        <View key={meal.key} style={{ gap: theme.spacing.sm }}>
          <SectionHeader title={`${meal.label} · ${meal.totals.calories} kcal`} action="Log" onAction={() => logMeal(meal)} />
          <Card style={{ gap: 8 }}>
            {meal.items.map((item, idx) => (
              <View key={`${item.id}-${idx}`}>
                {idx > 0 ? <Divider /> : null}
                <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Row gap={8} style={{ alignItems: 'center', flex: 1 }}>
                    <Icon icon={mealIcon(meal.key)} size={16} color={theme.colors.textMuted} />
                    <View style={{ flex: 1 }}>
                      <Text variant="body" numberOfLines={1}>
                        {item.servings % 1 === 0 ? item.servings : item.servings.toFixed(1)}× {item.name}
                      </Text>
                      <Text variant="caption" color="textFaint">{item.serving}</Text>
                    </View>
                  </Row>
                  <Text variant="caption" color="textMuted">
                    {item.calories} kcal · P{item.protein} C{item.carbs} F{item.fat}
                  </Text>
                </Row>
              </View>
            ))}
          </Card>
        </View>
      ))}

      <Button title="Log the whole day to diary" icon="core.check" color={theme.colors.calories} onPress={logAll} />
      <Text variant="caption" color="textFaint" center>
        Suggestions from your food database — swap anything you don't like and re-shuffle. Whole
        foods first; composite dishes and sweets are left out of auto-plans.
      </Text>
    </Screen>
  );
}

function TargetPill({ label, got, target, color }: { label: string; got: number; target: number; color: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text variant="h3" color={color}>{got}</Text>
      <Text variant="caption" color="textFaint">/ {target} {label}</Text>
    </View>
  );
}
