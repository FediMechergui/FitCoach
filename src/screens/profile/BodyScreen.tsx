import React, { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatTile } from '@/components/ui/StatTile';
import { Row, SectionHeader, Divider } from '@/components/ui/misc';
import type { RootStackParamList } from '@/navigation/types';
import { useUserStore } from '@/stores/userStore';
import { latestWeight } from '@/repositories/userRepo';
import {
  bodyFatCategory,
  computeBodyComp,
  ffmiCategory,
  type BodyComp,
} from '@/lib/bodyComposition';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function BodyScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const user = useUserStore((s) => s.user);
  const logWeight = useUserStore((s) => s.logWeight);

  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [muscle, setMuscle] = useState('');
  const [water, setWater] = useState('');
  const [bone, setBone] = useState('');
  const [current, setCurrent] = useState<BodyComp | null>(null);

  const refresh = useCallback(() => {
    const w = latestWeight();
    if (w) {
      setCurrent(
        computeBodyComp({
          weightKg: w.weightKg,
          heightCm: user?.heightCm,
          bodyFatPct: w.bodyFatPct,
          fatMassKg: w.fatMassKg,
          muscleMassKg: w.muscleMassKg,
          bodyWaterPct: w.bodyWaterPct,
          boneMassKg: w.boneMassKg,
          sex: user?.sex,
        })
      );
      if (!weight) setWeight(String(w.weightKg));
    }
  }, [user, weight]);

  useFocusEffect(useCallback(() => refresh(), [refresh]));

  const preview = useMemo(() => {
    const w = parseFloat(weight);
    if (!w) return null;
    return computeBodyComp({
      weightKg: w,
      heightCm: user?.heightCm,
      bodyFatPct: parseFloat(bodyFat) || null,
      muscleMassKg: parseFloat(muscle) || null,
      bodyWaterPct: parseFloat(water) || null,
      boneMassKg: parseFloat(bone) || null,
      sex: user?.sex,
    });
  }, [weight, bodyFat, muscle, water, bone, user]);

  const save = () => {
    const w = parseFloat(weight);
    if (!w) return;
    logWeight(w, {
      bodyFatPct: parseFloat(bodyFat) || null,
      muscleMassKg: parseFloat(muscle) || null,
      bodyWaterPct: parseFloat(water) || null,
      boneMassKg: parseFloat(bone) || null,
    });
    setBodyFat('');
    setMuscle('');
    setWater('');
    setBone('');
    refresh();
    navigation.goBack();
  };

  const shown = preview ?? current;

  return (
    <Screen>
      <Row gap={12} style={{ alignItems: 'center' }}>
        <Icon icon="stats.bodyFat" size={26} color={theme.colors.info} />
        <Text variant="h1">Body composition</Text>
      </Row>
      <Text variant="body" color="textMuted">
        Log weight, and if you know them, your body-fat %, muscle mass, body-water % and bone
        mass. FitCoach derives your lean mass, fat mass and FFMI.
      </Text>

      <Card style={{ gap: theme.spacing.md }}>
        <Input label="Weight" value={weight} onChangeText={setWeight} suffix="kg" keyboardType="numeric" />
        <Row>
          <View style={{ flex: 1 }}>
            <Input label="Body fat" value={bodyFat} onChangeText={setBodyFat} suffix="%" keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Muscle mass" value={muscle} onChangeText={setMuscle} suffix="kg" keyboardType="numeric" />
          </View>
        </Row>
        <Row>
          <View style={{ flex: 1 }}>
            <Input label="Body water" value={water} onChangeText={setWater} suffix="%" keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Bone mass" value={bone} onChangeText={setBone} suffix="kg" keyboardType="numeric" />
          </View>
        </Row>
      </Card>

      {shown && (
        <>
          <SectionHeader title="Composition" />
          <Row>
            <StatTile
              icon="stats.bodyFat"
              label="Body fat"
              value={shown.bodyFatPct != null ? `${shown.bodyFatPct}%` : '—'}
              sub={shown.bodyFatPct != null && user ? bodyFatCategory(shown.bodyFatPct, user.sex) : undefined}
              accent={theme.colors.warning}
            />
            <StatTile icon="strength.dumbbell" label="Lean mass" value={shown.leanMassKg != null ? `${shown.leanMassKg}kg` : '—'} accent={theme.colors.primary} />
          </Row>
          <Row>
            <StatTile icon="nutrition.calories" label="Fat mass" value={shown.fatMassKg != null ? `${shown.fatMassKg}kg` : '—'} accent={theme.colors.calories} />
            <StatTile
              icon="stats.progression"
              label="FFMI"
              value={shown.normalizedFFMI != null ? `${shown.normalizedFFMI}` : '—'}
              sub={shown.normalizedFFMI != null && user ? ffmiCategory(shown.normalizedFFMI, user.sex) : undefined}
              accent={theme.colors.accent}
            />
          </Row>
          {(shown.bodyWaterPct != null || shown.muscleMassKg != null) && (
            <Card style={{ gap: 8 }}>
              {shown.muscleMassKg != null && (
                <Row style={{ justifyContent: 'space-between' }}>
                  <Text variant="caption" color="textMuted">Muscle mass</Text>
                  <Text variant="bodyStrong">
                    {shown.muscleMassKg}kg{shown.musclePctOfLean != null ? ` · ${shown.musclePctOfLean}% of lean` : ''}
                  </Text>
                </Row>
              )}
              {shown.bodyWaterPct != null && (
                <>
                  <Divider />
                  <Row style={{ justifyContent: 'space-between' }}>
                    <Text variant="caption" color="textMuted">Body water</Text>
                    <Text variant="bodyStrong" color={shown.waterStatus === 'healthy' ? 'success' : 'warning'}>
                      {shown.bodyWaterPct}% ({shown.waterStatus})
                    </Text>
                  </Row>
                </>
              )}
            </Card>
          )}
        </>
      )}

      <Button title="Save weigh-in" icon="core.check" onPress={save} disabled={!parseFloat(weight)} />
    </Screen>
  );
}
