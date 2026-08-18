import React, { useMemo, useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, Pressable, FlatList } from 'react-native';
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
import { FOOD_DB, FOOD_CATEGORIES } from '@/data/foods';
import {
  composeTotals,
  describeComponents,
  makeComponent,
  rescaleComponent,
  wouldCreateCycle,
  type ComposableFood,
  type FoodComponent,
} from '@/lib/composedFood';
import {
  CUSTOM_FOOD_PREFIX,
  componentsOf,
  composableFoods,
  createComposedFood,
  getCustomFood,
  updateComposedFood,
} from '@/repositories/customFoodRepo';
import { MICRO_DEFS } from '@/lib/micros';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type ComposeRoute = RouteProp<RootStackParamList, 'ComposeFood'>;

/**
 * Build a dish from other foods with quantities — "Friday couscous": couscous
 * ×1.5, lamb ×1, chickpeas ×0.5, olive oil ×2 — and save it as one food.
 *
 * Every component is snapshotted at the moment it's added, so the plate you
 * save is the plate you log next month even if the catalogue is corrected
 * underneath it. Macros AND micros are summed from the parts, so the lamb's
 * iron and B12 ride along into your daily totals exactly as they would if you
 * had logged the parts separately — which is the whole point of doing it this
 * way instead of guessing a number for the finished plate.
 */
export function ComposeFoodScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<ComposeRoute>();
  const editingId = route.params?.id ?? null;
  const existing = useMemo(() => (editingId ? getCustomFood(editingId) : undefined), [editingId]);
  const selfId = editingId ? `${CUSTOM_FOOD_PREFIX}${editingId}` : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [serving, setServing] = useState(existing?.serving ?? '1 plate');
  const [category, setCategory] = useState<string | null>(existing?.category ?? null);
  const [components, setComponents] = useState<FoodComponent[]>(() => (existing ? componentsOf(existing) : []));

  // Picker state
  const [picking, setPicking] = useState(false);
  const [query, setQuery] = useState('');
  const [pickCat, setPickCat] = useState<string | null>(null);
  const [pending, setPending] = useState<ComposableFood | null>(null);
  const [pendingQty, setPendingQty] = useState('1');

  const pool = useMemo(() => composableFoods(FOOD_DB, selfId), [selfId, picking]);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = pool;
    if (pickCat) list = list.filter((f) => FOOD_DB.find((c) => c.id === f.id)?.category === pickCat);
    if (q) list = list.filter((f) => f.name.toLowerCase().includes(q));
    return list.slice(0, 40);
  }, [pool, query, pickCat]);

  const totals = useMemo(() => composeTotals(components), [components]);
  const microCount = totals.micros ? MICRO_DEFS.filter((d) => (totals.micros?.[d.key] ?? 0) > 0).length : 0;
  const complete = name.trim().length > 0 && components.length > 0;

  const addPending = () => {
    if (!pending) return;
    const qty = parseFloat(pendingQty.replace(',', '.'));
    // A composed food may include another composed food, but never itself,
    // directly or via a chain — that would be an infinite recipe.
    if (wouldCreateCycle(pending.id, selfId ? [selfId] : [])) return;
    setComponents((cs) => [...cs, makeComponent(pending, Number.isFinite(qty) && qty > 0 ? qty : 1)]);
    setPending(null);
    setPendingQty('1');
    setQuery('');
    setPicking(false);
  };

  const setQty = (i: number, text: string) => {
    const qty = parseFloat(text.replace(',', '.'));
    if (!Number.isFinite(qty) || qty <= 0) return;
    setComponents((cs) => cs.map((c, idx) => (idx === i ? rescaleComponent(c, qty) : c)));
  };

  const save = () => {
    if (!complete) return;
    const input = { name, serving, category, components };
    if (editingId) updateComposedFood(editingId, input);
    else createComposedFood(input);
    navigation.goBack();
  };

  // ── Picker mode ──
  if (picking) {
    return (
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        <View style={{ flex: 1, padding: theme.spacing.lg, gap: theme.spacing.sm }}>
          {pending ? (
            <Card style={{ gap: 10 }}>
              <Text variant="h3">{pending.name}</Text>
              <Text variant="caption" color="textMuted">
                {pending.serving} · {pending.calories} kcal · P{pending.protein} C{pending.carbs} F{pending.fat} Fb{pending.fiber}
              </Text>
              <Input label="How many servings" value={pendingQty} onChangeText={setPendingQty} keyboardType="numeric" />
              <Row gap={8}>
                <Button title="Back" variant="secondary" size="sm" onPress={() => setPending(null)} style={{ flex: 1 }} fullWidth={false} />
                <Button title="Add to dish" size="sm" icon="core.add" onPress={addPending} style={{ flex: 2 }} fullWidth={false} />
              </Row>
            </Card>
          ) : (
            <>
              <Row gap={8} style={{ alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Input value={query} onChangeText={setQuery} placeholder="Search a food to add…" />
                </View>
                <Pressable onPress={() => setPicking(false)} hitSlop={8}>
                  <Icon icon="core.close" size={22} color={theme.colors.textMuted} />
                </Pressable>
              </Row>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 6, paddingVertical: 4 }}>
                <Chip label="All" active={pickCat === null} onPress={() => setPickCat(null)} small />
                {FOOD_CATEGORIES.map((c) => (
                  <Chip key={c} label={c} active={pickCat === c} onPress={() => setPickCat(pickCat === c ? null : c)} small />
                ))}
              </ScrollView>
              <FlatList
                data={results}
                keyExtractor={(f) => f.id}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: 40 }}
                renderItem={({ item }) => (
                  <Pressable onPress={() => setPending(item)}>
                    <Card>
                      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flex: 1 }}>
                          <Row gap={6} style={{ alignItems: 'center' }}>
                            <Text variant="bodyStrong" numberOfLines={1} style={{ flexShrink: 1 }}>{item.name}</Text>
                            {item.id.startsWith(CUSTOM_FOOD_PREFIX) && <Text variant="caption" color="accent">yours</Text>}
                          </Row>
                          <Text variant="caption" color="textMuted">{item.serving} · {item.calories} kcal</Text>
                        </View>
                        <Icon icon="core.add" size={20} color={theme.colors.primary} />
                      </Row>
                    </Card>
                  </Pressable>
                )}
              />
            </>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // ── Compose mode ──
  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <Card style={{ gap: 12 }}>
            <Input label="Name the dish" value={name} onChangeText={setName} placeholder="e.g. Friday couscous" />
            <Input label="One serving is" value={serving} onChangeText={setServing} placeholder="e.g. 1 plate" />
          </Card>

          <Card style={{ gap: 10 }}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Text variant="label" color="textMuted">What's in it</Text>
              <Button title="Add food" size="sm" icon="core.add" onPress={() => setPicking(true)} fullWidth={false} />
            </Row>
            {components.length === 0 ? (
              <Text variant="caption" color="textFaint">
                Add the foods that make up the dish, each with how many servings went in. The totals add up as you go.
              </Text>
            ) : (
              components.map((c, i) => (
                <View key={`${c.sourceId}-${i}`}>
                  {i > 0 ? <Divider /> : null}
                  <Row gap={8} style={{ alignItems: 'center', paddingVertical: 4 }}>
                    <View style={{ flex: 1 }}>
                      <Text variant="body" numberOfLines={1}>{c.name}</Text>
                      <Text variant="caption" color="textFaint">
                        {c.servingSize ? `${c.servingSize} each · ` : ''}{Math.round(c.calories)} kcal
                      </Text>
                    </View>
                    <View style={{ width: 64 }}>
                      <Input
                        value={String(c.servings)}
                        onChangeText={(t) => setQty(i, t)}
                        keyboardType="numeric"
                        suffix="×"
                      />
                    </View>
                    <Pressable onPress={() => setComponents((cs) => cs.filter((_, idx) => idx !== i))} hitSlop={8}>
                      <Icon icon="core.close" size={16} color={theme.colors.textFaint} />
                    </Pressable>
                  </Row>
                </View>
              ))
            )}
          </Card>

          {components.length > 0 && (
            <Card accent={theme.colors.calories} style={{ gap: 8 }}>
              <Text variant="label" color="textMuted">Per serving of the dish</Text>
              <Row style={{ justifyContent: 'space-between' }}>
                <Macro label="Calories" value={`${totals.calories}`} color={theme.colors.calories} />
                <Macro label="Protein" value={`${totals.proteinG}g`} color={theme.colors.protein} />
                <Macro label="Carbs" value={`${totals.carbsG}g`} color={theme.colors.carbs} />
                <Macro label="Fat" value={`${totals.fatG}g`} color={theme.colors.fat} />
                <Macro label="Fibre" value={`${totals.fiberG}g`} color={theme.colors.fiber} />
              </Row>
              <Text variant="caption" color="textFaint">
                {microCount > 0
                  ? `${microCount} micronutrients summed from the parts — the lamb's iron, the greens' vitamin K — count toward your day exactly as the parts would.`
                  : 'Micronutrients follow from the parts; these components carry none.'}
              </Text>
              <Text variant="caption" color="textFaint">{describeComponents(components)}</Text>
            </Card>
          )}

          <Card style={{ gap: 10 }}>
            <Text variant="label" color="textMuted">Category (optional)</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              <Chip label="None" active={category === null} onPress={() => setCategory(null)} small />
              {FOOD_CATEGORIES.map((c) => (
                <Chip key={c} label={c} active={category === c} onPress={() => setCategory(category === c ? null : c)} small />
              ))}
            </View>
          </Card>

          <Text variant="caption" color="textFaint">
            Each part is saved as it is right now, so the dish you save is the dish you log next month —
            even if a food in the database is corrected underneath it.
          </Text>

          <Button title={editingId ? 'Save changes' : 'Save dish'} icon="core.check" onPress={save} disabled={!complete} />
          {!complete && (
            <Text variant="caption" color="textFaint" style={{ textAlign: 'center' }}>Needs a name and at least one food.</Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
