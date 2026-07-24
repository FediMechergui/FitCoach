import React, { useState } from 'react';
import { View, Pressable, Alert } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Row, SectionHeader, Divider } from '@/components/ui/misc';
import { SPECIAL_PROGRAMS, SPECIAL_CATEGORY_META, type SpecialCategory } from '@/data/specialPrograms';
import { dietNutrition, mealToDiaryInputs, type MealNutrition } from '@/lib/specialDiet';
import { addPreciseFood } from '@/repositories/nutritionRepo';

const CATEGORY_ORDER: SpecialCategory[] = ['military', 'historical', 'superhero', 'lifestyle'];

/**
 * Every Special Programme diet, meal by meal, loggable straight into the diary
 * with real macros and micronutrients — so a programme's food is tracked exactly
 * like anything else you eat.
 */
export function ProgrammeMealsScreen() {
  const theme = useTheme();
  const [openKey, setOpenKey] = useState<string | null>(null);

  const logMeal = (label: string, meal: MealNutrition) => {
    mealToDiaryInputs(meal).forEach((f) => addPreciseFood(f));
    Alert.alert('Logged', `${label} — ${meal.label} (${meal.calories} kcal) added to today's ${meal.mealType}.`);
  };

  return (
    <Screen>
      <Row gap={12} style={{ alignItems: 'center' }}>
        <Icon icon="nutrition.calories" size={26} color={theme.colors.calories} />
        <View style={{ flex: 1 }}>
          <Text variant="h1">Programme meals</Text>
          <Text variant="caption" color="textMuted">
            Eat like a legionary, a monk or a hero — every meal logs with its real macros & micros.
          </Text>
        </View>
      </Row>

      {CATEGORY_ORDER.map((cat) => (
        <View key={cat} style={{ gap: theme.spacing.sm }}>
          <SectionHeader title={SPECIAL_CATEGORY_META[cat].label} />
          {SPECIAL_PROGRAMS.filter((p) => p.category === cat).map((p) => {
            const open = openKey === p.key;
            const diet = dietNutrition(p);
            return (
              <Card key={p.key} accent={open ? p.accent : undefined} style={{ gap: 8 }}>
                <Pressable onPress={() => setOpenKey(open ? null : p.key)}>
                  <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <Row gap={10} style={{ alignItems: 'center', flex: 1 }}>
                      <Icon icon={p.icon} size={20} color={p.accent} />
                      <View style={{ flex: 1 }}>
                        <Text variant="bodyStrong" numberOfLines={1}>{p.name}</Text>
                        <Text variant="caption" color="textMuted" numberOfLines={1}>{p.diet.name}</Text>
                      </View>
                    </Row>
                    <Text variant="caption" color={theme.colors.calories}>≈ {diet.calories} kcal</Text>
                  </Row>
                </Pressable>

                {open && (
                  <View style={{ gap: 8 }}>
                    <Divider />
                    <Text variant="caption" color="textFaint">{p.diet.macroSlant}</Text>
                    {diet.meals.map((meal, i) => (
                      <View key={i} style={{ gap: 2 }}>
                        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text variant="bodyStrong" style={{ flex: 1 }}>{meal.label}</Text>
                          {meal.hydrationOnly ? (
                            <Text variant="caption" color="textFaint">hydration</Text>
                          ) : (
                            <Pressable onPress={() => logMeal(p.name, meal)} hitSlop={8}>
                              <Row gap={4} style={{ alignItems: 'center' }}>
                                <Text variant="caption" color={theme.colors.calories}>
                                  {meal.calories} kcal · {Math.round(meal.protein)}P
                                </Text>
                                <Icon icon="core.add" size={16} color={theme.colors.calories} />
                              </Row>
                            </Pressable>
                          )}
                        </Row>
                        {meal.foods.length > 0 && (
                          <Text variant="caption" color="textMuted">
                            {meal.foods.map((f) => (f.servings !== 1 ? `${f.name} ×${f.servings}` : f.name)).join(' · ')}
                          </Text>
                        )}
                      </View>
                    ))}
                    <Button
                      title="Log the whole day"
                      icon="nutrition.calories"
                      size="sm"
                      color={p.accent}
                      onPress={() => {
                        const meals = diet.meals.filter((m) => !m.hydrationOnly);
                        meals.flatMap((m) => mealToDiaryInputs(m)).forEach((f) => addPreciseFood(f));
                        Alert.alert('Logged', `${p.name} — ${diet.calories} kcal across ${meals.length} meals added to today's diary.`);
                      }}
                    />
                  </View>
                )}
              </Card>
            );
          })}
        </View>
      ))}

      <Text variant="caption" color="textFaint" center>
        Meals log as their real component foods — full macros and micronutrients, tracked like anything else.
      </Text>
    </Screen>
  );
}
