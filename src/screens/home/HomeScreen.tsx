import React, { useCallback, useState } from 'react';
import { View, Pressable, RefreshControl } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { StatTile } from '@/components/ui/StatTile';
import { SectionHeader, Row } from '@/components/ui/misc';
import type { RootStackParamList } from '@/navigation/types';
import { useUserStore } from '@/stores/userStore';
import { useNutritionStore } from '@/stores/nutritionStore';
import { useSmokingStore } from '@/stores/smokingStore';
import { getDailySteps } from '@/repositories/activityRepo';
import { activeCoachTips, dismissCoachTip, refreshCoachTips } from '@/repositories/coachRepo';
import { currentStreak } from '@/repositories/statsRepo';
import type { CoachTip } from '@/db/schema';
import { todayISO } from '@/lib/date';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const STEP_GOAL = 8000;
const CATEGORY_COLOR: Record<string, keyof ReturnType<typeof useTheme>['colors']> = {
  training: 'primary',
  nutrition: 'calories',
  hydration: 'water',
  caffeine: 'caffeine',
  recovery: 'mindbody',
  activity: 'accent',
  smoking: 'warning',
};

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

  const [steps, setSteps] = useState(0);
  const [tips, setTips] = useState<CoachTip[]>([]);
  const [streak, setStreak] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const reload = useCallback(() => {
    setDate(todayISO());
    refreshNutrition();
    setSteps(getDailySteps()?.stepCount ?? 0);
    setStreak(currentStreak());
    setTips(refreshCoachTips());
    loadSmoking();
  }, [setDate, refreshNutrition, loadSmoking]);

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

  const calTarget = goal?.calorieTarget ?? 2200;
  const calConsumed = food?.calories ?? 0;
  const calRemaining = Math.max(0, calTarget - calConsumed);
  const waterGoal = goal?.waterGoalMl ?? 2500;
  const water = beverages?.hydrationMl ?? 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const dismiss = (id: number) => {
    dismissCoachTip(id);
    setTips(activeCoachTips());
  };

  return (
    <Screen
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
      }
    >
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text variant="caption" color="textMuted">
            {greeting},
          </Text>
          <Text variant="h1">{user?.name ?? 'Athlete'}</Text>
        </View>
        <Row gap={6} style={{ alignItems: 'center' }}>
          <Icon icon="core.streak" size={20} color={theme.colors.warning} />
          <Text variant="h2">{streak}</Text>
          <Text variant="caption" color="textMuted">
            day{streak === 1 ? '' : 's'}
          </Text>
        </Row>
      </Row>

      {/* Primary rings */}
      <Card>
        <Row style={{ justifyContent: 'space-around', alignItems: 'center' }}>
          <ProgressRing
            progress={calTarget ? calConsumed / calTarget : 0}
            size={128}
            color={theme.colors.calories}
            value={`${calRemaining}`}
            label="kcal left"
          />
          <View style={{ gap: theme.spacing.md }}>
            <MiniRing
              progress={waterGoal ? water / waterGoal : 0}
              color={theme.colors.water}
              icon="nutrition.water"
              value={`${(water / 1000).toFixed(1)}L`}
              label={`of ${(waterGoal / 1000).toFixed(1)}L`}
            />
            <MiniRing
              progress={steps / STEP_GOAL}
              color={theme.colors.accent}
              icon="cardio.steps"
              value={steps.toLocaleString()}
              label={`of ${STEP_GOAL.toLocaleString()}`}
            />
          </View>
        </Row>
      </Card>

      {/* Quick actions */}
      <Row>
        <Button
          title="Start Session"
          icon="core.start"
          onPress={() => navigation.navigate('SessionTypePicker')}
          style={{ flex: 1 }}
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

      {/* Coach tips */}
      {tips.length > 0 && (
        <View style={{ gap: theme.spacing.md }}>
          <SectionHeader title="Coach Tips" />
          {tips.map((tip) => (
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

      {/* Today macros */}
      <SectionHeader title="Today's Nutrition" action="Log" onAction={() => navigation.navigate('Main', { screen: 'Nutrition' } as never)} />
      <Row>
        <StatTile
          icon="nutrition.protein"
          label="Protein"
          value={`${Math.round(food?.protein ?? 0)}g`}
          sub={`of ${goal?.proteinG ?? 0}g`}
          accent={theme.colors.protein}
        />
        <StatTile
          icon="nutrition.carbs"
          label="Carbs"
          value={`${Math.round(food?.carbs ?? 0)}g`}
          sub={`of ${goal?.carbsG ?? 0}g`}
          accent={theme.colors.carbs}
        />
        <StatTile
          icon="nutrition.fat"
          label="Fat"
          value={`${Math.round(food?.fat ?? 0)}g`}
          sub={`of ${goal?.fatG ?? 0}g`}
          accent={theme.colors.fat}
        />
      </Row>

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
    </Screen>
  );
}

function MiniRing({
  progress,
  color,
  icon,
  value,
  label,
}: {
  progress: number;
  color: string;
  icon: string;
  value: string;
  label: string;
}) {
  const theme = useTheme();
  return (
    <Row gap={10} style={{ alignItems: 'center' }}>
      <ProgressRing progress={progress} size={52} strokeWidth={6} color={color}>
        <Icon icon={icon} size={18} color={color} />
      </ProgressRing>
      <View>
        <Text variant="bodyStrong" style={{ fontVariant: ['tabular-nums'] }}>
          {value}
        </Text>
        <Text variant="caption" color="textMuted">
          {label}
        </Text>
      </View>
    </Row>
  );
}
