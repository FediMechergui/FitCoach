import React, { useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Row } from '@/components/ui/misc';
import type { RootStackParamList } from '@/navigation/types';
import { useUserStore } from '@/stores/userStore';
import { ACTIVITY_LABELS, GOAL_LABELS, type ActivityLevel, type Goal } from '@/lib/calories';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function EditProfileScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const user = useUserStore((s) => s.user)!;
  const updateProfile = useUserStore((s) => s.updateProfile);

  const [name, setName] = useState(user.name);
  const [sex, setSex] = useState<'male' | 'female'>(user.sex);
  const [birthdate, setBirthdate] = useState(user.birthdate ?? '1995-01-01');
  const [height, setHeight] = useState(user.heightCm ? String(user.heightCm) : '');
  const [activity, setActivity] = useState<ActivityLevel>(user.activityLevel);
  const [goal, setGoal] = useState<Goal>(user.goal);
  const [rate, setRate] = useState(user.rateOfChange);

  const save = () => {
    updateProfile({
      name: name.trim() || 'Athlete',
      sex,
      birthdate,
      heightCm: parseFloat(height) || user.heightCm,
      activityLevel: activity,
      goal,
      rateOfChange: rate,
    });
    navigation.goBack();
  };

  return (
    <Screen>
      <Input label="Name" value={name} onChangeText={setName} />
      <View>
        <Text variant="label" color="textMuted" style={{ marginBottom: 6 }}>Sex</Text>
        <SegmentedControl
          options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]}
          value={sex}
          onChange={setSex}
        />
      </View>
      <Input label="Birthdate (YYYY-MM-DD)" value={birthdate} onChangeText={setBirthdate} />
      <Input label="Height" value={height} onChangeText={setHeight} suffix="cm" keyboardType="numeric" />

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

      <View>
        <Text variant="label" color="textMuted" style={{ marginBottom: 6 }}>Goal</Text>
        <SegmentedControl
          options={(Object.keys(GOAL_LABELS) as Goal[]).map((k) => ({ value: k, label: GOAL_LABELS[k] }))}
          value={goal}
          onChange={setGoal}
        />
      </View>

      {goal !== 'maintain' && (
        <View>
          <Text variant="label" color="textMuted" style={{ marginBottom: 6 }}>Pace</Text>
          <SegmentedControl
            options={[
              { value: 'slow', label: 'Slow' },
              { value: 'moderate', label: 'Moderate' },
              { value: 'aggressive', label: 'Aggressive' },
            ]}
            value={rate}
            onChange={setRate}
          />
        </View>
      )}

      <Text variant="caption" color="textFaint">
        Saving recalculates your calorie, macro & water targets with Mifflin-St Jeor.
      </Text>
      <Row>
        <Button title="Cancel" variant="secondary" onPress={() => navigation.goBack()} style={{ flex: 1 }} fullWidth={false} />
        <Button title="Save" icon="core.check" onPress={save} style={{ flex: 2 }} fullWidth={false} />
      </Row>
    </Screen>
  );
}
