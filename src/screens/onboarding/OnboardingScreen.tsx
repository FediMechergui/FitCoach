import React, { useMemo, useState } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Bezel } from '@/components/ui/Bezel';
import { Metric } from '@/components/ui/misc3';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Row } from '@/components/ui/misc';
import { useUserStore, type OnboardingData } from '@/stores/userStore';
import { ACTIVITY_LABELS, GOAL_BLURBS, GOAL_LABELS, GOAL_ORDER, GOAL_NOTES, computeTargets } from '@/lib/calories';
import { estimateBodyType, BODY_TYPE_BLURB, BODY_TYPE_LABELS } from '@/lib/bodyType';
import { EXPERIENCE_LEVELS, LEVEL_LABELS, LEVEL_BLURBS, type ExperienceLevel } from '@/lib/level';
import { ageFromBirthdate } from '@/lib/date';

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6;
const TOTAL_STEPS = 7;

/**
 * Onboarding 3.0 — the wizard's math was always excellent; its inputs were
 * hostile. The rebuild keeps the beat structure and fixes the first hour:
 *
 *  · Selection cards are real Pressables now — the old onTouchEnd fired when a
 *    scroll happened to END on a card, choosing things nobody chose.
 *  · The birthdate is three numeric boxes validating a real calendar date —
 *    the free-text field wanted an iOS-only keyboard on an Android-first app.
 *  · A disabled Continue says what it is waiting for instead of dimming mutely.
 *  · Experience level is asked here (it silently defaulted to intermediate and
 *    shaped every pre-loaded session without anyone choosing it).
 *  · Gender offers the schema's fifth value, and the BMR-sex control says in
 *    one honest sentence why it exists.
 *  · The targets step is a moment: the calorie numeral in the display face,
 *    the macro trio as tinted Metrics, and the sovereignty mark — on this
 *    device, no account, ever.
 */
export function OnboardingScreen() {
  const theme = useTheme();
  const complete = useUserStore((s) => s.completeOnboarding);
  const [step, setStep] = useState<Step>(0);

  // Form state
  const [name, setName] = useState('');
  const [gender, setGender] = useState<OnboardingData['gender']>('male');
  const [sex, setSex] = useState<'male' | 'female'>('male');
  const [birthDay, setBirthDay] = useState('1');
  const [birthMonth, setBirthMonth] = useState('1');
  const [birthYear, setBirthYear] = useState('1995');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [waist, setWaist] = useState('');
  const [hip, setHip] = useState('');
  const [activity, setActivity] = useState<OnboardingData['activityLevel']>('moderate');
  const [goal, setGoal] = useState<OnboardingData['goal']>('maintain');
  const [rate, setRate] = useState<OnboardingData['rate']>('moderate');
  const [level, setLevel] = useState<ExperienceLevel>('beginner');

  const heightCm = parseFloat(height) || 0;
  const weightKg = parseFloat(weight) || 0;

  /** A real calendar date, or null — 31/02 does not become a birthday. */
  const birthdate = useMemo(() => {
    const d = parseInt(birthDay, 10);
    const m = parseInt(birthMonth, 10);
    const y = parseInt(birthYear, 10);
    if (!d || !m || !y || y < 1900 || y > new Date().getFullYear()) return null;
    const date = new Date(y, m - 1, d);
    if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }, [birthDay, birthMonth, birthYear]);

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
    if (!heightCm || !weightKg || !birthdate) return null;
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

  /** What still stands between here and Continue — said out loud. */
  const missing = (): string[] => {
    if (step !== 1) return [];
    const gaps: string[] = [];
    if (!name.trim()) gaps.push('your name');
    if (!birthdate) gaps.push('a real birthdate');
    if (heightCm <= 100) gaps.push('your height');
    if (weightKg <= 25) gaps.push('your weight');
    return gaps;
  };
  const gaps = missing();
  const canProceed = gaps.length === 0;

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
      birthdate: birthdate ?? '1995-01-01',
      heightCm,
      weightKg,
      waistCm: parseFloat(waist) || null,
      hipCm: parseFloat(hip) || null,
      activityLevel: activity,
      goal,
      rate,
      experienceLevel: level,
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
              <Text variant="eyebrow" color="primary">
                About you
              </Text>
              <Text variant="h1">The numbers that set your targets</Text>
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
                    { value: 'prefer_not_to_say', label: 'Prefer not to say' },
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
                    Body for the energy math
                  </Text>
                  <SegmentedControl
                    options={[
                      { value: 'male', label: 'Male' },
                      { value: 'female', label: 'Female' },
                    ]}
                    value={sex}
                    onChange={setSex}
                  />
                  <Text variant="caption" color="textFaint" style={{ marginTop: 4 }}>
                    Asked only because the calorie equation (Mifflin-St Jeor) is calibrated per
                    physiological sex — it never appears anywhere else.
                  </Text>
                </View>
              )}
              <View>
                <Text variant="label" color="textMuted" style={{ marginBottom: 6 }}>
                  Birthdate
                </Text>
                <Row>
                  <View style={{ flex: 1 }}>
                    <Input value={birthDay} onChangeText={setBirthDay} placeholder="DD" suffix="day" keyboardType="numeric" maxLength={2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Input value={birthMonth} onChangeText={setBirthMonth} placeholder="MM" suffix="month" keyboardType="numeric" maxLength={2} />
                  </View>
                  <View style={{ flex: 1.4 }}>
                    <Input
                      value={birthYear}
                      onChangeText={setBirthYear}
                      placeholder="YYYY"
                      suffix="year"
                      keyboardType="numeric"
                      maxLength={4}
                      error={birthdate == null && birthYear.length === 4 ? 'That date does not exist' : undefined}
                    />
                  </View>
                </Row>
              </View>
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
              <Text variant="eyebrow" color="primary">
                Day to day
              </Text>
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
              <Text variant="eyebrow" color="primary">
                Direction
              </Text>
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
              <Text variant="eyebrow" color="primary">
                Experience
              </Text>
              <Text variant="h1">How long have you trained?</Text>
              <Text variant="body" color="textMuted">
                This shapes how many exercises a session pre-loads, the rep ranges, and how long the
                rests run. It changes nothing you can't override.
              </Text>
              {EXPERIENCE_LEVELS.map((key) => (
                <SelectCard
                  key={key}
                  active={level === key}
                  title={LEVEL_LABELS[key]}
                  subtitle={LEVEL_BLURBS[key]}
                  onPress={() => setLevel(key)}
                />
              ))}
            </View>
          )}

          {step === 5 && (
            <View style={{ gap: theme.spacing.md }}>
              <Text variant="eyebrow" color="primary">
                Optional
              </Text>
              <Text variant="h1">Body-type check</Text>
              <Text variant="body" color="textMuted">
                Waist & hip refine your starting macros. You can skip this.
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

          {step === 6 && preview && (
            <View style={{ gap: theme.spacing.md }}>
              <Text variant="eyebrow" color="primary">
                Your targets
              </Text>
              <Text variant="h1">Built for you, refined as you log</Text>
              <Text variant="body" color="textMuted">
                Calculated with Mifflin-St Jeor · TDEE × {GOAL_LABELS[goal].toLowerCase()}.
              </Text>
              <Bezel tint={theme.colors.calories}>
                <View style={{ alignItems: 'center', gap: 2 }}>
                  <Text variant="numeralXL" style={{ color: theme.colors.calories }}>
                    {preview.calorieTarget.toLocaleString()}
                  </Text>
                  <Text variant="eyebrow" color="textMuted">
                    kcal a day
                  </Text>
                  <Text variant="caption" color="textFaint">
                    BMR {preview.bmr} · TDEE {preview.tdee} kcal
                  </Text>
                </View>
              </Bezel>
              <Row>
                <Metric value={`${preview.macros.protein}g`} label="Protein" accent={theme.colors.protein} />
                <Metric value={`${preview.macros.carbs}g`} label="Carbs" accent={theme.colors.carbs} />
                <Metric value={`${preview.macros.fat}g`} label="Fat" accent={theme.colors.fat} />
              </Row>
              <Row gap={8} style={{ alignItems: 'center', justifyContent: 'center' }}>
                <Icon icon="core.settings" size={14} color={theme.colors.textFaint} />
                <Text variant="caption" color="textFaint">
                  On this device — no account, ever.
                </Text>
              </Row>
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
              disabled={!canProceed}
              hint={gaps.length > 0 ? `Still needed: ${gaps.join(', ')}` : undefined}
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

/**
 * A real Pressable at last. The old version used onTouchEnd on a plain View,
 * which fires when a SCROLL ends on the card — people chose activity levels by
 * lifting their thumb in the wrong place, with zero pressed feedback and no
 * accessibility role. Card's pressable variant provides all three.
 */
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
      onPress={onPress}
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
