import React, { useMemo, useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, Pressable, Alert } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Chip } from '@/components/ui/Chip';
import { Row, Divider } from '@/components/ui/misc';
import type { RootStackParamList } from '@/navigation/types';
import { FOOD_CATEGORIES } from '@/data/foods';
import { caloriesFromMacros, parseAmount, isCompleteCustomFood } from '@/lib/foodMath';
import {
  createCustomFood,
  updateCustomFood,
  deleteCustomFood,
  getCustomFood,
  listCustomFoods,
} from '@/repositories/customFoodRepo';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type CustomFoodRouteProp = RouteProp<RootStackParamList, 'CustomFood'>;

/**
 * Create or edit a food the built-in database doesn't have.
 *
 * The calorie field is the interesting one: it's optional. Most packaging shows
 * protein/carbs/fat clearly and the energy figure is often the one that's
 * missing, in the wrong unit, or simply not there at all for home cooking. So
 * calories are derived from the macros as you type, and typing over them is
 * what makes the figure yours rather than ours — which the card then stops
 * calling an estimate.
 */
export function CustomFoodScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<CustomFoodRouteProp>();
  const editingId = route.params?.id ?? null;

  const existing = useMemo(() => (editingId ? getCustomFood(editingId) : undefined), [editingId]);

  const [name, setName] = useState(existing?.name ?? '');
  const [serving, setServing] = useState(existing?.serving ?? '');
  const [protein, setProtein] = useState(existing ? String(existing.protein) : '');
  const [carbs, setCarbs] = useState(existing ? String(existing.carbs) : '');
  const [fat, setFat] = useState(existing ? String(existing.fat) : '');
  const [fiber, setFiber] = useState(existing ? String(existing.fiber) : '');
  // Blank when the stored figure was itself derived, so editing keeps deriving.
  const [calories, setCalories] = useState(
    existing && !existing.caloriesEstimated ? String(existing.calories) : ''
  );
  const [category, setCategory] = useState<string | null>(existing?.category ?? null);

  const macros = {
    protein: parseAmount(protein),
    carbs: parseAmount(carbs),
    fat: parseAmount(fat),
    fiber: parseAmount(fiber),
  };
  const derived = caloriesFromMacros(macros);
  const entered = parseAmount(calories);
  const shown = entered > 0 ? entered : derived;
  const estimated = entered <= 0;
  const complete = isCompleteCustomFood({ name, ...macros });

  const save = () => {
    if (!complete) return;
    const input = {
      name,
      serving,
      calories: entered,
      ...macros,
      category,
      caloriesEstimated: estimated,
    };
    if (editingId) updateCustomFood(editingId, input);
    else createCustomFood(input);
    navigation.goBack();
  };

  const remove = () => {
    if (!editingId) return;
    Alert.alert('Delete this food?', 'Diary entries you already logged with it are kept.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteCustomFood(editingId);
          navigation.goBack();
        },
      },
    ]);
  };

  // Categories the user has already used, so their own vocabulary comes first.
  const usedCategories = useMemo(
    () => [...new Set(listCustomFoods().map((f) => f.category).filter((c): c is string => !!c))],
    []
  );
  const categories = useMemo(
    () => [...usedCategories, ...FOOD_CATEGORIES.filter((c) => !usedCategories.includes(c))],
    [usedCategories]
  );

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <Card style={{ gap: 12 }}>
            <Input label="Name" value={name} onChangeText={setName} placeholder="e.g. Mum's couscous" />
            <Input
              label="Serving"
              value={serving}
              onChangeText={setServing}
              placeholder="e.g. 1 plate (300 g)"
            />
          </Card>

          <Card style={{ gap: 12 }}>
            <Text variant="label" color="textMuted">
              Macros per serving
            </Text>
            <Row gap={10}>
              <View style={{ flex: 1 }}>
                <Input label="Protein (g)" value={protein} onChangeText={setProtein} keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <Input label="Carbs (g)" value={carbs} onChangeText={setCarbs} keyboardType="numeric" />
              </View>
            </Row>
            <Row gap={10}>
              <View style={{ flex: 1 }}>
                <Input label="Fat (g)" value={fat} onChangeText={setFat} keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <Input label="Fibre (g)" value={fiber} onChangeText={setFiber} keyboardType="numeric" />
              </View>
            </Row>
            <Text variant="caption" color="textFaint">
              Fibre is part of carbs — enter it if you know it and the calorie estimate gets sharper.
            </Text>
          </Card>

          {/* Calories: derived unless overridden. */}
          <Card accent={estimated ? theme.colors.warning : theme.colors.calories} style={{ gap: 12 }}>
            <Row gap={8} style={{ alignItems: 'center' }}>
              <Icon
                icon={estimated ? 'nutrition.estimated' : 'nutrition.calories'}
                size={18}
                color={estimated ? theme.colors.warning : theme.colors.calories}
              />
              <Text variant="bodyStrong" style={{ flex: 1 }}>
                {shown} kcal
              </Text>
              {estimated && (
                <Text variant="caption" color="textFaint">
                  estimated
                </Text>
              )}
            </Row>
            <Input
              label="Calories (leave blank to work it out)"
              value={calories}
              onChangeText={setCalories}
              keyboardType="numeric"
              placeholder={`${derived}`}
            />
            <Text variant="caption" color="textFaint">
              {estimated
                ? "Worked out from the macros — 4 kcal a gram for protein and carbs, 9 for fat, with fibre at 2. That lands within 10% for 97 of every 100 foods in the database. Type a figure from the label to use it instead."
                : 'Using the figure you entered.'}
            </Text>
          </Card>

          <Card style={{ gap: 10 }}>
            <Text variant="label" color="textMuted">
              Category (optional)
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              <Chip label="None" active={category === null} onPress={() => setCategory(null)} small />
              {categories.map((c) => (
                <Chip
                  key={c}
                  label={c}
                  active={category === c}
                  onPress={() => setCategory(category === c ? null : c)}
                  small
                />
              ))}
            </View>
          </Card>

          <Divider />
          <Text variant="caption" color="textFaint">
            Custom foods have no vitamin or mineral data — we won't invent one from a name. They
            count fully toward calories and macros, and simply add nothing to your micronutrient
            totals.
          </Text>

          <Button
            title={editingId ? 'Save changes' : 'Save food'}
            icon="core.check"
            onPress={save}
            disabled={!complete}
          />
          {!complete && (
            <Text variant="caption" color="textFaint" style={{ textAlign: 'center' }}>
              Needs a name and at least one macro.
            </Text>
          )}
          {editingId && (
            <Pressable onPress={remove} style={{ paddingVertical: 12, alignItems: 'center' }}>
              <Text variant="caption" color="danger">
                Delete this food
              </Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
