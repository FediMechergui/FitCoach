import React, { useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Row } from '@/components/ui/misc';
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

  const save = () => {
    upsertNutritionGoal({
      calorieTarget: parseFloat(calories) || goal?.calorieTarget || 2200,
      proteinG: parseFloat(protein) || goal?.proteinG || 140,
      carbsG: parseFloat(carbs) || goal?.carbsG || 220,
      fatG: parseFloat(fat) || goal?.fatG || 70,
      waterGoalMl: parseFloat(water) || 2500,
      caffeineSoftLimitMg: parseFloat(caffeine) || 400,
      tdee: goal?.tdee ?? null,
    });
    load();
    navigation.goBack();
  };

  const autoRecalc = () => {
    const g = recalc();
    if (g) {
      setCalories(String(g.calorieTarget));
      setProtein(String(g.proteinG));
      setCarbs(String(g.carbsG));
      setFat(String(g.fatG));
    }
  };

  return (
    <Screen>
      <Text variant="body" color="textMuted">
        These override the auto-calculated targets. Use “Auto-recalculate” to reset them
        from your profile & latest weight.
      </Text>

      <Card style={{ gap: theme.spacing.md }}>
        <Input label="Daily calories" value={calories} onChangeText={setCalories} suffix="kcal" keyboardType="numeric" />
        <Row>
          <View style={{ flex: 1 }}>
            <Input label="Protein" value={protein} onChangeText={setProtein} suffix="g" keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Carbs" value={carbs} onChangeText={setCarbs} suffix="g" keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Fat" value={fat} onChangeText={setFat} suffix="g" keyboardType="numeric" />
          </View>
        </Row>
      </Card>

      <Card style={{ gap: theme.spacing.md }}>
        <Input label="Water goal" value={water} onChangeText={setWater} suffix="ml" keyboardType="numeric" />
        <Input label="Caffeine soft limit" value={caffeine} onChangeText={setCaffeine} suffix="mg" keyboardType="numeric" />
      </Card>

      <Button title="Auto-recalculate from profile" variant="secondary" icon="core.settings" onPress={autoRecalc} />
      <Row>
        <Button title="Cancel" variant="ghost" onPress={() => navigation.goBack()} style={{ flex: 1 }} fullWidth={false} />
        <Button title="Save Targets" icon="core.check" onPress={save} style={{ flex: 2 }} fullWidth={false} />
      </Row>
    </Screen>
  );
}
