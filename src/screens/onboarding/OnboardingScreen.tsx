import React, { useMemo, useState } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Row } from '@/components/ui/misc';
import { useUserStore, type OnboardingData } from '@/stores/userStore';
import { ACTIVITY_LABELS, GOAL_BLURBS, GOAL_LABELS, GOAL_ORDER, GOAL_NOTES, computeTargets } from '@/lib/calories';
import { estimateBodyType, BODY_TYPE_BLURB, BODY_TYPE_LABELS } from '@/lib/bodyType';
import { ageFromBirthdate } from '@/lib/date';

type Step = 0 | 1 | 2 | 3 | 4 | 5;
const TOTAL_STEPS = 6;

export function OnboardingScreen() {
  const theme = useTheme();
  const complete = useUserStore((s) => s.completeOnboarding);
  const [step, setStep] = useState<Step>(0);

  // Form state
  const [name, setName] = useState('');
  const [gender, setGender] = useState<OnboardingData['gender']>('male');
  const [sex, setSex] = useState<'male' | 'female'>('male');
  const [birthdate, setBirthdate] = useState('1995-01-01');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [waist, setWaist] = useState('');
  const [hip, setHip] = useState('');
  const [activity, setActivity] = useState<OnboardingData['activityLevel']>('moderate');
  const [goal, setGoal] = useState<OnboardingData['goal']>('maintain');
  const [rate, setRate] = useState<OnboardingData['rate']>('moderate');

  const heightCm = parseFloat(height) || 0;
  const weightKg = parseFloat(weight) || 0;

  const bodyType = useMemo(
    () =>
      heightCm && weightKg
        ? estimateBodyType({
            heightCm,
            weightKg,
            waistCm: parseFloat(waist) || null,
            hipCm: parseFloat(hip) || null,
            sex,
          })
        : null,
    [heightCm, weightKg, waist, hip, sex]
  );

  const preview = useMemo(() => {
    if (!heightCm || !weightKg) return null;
    return computeTargets({
      sex,
      age: ageFromBirthdate(birthdate),
      heightCm,
      weightKg,
      activityLevel: activity,
      goal,
      rate,
    });
  }, [sex, birthdate, heightCm, weightKg, activity, goal, rate]);

  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        return !!name.trim() && heightCm > 100 && weightKg > 25 && /^\d{4}-\d{2}-\d{2}$/.test(birthdate);
      default:
        return true;
    }
  };

  const next = () => {
    if (step < TOTAL_STEPS - 1) setStep((s) => (s + 1) as Step);
  };
  const back = () => {
    if (step > 0) setStep((s) => (s - 1) as Step);
  };

  const finish = () => {
    complete({
      name: name.trim() || 'Athlete',
      gender,
      sex,
      birthdate,
      heightCm,
      weightKg,
      waistCm: parseFloat(waist) || null,
      hipCm: parseFloat(hip) || null,
      activityLevel: activity,
      goal,
      rate,
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={{ padding: theme.spacing.lg, gap: 6 }}>
          <ProgressBar progress={(step + 1) / TOTAL_STEPS} />
          <Text variant="caption" color="textFaint">
            Step {step + 1} of {TOTAL_STEPS}
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.lg, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {step === 0 && <Welcome />}

          {step === 1 && (
            <View style={{ gap: theme.spacing.md }}>
              <Text variant="h1">About you</Text>
              <Text variant="body" color="textMuted">
                This personalizes your calorie, macro, water and caffeine targets.
              </Text>
              <Input label="Name" value={name} onChangeText={setName} placeholder="Your name" />
              <View>
                <Text variant="label" color="textMuted" style={{ marginBottom: 6 }}>
                  Gender
                </Text>
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
                label="Birthdate (YYYY-MM-DD)"
                value={birthdate}
                onChangeText={setBirthdate}
                placeholder="1995-01-01"
                keyboardType="numbers-and-punctuation"
              />
              <Row>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Height"
                    value={height}
                    onChangeText={setHeight}
                    placeholder="175"
                    suffix="cm"
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Weight"
                    value={weight}
                    onChangeText={setWeight}
                    placeholder="75"
                    suffix="kg"
                    keyboardType="numeric"
                  />
                </View>
              </Row>
            </View>
          )}

          {step === 2 && (
            <View style={{ gap: theme.spacing.md }}>
              <Text variant="h1">Activity level</Text>
              <Text variant="body" color="textMuted">
                How active are you outside of logged workouts?
              </Text>
              {(Object.keys(ACTIVITY_LABELS) as Array<keyof typeof ACTIVITY_LABELS>).map((key) => (
                <SelectCard
                  key={key}
                  active={activity === key}
                  title={ACTIVITY_LABELS[key].split(' — ')[0]}
                  subtitle={ACTIVITY_LABELS[key].split(' — ')[1]}
                  onPress={() => setActivity(key)}
                />
              ))}
            </View>
          )}

          {step === 3 && (
            <View style={{ gap: theme.spacing.md }}>
              <Text variant="h1">Your goal</Text>
              {GOAL_ORDER.map((key) => (
                <SelectCard
                  key={key}
                  active={goal === key}
                  title={GOAL_LABELS[key]}
                  subtitle={GOAL_BLURBS[key]}
                  onPress={() => setGoal(key)}
                />
              ))}
              <Text variant="caption" color="textMuted">{GOAL_NOTES[goal]}</Text>
              {goal !== 'maintain' && (
                <View style={{ marginTop: 4 }}>
                  <Text variant="label" color="textMuted" style={{ marginBottom: 6 }}>
                    Pace
                  </Text>
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
            </View>
          )}

          {step === 4 && (
            <View style={{ gap: theme.spacing.md }}>
              <Text variant="h1">Body-type check</Text>
              <Text variant="body" color="textMuted">
                Optional. Waist & hip refine your starting macros. You can skip this.
              </Text>
              <Row>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Waist"
                    value={waist}
                    onChangeText={setWaist}
                    placeholder="82"
                    suffix="cm"
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Hip"
                    value={hip}
                    onChangeText={setHip}
                    placeholder="98"
                    suffix="cm"
                    keyboardType="numeric"
                  />
                </View>
              </Row>
              {bodyType && (
                <Card accent={theme.colors.accent}>
                  <Row gap={10}>
                    <Icon icon="stats.bodyFat" color={theme.colors.accent} />
                    <View style={{ flex: 1 }}>
                      <Text variant="h3">{BODY_TYPE_LABELS[bodyType]}</Text>
                      <Text variant="caption" color="textMuted">
                        {BODY_TYPE_BLURB[bodyType]}
                      </Text>
                    </View>
                  </Row>
                </Card>
              )}
            </View>
          )}

          {step === 5 && preview && (
            <View style={{ gap: theme.spacing.md }}>
              <Text variant="h1">Your targets</Text>
              <Text variant="body" color="textMuted">
                Calculated with Mifflin-St Jeor · TDEE ×{' '}
                {GOAL_LABELS[goal].toLowerCase()}. These auto-refine as you log.
              </Text>
              <Card>
                <Row style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Text variant="h2">Daily calories</Text>
                  <Text variant="h1" color="calories">
                    {preview.calorieTarget}
                  </Text>
                </Row>
                <Text variant="caption" color="textFaint">
                  BMR {preview.bmr} · TDEE {preview.tdee} kcal
                </Text>
                <View style={{ height: 12 }} />
                <Row>
                  <MacroPill label="Protein" value={`${preview.macros.protein}g`} color={theme.colors.protein} />
                  <MacroPill label="Carbs" value={`${preview.macros.carbs}g`} color={theme.colors.carbs} />
                  <MacroPill label="Fat" value={`${preview.macros.fat}g`} color={theme.colors.fat} />
                </Row>
              </Card>
            </View>
          )}
        </ScrollView>

        <View style={{ flexDirection: 'row', gap: 12, padding: theme.spacing.lg }}>
          {step > 0 && (
            <Button title="Back" variant="secondary" onPress={back} fullWidth={false} style={{ flex: 1 }} />
          )}
          {step < TOTAL_STEPS - 1 ? (
            <Button
              title={step === 0 ? 'Get Started' : 'Continue'}
              onPress={next}
              disabled={!canProceed()}
              style={{ flex: 2 }}
              fullWidth={false}
            />
          ) : (
            <Button title="Start Training" icon="core.check" onPress={finish} style={{ flex: 2 }} fullWidth={false} />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Welcome() {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.lg, alignItems: 'center', paddingTop: theme.spacing.xxl }}>
      <View
        style={{
          width: 96,
          height: 96,
          borderRadius: 28,
          backgroundColor: theme.colors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon def={{ lib: 'MaterialCommunityIcons', name: 'dumbbell' }} size={48} color={theme.colors.primary} />
      </View>
      <Text variant="display" center>
        FitCoach
      </Text>
      <Text variant="body" color="textMuted" center style={{ maxWidth: 300 }}>
        Your private coach for training, nutrition and health. Minimal friction during a
        session, maximum insight afterward.
      </Text>
      <View style={{ gap: 10, alignSelf: 'stretch', marginTop: theme.spacing.md }}>
        <Feature icon="core.start" text="Track every set, run, sport & sit" />
        <Feature icon="nutrition.calories" text="Smart calorie & macro targets" />
        <Feature icon="stats.progression" text="Progress charts, PRs & coach tips" />
        <Feature icon="core.settings" text="100% offline · your data stays on-device" />
      </View>
    </View>
  );
}

function Feature({ icon, text }: { icon: string; text: string }) {
  const theme = useTheme();
  return (
    <Row gap={12} style={{ alignItems: 'center' }}>
      <Icon icon={icon} size={20} color={theme.colors.primary} />
      <Text variant="body" color="textMuted">
        {text}
      </Text>
    </Row>
  );
}

function SelectCard({
  active,
  title,
  subtitle,
  onPress,
}: {
  active: boolean;
  title: string;
  subtitle?: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Card
      onTouchEnd={onPress}
      style={{
        borderColor: active ? theme.colors.primary : theme.colors.border,
        backgroundColor: active ? theme.colors.primarySoft : theme.colors.card,
      }}
    >
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text variant="h3">{title}</Text>
          {subtitle ? (
            <Text variant="caption" color="textMuted">
              {subtitle}
            </Text>
          ) : null}
        </View>
        <Icon
          icon={active ? 'core.check' : 'core.forward'}
          size={22}
          color={active ? theme.colors.primary : theme.colors.textFaint}
        />
      </Row>
    </Card>
  );
}

function MacroPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
      <Text variant="h3" color={color}>
        {value}
      </Text>
      <Text variant="caption" color="textMuted">
        {label}
      </Text>
    </View>
  );
}
