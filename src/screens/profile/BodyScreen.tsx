import React, { useCallback, useMemo, useState } from 'react';
import { View, Pressable, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatTile } from '@/components/ui/StatTile';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Row, SectionHeader, Divider, Badge } from '@/components/ui/misc';
import { useUserStore } from '@/stores/userStore';
import { latestWeight, weighInHistory, type WeighInExtra } from '@/repositories/userRepo';
import { goalHistoryList } from '@/repositories/goalHistoryRepo';
import { computeBodyComp, ffmiCategory, MEASUREMENT_FIELDS, type BodyComp } from '@/lib/bodyComposition';
import { GOAL_LABELS, type Goal, type RateOfChange } from '@/lib/calories';
import { fmtNum } from '@/lib/format';

/** Composition readings a bio-impedance scale gives you (all optional). */
const COMPOSITION_FIELDS: Array<{ key: keyof WeighInExtra; label: string; unit: string }> = [
  { key: 'bodyFatPct', label: 'Body fat', unit: '%' },
  { key: 'bodyWaterPct', label: 'Body water', unit: '%' },
  { key: 'muscleMassKg', label: 'Muscle mass', unit: 'kg' },
  { key: 'skeletalMuscleKg', label: 'Skeletal muscle', unit: 'kg' },
  { key: 'boneMassKg', label: 'Bone mass', unit: 'kg' },
  { key: 'proteinPct', label: 'Protein', unit: '%' },
  { key: 'visceralFatRating', label: 'Visceral fat', unit: 'rating' },
  { key: 'trappedWaterKg', label: 'Retained water', unit: 'kg' },
  { key: 'bmrKcal', label: 'Metabolism (BMR)', unit: 'kcal' },
];

const ALL_KEYS = [
  ...COMPOSITION_FIELDS.map((c) => c.key as string),
  ...MEASUREMENT_FIELDS.map((m) => m.key as string),
];

type Form = Record<string, string>;

export function BodyScreen() {
  const theme = useTheme();
  const user = useUserStore((s) => s.user);
  const goalTargets = useUserStore((s) => s.goal);
  const logWeight = useUserStore((s) => s.logWeight);
  const updateProfile = useUserStore((s) => s.updateProfile);
  const recalcTargets = useUserStore((s) => s.recalcTargets);

  const [form, setForm] = useState<Form>({});
  const [openComp, setOpenComp] = useState(false);
  const [openMeas, setOpenMeas] = useState(false);
  const [history, setHistory] = useState<ReturnType<typeof weighInHistory>>([]);
  const [goalLog, setGoalLog] = useState<ReturnType<typeof goalHistoryList>>([]);
  const [goal, setGoal] = useState<Goal>('maintain');
  const [rate, setRate] = useState<RateOfChange>('moderate');
  const [targetWeight, setTargetWeight] = useState('');

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const num = useCallback(
    (k: string): number | null => {
      const v = parseFloat(form[k] ?? '');
      return Number.isFinite(v) ? v : null;
    },
    [form]
  );

  const reload = useCallback(() => {
    const w = latestWeight();
    if (w) {
      const next: Form = { weightKg: String(w.weightKg) };
      for (const key of ALL_KEYS) {
        const v = (w as unknown as Record<string, number | null>)[key];
        if (v != null) next[key] = String(v);
      }
      setForm(next);
    }
    setHistory(weighInHistory().slice(-30).reverse());
    setGoalLog(goalHistoryList(10));
    if (user) {
      setGoal(user.goal);
      setRate(user.rateOfChange);
    }
  }, [user]);

  useFocusEffect(useCallback(() => reload(), [reload]));

  // Live preview of everything derived from what's currently typed in.
  const comp: BodyComp | null = useMemo(() => {
    const weightKg = num('weightKg');
    if (!weightKg) return null;
    const input: Record<string, unknown> = {
      weightKg,
      heightCm: user?.heightCm,
      sex: user?.sex ?? 'male',
    };
    for (const key of ALL_KEYS) input[key] = num(key);
    return computeBodyComp(input as never);
  }, [num, user]);

  const save = () => {
    const weightKg = num('weightKg');
    if (!weightKg) {
      Alert.alert('Weight required', 'Enter at least your weight to save a measurement.');
      return;
    }
    const extra: Record<string, number | null> = {};
    for (const key of ALL_KEYS) extra[key] = num(key);
    logWeight(weightKg, extra as WeighInExtra);
    reload();
    Alert.alert('Saved ✓', 'Measurement recorded — your targets were recalculated from it.');
  };

  const applyGoal = () => {
    updateProfile({ goal, rateOfChange: rate });
    const g = recalcTargets({ record: true, targetWeightKg: parseFloat(targetWeight) || null, notes: 'Goal updated' });
    reload();
    Alert.alert(
      'Goal updated ✓',
      g
        ? `${GOAL_LABELS[goal]}\n${g.calorieTarget} kcal · P ${g.proteinG}g · C ${g.carbsG}g · F ${g.fatG}g`
        : 'Log a weigh-in and set your height first.'
    );
  };

  return (
    <Screen>
      <Row gap={12} style={{ alignItems: 'center' }}>
        <Icon icon="stats.bodyFat" size={26} color={theme.colors.info} />
        <Text variant="h1" style={{ flex: 1 }}>Body composition</Text>
      </Row>
      <Text variant="body" color="textMuted">
        Enter what you measure — everything else is calculated. Every save is kept in your history
        and your calorie & macro targets are recalculated from it.
      </Text>

      {/* ── MEASURED: weight ── */}
      <SectionHeader title="You enter · weight" />
      <Card>
        <Input label="Weight" value={form.weightKg ?? ''} onChangeText={(v) => set('weightKg', v)} suffix="kg" keyboardType="numeric" />
      </Card>

      {/* ── MEASURED: composition ── */}
      <Pressable onPress={() => setOpenComp((o) => !o)}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center', paddingTop: 10 }}>
          <Text variant="h3" style={{ flex: 1 }}>You enter · scale readings</Text>
          <Icon icon={openComp ? 'core.back' : 'core.forward'} size={16} color={theme.colors.textFaint} />
        </Row>
      </Pressable>
      {openComp && (
        <Card style={{ gap: theme.spacing.md }}>
          <Text variant="caption" color="textFaint">
            Optional — fill in whatever your scale reports. Blank fields are left out of the
            calculations rather than guessed.
          </Text>
          {chunk(COMPOSITION_FIELDS, 2).map((pair, i) => (
            <Row key={i}>
              {pair.map((f) => (
                <View key={f.key as string} style={{ flex: 1 }}>
                  <Input
                    label={f.label}
                    value={form[f.key as string] ?? ''}
                    onChangeText={(v) => set(f.key as string, v)}
                    suffix={f.unit}
                    keyboardType="numeric"
                  />
                </View>
              ))}
              {pair.length === 1 && <View style={{ flex: 1 }} />}
            </Row>
          ))}
        </Card>
      )}

      {/* ── MEASURED: tape measurements ── */}
      <Pressable onPress={() => setOpenMeas((o) => !o)}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center', paddingTop: 10 }}>
          <Text variant="h3" style={{ flex: 1 }}>You enter · measurements (cm)</Text>
          <Icon icon={openMeas ? 'core.back' : 'core.forward'} size={16} color={theme.colors.textFaint} />
        </Row>
      </Pressable>
      {openMeas && (
        <Card style={{ gap: theme.spacing.md }}>
          {['Upper body', 'Torso', 'Arms', 'Legs'].map((group) => (
            <View key={group} style={{ gap: theme.spacing.sm }}>
              <Text variant="label" color={theme.colors.info}>{group}</Text>
              {chunk(MEASUREMENT_FIELDS.filter((m) => m.group === group), 2).map((pair, i) => (
                <Row key={i}>
                  {pair.map((f) => (
                    <View key={f.key as string} style={{ flex: 1 }}>
                      <Input
                        label={f.label}
                        value={form[f.key as string] ?? ''}
                        onChangeText={(v) => set(f.key as string, v)}
                        suffix="cm"
                        keyboardType="numeric"
                      />
                    </View>
                  ))}
                  {pair.length === 1 && <View style={{ flex: 1 }} />}
                </Row>
              ))}
            </View>
          ))}
        </Card>
      )}

      <Button title="Save measurement" icon="core.check" onPress={save} disabled={!num('weightKg')} />

      {/* ── CALCULATED ── */}
      {comp && (
        <>
          <SectionHeader title="We calculate" />
          <Row>
            <StatTile icon="stats.weight" label="BMI" value={comp.bmi != null ? fmtNum(comp.bmi) : '—'} sub={comp.bmiCategory ?? undefined} accent={theme.colors.info} />
            <StatTile icon="stats.bodyFat" label="Fat weight" value={comp.fatMassKg != null ? `${fmtNum(comp.fatMassKg)}kg` : '—'} sub={comp.fatCategory ?? undefined} accent={theme.colors.warning} />
          </Row>
          <Row>
            <StatTile icon="strength.dumbbell" label="Lean mass" value={comp.leanMassKg != null ? `${fmtNum(comp.leanMassKg)}kg` : '—'} accent={theme.colors.primary} />
            <StatTile
              icon="stats.progression"
              label="FFMI"
              value={comp.normalizedFFMI != null ? fmtNum(comp.normalizedFFMI) : '—'}
              sub={comp.normalizedFFMI != null && user ? ffmiCategory(comp.normalizedFFMI, user.sex) : undefined}
              accent={theme.colors.accent}
            />
          </Row>

          <Card style={{ gap: 8 }}>
            <CalcRow label="Muscle mass" value={comp.muscleMassKg != null ? `${fmtNum(comp.muscleMassKg)} kg · ${comp.musclePct != null ? fmtNum(comp.musclePct) + '%' : '—'}` : null} />
            <CalcRow label="Skeletal muscle" value={comp.skeletalMuscleKg != null ? `${fmtNum(comp.skeletalMuscleKg)} kg · ${comp.skeletalMusclePct != null ? fmtNum(comp.skeletalMusclePct) + '%' : '—'}` : null} />
            <CalcRow label="Body water" value={comp.bodyWaterKg != null ? `${fmtNum(comp.bodyWaterKg)} kg · ${fmtNum(comp.bodyWaterPct as number)}%` : null} hint={comp.waterStatus ?? undefined} />
            <CalcRow label="Retained water" value={comp.trappedWaterKg != null ? `${fmtNum(comp.trappedWaterKg)} kg` : null} />
            <CalcRow label="Bone mass" value={comp.boneMassKg != null ? `${fmtNum(comp.boneMassKg)} kg · ${comp.bonePct != null ? fmtNum(comp.bonePct) + '%' : '—'}` : null} />
            <CalcRow label="Protein" value={comp.proteinKg != null ? `${fmtNum(comp.proteinKg)} kg · ${fmtNum(comp.proteinPct as number)}%` : null} />
            <CalcRow label="Visceral fat" value={comp.visceralFatRating != null ? fmtNum(comp.visceralFatRating) : null} hint={comp.visceralStatus ?? undefined} />
            <CalcRow label="Obesity degree" value={comp.obesityDegreePct != null ? `${comp.obesityDegreePct > 0 ? '+' : ''}${fmtNum(comp.obesityDegreePct)}%` : null} hint="vs a BMI-22 ideal weight" />
            <CalcRow label="Waist-to-hip" value={comp.waistToHip != null ? fmtNum(comp.waistToHip) : null} />
            <CalcRow label="Waist-to-height" value={comp.waistToHeight != null ? fmtNum(comp.waistToHeight) : null} hint="under 0.5 is the usual target" />
            <CalcRow
              label="BMR (metabolism)"
              value={comp.bmrKcal != null ? `${comp.bmrKcal} kcal` : null}
              hint={comp.bmrBasis === 'katch' ? 'Katch-McArdle, from your lean mass' : comp.bmrBasis === 'scale' ? 'your scale reading' : undefined}
            />
          </Card>
          <Text variant="caption" color="textFaint">
            A “—” just means the measurement it needs isn't entered yet — nothing here is estimated
            or invented.
          </Text>
        </>
      )}

      {/* ── GOAL ── */}
      <SectionHeader title="Goal & targets" />
      <Card style={{ gap: theme.spacing.md }}>
        <SegmentedControl
          scrollable
          options={(['lose_fat', 'maintain', 'build_muscle'] as Goal[]).map((g) => ({ value: g, label: GOAL_LABELS[g] }))}
          value={goal}
          onChange={(v) => setGoal(v as Goal)}
        />
        <SegmentedControl
          options={(['slow', 'moderate', 'aggressive'] as RateOfChange[]).map((r) => ({ value: r, label: r[0].toUpperCase() + r.slice(1) }))}
          value={rate}
          onChange={(v) => setRate(v as RateOfChange)}
        />
        <Input label="Target weight (optional)" value={targetWeight} onChangeText={setTargetWeight} suffix="kg" keyboardType="numeric" />
        {goalTargets && (
          <Text variant="caption" color="textMuted">
            Current: {goalTargets.calorieTarget} kcal · P {goalTargets.proteinG}g · C {goalTargets.carbsG}g · F {goalTargets.fatG}g
          </Text>
        )}
        <Button title="Apply goal & recalculate" icon="core.settings" onPress={applyGoal} color={theme.colors.accent} />
        <Text variant="caption" color="textFaint">
          With body fat measured, calories come from Katch-McArdle (your lean mass) rather than a
          height/weight formula, and protein is anchored to lean mass. Vitamin & mineral targets are
          set by age and sex, so they don't shift with body composition.
        </Text>
      </Card>

      {goalLog.length > 0 && (
        <Card style={{ gap: 6 }}>
          <Text variant="label" color="textMuted">Goal history</Text>
          {goalLog.map((g) => (
            <Row key={g.id} style={{ justifyContent: 'space-between' }}>
              <Text variant="caption" color="textMuted">
                {g.date} · {GOAL_LABELS[g.goal as Goal]}
              </Text>
              <Text variant="caption">
                {Math.round(g.calorieTarget)} kcal · P{Math.round(g.proteinG)}
              </Text>
            </Row>
          ))}
        </Card>
      )}

      {/* ── HISTORY ── */}
      {history.length > 0 && (
        <>
          <SectionHeader title="Measurement history" />
          <Card style={{ gap: 8 }}>
            {history.slice(0, 12).map((h, i) => (
              <View key={h.id}>
                {i > 0 ? <Divider /> : null}
                <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyStrong">{fmtNum(h.weightKg)} kg</Text>
                    <Text variant="caption" color="textFaint">
                      {h.date}
                      {h.bodyFatPct != null ? ` · ${fmtNum(h.bodyFatPct)}% fat` : ''}
                      {h.waistCm != null ? ` · waist ${fmtNum(h.waistCm)}cm` : ''}
                    </Text>
                  </View>
                  {h.muscleMassKg != null && <Badge label={`${fmtNum(h.muscleMassKg)}kg muscle`} color={theme.colors.primary} />}
                </Row>
              </View>
            ))}
          </Card>
        </>
      )}
    </Screen>
  );
}

function CalcRow({ label, value, hint }: { label: string; value: string | null; hint?: string }) {
  const theme = useTheme();
  return (
    <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
      <View style={{ flex: 1 }}>
        <Text variant="caption" color="textMuted">{label}</Text>
        {hint && <Text variant="caption" color="textFaint" style={{ fontSize: 10 }}>{hint}</Text>}
      </View>
      <Text variant="bodyStrong" color={value ? 'text' : theme.colors.textFaint}>{value ?? '—'}</Text>
    </Row>
  );
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
