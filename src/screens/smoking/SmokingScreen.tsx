import React, { useCallback, useMemo, useState } from 'react';
import { View, Pressable, Alert } from 'react-native';
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
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { BarChart } from '@/components/charts/BarChart';
import { Row, SectionHeader, Divider, Badge } from '@/components/ui/misc';
import { PageHero } from '@/components/ui/PageHero';
import type { RootStackParamList } from '@/navigation/types';
import { useSmokingStore } from '@/stores/smokingStore';
import { NICOTINE_GROUPS, findNicotineProduct } from '@/data/nicotineProducts';
import { dailySeries, smokingCorrelation, recentSmokeEvents } from '@/repositories/smokingRepo';
import { DigestionCard } from '@/components/DigestionCard';
import {
  currentQuitMilestone,
  nextQuitMilestone,
  DEFAULT_SMOKING_SETTINGS,
} from '@/lib/smoking';
import { formatDurationLong } from '@/lib/format';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function SmokingScreen() {
  const enabled = useSmokingStore((s) => s.enabled);
  const load = useSmokingStore((s) => s.load);
  const [editing, setEditing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (editing) return <SmokingSetup editing onDone={() => setEditing(false)} />;
  return enabled ? <ImpactDashboard onEditSettings={() => setEditing(true)} /> : <SmokingSetup />;
}

// ── Setup / settings editor for the tracker ──────────────────────────────────
function SmokingSetup({ editing, onDone }: { editing?: boolean; onDone?: () => void }) {
  const theme = useTheme();
  const enable = useSmokingStore((s) => s.enable);
  const updateProfile = useSmokingStore((s) => s.updateProfile);
  const profile = useSmokingStore((s) => s.profile);

  const [mode, setMode] = useState<'tracking' | 'quitting'>(profile?.mode ?? 'quitting');
  const [perPack, setPerPack] = useState(String(profile?.cigarettesPerPack ?? 20));
  const [price, setPrice] = useState(String(profile?.pricePerPack ?? 8));
  const [currency, setCurrency] = useState(profile?.currency ?? '$');
  const [baseline, setBaseline] = useState(String(profile?.baselinePerDay ?? 10));
  const [target, setTarget] = useState(String(profile?.dailyTarget ?? 5));

  const save = () => {
    const patch = {
      mode,
      cigarettesPerPack: parseInt(perPack, 10) || 20,
      pricePerPack: parseFloat(price) || 8,
      currency: currency || '$',
      baselinePerDay: parseInt(baseline, 10) || 10,
      dailyTarget: mode === 'quitting' ? parseInt(target, 10) || null : null,
      nicotineMgPerCig: DEFAULT_SMOKING_SETTINGS.nicotineMgPerCig,
    };
    if (editing) {
      updateProfile(patch);
      onDone?.();
    } else {
      enable(patch);
    }
  };

  return (
    <Screen>
      <PageHero icon="smoking.cigarette" color={theme.colors.warning} title={editing ? 'Tracker settings' : 'Smoking tracker'} />
      {!editing && (
        <Text variant="body" color="textMuted">
          Optional and private. Log cigarettes with a tap and FitCoach shows — honestly, no
          judgment — how it maps onto your training, steps, money and health, using your own
          data plus transparent estimates.
        </Text>
      )}

      <Card style={{ gap: theme.spacing.md }}>
        <View>
          <Text variant="label" color="textMuted" style={{ marginBottom: 6 }}>
            What's your aim?
          </Text>
          <SegmentedControl
            options={[
              { value: 'quitting', label: 'Cut down / quit' },
              { value: 'tracking', label: 'Just track' },
            ]}
            value={mode}
            onChange={setMode}
          />
        </View>
        <Row>
          <View style={{ flex: 1 }}>
            <Input label="Cigarettes / pack" value={perPack} onChangeText={setPerPack} keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Price / pack" value={price} onChangeText={setPrice} keyboardType="numeric" />
          </View>
          <View style={{ width: 64 }}>
            <Input label="Cur." value={currency} onChangeText={setCurrency} />
          </View>
        </Row>
        <Row>
          <View style={{ flex: 1 }}>
            <Input label="Typical / day" value={baseline} onChangeText={setBaseline} keyboardType="numeric" />
          </View>
          {mode === 'quitting' && (
            <View style={{ flex: 1 }}>
              <Input label="Daily cap goal" value={target} onChangeText={setTarget} keyboardType="numeric" />
            </View>
          )}
        </Row>
      </Card>

      <Button title={editing ? 'Save settings' : 'Enable tracker'} icon="core.check" color={theme.colors.warning} onPress={save} />
      {editing ? (
        <Button title="Cancel" variant="ghost" onPress={onDone} />
      ) : (
        <Text variant="caption" color="textFaint" center>
          You can turn this off anytime. Nothing leaves your device.
        </Text>
      )}
    </Screen>
  );
}

// ── Impact dashboard ─────────────────────────────────────────────────────────
function ImpactDashboard({ onEditSettings }: { onEditSettings: () => void }) {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const { profile, today, impact, add, undo, disable, nicotineToday, smokedShare } =
    useSmokingStore();
  const [showProducts, setShowProducts] = useState(false);
  // The training clock: re-read whenever today's count moves.
  const smokes = useMemo(() => recentSmokeEvents(), [today, nicotineToday]);
  const [correlation] = useState(() => smokingCorrelation(30));
  const [series] = useState(() => dailySeries(21));

  if (!impact || !profile) return null;
  const cur = impact.currency;
  const target = impact.dailyTarget;
  const overTarget = target != null && today > target;
  const milestone = isFinite(impact.smokeFreeHours) ? currentQuitMilestone(impact.smokeFreeHours) : null;
  const next = isFinite(impact.smokeFreeHours) ? nextQuitMilestone(impact.smokeFreeHours) : null;

  const confirmDisable = () => {
    Alert.alert('Turn off smoking tracker?', 'Your logged history is kept, but the tracker is hidden.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Turn off', style: 'destructive', onPress: () => { disable(); navigation.goBack(); } },
    ]);
  };

  return (
    <Screen>
      <PageHero
        icon="smoking.cigarette"
        color={profile.mode === 'quitting' ? theme.colors.accent : theme.colors.warning}
        title="Smoking"
        right={profile.mode === 'quitting' ? <Badge label="Quitting" color={theme.colors.accent} /> : <Badge label="Tracking" color={theme.colors.textMuted} />}
      />

      {/* Today logger */}
      <Card accent={overTarget ? theme.colors.danger : theme.colors.warning}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text variant="caption" color="textMuted">Today</Text>
            <Row gap={6} style={{ alignItems: 'baseline' }}>
              <Text variant="display" style={{ fontVariant: ['tabular-nums'] }}>{today}</Text>
              <Text variant="body" color="textMuted">
                cig{today === 1 ? '' : 's'}{target != null ? ` / ${target} cap` : ''}
              </Text>
            </Row>
          </View>
          <Row gap={8}>
            <Pressable onPress={undo} hitSlop={6}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
                <Text variant="h2" color="textMuted">−</Text>
              </View>
            </Pressable>
            <Pressable onPress={() => add(1)} hitSlop={6}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.warning, alignItems: 'center', justifyContent: 'center' }}>
                <Text variant="h2" color="#fff">+1</Text>
              </View>
            </Pressable>
          </Row>
        </Row>
        {/* Nicotine across everything, and how much of it you burned. */}
        {nicotineToday > 0 && (
          <Text variant="caption" color="textFaint" style={{ marginTop: 8 }}>
            {nicotineToday} mg nicotine today
            {smokedShare < 1
              ? ` · ${Math.round(smokedShare * 100)}% of it from smoking`
              : ' · all of it from smoking'}
          </Text>
        )}

        {/* Alternatives — snus, pouches, vape, NRT. */}
        <Pressable onPress={() => setShowProducts((v) => !v)} hitSlop={6} style={{ marginTop: 10 }}>
          <Row gap={6} style={{ alignItems: 'center' }}>
            <Icon icon={showProducts ? 'core.chevronUp' : 'core.chevronDown'} size={14} color={theme.colors.primary} />
            <Text variant="caption" color="primary">
              {showProducts ? 'Hide' : 'Log something else — snus, pouch, vape, patch…'}
            </Text>
          </Row>
        </Pressable>
        {showProducts && <NicotineProductPicker onPick={(key) => add(1, undefined, key)} />}

        {target != null && (
          <View style={{ marginTop: 10 }}>
            <ProgressBar progress={target ? today / target : 0} color={overTarget ? theme.colors.danger : theme.colors.warning} />
            {overTarget && (
              <Text variant="caption" color="danger" style={{ marginTop: 4 }}>
                {today - target} over today's cap — no judgment, tomorrow's a fresh start.
              </Text>
            )}
          </View>
        )}
      </Card>

      {/*
        The other cost of the one you just lit: how long before training is a
        good idea again. Only the smoke clock here — the meal clock lives on
        Home, Train and Nutrition.
      */}
      <DigestionCard meals={[]} smokes={smokes} defaultIntensity="hard" compact />

      {/* Smoke-free progress */}
      {impact.smokeFreeStreak > 0 && (
        <Card accent={theme.colors.accent}>
          <Row gap={12} style={{ alignItems: 'center' }}>
            <Icon icon="smoking.smokeFree" size={28} color={theme.colors.accent} />
            <View style={{ flex: 1 }}>
              <Text variant="h2">
                {impact.smokeFreeStreak} smoke-free day{impact.smokeFreeStreak === 1 ? '' : 's'}
              </Text>
              {isFinite(impact.smokeFreeHours) && (
                <Text variant="caption" color="textMuted">
                  {formatDurationLong(impact.smokeFreeHours * 3600)} since your last cigarette
                </Text>
              )}
            </View>
          </Row>
          {milestone && (
            <View style={{ marginTop: 10 }}>
              <Text variant="bodyStrong" color="accent">✓ {milestone.afterLabel}</Text>
              <Text variant="caption" color="textMuted">{milestone.benefit}</Text>
            </View>
          )}
          {next && (
            <View style={{ marginTop: 8 }}>
              <Text variant="caption" color="textFaint">Next · {next.afterLabel}: {next.benefit}</Text>
            </View>
          )}
        </Card>
      )}

      {/* This week impact */}
      <SectionHeader title="This Week" />
      <Row>
        <StatTile icon="smoking.cigarette" label="Cigarettes" value={`${impact.week}`} sub={`~${impact.avgPerDay}/day`} accent={theme.colors.warning} />
        <StatTile icon="smoking.money" label="Spent" value={`${cur}${impact.moneyWeek.toFixed(2)}`} sub={`${cur}${impact.moneyYearProjected}/yr`} accent={theme.colors.calories} />
      </Row>
      <Row>
        <StatTile icon="smoking.life" label="Life cost" value={`${Math.round(impact.lifeMinutesWeek / 60 * 10) / 10}h`} sub="this week (est.)" accent={theme.colors.danger} />
        <StatTile icon="smoking.heart" label="Nicotine" value={`${impact.nicotineWeekMg}mg`} sub="this week" accent={theme.colors.caffeine} />
      </Row>

      {/* Fitness impact — the "how it's affecting you" model */}
      <SectionHeader title="Estimated Fitness Impact" />
      <Card style={{ gap: 12 }}>
        <Row gap={10} style={{ alignItems: 'center' }}>
          <Icon icon="smoking.lungs" size={22} color={theme.colors.info} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">Aerobic capacity −{impact.aerobicPenaltyPct}%</Text>
            <Text variant="caption" color="textMuted">
              At ~{impact.avgPerDay}/day, carbon monoxide binds haemoglobin and cuts oxygen
              delivery — blunting endurance and pace. (Estimate.)
            </Text>
          </View>
        </Row>
        <Divider />
        <Row gap={10} style={{ alignItems: 'center' }}>
          <Icon icon="smoking.heart" size={22} color={theme.colors.danger} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">Resting heart rate +{impact.restingHrElevationBpm} bpm</Text>
            <Text variant="caption" color="textMuted">
              Nicotine is a stimulant that raises resting heart rate and blood pressure, so
              your heart works harder at rest and in training.
            </Text>
          </View>
        </Row>
      </Card>

      {/* Correlation with the user's OWN data */}
      {correlation && (correlation.avgStepsSmokeDays !== null || correlation.avgSessionCalSmokeDays !== null) && (
        <>
          <SectionHeader title="Your Data: Smoke vs Smoke-Free Days" />
          <Card style={{ gap: 12 }}>
            <Text variant="caption" color="textMuted">
              Last {correlation.windowDays} days · {correlation.smokeDays} with cigarettes,{' '}
              {correlation.cleanDays} smoke-free. Observational — your own logs.
            </Text>
            {correlation.avgStepsSmokeDays !== null && correlation.avgStepsCleanDays !== null && (
              <CompareRow
                label="Avg steps"
                smoke={correlation.avgStepsSmokeDays}
                clean={correlation.avgStepsCleanDays}
                format={(v) => v.toLocaleString()}
                higherIsBetter
              />
            )}
            {correlation.avgSessionCalSmokeDays !== null && correlation.avgSessionCalCleanDays !== null && (
              <CompareRow
                label="Avg session kcal"
                smoke={correlation.avgSessionCalSmokeDays}
                clean={correlation.avgSessionCalCleanDays}
                format={(v) => `${v}`}
                higherIsBetter
              />
            )}
            {correlation.lostSessionEquivalent > 0 && (
              <Text variant="caption" color="textFaint">
                Reduced aerobic capacity is roughly equivalent to losing{' '}
                {correlation.lostSessionEquivalent} of your {correlation.sessionsInWindow} sessions'
                endurance benefit this month.
              </Text>
            )}
          </Card>
        </>
      )}

      {/* Trend */}
      <SectionHeader title="Daily Trend" />
      <Card>
        <BarChart
          data={series.map((d) => ({ label: d.date.slice(8), value: d.count }))}
          color={theme.colors.warning}
          valueFormat={(v) => (v > 0 ? `${Math.round(v)}` : '')}
        />
      </Card>

      <Button title="Tracker settings" variant="secondary" icon="core.settings" onPress={onEditSettings} />
      <Button title="Turn off tracker" variant="ghost" onPress={confirmDisable} color={theme.colors.textMuted} />
    </Screen>
  );
}

function CompareRow({
  label,
  smoke,
  clean,
  format,
  higherIsBetter,
}: {
  label: string;
  smoke: number;
  clean: number;
  format: (v: number) => string;
  higherIsBetter: boolean;
}) {
  const theme = useTheme();
  const diff = clean - smoke;
  const pct = smoke > 0 ? Math.round((diff / smoke) * 100) : 0;
  const better = higherIsBetter ? diff > 0 : diff < 0;
  const max = Math.max(smoke, clean, 1);
  return (
    <View style={{ gap: 6 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text variant="label" color="textMuted">{label}</Text>
        {pct !== 0 && (
          <Text variant="caption" color={better ? 'success' : 'danger'}>
            {pct > 0 ? '+' : ''}{pct}% on smoke-free days
          </Text>
        )}
      </Row>
      <Row gap={8} style={{ alignItems: 'center' }}>
        <Icon icon="smoking.cigarette" size={14} color={theme.colors.warning} />
        <View style={{ flex: 1 }}>
          <ProgressBar progress={smoke / max} color={theme.colors.warning} height={8} />
        </View>
        <Text variant="caption" color="textMuted" style={{ width: 64, textAlign: 'right' }}>{format(smoke)}</Text>
      </Row>
      <Row gap={8} style={{ alignItems: 'center' }}>
        <Icon icon="smoking.smokeFree" size={14} color={theme.colors.accent} />
        <View style={{ flex: 1 }}>
          <ProgressBar progress={clean / max} color={theme.colors.accent} height={8} />
        </View>
        <Text variant="caption" color="textMuted" style={{ width: 64, textAlign: 'right' }}>{format(clean)}</Text>
      </Row>
    </View>
  );
}

/**
 * Pick what you actually used.
 *
 * Grouped worst-first so the ordering itself carries the message, and each
 * group states its own trade-off rather than leaving the user to infer that
 * everything on the list is equivalent. Only combusted items move the health
 * figures; the rest still count toward the day's nicotine, because dependence
 * is real even when the damage is much lower.
 */
function NicotineProductPicker({ onPick }: { onPick: (key: string) => void }) {
  const theme = useTheme();
  const [openKey, setOpenKey] = useState<string | null>(null);

  return (
    <View style={{ gap: 10, marginTop: 8 }}>
      {NICOTINE_GROUPS.map((g) => (
        <View key={g.label} style={{ gap: 6 }}>
          <Text variant="label" color="textMuted">{g.label}</Text>
          <Text variant="caption" color="textFaint">{g.blurb}</Text>
          {g.keys.map((k) => {
            const p = findNicotineProduct(k);
            if (!p) return null;
            const open = openKey === k;
            return (
              <View key={k}>
                <Row style={{ alignItems: 'center', paddingVertical: 4 }}>
                  <Pressable onPress={() => setOpenKey(open ? null : k)} hitSlop={6} style={{ flex: 1 }}>
                    <Text variant="body">{p.label}</Text>
                    <Text variant="caption" color="textFaint">
                      {p.nicotineMg} mg nicotine / {p.unitLabel}
                      {p.combusted ? ' · burned' : ' · smoke-free'}
                      {p.isNrt ? ' · licensed medicine' : ''}
                    </Text>
                  </Pressable>
                  <Button title={`+1`} size="sm" variant="secondary" onPress={() => onPick(k)} fullWidth={false} />
                </Row>
                {open && (
                  <Text variant="caption" color="textMuted" style={{ paddingBottom: 6 }}>
                    {p.note}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      ))}
      <Text variant="caption" color="textFaint">
        Only the burned ones count toward the life-cost and aerobic figures — that is where the tar
        and carbon monoxide are. Everything here still counts toward your nicotine, because the
        dependence is just as real.
      </Text>
    </View>
  );
}
