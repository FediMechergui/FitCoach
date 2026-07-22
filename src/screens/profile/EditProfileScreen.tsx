import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Row, EmptyState } from '@/components/ui/misc';
import type { RootStackParamList } from '@/navigation/types';
import { useUserStore } from '@/stores/userStore';
import { ACTIVITY_LABELS, GOAL_LABELS, GOAL_NOTES, GOAL_ORDER, type ActivityLevel, type Goal } from '@/lib/calories';
import { BODY_TYPE_BLURB, BODY_TYPE_LABELS, type BodyType } from '@/lib/bodyType';
import type { Gender } from '@/db/schema';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * Edit profile / change goal. Rewritten to be null-safe (the previous version
 * crashed with a blank screen if the user store wasn't hydrated) and to give
 * explicit feedback: saving recalculates targets and shows the new numbers.
 */
export function EditProfileScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const user = useUserStore((s) => s.user);
  const updateProfile = useUserStore((s) => s.updateProfile);
  const recalc = useUserStore((s) => s.recalcTargets);

  const [name, setName] = useState(user?.name ?? '');
  const [gender, setGender] = useState<Gender>(user?.gender ?? 'male');
  const [sex, setSex] = useState<'male' | 'female'>(user?.sex ?? 'male');
  const [birthdate, setBirthdate] = useState(user?.birthdate ?? '1995-01-01');
  const [height, setHeight] = useState(user?.heightCm ? String(user.heightCm) : '');
  const [activity, setActivity] = useState<ActivityLevel>(user?.activityLevel ?? 'moderate');
  const [goal, setGoal] = useState<Goal>(user?.goal ?? 'maintain');
  const [rate, setRate] = useState<'slow' | 'moderate' | 'aggressive'>(user?.rateOfChange ?? 'moderate');
  const [bodyType, setBodyType] = useState<BodyType | null>(user?.bodyType ?? null);
  const [saving, setSaving] = useState(false);

  // Never crash on a missing store — show a recoverable state instead.
  if (!user) {
    return (
      <Screen>
        <EmptyState
          icon="core.info"
          title="Profile not loaded"
          message="Go back and reopen this screen. If it persists, restart the app."
        />
        <Button title="Back" onPress={() => navigation.goBack()} />
      </Screen>
    );
  }

  const birthdateValid = /^\d{4}-\d{2}-\d{2}$/.test(birthdate.trim());
  const heightNum = parseFloat(height);
  const heightValid = !height || (heightNum > 100 && heightNum < 250);
  const canSave = !!name.trim() && birthdateValid && heightValid && !saving;

  const save = () => {
    setSaving(true);
    try {
      updateProfile({
        name: name.trim() || 'Athlete',
        gender,
        sex,
        birthdate: birthdate.trim(),
        heightCm: heightNum > 0 ? heightNum : user.heightCm,
        activityLevel: activity,
        goal,
        rateOfChange: rate,
        bodyType,
      });
      const newGoal = recalc();
      Alert.alert(
        'Profile updated ✓',
        newGoal
          ? `Your targets were recalculated:\n\n${newGoal.calorieTarget} kcal · P ${newGoal.proteinG}g · C ${newGoal.carbsG}g · F ${newGoal.fatG}g`
          : 'Saved. Log a weigh-in so calorie targets can be calculated.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (e) {
      Alert.alert('Could not save', String(e instanceof Error ? e.message : e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Input label="Name" value={name} onChangeText={setName} />

      <View>
        <Text variant="label" color="textMuted" style={{ marginBottom: 6 }}>Gender</Text>
        <SegmentedControl
          scrollable
          options={[
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
            { value: 'non_binary', label: 'Non-binary' },
            { value: 'other', label: 'Other' },
          ]}
          value={gender}
          onChange={(g) => {
            setGender(g);
            if (g === 'male' || g === 'female') setSex(g);
          }}
        />
      </View>

      {gender !== 'male' && gender !== 'female' && (
        <View>
          <Text variant="label" color="textMuted" style={{ marginBottom: 6 }}>
            Sex for metabolic calculations (BMR)
          </Text>
          <SegmentedControl
            options={[
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
            ]}
            value={sex}
            onChange={setSex}
          />
        </View>
      )}

      <Input
        label={`Birthdate (YYYY-MM-DD)${birthdateValid ? '' : ' — invalid format'}`}
        value={birthdate}
        onChangeText={setBirthdate}
        keyboardType="numbers-and-punctuation"
      />
      <Input
        label={`Height${heightValid ? '' : ' — enter 100–250 cm'}`}
        value={height}
        onChangeText={setHeight}
        suffix="cm"
        keyboardType="numeric"
      />

      <View>
        <Text variant="label" color="textMuted" style={{ marginBottom: 6 }}>Activity level</Text>
        <SegmentedControl
          scrollable
          options={(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((k) => ({
            value: k,
            label: ACTIVITY_LABELS[k].split(' — ')[0],
          }))}
          value={activity}
          onChange={setActivity}
        />
      </View>

      {/* Body type — user-changeable; biases macro defaults & fat-distribution info */}
      <View>
        <Text variant="label" color="textMuted" style={{ marginBottom: 6 }}>Body type</Text>
        <SegmentedControl
          options={(['ectomorph', 'mesomorph', 'endomorph'] as BodyType[]).map((t) => ({
            value: t,
            label: BODY_TYPE_LABELS[t].replace('-leaning', ''),
          }))}
          value={(bodyType ?? 'mesomorph') as BodyType}
          onChange={(t) => setBodyType(t)}
        />
        {bodyType && (
          <Text variant="caption" color="textFaint" style={{ marginTop: 4 }}>
            {BODY_TYPE_BLURB[bodyType]}
          </Text>
        )}
      </View>

      {/* Goal — the reason most people open this screen. */}
      <Card accent={theme.colors.primary} style={{ gap: 10 }}>
        <Text variant="h3">Your goal</Text>
        <SegmentedControl
          scrollable
          options={GOAL_ORDER.map((k) => ({ value: k, label: GOAL_LABELS[k] }))}
          value={goal}
          onChange={setGoal}
        />
        <Text variant="caption" color="textMuted">{GOAL_NOTES[goal]}</Text>
        {goal !== 'maintain' && (
          <>
            <Text variant="label" color="textMuted">Pace</Text>
            <SegmentedControl
              options={[
                { value: 'slow', label: 'Slow' },
                { value: 'moderate', label: 'Moderate' },
                { value: 'aggressive', label: 'Aggressive' },
              ]}
              value={rate}
              onChange={setRate}
            />
          </>
        )}
        <Text variant="caption" color="textFaint">
          Saving recalculates your calorie, macro & water targets immediately and shows you
          the new numbers.
        </Text>
      </Card>

      <Row>
        <Button title="Cancel" variant="secondary" onPress={() => navigation.goBack()} style={{ flex: 1 }} fullWidth={false} />
        <Button title={saving ? 'Saving…' : 'Save'} icon="core.check" onPress={save} style={{ flex: 2 }} fullWidth={false} disabled={!canSave} />
      </Row>
    </Screen>
  );
}
