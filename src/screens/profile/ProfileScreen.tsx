import React, { useCallback, useState } from 'react';
import { View, Pressable } from 'react-native';
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
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Row, SectionHeader, Divider } from '@/components/ui/misc';
import type { RootStackParamList } from '@/navigation/types';
import { useUserStore } from '@/stores/userStore';
import { useSmokingStore } from '@/stores/smokingStore';
import { BODY_TYPE_LABELS } from '@/lib/bodyType';
import { GOAL_LABELS, ACTIVITY_LABELS } from '@/lib/calories';
import { ageFromBirthdate } from '@/lib/date';
import { formatWeight, kgToLb, lbToKg } from '@/lib/format';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ProfileScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const { user, goal, currentWeightKg, load, logWeight, updateProfile } = useUserStore();
  const smokingEnabled = useSmokingStore((s) => s.enabled);
  const loadSmoking = useSmokingStore((s) => s.load);
  const [weighInput, setWeighInput] = useState('');

  useFocusEffect(
    useCallback(() => {
      load();
      loadSmoking();
    }, [load, loadSmoking])
  );

  if (!user) return <Screen><Text>Loading…</Text></Screen>;

  const unit = user.unitPreference;
  const saveWeight = () => {
    const raw = parseFloat(weighInput);
    if (!raw) return;
    const kg = unit === 'imperial' ? lbToKg(raw) : raw;
    logWeight(kg);
    setWeighInput('');
  };

  return (
    <Screen>
      <Row gap={14} style={{ alignItems: 'center' }}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            backgroundColor: theme.colors.primarySoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon icon="nav.profile" size={38} color={theme.colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="h1">{user.name}</Text>
          <Text variant="caption" color="textMuted">
            {ageFromBirthdate(user.birthdate)} yrs · {user.heightCm ?? '—'} cm ·{' '}
            {user.bodyType ? BODY_TYPE_LABELS[user.bodyType] : 'Body type —'}
          </Text>
        </View>
        <Pressable onPress={() => navigation.navigate('EditProfile')} hitSlop={8}>
          <Icon icon="core.edit" size={22} color={theme.colors.textMuted} />
        </Pressable>
      </Row>

      {/* Weight */}
      <Card>
        <SectionHeader title="Weight" />
        <Row style={{ alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <View>
            <Text variant="display" style={{ fontVariant: ['tabular-nums'] }}>
              {currentWeightKg ? (unit === 'imperial' ? kgToLb(currentWeightKg).toFixed(1) : currentWeightKg.toFixed(1)) : '—'}
            </Text>
            <Text variant="caption" color="textMuted">{unit === 'imperial' ? 'lb' : 'kg'} · current</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 16, gap: 8 }}>
            <Input
              value={weighInput}
              onChangeText={setWeighInput}
              placeholder={`Log today's weight`}
              suffix={unit === 'imperial' ? 'lb' : 'kg'}
              keyboardType="numeric"
            />
            <Button title="Log weigh-in" size="sm" icon="stats.weight" onPress={saveWeight} disabled={!weighInput} />
          </View>
        </Row>
      </Card>

      {/* Targets */}
      {goal && (
        <>
          <SectionHeader title="Daily Targets" action="Adjust" onAction={() => navigation.navigate('Goals')} />
          <Row>
            <StatTile icon="nutrition.calories" label="Calories" value={`${goal.calorieTarget}`} accent={theme.colors.calories} />
            <StatTile icon="nutrition.water" label="Water" value={`${(goal.waterGoalMl / 1000).toFixed(1)}L`} accent={theme.colors.water} />
            <StatTile icon="nutrition.caffeine" label="Caffeine" value={`${goal.caffeineSoftLimitMg}mg`} accent={theme.colors.caffeine} />
          </Row>
          <Row>
            <StatTile icon="nutrition.protein" label="Protein" value={`${goal.proteinG}g`} accent={theme.colors.protein} />
            <StatTile icon="nutrition.carbs" label="Carbs" value={`${goal.carbsG}g`} accent={theme.colors.carbs} />
            <StatTile icon="nutrition.fat" label="Fat" value={`${goal.fatG}g`} accent={theme.colors.fat} />
          </Row>
          <Text variant="caption" color="textFaint" center>
            {GOAL_LABELS[user.goal]} · {ACTIVITY_LABELS[user.activityLevel].split(' — ')[0]}
            {goal.tdee ? ` · TDEE ${goal.tdee}` : ''}
          </Text>
        </>
      )}

      {/* Units */}
      <SectionHeader title="Units" />
      <SegmentedControl
        options={[
          { value: 'metric', label: 'Metric (kg, km)' },
          { value: 'imperial', label: 'Imperial (lb, mi)' },
        ]}
        value={unit}
        onChange={(v) => updateProfile({ unitPreference: v })}
      />

      {/* Athlete card & reports */}
      <SectionHeader title="Card & Reports" />
      <Card style={{ gap: 0 }}>
        <LinkRow icon="card.trophy" label="Athlete card" onPress={() => navigation.navigate('ProfileCard')} />
        <Divider />
        <LinkRow icon="report.pdf" label="Export PDF reports" onPress={() => navigation.navigate('Reports')} />
      </Card>

      {/* Health & wellness */}
      <SectionHeader title="Health & Wellness" />
      <Card style={{ gap: 0 }}>
        <LinkRow icon="stats.bodyFat" label="Body composition" onPress={() => navigation.navigate('Body')} />
        <Divider />
        <LinkRow icon="sleep.moon" label="Sleep" onPress={() => navigation.navigate('Sleep')} />
        <Divider />
        <LinkRow icon="work.briefcase" label="Work hours" onPress={() => navigation.navigate('Work')} />
        <Divider />
        <LinkRow icon="habits.generic" label="Habits" onPress={() => navigation.navigate('Habits')} />
        <Divider />
        <LinkRow icon="alcohol.beer" label="Alcohol" onPress={() => navigation.navigate('Alcohol')} />
        <Divider />
        <LinkRow
          icon="smoking.cigarette"
          label={smokingEnabled ? 'Smoking impact' : 'Smoking tracker'}
          onPress={() => navigation.navigate('Smoking')}
        />
        <Divider />
        <LinkRow icon="cycle.flower" label="Cycle tracking" onPress={() => navigation.navigate('Cycle')} />
        <Divider />
        <LinkRow icon="health.medical" label="Health conditions" onPress={() => navigation.navigate('Conditions')} />
        <Divider />
        <LinkRow icon="faith.crescent" label="Prayer times" onPress={() => navigation.navigate('Prayers')} />
        <Divider />
        <LinkRow icon="faith.fasting" label="Fasting mode" onPress={() => navigation.navigate('Fasting')} />
      </Card>

      {/* Links */}
      <SectionHeader title="More" />
      <Card style={{ gap: 0 }}>
        <LinkRow icon="core.calendar" label="Session history" onPress={() => navigation.navigate('SessionHistory')} />
        <Divider />
        <LinkRow icon="nav.train" label="Exercise library" onPress={() => navigation.navigate('ExerciseLibrary', { pick: false })} />
        <Divider />
        <LinkRow icon="core.settings" label="Recalculate targets" onPress={() => useUserStore.getState().recalcTargets()} />
      </Card>

      {/* Privacy note */}
      <Card accent={theme.colors.accent}>
        <Row gap={10} style={{ alignItems: 'flex-start' }}>
          <Icon icon="core.info" size={18} color={theme.colors.accent} />
          <Text variant="caption" color="textMuted" style={{ flex: 1 }}>
            Local-first & private. All your health, body and nutrition data stays on this
            device in an on-device SQLite database — no account or internet required. Cloud
            sync is an explicit opt-in (Phase 2).
          </Text>
        </Row>
      </Card>
    </Screen>
  );
}

function LinkRow({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 }}>
        <Row gap={12} style={{ alignItems: 'center' }}>
          <Icon icon={icon} size={20} color={theme.colors.textMuted} />
          <Text variant="body">{label}</Text>
        </Row>
        <Icon icon="core.forward" size={18} color={theme.colors.textFaint} />
      </Row>
    </Pressable>
  );
}
