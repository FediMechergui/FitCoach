import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { toast } from '@/components/ui/Toast';
import { Row, SectionHeader, Badge, Divider, EmptyState } from '@/components/ui/misc';
import { PageHero } from '@/components/ui/PageHero';
import type { RootStackParamList } from '@/navigation/types';
import { metaFor } from '@/constants/sessionTypes';
import { LEVEL_LABEL } from '@/data/programs';
import {
  findSpecialProgram,
  specialStyleTag,
  specialWeeklyMinutes,
  type SpecialDay,
} from '@/data/specialPrograms';
import { exercisesBySlugs } from '@/repositories/exerciseRepo';
import { useSessionStore } from '@/stores/sessionStore';
import { dietNutrition, mealToDiaryInputs, type MealNutrition } from '@/lib/specialDiet';
import { addPreciseFood } from '@/repositories/nutritionRepo';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type DetailRoute = RouteProp<RootStackParamList, 'SpecialProgramDetail'>;
type Tab = 'week' | 'story' | 'diet';

/**
 * One programme, three depths.
 *
 * v2 stacked the story, the honesty notes, seven day cards and a full diet on
 * one scroll. 3.0 opens on the actionable depth — THE WEEK, with the days
 * numbered and a Start on each — and keeps the story and the diet one tap to
 * either side. Logging a meal or a day speaks through the toast, not an Alert.
 */
export function SpecialProgramDetailScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<DetailRoute>();
  const program = findSpecialProgram(route.params.programKey);
  const begin = useSessionStore((s) => s.begin);
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('week');

  if (!program) {
    return (
      <Screen>
        <EmptyState
          icon="mindbody.special"
          title="That programme is not here"
          message="It may have been renamed in an update. Head back to the list and pick it again."
        />
      </Screen>
    );
  }

  const diet = dietNutrition(program);

  const startDay = (day: SpecialDay) => {
    begin(day.sessionType, {
      label: `${program.name} · ${day.label}`,
      style: specialStyleTag(program, day),
      prefillSlugs: day.exercises,
    });
    const id = useSessionStore.getState().activeId!;
    navigation.replace('ActiveSession', { sessionId: id });
  };

  const logMeal = (meal: MealNutrition) => {
    const inputs = mealToDiaryInputs(meal);
    inputs.forEach((f) => addPreciseFood(f));
    toast({ message: `Logged ${meal.label} — ${meal.calories} kcal to today's ${meal.mealType}` });
  };

  const logDay = () => {
    const loggable = diet.meals.filter((m) => !m.hydrationOnly);
    loggable.flatMap((m) => mealToDiaryInputs(m)).forEach((f) => addPreciseFood(f));
    toast({ message: `Logged ${program.diet.name} — ${diet.calories} kcal across ${loggable.length} meals` });
  };

  return (
    <Screen>
      <PageHero icon={program.icon} color={program.accent} title={program.name} subtitle={program.tagline} />

      <Row gap={6} style={{ flexWrap: 'wrap' }}>
        <Badge label={LEVEL_LABEL[program.level]} color={program.accent} />
        <Chip label={`${program.daysPerWeek}×/week`} color={program.accent} small />
        <Chip label={`${program.blockWeeks} weeks`} color={program.accent} small />
        <Chip label={`~${Math.round(specialWeeklyMinutes(program) / 60)} h/week`} color={program.accent} small />
      </Row>

      <SegmentedControl
        options={[
          { value: 'week', label: 'The week', icon: 'core.calendar' },
          { value: 'story', label: 'Story', icon: 'core.info' },
          { value: 'diet', label: 'Diet', icon: 'nutrition.calories' },
        ]}
        value={tab}
        onChange={setTab}
        accent={program.accent}
      />

      {/* ── The week ── */}
      {tab === 'week' && (
        <>
          <Text variant="caption" color="textFaint">
            Tap a day to see what is in it, then start it. Days are pre-loaded, never locked — add,
            remove or reorder anything once the session starts.
          </Text>
          {program.days.map((day, idx) => {
            const meta = metaFor(day.sessionType);
            const open = openDay === day.key;
            const preview = open ? exercisesBySlugs(day.exercises) : [];
            return (
              <Card key={day.key} accent={open ? program.accent : undefined} style={{ gap: 8 }}>
                <Pressable onPress={() => setOpenDay(open ? null : day.key)}>
                  <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <Row gap={10} style={{ alignItems: 'center', flex: 1 }}>
                      <View style={{ width: 34, alignItems: 'center' }}>
                        <Text variant="eyebrow" color={open ? program.accent : theme.colors.textFaint}>
                          D{idx + 1}
                        </Text>
                      </View>
                      <Icon icon={meta.icon} size={20} color={meta.color} />
                      <View style={{ flex: 1 }}>
                        <Text variant="bodyStrong">{day.label}</Text>
                        <Text variant="caption" color="textMuted" numberOfLines={open ? undefined : 1}>
                          {day.focus}
                        </Text>
                      </View>
                    </Row>
                    <Badge label={`~${day.minutes}m`} color={theme.colors.textFaint} />
                  </Row>
                </Pressable>

                {open && (
                  <View style={{ gap: 8 }}>
                    <Divider />
                    <View>
                      <Text variant="label" color={program.accent}>
                        Prescription
                      </Text>
                      <Text variant="caption" color="textMuted">
                        {day.prescription}
                      </Text>
                    </View>
                    <Text variant="label" color="textMuted">
                      {preview.length}/{day.exercises.length} exercises pre-loaded
                    </Text>
                    {preview.map((ex, i) => (
                      <Row key={ex.id} gap={8} style={{ alignItems: 'center' }}>
                        <Text variant="caption" color="textFaint" style={{ width: 18 }}>
                          {i + 1}.
                        </Text>
                        <Icon icon={ex.iconKey} size={16} color={meta.color} />
                        <Text variant="body" style={{ flex: 1 }} numberOfLines={1}>
                          {ex.name}
                        </Text>
                      </Row>
                    ))}
                    <Button title={`Start ${day.label}`} icon="core.start" size="sm" color={program.accent} onPress={() => startDay(day)} />
                  </View>
                )}
              </Card>
            );
          })}
        </>
      )}

      {/* ── Story ── */}
      {tab === 'story' && (
        <>
          <Card accent={program.accent} style={{ gap: 8 }}>
            <View>
              <Text variant="label" color={program.accent}>
                Origin
              </Text>
              <Text variant="body" color="textMuted">
                {program.origin}
              </Text>
            </View>
            <Divider />
            <Row gap={8} style={{ alignItems: 'flex-start' }}>
              <Icon icon="core.pr" size={16} color={program.accent} />
              <Text variant="bodyStrong" style={{ flex: 1, fontStyle: 'italic' }}>
                {program.ethos}
              </Text>
            </Row>
          </Card>

          <Card accent={theme.colors.textFaint} style={{ gap: 6 }}>
            <Row gap={8} style={{ alignItems: 'flex-start' }}>
              <Icon icon="core.info" size={16} color={theme.colors.textFaint} />
              <View style={{ flex: 1 }}>
                <Text variant="label" color="textMuted">
                  What is real, what is adapted
                </Text>
                <Text variant="caption" color="textMuted">
                  {program.authenticityNote}
                </Text>
              </View>
            </Row>
            {program.safetyNote && (
              <>
                <Divider />
                <Row gap={8} style={{ alignItems: 'flex-start' }}>
                  <Icon icon="core.info" size={16} color={theme.colors.warning} />
                  <View style={{ flex: 1 }}>
                    <Text variant="label" color={theme.colors.warning}>
                      Train it safely
                    </Text>
                    <Text variant="caption" color="textMuted">
                      {program.safetyNote}
                    </Text>
                  </View>
                </Row>
              </>
            )}
          </Card>
        </>
      )}

      {/* ── Diet — with real, loggable macros/micros per meal ── */}
      {tab === 'diet' && (
        <>
          <SectionHeader title={program.diet.name} />
          <Card accent={theme.colors.calories} style={{ gap: 8 }}>
            <Text variant="body" color="textMuted">
              {program.diet.approach}
            </Text>
            <Row gap={8} style={{ alignItems: 'flex-start' }}>
              <Icon icon="nutrition.protein" size={16} color={theme.colors.calories} />
              <Text variant="caption" color={theme.colors.calories} style={{ flex: 1 }}>
                {program.diet.macroSlant}
              </Text>
            </Row>
            <Divider />
            <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Text variant="label" color="textMuted">
                A day of eating
              </Text>
              <Text variant="caption" color={theme.colors.calories} style={{ fontVariant: ['tabular-nums'] }}>
                ≈ {diet.calories} kcal · {Math.round(diet.protein)}P {Math.round(diet.carbs)}C {Math.round(diet.fat)}F
              </Text>
            </Row>
            {diet.meals.map((meal, i) => (
              <View key={i} style={{ gap: 3, paddingVertical: 2 }}>
                <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text variant="bodyStrong" style={{ flex: 1 }}>
                    {meal.label}
                  </Text>
                  {!meal.hydrationOnly && (
                    <Pressable onPress={() => logMeal(meal)} hitSlop={8}>
                      <Row gap={4} style={{ alignItems: 'center' }}>
                        <Text variant="caption" color={theme.colors.calories}>
                          {meal.calories} kcal
                        </Text>
                        <Icon icon="core.add" size={16} color={theme.colors.calories} />
                      </Row>
                    </Pressable>
                  )}
                </Row>
                <Text variant="caption" color="textMuted">
                  {meal.detail}
                </Text>
                {meal.foods.length > 0 && (
                  <Text variant="caption" color="textFaint">
                    {meal.foods.map((f) => (f.servings !== 1 ? `${f.name} ×${f.servings}` : f.name)).join(' · ')}
                  </Text>
                )}
              </View>
            ))}
            {program.diet.notes.map((n, i) => (
              <Row key={i} gap={8} style={{ alignItems: 'flex-start' }}>
                <Icon icon="core.info" size={14} color={theme.colors.textFaint} />
                <Text variant="caption" color="textFaint" style={{ flex: 1 }}>
                  {n}
                </Text>
              </Row>
            ))}
            <Button title="Log this whole day to my diary" icon="nutrition.calories" size="sm" color={theme.colors.calories} onPress={logDay} />
            <Text variant="caption" color="textFaint" center>
              Meals log as their real foods, with full macros and micronutrients.
            </Text>
          </Card>
        </>
      )}
    </Screen>
  );
}
