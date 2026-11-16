import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { finiteNumber } from '@/lib/validation';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Row } from '@/components/ui/misc';
import { PageHero } from '@/components/ui/PageHero';
import type { RootStackParamList } from '@/navigation/types';
import { useUserStore } from '@/stores/userStore';
import { upsertNutritionGoal } from '@/repositories/userRepo';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function GoalsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const goal = useUserStore((s) => s.goal);
  const recalc = useUserStore((s) => s.recalcTargets);
  const load = useUserStore((s) => s.load);

  const [calories, setCalories] = useState(goal ? String(goal.calorieTarget) : '');
  const [protein, setProtein] = useState(goal ? String(goal.proteinG) : '');
  const [carbs, setCarbs] = useState(goal ? String(goal.carbsG) : '');
  const [fat, setFat] = useState(goal ? String(goal.fatG) : '');
  const [water, setWater] = useState(goal ? String(goal.waterGoalMl) : '2500');
  const [caffeine, setCaffeine] = useState(goal ? String(goal.caffeineSoftLimitMg) : '400');
  const [automatic, setAutomatic] = useState(false);

  const save = () => {
    try {
    upsertNutritionGoal({
      calorieTarget: finiteNumber(calories, 'Daily calories', 500, 10000),
      proteinG: finiteNumber(protein, 'Protein', 0, 1000),
      carbsG: finiteNumber(carbs, 'Carbohydrates', 0, 2000),
      fatG: finiteNumber(fat, 'Fat', 0, 1000),
      waterGoalMl: finiteNumber(water, 'Water', 250, 15000),
      caffeineSoftLimitMg: finiteNumber(caffeine, 'Caffeine limit', 0, 2000),
      manual: !automatic,
      tdee: goal?.tdee ?? null,
    });
    load();
    navigation.goBack();
    } catch (error) { Alert.alert('Check your targets', error instanceof Error ? error.message : 'Please enter valid targets.'); }
  };

  const autoRecalc = () => {
    const g = recalc({ preview: true, resetManual: true });
    if (g) {
      setCalories(String(g.calorieTarget));
      setProtein(String(g.proteinG));
      setCarbs(String(g.carbsG));
      setFat(String(g.fatG));
      setWater(String(g.waterGoalMl));
      setAutomatic(true);
    }
  };

  return (
    <Screen>
      <PageHero icon="nutrition.calories" color={theme.colors.calories} title="Targets" subtitle="These override the auto-calculated targets. Use “Auto-recalculate” to reset them from your profile & latest weight." />

      <Card style={{ gap: theme.spacing.md }}>
        <Input label="Daily calories" value={calories} onChangeText={(v) => { setAutomatic(false); setCalories(v); }} suffix="kcal" keyboardType="numeric" />
        <Row>
          <View style={{ flex: 1 }}>
            <Input label="Protein" value={protein} onChangeText={(v) => { setAutomatic(false); setProtein(v); }} suffix="g" keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Carbs" value={carbs} onChangeText={(v) => { setAutomatic(false); setCarbs(v); }} suffix="g" keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Fat" value={fat} onChangeText={(v) => { setAutomatic(false); setFat(v); }} suffix="g" keyboardType="numeric" />
          </View>
        </Row>
      </Card>

      <Card style={{ gap: theme.spacing.md }}>
        <Input label="Water goal" value={water} onChangeText={(v) => { setAutomatic(false); setWater(v); }} suffix="ml" keyboardType="numeric" />
        <Input label="Caffeine soft limit" value={caffeine} onChangeText={(v) => { setAutomatic(false); setCaffeine(v); }} suffix="mg" keyboardType="numeric" />
      </Card>

      <Button title="Auto-recalculate from profile" variant="secondary" icon="core.settings" onPress={autoRecalc} />
      <Row>
        <Button title="Cancel" variant="ghost" onPress={() => navigation.goBack()} style={{ flex: 1 }} fullWidth={false} />
        <Button title="Save Targets" icon="core.check" onPress={save} style={{ flex: 2 }} fullWidth={false} />
      </Row>
    </Screen>
  );
}
