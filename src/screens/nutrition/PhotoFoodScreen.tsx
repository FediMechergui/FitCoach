import React, { useCallback, useMemo, useState } from 'react';
import { View, Image, ActivityIndicator, Pressable } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { PageHero } from '@/components/ui/PageHero';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Icon } from '@/components/ui/Icon';
import { Row, Divider } from '@/components/ui/misc';
import type { RootStackParamList } from '@/navigation/types';
import { SEARCH_FOOD_DB } from '@/data/foods';
import { customFoodsAsItems, createCustomFood } from '@/repositories/customFoodRepo';
import { useNutritionStore } from '@/stores/nutritionStore';
import { EatenAtPicker } from '@/components/EatenAtPicker';
import { resolveEatenAt, type EatenAtChoice } from '@/lib/eatenAt';
import { setOpenRouterKey, openRouterKey } from '@/repositories/kvRepo';
import {
  identifyFoodInPhoto,
  researchNutrition,
  failureMessage,
  lastVisionDetail,
  DEFAULT_MODEL,
  type VisionFailure,
} from '@/services/foodVision';
import {
  rowFromCatalogue,
  rowFromResearch,
  scaleCatalogueFood,
  mealTotals,
  type PhotoMealRow,
} from '@/lib/photoMeal';
import { scalePer100g } from '@/lib/aiFood';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type PhotoRoute = RouteProp<RootStackParamList, 'PhotoFood'>;

type Stage = 'idle' | 'looking' | 'researching' | 'review';

/**
 * Logging a meal from a photograph.
 *
 * The model names what it sees and estimates the portions; anything the
 * catalogue already knows is then answered with the catalogue's own curated
 * numbers, and only genuinely new foods use researched figures — saved as new
 * foods, permanently marked as model-sourced.
 *
 * Nothing is logged without being shown first. Portion estimates from a flat
 * photograph are the weakest part of the whole chain, so every row is editable,
 * and the screen says plainly where each number came from.
 */
export function PhotoFoodScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<PhotoRoute>();
  const meal = route.params.meal;

  const addPrecise = useNutritionStore((s) => s.addPrecise);
  const diaryDate = useNutritionStore((s) => s.date);

  const [keyInput, setKeyInput] = useState('');
  const [hasKey, setHasKey] = useState(() => openRouterKey() != null);
  const [stage, setStage] = useState<Stage>('idle');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [rows, setRows] = useState<PhotoMealRow[]>([]);
  const [dishName, setDishName] = useState('');
  /** foods the model saw but nothing could price — never silently dropped */
  const [dropped, setDropped] = useState<string[]>([]);
  const [error, setError] = useState<VisionFailure | null>(null);
  const [eatenAt, setEatenAt] = useState<EatenAtChoice>({ kind: 'now' });

  const catalogue = useMemo(() => [...customFoodsAsItems(), ...SEARCH_FOOD_DB], []);
  const totals = useMemo(() => mealTotals(rows), [rows]);

  const saveKey = () => {
    const k = keyInput.trim();
    if (!k) return;
    setOpenRouterKey(k);
    setKeyInput('');
    setHasKey(true);
  };

  const run = useCallback(
    async (fromCamera: boolean) => {
      setError(null);
      const perm = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return;

      const opts: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        // Compressed hard on purpose: the model's own downscaling makes a
        // larger upload pointless, and this is someone's mobile data.
        quality: 0.4,
        base64: true,
      };
      const picked = fromCamera
        ? await ImagePicker.launchCameraAsync(opts)
        : await ImagePicker.launchImageLibraryAsync(opts);
      if (picked.canceled || !picked.assets[0]?.base64) return;

      const asset = picked.assets[0];
      setPhotoUri(asset.uri);
      setStage('looking');

      const seen = await identifyFoodInPhoto(asset.base64!);
      if (!seen.data) {
        setError(seen.error);
        setStage('idle');
        return;
      }
      setDishName(seen.data.dishName);

      // Everything the catalogue can answer, answered from the catalogue.
      const resolved: PhotoMealRow[] = [];
      const pending: typeof seen.data.items = [];
      for (const item of seen.data.items) {
        const row = rowFromCatalogue(item, catalogue);
        if (row) resolved.push(row);
        else pending.push(item);
      }

      // Only what's left gets researched — one request for all of it.
      const missed: string[] = [];
      if (pending.length > 0) {
        setStage('researching');
        const found = await researchNutrition(pending.map((p) => p.name));
        for (const item of pending) {
          const per100g = found.data?.get(item.name.trim().toLowerCase());
          if (per100g) resolved.push(rowFromResearch(item, per100g));
          // Nothing is invented for a food we couldn't price — but the plate
          // must say so, or the meal quietly logs short of what was eaten.
          else missed.push(item.name);
        }
        if (!found.data && resolved.length === 0) {
          setError(found.error);
          setStage('idle');
          return;
        }
      }
      setDropped(missed);

      if (resolved.length === 0) {
        setError('unreadable');
        setStage('idle');
        return;
      }
      setRows(resolved);
      setStage('review');
    },
    [catalogue]
  );

  /** Re-scale a row when its portion is corrected. */
  const setGrams = (index: number, text: string) => {
    const grams = Math.max(0, parseFloat(text) || 0);
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== index) return r;
        if (r.source === 'catalogue' && r.food) {
          const s = scaleCatalogueFood(r.food, grams);
          return { ...r, grams, quantity: s.quantity, nutrition: s.nutrition };
        }
        if (r.per100g) {
          return {
            ...r,
            grams,
            quantity: Math.round((grams / 100) * 100) / 100,
            nutrition: scalePer100g(r.per100g, grams),
          };
        }
        return r;
      })
    );
  };

  const removeRow = (index: number) => setRows((prev) => prev.filter((_, i) => i !== index));

  const logMeal = () => {
    const when = resolveEatenAt(eatenAt, diaryDate);
    /*
     * A row edited down to nothing must log nothing. The diary treats a
     * quantity of 0 as "unspecified" and substitutes one whole serving, so
     * passing it straight through recorded a full portion of something the
     * review screen was showing as 0 kcal.
     */
    const loggable = rows.filter((r) => r.quantity > 0);
    if (loggable.length === 0) return;
    /** researched names already written this run, so one plate can't duplicate */
    const written = new Set<string>();
    for (const r of loggable) {
      // A researched food joins the food database first, so it is there next
      // time and never has to be researched again.
      const key = r.name.trim().toLowerCase();
      if (r.source === 'researched' && r.per100g && !written.has(key)) {
        written.add(key);
        createCustomFood({
          name: r.name,
          serving: '100 g',
          calories: r.per100g.calories,
          protein: r.per100g.protein,
          carbs: r.per100g.carbs,
          fat: r.per100g.fat,
          fiber: r.per100g.fiber,
          category: null,
          caloriesEstimated: false,
          form: r.per100g.form,
          micros: r.per100g.micros,
          source: 'ai',
        });
      }
      addPrecise({
        mealType: meal,
        foodName: r.name,
        quantity: r.quantity,
        servingSize: r.source === 'researched' ? '100 g' : r.food?.serving,
        calories: r.source === 'researched' ? r.per100g!.calories : r.food!.calories,
        proteinG: r.source === 'researched' ? r.per100g!.protein : r.food!.protein,
        carbsG: r.source === 'researched' ? r.per100g!.carbs : r.food!.carbs,
        fatG: r.source === 'researched' ? r.per100g!.fat : r.food!.fat,
        fiberG: r.source === 'researched' ? r.per100g!.fiber : r.food!.fiber,
        micros: r.source === 'researched' ? r.per100g!.micros : r.food!.micros,
        form: r.source === 'researched' ? r.per100g!.form : r.food?.form,
        eatenAt: when,
      });
    }
    navigation.goBack();
  };

  // ── Setup: no key yet ──
  if (!hasKey) {
    return (
      <Screen>
        <PageHero
          icon="nutrition.search"
          color={theme.colors.accent}
          title="Photograph a meal"
          subtitle="Connect an OpenRouter key once, and a free model will read your plate."
        />
        <Card>
          <View style={{ gap: theme.spacing.md }}>
            <Text variant="body" color="textMuted">
              Create a free key at openrouter.ai/keys and paste it below. It is kept in this app's
              own database on your phone, never in the app itself, and it is sent nowhere but
              OpenRouter. Note that Android's own backup may copy app data to your Google account,
              so treat the key as you would any other saved password — you can revoke it at
              openrouter.ai/keys at any time.
            </Text>
            <Input
              label="OpenRouter API key"
              value={keyInput}
              onChangeText={setKeyInput}
              placeholder="sk-or-v1-…"
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
            />
            <Button title="Save key" onPress={saveKey} disabled={!keyInput.trim()} />
            <Text variant="caption" color="textFaint">
              Uses {DEFAULT_MODEL}, which costs nothing. The free tier allows 20 requests a minute
              and 50 a day. Your photo is sent to OpenRouter to be read — everything else in
              FitCoach stays offline.
            </Text>
          </View>
        </Card>
      </Screen>
    );
  }

  // ── Working ──
  if (stage === 'looking' || stage === 'researching') {
    return (
      <Screen>
        <PageHero icon="nutrition.search" color={theme.colors.accent} title="Reading your plate" />
        {photoUri && (
          <Image
            source={{ uri: photoUri }}
            style={{ width: '100%', height: 200, borderRadius: theme.radius.lg }}
            resizeMode="cover"
          />
        )}
        <Card>
          <Row gap={12} style={{ alignItems: 'center' }}>
            <ActivityIndicator color={theme.colors.accent} />
            <Text variant="body" color="textMuted" style={{ flex: 1 }}>
              {stage === 'looking'
                ? 'Identifying what is on the plate…'
                : 'Looking up nutrition for the foods we don’t have yet…'}
            </Text>
          </Row>
        </Card>
      </Screen>
    );
  }

  // ── Review ──
  if (stage === 'review') {
    const researched = rows.filter((r) => r.source === 'researched').length;
    const loggable = rows.filter((r) => r.quantity > 0).length;
    return (
      <Screen>
        <PageHero
          icon="nutrition.search"
          color={theme.colors.accent}
          title={dishName || 'What we found'}
          subtitle="Check the portions before logging — a photo judges weight far less well than it names food."
        />
        {photoUri && (
          <Image
            source={{ uri: photoUri }}
            style={{ width: '100%', height: 160, borderRadius: theme.radius.lg }}
            resizeMode="cover"
          />
        )}

        {rows.map((r, i) => (
          <Card key={`${r.name}-${i}`}>
            <View style={{ gap: theme.spacing.sm }}>
              <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text variant="label">{r.name}</Text>
                  <Text variant="caption" color="textFaint">
                    {r.source === 'catalogue'
                      ? `From your food database${r.spokenName !== r.name ? ` · seen as “${r.spokenName}”` : ''}`
                      : `New food — researched and will be added to your database${
                          r.per100g?.basis ? ` · ${r.per100g.basis}` : ''
                        }`}
                  </Text>
                </View>
                <Pressable onPress={() => removeRow(i)} hitSlop={10}>
                  <Icon icon="core.close" size={18} color={theme.colors.textFaint} />
                </Pressable>
              </Row>

              <Row gap={12} style={{ alignItems: 'flex-end' }}>
                <View style={{ width: 110 }}>
                  <Input
                    label={r.servingUnknown ? 'Servings' : 'Portion'}
                    value={String(r.servingUnknown ? r.quantity : r.grams)}
                    onChangeText={(t) => setGrams(i, t)}
                    keyboardType="numeric"
                    suffix={r.servingUnknown ? '' : 'g'}
                  />
                </View>
                <Text variant="caption" color="textMuted" style={{ flex: 1, paddingBottom: 10 }}>
                  {r.nutrition.calories} kcal · P {r.nutrition.protein} · C {r.nutrition.carbs} · F{' '}
                  {r.nutrition.fat}
                  {r.servingUnknown ? `\nCounted in servings of ${r.food?.serving ?? '1 serving'}.` : ''}
                  {r.quantity <= 0 ? '\nSet this above zero, or remove it — it will not be logged.' : ''}
                </Text>
              </Row>
            </View>
          </Card>
        ))}

        <Card accent={theme.colors.accent}>
          <View style={{ gap: theme.spacing.sm }}>
            <Text variant="label">Meal total</Text>
            <Text variant="h2">{totals.calories} kcal</Text>
            <Text variant="caption" color="textMuted">
              Protein {totals.protein} g · Carbs {totals.carbs} g · Fat {totals.fat} g · Fibre{' '}
              {totals.fiber} g
            </Text>
            {totals.micros && (
              <Text variant="caption" color="textFaint">
                {Object.keys(totals.micros).length} micronutrients counted
              </Text>
            )}
          </View>
        </Card>

        {dropped.length > 0 && (
          <Card accent={theme.colors.danger}>
            <Text variant="caption" color="textMuted">
              {dropped.length === 1 ? 'One food was' : `${dropped.length} foods were`} seen but could
              not be priced — {dropped.join(', ')}. Rather than invent numbers,{' '}
              {dropped.length === 1 ? 'it has' : 'they have'} been left out, so this meal logs short.
              Add {dropped.length === 1 ? 'it' : 'them'} by hand if it matters.
            </Text>
          </Card>
        )}

        {researched > 0 && (
          <Card accent={theme.colors.warning}>
            <Text variant="caption" color="textMuted">
              {researched === 1 ? 'One food was' : `${researched} foods were`} not in your database,
              so {researched === 1 ? 'its' : 'their'} nutrition was researched by the model rather
              than measured. {researched === 1 ? 'It is' : 'They are'} saved as an estimate and
              marked as such wherever {researched === 1 ? 'it appears' : 'they appear'}.
            </Text>
          </Card>
        )}

        <Divider />
        <EatenAtPicker value={eatenAt} onChange={setEatenAt} dateISO={diaryDate} />
        <Button
          title={loggable === 0 ? 'Nothing to log' : `Log ${loggable === 1 ? 'this food' : `all ${loggable}`}`}
          onPress={logMeal}
          disabled={loggable === 0}
        />
        <Button title="Discard" variant="ghost" onPress={() => { setRows([]); setStage('idle'); }} />
      </Screen>
    );
  }

  // ── Idle ──
  return (
    <Screen>
      <PageHero
        icon="nutrition.search"
        color={theme.colors.accent}
        title="Photograph a meal"
        subtitle="A free model names what is on the plate; your own food database supplies the numbers."
      />
      {error && (
        <Card accent={theme.colors.danger}>
          <Text variant="caption" color="textMuted">
            {failureMessage(error)}
          </Text>
          {/* The provider's actual words, so a failure can be reported and
              fixed instead of leaving "does it even work?" unanswerable. */}
          {lastVisionDetail() && (
            <Text variant="caption" color="textFaint" style={{ marginTop: 6 }}>
              {lastVisionDetail()}
            </Text>
          )}
        </Card>
      )}
      <Button title="Take a photo" onPress={() => void run(true)} />
      <Button title="Choose from gallery" variant="ghost" onPress={() => void run(false)} />
      {/* Without this a mistyped key is permanent: every call returns 401 and
          the setup card never shows again, so the feature is stuck for good. */}
      <Button
        title="Replace API key"
        variant="ghost"
        onPress={() => {
          setOpenRouterKey('');
          setHasKey(false);
          setError(null);
        }}
      />
      <Card>
        <Text variant="caption" color="textFaint">
          Foods already in your database are logged with their own curated macros and
          micronutrients — the photo only decides what they are and how much. Anything new is
          researched, added to your database, and flagged as an estimate. Nothing is logged until
          you have seen it.
        </Text>
      </Card>
    </Screen>
  );
}
