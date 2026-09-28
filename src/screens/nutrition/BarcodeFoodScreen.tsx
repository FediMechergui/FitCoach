import React, { useMemo, useState } from 'react';
import { View, Pressable, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageHero } from '@/components/ui/PageHero';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Row, Divider, Badge } from '@/components/ui/misc';
import { EmptyState } from '@/components/ui/misc3';
import { toast } from '@/components/ui/Toast';
import {
  BARCODE_REASON,
  NOVA_NOTE,
  NUTRISCORE_NOTE,
  PARSE_REASON,
  checkBarcode,
  judgeBarcodeReading,
  offDisplayName,
  offPortion,
  type OffBasis,
  type OffProduct,
} from '@/lib/openFoodFacts';
import { OFF_FAILURE, lookupBarcode, searchProducts, type OffFailure } from '@/services/openFoodFacts';
import { failureMessage, hasFoodVisionKey, readBarcodeInPhoto } from '@/services/foodVision';
import { readBarcodeOnDevice } from '@/services/barcodePhoto';
import { keepOffImage } from '@/services/foodPhoto';
import { FoodImage } from '@/components/FoodImage';
import { createCustomFood, findByBarcode, toFoodItem } from '@/repositories/customFoodRepo';
import { useNutritionStore } from '@/stores/nutritionStore';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Mode = 'barcode' | 'name';

/**
 * A packaged product, from Open Food Facts.
 *
 * Type the numbers under the barcode, or search by name. The record is shown
 * in full before anything is kept: what it says, what it does not say, and
 * where it came from. A product saved once lives in the app's own database
 * and is found again by its barcode with no connection at all.
 *
 * What leaves the phone is the barcode or the words typed. Nothing else.
 */
export function BarcodeFoodScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<RouteProp<RootStackParamList, 'BarcodeFood'>>();
  const meal = params.meal;
  const addPrecise = useNutritionStore((s) => s.addPrecise);

  const [mode, setMode] = useState<Mode>('barcode');
  const [code, setCode] = useState('');
  const [words, setWords] = useState('');
  const [tunisiaOnly, setTunisiaOnly] = useState(true);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [failure, setFailure] = useState<OffFailure | null>(null);
  const [product, setProduct] = useState<OffProduct | null>(null);
  const [kept, setKept] = useState(false);
  const [results, setResults] = useState<OffProduct[] | null>(null);
  const [total, setTotal] = useState(0);
  const [basis, setBasis] = useState<OffBasis>('serving');
  const [servings, setServings] = useState('1');
  const [reading, setReading] = useState(false);
  /** the pack's picture, once it has been downloaded into the app's storage */
  const [packImage, setPackImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const hasModel = hasFoodVisionKey();

  const verdict = useMemo(() => checkBarcode(code), [code]);

  const clear = () => {
    setProblem(null);
    setFailure(null);
    setProduct(null);
    setKept(false);
  };

  const show = (p: OffProduct, alreadyKept: boolean) => {
    setPackImage(null);
    setProduct(p);
    setKept(alreadyKept);
    setBasis(p.servingG != null ? 'serving' : '100');
    setServings('1');
  };

  const lookUp = async (given?: string) => {
    clear();
    setResults(null);
    const verdict = checkBarcode(given ?? code);
    if (!verdict.ok) {
      setProblem(BARCODE_REASON[verdict.reason]);
      return;
    }
    // Looked up before: it is already on the phone, and the network is not asked.
    const saved = findByBarcode(verdict.code);
    if (saved) {
      const item = toFoodItem(saved);
      toast({ message: `${saved.name} is already in your foods` });
      addAndLeave(item.name, item.serving, { calories: item.calories, protein: item.protein, carbs: item.carbs, fat: item.fat, fiber: item.fiber }, item.micros, item.form === 'liquid', false);
      return;
    }
    setBusy(true);
    const r = await lookupBarcode(verdict.code);
    setBusy(false);
    if (r.ok) show(r.product, false);
    else {
      setFailure(r.reason);
      setProblem(r.reason === 'unusable' && r.detail ? PARSE_REASON[r.detail] : OFF_FAILURE[r.reason]);
    }
  };

  /**
   * Photograph the barcode.
   *
   * It is read ON THE PHONE first: the bars themselves are decoded, with no
   * model and no request, and the same number has to be read on more than one
   * line and pass its check digit. Only if that finds nothing, and a key is
   * set, is the photograph sent to the model that reads your meals — and
   * what the model says is put through the check digit too. A number that
   * fails is shown for correction and NOT looked up: a wrong barcode is a
   * different product.
   */
  const photograph = async () => {
    clear();
    setResults(null);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setProblem(perm.canAskAgain ? 'The camera was not allowed. You can type the number instead.' : 'The camera is switched off for FitCoach. Turn it on in settings, or type the number.');
      return;
    }
    const picked = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      // Crop to the barcode: fewer pixels to read, and nothing else in the frame.
      allowsEditing: true,
      aspect: [3, 2],
      quality: 0.6,
      base64: true,
    });
    if (picked.canceled || !picked.assets[0]?.base64) return;
    const photo = picked.assets[0].base64;
    setReading(true);

    const local = await readBarcodeOnDevice(photo);
    if (local.ok) {
      setReading(false);
      setCode(local.result.code);
      await lookUp(local.result.code);
      return;
    }

    if (!hasModel) {
      setReading(false);
      setProblem(
        local.reason === 'too-large'
          ? 'That photograph is too large to read on the phone. Crop it closer to the barcode, or type the number.'
          : 'No barcode could be read from that photograph. Fill the frame with it, hold it level in good light, or type the number.'
      );
      return;
    }

    const seen = await readBarcodeInPhoto(photo);
    setReading(false);
    if (seen.error) {
      setProblem(`The bars could not be read on the phone, and the model could not be asked. ${failureMessage(seen.error)}`);
      return;
    }
    const judged = judgeBarcodeReading(seen.data);
    if (judged.kind === 'read') {
      setCode(judged.code);
      await lookUp(judged.code);
    } else if (judged.kind === 'doubtful') {
      setCode(judged.digits);
      setProblem(`Read as ${judged.digits}, but that number does not add up, so one digit was read wrong. Correct it against the pack, then look it up.`);
    } else {
      setProblem('No number could be read from that photograph. Fill the frame with the barcode in good light, or type the number.');
    }
  };

  const search = async () => {
    clear();
    if (words.trim().length < 2) {
      setProblem('Type at least two letters of the product or the brand.');
      return;
    }
    setBusy(true);
    const r = await searchProducts(words, tunisiaOnly);
    setBusy(false);
    if (r.ok) {
      setResults(r.products);
      setTotal(r.total);
    } else {
      setResults(null);
      setFailure(r.reason);
      setProblem(OFF_FAILURE[r.reason]);
    }
  };

  const addAndLeave = (
    name: string,
    serving: string,
    m: { calories: number; protein: number; carbs: number; fat: number; fiber: number },
    micros: Parameters<typeof addPrecise>[0]['micros'],
    liquid: boolean,
    announce = true
  ) => {
    const q = Math.max(0.1, Math.min(20, parseFloat(servings.replace(',', '.')) || 1));
    addPrecise({
      mealType: meal,
      foodName: name,
      quantity: q,
      servingSize: serving,
      calories: m.calories,
      proteinG: m.protein,
      carbsG: m.carbs,
      fatG: m.fat,
      fiberG: m.fiber,
      micros,
      form: liquid ? 'liquid' : 'solid',
    });
    if (announce) toast({ message: `Logged ${name} to ${meal}` });
    navigation.goBack();
  };

  const keep = async (alsoLog: boolean) => {
    if (!product || saving) return;
    const portion = offPortion(product, basis);
    const name = offDisplayName(product);
    if (!kept && !findByBarcode(product.barcode)) {
      // The picture is downloaded once, now, and shown from the phone from then on.
      // No picture is not a failure: the product is saved without one.
      setSaving(true);
      const imageUri = packImage ?? (await keepOffImage(product.imageUrl));
      setSaving(false);
      setPackImage(imageUri);
      createCustomFood({
        name,
        serving: portion.label,
        calories: portion.macros.calories,
        protein: portion.macros.protein,
        carbs: portion.macros.carbs,
        fat: portion.macros.fat,
        fiber: portion.macros.fiber,
        category: 'Packaged product',
        caloriesEstimated: product.missing.includes('calories'),
        form: product.liquid ? 'liquid' : 'solid',
        micros: portion.micros,
        source: 'off',
        barcode: product.barcode,
        imageUri,
      });
      setKept(true);
    }
    if (alsoLog) addAndLeave(name, portion.label, portion.macros, portion.micros, product.liquid);
    else toast({ message: `${name} is in your foods now, and works offline` });
  };

  const portion = product ? offPortion(product, basis) : null;

  return (
    <Screen>
      <PageHero
        icon="nutrition.search"
        color={theme.colors.accent}
        eyebrow="Open Food Facts"
        title="Packaged product"
        subtitle="Read the label of a packaged product from a free, open database, then keep it on your phone."
      />

      <SegmentedControl
        value={mode}
        onChange={(v) => {
          setMode(v as Mode);
          clear();
        }}
        options={[
          { value: 'barcode', label: 'By barcode' },
          { value: 'name', label: 'By name' },
        ]}
      />

      {mode === 'barcode' ? (
        <Card style={{ gap: 12 }}>
          <Input
            label="The numbers under the barcode"
            value={code}
            onChangeText={(t) => {
              setCode(t);
              setProblem(null);
            }}
            placeholder="6194003803042"
            keyboardType="number-pad"
            maxLength={16}
            helper={verdict.ok ? 'That number checks out.' : code.length >= 8 ? BARCODE_REASON[verdict.reason] : 'Eight, twelve or thirteen digits. Tunisian products begin with 619.'}
          />
          <Button title={busy ? 'Looking it up…' : 'Look it up'} icon="nutrition.search" loading={busy} disabled={!verdict.ok || reading} hint={!verdict.ok && code.length > 0 ? BARCODE_REASON[verdict.reason] : undefined} onPress={() => lookUp()} />
          <Button title={reading ? 'Reading the barcode…' : 'Photograph the barcode'} icon="card.camera" variant="secondary" loading={reading} disabled={busy} onPress={photograph} />
          <Text variant="caption" color="textFaint">
            The bars are read on your phone, with no connection and nothing sent. The number has to be read on more than one line and pass its own check digit before it is used.
            {hasModel ? ' If the bars cannot be read, the photograph is sent to the model that reads your meals, and its reading is checked the same way.' : ''}
          </Text>
        </Card>
      ) : (
        <Card style={{ gap: 12 }}>
          <Input label="Product or brand" value={words} onChangeText={setWords} placeholder="yaourt, harissa, biscuit…" maxLength={60} returnKeyType="search" onSubmitEditing={search} />
          <SegmentedControl
            value={tunisiaOnly ? 'tn' : 'all'}
            onChange={(v) => setTunisiaOnly(v === 'tn')}
            options={[
              { value: 'tn', label: 'Sold in Tunisia' },
              { value: 'all', label: 'Everywhere' },
            ]}
          />
          <Button title={busy ? 'Searching…' : 'Search'} icon="nutrition.search" loading={busy} onPress={search} />
        </Card>
      )}

      {problem ? (
        <Card accent={theme.colors.warning} style={{ gap: 10 }}>
          <Text variant="body">{problem}</Text>
          {failure === 'not-found' || failure === 'unusable' ? (
            <Button title="Enter the label by hand" variant="secondary" size="sm" icon="core.edit" onPress={() => navigation.navigate('CustomFood', {})} />
          ) : null}
        </Card>
      ) : null}

      {mode === 'name' && results && !product ? (
        results.length === 0 ? (
          <EmptyState
            icon="nutrition.search"
            title="Nothing found"
            message={tunisiaOnly ? 'No product with a usable label is recorded as sold in Tunisia under those words. Try "Everywhere", or another spelling.' : 'No product with a usable label matched those words.'}
          />
        ) : (
          <>
            <Text variant="caption" color="textMuted">
              {results.length} with a usable label{total > results.length ? `, of ${total.toLocaleString()} found` : ''}. Tap one to read it.
            </Text>
            {results.map((p) => (
              <Card key={p.barcode} onPress={() => show(p, !!findByBarcode(p.barcode))} style={{ gap: 2 }}>
                <Text variant="bodyStrong" numberOfLines={2}>
                  {offDisplayName(p)}
                </Text>
                <Text variant="caption" color="textMuted" numberOfLines={1}>
                  {p.per100.calories} kcal per 100 {p.liquid ? 'ml' : 'g'} · P{p.per100.protein} C{p.per100.carbs} F{p.per100.fat}
                  {p.quantity ? ` · ${p.quantity}` : ''}
                </Text>
              </Card>
            ))}
          </>
        )
      ) : null}

      {product && portion ? (
        <>
          <Card raised accent={theme.colors.accent} style={{ gap: 12 }}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ marginRight: 12 }}>
                <FoodImage imageUri={packImage} category="Packaged product" form={product.liquid ? 'liquid' : 'solid'} size={56} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="h3">{offDisplayName(product)}</Text>
                <Text variant="caption" color="textMuted">
                  {[product.quantity, product.barcode].filter(Boolean).join(' · ')}
                </Text>
              </View>
              {kept ? <Badge label="In your foods" color={theme.colors.success} /> : null}
            </Row>

            {product.servingG != null ? (
              <SegmentedControl
                value={basis}
                onChange={(v) => setBasis(v as OffBasis)}
                options={[
                  { value: 'serving', label: `Per serving` },
                  { value: '100', label: `Per 100 ${product.liquid ? 'ml' : 'g'}` },
                ]}
              />
            ) : null}

            <View style={{ gap: 2 }}>
              <Text variant="eyebrow" color="textMuted">
                {portion.label}
              </Text>
              <Text variant="numeralXL">{portion.macros.calories}</Text>
              <Text variant="caption" color="textFaint">
                kcal{product.missing.includes('calories') ? ' · worked out from the macros, the label gave none' : ''}
              </Text>
            </View>

            <Row gap={8}>
              <Macro label="Protein" value={portion.macros.protein} color={theme.colors.protein} absent={product.missing.includes('protein')} />
              <Macro label="Carbs" value={portion.macros.carbs} color={theme.colors.carbs} absent={product.missing.includes('carbs')} />
              <Macro label="Fat" value={portion.macros.fat} color={theme.colors.fat} absent={product.missing.includes('fat')} />
              <Macro label="Fibre" value={portion.macros.fiber} color={theme.colors.fiber} absent={product.missing.includes('fiber')} />
            </Row>

            {product.missing.length > 0 ? (
              <Text variant="caption" color="warning">
                This record does not give: {product.missing.join(', ')}. Those read as zero here. If the pack says otherwise, correct the food after saving it.
              </Text>
            ) : null}

            <Divider />

            {product.sugars != null || product.saturatedFat != null || product.salt != null ? (
              <Text variant="caption" color="textMuted">
                Per 100 {product.liquid ? 'ml' : 'g'}:
                {product.sugars != null ? ` sugars ${product.sugars} g` : ''}
                {product.saturatedFat != null ? ` · saturated fat ${product.saturatedFat} g` : ''}
                {product.salt != null ? ` · salt ${product.salt} g` : ''}
              </Text>
            ) : null}
            {product.nutriScore ? (
              <Text variant="caption" color="textMuted">
                {NUTRISCORE_NOTE[product.nutriScore]}
              </Text>
            ) : null}
            {product.nova ? (
              <Text variant="caption" color="textMuted">
                {NOVA_NOTE[product.nova]} (NOVA {product.nova})
              </Text>
            ) : null}
            {product.allergens.length > 0 ? (
              <Row gap={8} style={{ alignItems: 'flex-start' }}>
                <Icon icon="core.warning" size={15} color={theme.colors.warning} />
                <Text variant="caption" color="textMuted" style={{ flex: 1 }}>
                  Declared allergens: {product.allergens.join(', ')}. A record can be incomplete: the pack is what counts.
                </Text>
              </Row>
            ) : null}
            {product.ingredients ? (
              <Text variant="caption" color="textFaint" numberOfLines={6}>
                {product.ingredients}
              </Text>
            ) : null}
          </Card>

          <Card style={{ gap: 12 }}>
            <Input label={`How many (${portion.label} each)`} value={servings} onChangeText={setServings} keyboardType="decimal-pad" placeholder="1" maxLength={5} />
            <Button title={saving ? 'Saving…' : `Save and log to ${meal}`} icon="core.check" loading={saving} onPress={() => keep(true)} />
            {!kept ? <Button title="Save to my foods only" variant="secondary" disabled={saving} onPress={() => keep(false)} /> : null}
            {product.imageUrl ? (
              <Text variant="caption" color="textFaint">
                Saving also keeps the picture of the pack, downloaded once from Open Food Facts.
              </Text>
            ) : null}
          </Card>
        </>
      ) : null}

      <Card style={{ gap: 6 }}>
        <Text variant="eyebrow" color="textMuted">
          Where this comes from
        </Text>
        <Text variant="caption" color="textMuted">
          Open Food Facts is a free database of packaged food, entered by the people who buy it and published under the Open Database Licence. A record is as good as whoever typed it, so check it against the pack.
        </Text>
        <Text variant="caption" color="textMuted">
          A lookup sends the barcode, or the words you typed, to openfoodfacts.org. Nothing about you or your diary is sent. A photograph of a barcode is read on the phone; it goes to OpenRouter, with your own key, only if the phone could not read it.
        </Text>
        <Pressable onPress={() => Linking.openURL('https://world.openfoodfacts.org').catch(() => undefined)} accessibilityRole="link">
          <Text variant="caption" color="accent">
            openfoodfacts.org
          </Text>
        </Pressable>
      </Card>
    </Screen>
  );
}

function Macro({ label, value, color, absent }: { label: string; value: number; color: string; absent: boolean }) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, paddingVertical: 8, paddingHorizontal: 6, borderRadius: theme.radius.sm, backgroundColor: theme.alpha.tint08(color), alignItems: 'center', gap: 1 }}>
      <Text variant="numeralM" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={{ color: absent ? theme.colors.textFaint : theme.colors.text }}>
        {absent ? '—' : value}
      </Text>
      <Text variant="caption" color="textMuted" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}
