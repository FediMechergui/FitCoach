import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { mealsFromEntries } from '@/lib/digestion';
import { foodEntriesForDay } from '@/repositories/nutritionRepo';
import { recentSmokeEvents } from '@/repositories/smokingRepo';
import { activePostSession } from '@/repositories/postSessionRepo';
import { weatherAdjustedWaterGoal } from '@/repositories/weatherRepo';
import { View, Pressable, RefreshControl } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Metric } from '@/components/ui/misc3';
import { StatTile } from '@/components/ui/StatTile';
import { toast } from '@/components/ui/Toast';
import { SectionHeader, Row } from '@/components/ui/misc';
import type { RootStackParamList } from '@/navigation/types';
import { useUserStore } from '@/stores/userStore';
import { useNutritionStore } from '@/stores/nutritionStore';
import { useSmokingStore } from '@/stores/smokingStore';
import { useSleepStore } from '@/stores/sleepStore';
import { useCycleStore } from '@/stores/cycleStore';
import { useUsageStore } from '@/stores/usageStore';
import { ConsistencyCard } from '@/components/ConsistencyCard';
import { ReadinessStrip } from '@/components/ReadinessStrip';
import { SessionTypeSheet } from '@/components/SessionTypeSheet';
import { FuelCell } from '@/components/FuelCell';
import { EnergyBalanceStrip } from '@/components/EnergyBalanceCard';
import { PHASE_GUIDANCE } from '@/lib/cycle';
import { getDailySteps } from '@/repositories/activityRepo';
import { DAILY_STEP_GOAL as STEP_GOAL } from '@/lib/pedometer';
import { activeCoachTips, dismissCoachTip, refreshCoachTips } from '@/repositories/coachRepo';
import { currentStreak } from '@/repositories/statsRepo';
import { getSelfCare, bumpSelfCare } from '@/repositories/selfCareRepo';
import { getPrayerSettings, prayersDone, togglePrayer, DAILY_PRAYERS } from '@/repositories/faithRepo';
import { SELF_CARE_ITEMS } from '@/lib/selfCare';
import { PRAYER_NAMES } from '@/lib/prayers';
import type { CoachTip } from '@/db/schema';
import { todayISO } from '@/lib/date';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const CATEGORY_COLOR: Record<string, keyof ReturnType<typeof useTheme>['colors']> = {
  training: 'primary',
  nutrition: 'calories',
  hydration: 'water',
  caffeine: 'caffeine',
  recovery: 'mindbody',
  activity: 'accent',
  smoking: 'warning',
  sleep: 'mindbody',
  alcohol: 'warning',
  cycle: 'protein',
  health: 'danger',
};

/** Coach tips shown on Home; the rest wait their turn. */
const MAX_TIPS = 2;

/**
 * Home 3.0 — a daily briefing in four bands, not a card pile.
 *
 *   Presence  — who you are today: greeting, the next right action, one
 *               consistency story (training + check-in merged).
 *   Readiness — one verdict strip; the physiology lives a tap down in a sheet.
 *               Clear states show — silence is not reassurance.
 *   Fuel      — one cell, one progress grammar: the calorie Arc with Water /
 *               Steps / Protein Rails, the energy ledger beneath, two macro
 *               Metrics and a door to the rest.
 *   Life      — self-care (with forgiveness), prayers, at most two coach tips,
 *               and the recovery row.
 *
 * Reads stop writing here: coach tips refresh once per app open, not on every
 * focus — opening Home no longer inserts rows for being looked at.
 */
export function HomeScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const user = useUserStore((s) => s.user);
  const goal = useUserStore((s) => s.goal);
  const food = useNutritionStore((s) => s.food);
  const beverages = useNutritionStore((s) => s.beverages);
  const refreshNutrition = useNutritionStore((s) => s.refresh);
  const setDate = useNutritionStore((s) => s.setDate);
  const smokingEnabled = useSmokingStore((s) => s.enabled);
  const smokingToday = useSmokingStore((s) => s.today);
  const smokingImpact = useSmokingStore((s) => s.impact);
  const loadSmoking = useSmokingStore((s) => s.load);
  const sleepLastNight = useSleepStore((s) => s.lastNight);
  const sleepSummaryData = useSleepStore((s) => s.summary);
  const loadSleep = useSleepStore((s) => s.load);
  const cycleEnabled = useCycleStore((s) => s.enabled);
  const cycleState = useCycleStore((s) => s.state);
  const loadCycle = useCycleStore((s) => s.load);
  const usage = useUsageStore((s) => s.streak);
  const loadUsage = useUsageStore((s) => s.load);

  const [steps, setSteps] = useState(0);
  const [tips, setTips] = useState<CoachTip[]>([]);
  const [streak, setStreak] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [care, setCare] = useState<Record<string, number>>({});
  const [prayersSet, setPrayersSet] = useState<Set<string>>(new Set());
  const [faithOn, setFaithOn] = useState(false);
  const [after, setAfter] = useState<ReturnType<typeof activePostSession>>(null);
  const [showTypePicker, setShowTypePicker] = useState(false);

  // Tips are refreshed ONCE per app open — an intent boundary, not a focus
  // effect. Looking at Home must never write to the database.
  useEffect(() => {
    setTips(refreshCoachTips());
  }, []);

  const reload = useCallback(() => {
    setDate(todayISO());
    refreshNutrition();
    setSteps(getDailySteps()?.stepCount ?? 0);
    setStreak(currentStreak());
    setTips(activeCoachTips());
    loadSmoking();
    loadSleep();
    loadCycle();
    loadUsage();
    setCare(getSelfCare());
    setFaithOn(!!getPrayerSettings()?.enabled);
    setPrayersSet(prayersDone());
    // Today's session, while its smoke / alcohol / eat margins are still running.
    setAfter(activePostSession());
  }, [setDate, refreshNutrition, loadSmoking, loadSleep, loadCycle, loadUsage]);

  /**
   * Self-care with forgiveness: the counter still cycles, but wrapping back to
   * zero — v2's silent fourth-tap data wipe — now announces itself and can be
   * undone. The undo replays the taps back to where you were.
   */
  const tapCare = (key: string) => {
    const before = care[key] ?? 0;
    bumpSelfCare(key);
    const now = getSelfCare();
    setCare(now);
    const item = SELF_CARE_ITEMS.find((i) => i.key === key);
    if ((now[key] ?? 0) < before) {
      toast({
        message: `${item?.label ?? 'Counter'} reset to 0`,
        actionLabel: 'Undo',
        onAction: () => {
          for (let i = 0; i < before; i++) bumpSelfCare(key);
          setCare(getSelfCare());
        },
      });
    }
  };
  const tapPrayer = (prayer: string) => {
    togglePrayer(prayer);
    setPrayersSet(prayersDone());
  };

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const onRefresh = () => {
    setRefreshing(true);
    reload();
    setRefreshing(false);
  };

  // Digestion inputs re-derive whenever the food snapshot changes.
  const digestMeals = useMemo(() => mealsFromEntries(foodEntriesForDay(todayISO())), [food]);
  // Keyed on today's count so logging a cigarette re-reads the events at once.
  const smokes = useMemo(() => recentSmokeEvents(), [smokingEnabled, smokingToday]);
  const calTarget = goal?.calorieTarget ?? 2200;
  const calConsumed = food?.calories ?? 0;
  // The weather adds to the base water goal on hot days — never subtracts.
  const waterAdj = useMemo(() => weatherAdjustedWaterGoal(goal?.waterGoalMl ?? 2500), [goal, food]);
  const water = beverages?.hydrationMl ?? 0;
  const weatherLine =
    waterAdj.feelsLike != null
      ? `Feels like ${Math.round(waterAdj.feelsLike)}°${waterAdj.extraMl > 0 ? ` — +${waterAdj.extraMl} ml water today` : ''}`
      : null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const dismiss = (id: number) => {
    dismissCoachTip(id);
    setTips(activeCoachTips());
    toast({ message: 'Tip muted for now' });
  };

  return (
    <Screen
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
      }
    >
      {/* ── Presence ─────────────────────────────────────────────────────── */}
      <View>
        <Text variant="eyebrow" color="textMuted">
          {greeting}
        </Text>
        <Text variant="display">{user?.name ?? 'Athlete'}</Text>
      </View>

      <Row>
        <Button
          title="Start Session"
          icon="core.start"
          onPress={() => setShowTypePicker(true)}
          style={{ flex: 2 }}
          fullWidth={false}
        />
        <Button
          title="Walk"
          icon="cardio.walk"
          variant="secondary"
          onPress={() => navigation.navigate('Walk', { mode: 'walk' })}
          fullWidth={false}
          style={{ flex: 1 }}
        />
      </Row>

      {usage && <ConsistencyCard usage={usage} trainingStreak={streak} />}

      {/* ── Readiness ────────────────────────────────────────────────────── */}
      <ReadinessStrip
        meals={digestMeals}
        smokes={smokes}
        smokingEnabled={smokingEnabled}
        after={after}
        weatherLine={weatherLine}
      />

      {/* ── Fuel ─────────────────────────────────────────────────────────── */}
      <FuelCell
        calConsumed={calConsumed}
        calTarget={calTarget}
        water={water}
        waterGoal={waterAdj.totalMl}
        waterExtraMl={waterAdj.extraMl}
        steps={steps}
        stepGoal={STEP_GOAL}
        protein={food?.protein ?? 0}
        proteinGoal={goal?.proteinG ?? 0}
        onPress={() => navigation.navigate('Main', { screen: 'Nutrition' } as never)}
      />
      <EnergyBalanceStrip onPress={() => navigation.navigate('Main', { screen: 'Nutrition' } as never)} />

      <Row>
        <Metric
          value={`${Math.round(food?.carbs ?? 0)}g`}
          label={`Carbs · of ${goal?.carbsG ?? 0}g`}
          accent={theme.colors.carbs}
          progress={{ value: food?.carbs ?? 0, max: goal?.carbsG || 1 }}
        />
        <Metric
          value={`${Math.round(food?.fat ?? 0)}g`}
          label={`Fat · of ${goal?.fatG ?? 0}g`}
          accent={theme.colors.fat}
          progress={{ value: food?.fat ?? 0, max: goal?.fatG || 1 }}
        />
      </Row>
      <Pressable onPress={() => navigation.navigate('Main', { screen: 'Nutrition' } as never)}>
        <Text variant="label" color="primary">
          All macros & micros →
        </Text>
      </Pressable>

      {/* ── Life ─────────────────────────────────────────────────────────── */}
      <SectionHeader title="Self-care" />
      <Card>
        <Row style={{ justifyContent: 'space-around' }}>
          {SELF_CARE_ITEMS.map((item) => {
            const count = care[item.key] ?? 0;
            const done = count >= item.target;
            const color = theme.colors[item.color as keyof typeof theme.colors] ?? theme.colors.primary;
            return (
              <Pressable key={item.key} onPress={() => tapCare(item.key)} style={{ alignItems: 'center', gap: 6, flex: 1 }}>
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: done ? color : theme.alpha.tint14(color as string),
                    borderWidth: 2,
                    borderColor: count > 0 ? color : theme.colors.border,
                  }}
                >
                  <Icon icon={item.icon} size={26} color={done ? '#fff' : color} />
                </View>
                <Text variant="caption" color={count > 0 ? 'text' : 'textFaint'} style={{ textAlign: 'center' }}>
                  {item.label}
                </Text>
                <Text variant="caption" color="textFaint" style={{ fontSize: 11 }}>
                  {item.target > 1 ? `${count}/${item.target}` : done ? 'Done ✓' : item.hint}
                </Text>
              </Pressable>
            );
          })}
        </Row>
      </Card>

      {/* Prayer check-ins (faith mode) */}
      {faithOn && (
        <>
          <SectionHeader title="Prayers today" action="Times" onAction={() => navigation.navigate('Prayers')} />
          <Card>
            <Row style={{ justifyContent: 'space-between' }}>
              {DAILY_PRAYERS.map((p) => {
                const meta = PRAYER_NAMES.find((n) => n.key === p);
                const done = prayersSet.has(p);
                return (
                  <Pressable key={p} onPress={() => tapPrayer(p)} style={{ alignItems: 'center', gap: 5, flex: 1 }}>
                    <View
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 23,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: done ? theme.colors.success : theme.colors.surfaceAlt,
                        borderWidth: 1.5,
                        borderColor: done ? theme.colors.success : theme.colors.border,
                      }}
                    >
                      <Icon icon={done ? 'core.check' : (meta?.icon ?? 'faith.crescent')} size={20} color={done ? '#fff' : theme.colors.textMuted} />
                    </View>
                    <Text variant="caption" color={done ? 'success' : 'textFaint'} style={{ fontSize: 11 }}>
                      {meta?.label ?? p}
                    </Text>
                  </Pressable>
                );
              })}
            </Row>
            <Text variant="caption" color="textFaint" center style={{ marginTop: 8 }}>
              {prayersSet.size} of 5 prayers marked done
            </Text>
          </Card>
        </>
      )}

      {/* Coach tips — at most two; the coach advises, it doesn't lecture. */}
      {tips.length > 0 && (
        <View style={{ gap: theme.spacing.md }}>
          <SectionHeader title="Coach Tips" />
          {tips.slice(0, MAX_TIPS).map((tip) => (
            <Card key={tip.id} accent={theme.colors[CATEGORY_COLOR[tip.category] ?? 'primary']}>
              <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Row gap={10} style={{ flex: 1, alignItems: 'flex-start' }}>
                  <Icon icon="stats.coachTip" size={20} color={theme.colors.warning} />
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyStrong">{tip.title}</Text>
                    <Text variant="caption" color="textMuted" style={{ marginTop: 2 }}>
                      {tip.message}
                    </Text>
                  </View>
                </Row>
                <Pressable onPress={() => dismiss(tip.id)} hitSlop={8}>
                  <Icon icon="core.close" size={18} color={theme.colors.textFaint} />
                </Pressable>
              </Row>
            </Card>
          ))}
        </View>
      )}

      {/* Recovery row — when the cycle is on, alcohol keeps its own slot
          instead of the two fighting over one tile. */}
      <Row>
        <Pressable style={{ flex: 1 }} onPress={() => navigation.navigate('Sleep')}>
          <StatTile
            icon="sleep.moon"
            label="Sleep"
            value={sleepLastNight != null ? `${sleepLastNight}h` : '—'}
            sub={sleepSummaryData?.avg7d != null ? `${sleepSummaryData.avg7d}h avg` : 'Tap to log'}
            accent={theme.colors.mindbody}
          />
        </Pressable>
        {cycleEnabled && cycleState ? (
          <Pressable style={{ flex: 1 }} onPress={() => navigation.navigate('Cycle')}>
            <StatTile
              icon="cycle.flower"
              label={PHASE_GUIDANCE[cycleState.phase].title}
              value={`Day ${cycleState.dayOfCycle}`}
              sub={`Period in ${cycleState.daysUntilNextPeriod}d`}
              accent={PHASE_GUIDANCE[cycleState.phase].color}
            />
          </Pressable>
        ) : (
          <Pressable style={{ flex: 1 }} onPress={() => navigation.navigate('Alcohol')}>
            <StatTile icon="alcohol.beer" label="Alcohol" value="Log" sub="tap to track" accent={theme.colors.warning} />
          </Pressable>
        )}
      </Row>
      {cycleEnabled && cycleState ? (
        <Pressable onPress={() => navigation.navigate('Alcohol')}>
          <StatTile icon="alcohol.beer" label="Alcohol" value="Log" sub="tap to track" accent={theme.colors.warning} />
        </Pressable>
      ) : null}

      {/* Smoking tracker tile (opt-in) */}
      {smokingEnabled && (
        <Pressable onPress={() => navigation.navigate('Smoking')}>
          <Card accent={smokingImpact && smokingImpact.smokeFreeStreak > 0 ? theme.colors.accent : theme.colors.warning}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Row gap={10} style={{ alignItems: 'center', flex: 1 }}>
                <Icon
                  icon={smokingImpact && smokingImpact.smokeFreeStreak > 0 ? 'smoking.smokeFree' : 'smoking.cigarette'}
                  size={22}
                  color={smokingImpact && smokingImpact.smokeFreeStreak > 0 ? theme.colors.accent : theme.colors.warning}
                />
                <View style={{ flex: 1 }}>
                  {smokingImpact && smokingImpact.smokeFreeStreak > 0 ? (
                    <Text variant="bodyStrong">{smokingImpact.smokeFreeStreak}-day smoke-free streak</Text>
                  ) : (
                    <Text variant="bodyStrong">{smokingToday} cigarette{smokingToday === 1 ? '' : 's'} today</Text>
                  )}
                  <Text variant="caption" color="textMuted">
                    {smokingImpact
                      ? `~${smokingImpact.avgPerDay}/day · −${smokingImpact.aerobicPenaltyPct}% aerobic (est.)`
                      : 'Tap for impact'}
                  </Text>
                </View>
              </Row>
              <Icon icon="core.forward" size={18} color={theme.colors.textFaint} />
            </Row>
          </Card>
        </Pressable>
      )}
      <SessionTypeSheet visible={showTypePicker} onClose={() => setShowTypePicker(false)} />
    </Screen>
  );
}
