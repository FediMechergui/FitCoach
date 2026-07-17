import React, { useMemo, useState } from 'react';
import { View, Pressable, FlatList, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Row, Divider } from '@/components/ui/misc';
import type { RootStackParamList } from '@/navigation/types';
import type { MealType } from '@/db/schema';
import { FOOD_DB, FOOD_CATEGORIES, estimateFromDescription, type FoodItem } from '@/data/foods';
import { Chip } from '@/components/ui/Chip';
import { useNutritionStore } from '@/stores/nutritionStore';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type AddFoodRoute = RouteProp<RootStackParamList, 'AddFood'>;

export function AddFoodScreen() {
  const theme = useTheme();
  const route = useRoute<AddFoodRoute>();
  const meal = route.params.meal;
  const [mode, setMode] = useState<'precise' | 'honest'>(route.params.mode ?? 'precise');

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ padding: theme.spacing.lg, gap: theme.spacing.md }}>
          <SegmentedControl
            options={[
              { value: 'precise', label: 'Precise', icon: 'nutrition.search' },
              { value: 'honest', label: 'Honest Log', icon: 'nutrition.honest' },
            ]}
            value={mode}
            onChange={setMode}
          />
        </View>
        {mode === 'precise' ? <PreciseMode meal={meal} /> : <HonestMode meal={meal} />}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Precise mode ──────────────────────────────────────────────────────────────
function PreciseMode({ meal }: { meal: MealType }) {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const addPrecise = useNutritionStore((s) => s.addPrecise);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [qty, setQty] = useState('1');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = FOOD_DB;
    if (category) list = list.filter((f) => f.category === category);
    if (q) list = list.filter((f) => f.name.toLowerCase().includes(q));
    else if (!category) list = list.slice(0, 25);
    return list;
  }, [query, category]);

  const save = () => {
    if (!selected) return;
    const q = parseFloat(qty) || 1;
    addPrecise({
      mealType: meal,
      foodName: selected.name,
      quantity: q,
      servingSize: selected.serving,
      calories: selected.calories,
      proteinG: selected.protein,
      carbsG: selected.carbs,
      fatG: selected.fat,
      fiberG: selected.fiber,
      micros: selected.micros,
    });
    navigation.goBack();
  };

  if (selected) {
    const q = parseFloat(qty) || 1;
    return (
      <View style={{ flex: 1, padding: theme.spacing.lg, gap: theme.spacing.md }}>
        <Card style={{ gap: 12 }}>
          <Row gap={10} style={{ alignItems: 'center' }}>
            <Icon icon="nutrition.calories" color={theme.colors.calories} />
            <View style={{ flex: 1 }}>
              <Text variant="h3">{selected.name}</Text>
              <Text variant="caption" color="textMuted">{selected.serving}</Text>
            </View>
          </Row>
          <Input label="Servings" value={qty} onChangeText={setQty} keyboardType="numeric" />
          <Divider />
          <Row style={{ justifyContent: 'space-between' }}>
            <Macro label="Calories" value={`${Math.round(selected.calories * q)}`} color={theme.colors.calories} />
            <Macro label="Protein" value={`${Math.round(selected.protein * q)}g`} color={theme.colors.protein} />
            <Macro label="Carbs" value={`${Math.round(selected.carbs * q)}g`} color={theme.colors.carbs} />
            <Macro label="Fat" value={`${Math.round(selected.fat * q)}g`} color={theme.colors.fat} />
          </Row>
        </Card>
        <Row>
          <Button title="Back" variant="secondary" onPress={() => setSelected(null)} style={{ flex: 1 }} fullWidth={false} />
          <Button title="Add to diary" icon="core.add" onPress={save} style={{ flex: 2 }} fullWidth={false} />
        </Row>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, paddingHorizontal: theme.spacing.lg }}>
      <Input value={query} onChangeText={setQuery} placeholder="Search foods (e.g. couscous, brik, tuna)" />

      {/* Category browser */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginTop: theme.spacing.sm, flexGrow: 0 }}
        contentContainerStyle={{ gap: 6, paddingVertical: 4 }}
      >
        <Chip label="All" active={category === null} onPress={() => setCategory(null)} small />
        {FOOD_CATEGORIES.map((c) => (
          <Chip
            key={c}
            label={c}
            active={category === c}
            onPress={() => setCategory(category === c ? null : c)}
            small
          />
        ))}
      </ScrollView>

      <FlatList
        data={results}
        keyExtractor={(f) => f.id}
        style={{ marginTop: theme.spacing.sm }}
        contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <Text variant="caption" color="textFaint">
            {results.length} food{results.length === 1 ? '' : 's'}
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => setSelected(item)}>
            <Card>
              <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Row gap={6} style={{ alignItems: 'center' }}>
                    <Text variant="bodyStrong" numberOfLines={1} style={{ flexShrink: 1 }}>
                      {item.name}
                    </Text>
                    {item.cuisine === 'tunisian' && <Text style={{ fontSize: 12 }}>🇹🇳</Text>}
                  </Row>
                  <Text variant="caption" color="textMuted">
                    {item.serving} · {item.calories} kcal · P{item.protein} C{item.carbs} F{item.fat}
                  </Text>
                </View>
                <Icon icon="core.add" size={20} color={theme.colors.primary} />
              </Row>
            </Card>
          </Pressable>
        )}
      />
    </View>
  );
}

// ── Honest-log mode ───────────────────────────────────────────────────────────
function HonestMode({ meal }: { meal: MealType }) {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const addHonest = useNutritionStore((s) => s.addHonest);
  const [text, setText] = useState('');
  const estimate = useMemo(() => (text.trim() ? estimateFromDescription(text) : null), [text]);

  const save = () => {
    if (!text.trim()) return;
    addHonest({ mealType: meal, description: text.trim() });
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1, padding: theme.spacing.lg, gap: theme.spacing.md }}>
      <Row gap={10} style={{ alignItems: 'flex-start' }}>
        <Icon icon="nutrition.honestAlt" size={22} color={theme.colors.accent} />
        <Text variant="body" color="textMuted" style={{ flex: 1 }}>
          Just describe what you actually ate — no judgment. We'll estimate the macros so
          the day still gets logged.
        </Text>
      </Row>
      <Input
        multiline
        value={text}
        onChangeText={setText}
        placeholder={'e.g. "burger, fries and a soda" or "skipped lunch, big dinner"'}
      />

      {estimate && (
        <Card accent={theme.colors.warning} style={{ gap: 10 }}>
          <Row gap={8} style={{ alignItems: 'center' }}>
            <Icon icon="nutrition.estimated" size={18} color={theme.colors.warning} />
            <Text variant="bodyStrong">Estimated</Text>
            {estimate.matched.length > 0 && (
              <Text variant="caption" color="textFaint" numberOfLines={1} style={{ flex: 1 }}>
                {estimate.matched.join(', ')}
              </Text>
            )}
          </Row>
          <Row style={{ justifyContent: 'space-between' }}>
            <Macro label="Calories" value={`${estimate.calories}`} color={theme.colors.calories} />
            <Macro label="Protein" value={`${estimate.protein}g`} color={theme.colors.protein} />
            <Macro label="Carbs" value={`${estimate.carbs}g`} color={theme.colors.carbs} />
            <Macro label="Fat" value={`${estimate.fat}g`} color={theme.colors.fat} />
          </Row>
          <Text variant="caption" color="textFaint">
            You can fine-tune any entry later from the diary.
          </Text>
        </Card>
      )}

      <Button title="Log it honestly" icon="core.check" onPress={save} disabled={!text.trim()} />
    </View>
  );
}

function Macro({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      <Text variant="bodyStrong" color={color}>{value}</Text>
      <Text variant="caption" color="textFaint">{label}</Text>
    </View>
  );
}
