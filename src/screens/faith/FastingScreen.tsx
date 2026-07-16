import React, { useCallback, useEffect, useState } from 'react';
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
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Row, SectionHeader, Badge } from '@/components/ui/misc';
import type { RootStackParamList } from '@/navigation/types';
import {
  currentFastingState,
  fastingStats,
  getFastingProfile,
  getPrayerSettings,
  logFastCompleted,
  upsertFastingProfile,
  type FastingStats,
} from '@/repositories/faithRepo';
import { FASTING_TRAINING_TIPS, type FastingState } from '@/lib/fasting';
import { minutesToHM } from '@/lib/time';
import type { FastingProfile } from '@/db/schema';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function FastingScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const [profile, setProfile] = useState<FastingProfile | null>(null);
  const [state, setState] = useState<FastingState | null>(null);
  const [stats, setStats] = useState<FastingStats | null>(null);
  const [suhoor, setSuhoor] = useState('04:00');
  const [iftar, setIftar] = useState('19:00');
  const [eatStart, setEatStart] = useState('12:00');
  const [eatEnd, setEatEnd] = useState('20:00');

  const reload = useCallback(() => {
    const p = getFastingProfile() ?? null;
    setProfile(p);
    setState(currentFastingState());
    setStats(fastingStats());
    if (p) {
      setSuhoor(p.manualSuhoor ?? '04:00');
      setIftar(p.manualIftar ?? '19:00');
      setEatStart(p.eatingStart ?? '12:00');
      setEatEnd(p.eatingEnd ?? '20:00');
    }
  }, []);

  useFocusEffect(useCallback(() => reload(), [reload]));
  useEffect(() => {
    const t = setInterval(() => setState(currentFastingState()), 30_000);
    return () => clearInterval(t);
  }, []);

  const enabled = !!profile?.enabled;
  const mode = profile?.mode ?? 'ramadan';
  const prayersConfigured = !!getPrayerSettings()?.enabled;

  const enable = () => {
    upsertFastingProfile({ enabled: true, mode });
    reload();
  };
  const disable = () => {
    upsertFastingProfile({ enabled: false });
    reload();
  };
  const setMode = (m: 'ramadan' | 'intermittent') => {
    upsertFastingProfile({ enabled: true, mode: m });
    reload();
  };
  const saveTimes = () => {
    upsertFastingProfile({
      manualSuhoor: suhoor,
      manualIftar: iftar,
      eatingStart: eatStart,
      eatingEnd: eatEnd,
    });
    reload();
  };

  return (
    <Screen>
      <Row gap={12} style={{ alignItems: 'center' }}>
        <Icon icon="faith.fasting" size={28} color={theme.colors.warning} />
        <Text variant="h1" style={{ flex: 1 }}>Fasting</Text>
        {enabled && <Badge label={mode === 'ramadan' ? 'Ramadan' : 'Intermittent'} color={theme.colors.warning} />}
      </Row>

      {!enabled ? (
        <>
          <Text variant="body" color="textMuted">
            Track Ramadan or intermittent fasting. FitCoach shows a live fasting timer, adapts
            the nutrition diary, and keeps a fasted-day streak.
          </Text>
          <SegmentedControl
            options={[
              { value: 'ramadan', label: 'Ramadan' },
              { value: 'intermittent', label: 'Intermittent (16:8…)' },
            ]}
            value={mode}
            onChange={(m) => upsertFastingProfile({ mode: m })}
          />
          <Button title="Enable fasting mode" icon="core.check" color={theme.colors.warning} onPress={enable} />
        </>
      ) : (
        <>
          {/* Live state */}
          {state && (
            <Card accent={state.fasting ? theme.colors.warning : theme.colors.success} style={{ gap: 8 }}>
              <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Text variant="h2" style={{ color: state.fasting ? theme.colors.warning : theme.colors.success }}>
                  {state.fasting ? 'FASTING' : 'Eating window'}
                </Text>
                <Icon icon={state.fasting ? 'faith.fasting' : 'nutrition.calories'} size={22} color={state.fasting ? theme.colors.warning : theme.colors.success} />
              </Row>
              <ProgressBar progress={state.progress} color={state.fasting ? theme.colors.warning : theme.colors.success} />
              <Row style={{ justifyContent: 'space-between' }}>
                <Text variant="caption" color="textMuted">{state.nextLabel} at {state.nextTime}</Text>
                <Text variant="bodyStrong">{minutesToHM(state.minutesUntilNext)} left</Text>
              </Row>
              {mode === 'ramadan' && prayersConfigured && (
                <Text variant="caption" color="textFaint">
                  Suhoor ends at Fajr · Iftar at Maghrib — synced with your prayer times.
                </Text>
              )}
            </Card>
          )}

          {/* Mode & times */}
          <SectionHeader title="Schedule" />
          <SegmentedControl
            options={[
              { value: 'ramadan', label: 'Ramadan' },
              { value: 'intermittent', label: 'Intermittent' },
            ]}
            value={mode}
            onChange={setMode}
          />
          {mode === 'ramadan' ? (
            prayersConfigured ? (
              <Button
                title="Times come from your prayer settings"
                variant="secondary"
                icon="faith.crescent"
                onPress={() => navigation.navigate('Prayers')}
              />
            ) : (
              <Card style={{ gap: 10 }}>
                <Text variant="caption" color="textMuted">
                  Set your location in Prayer times for automatic Suhoor/Iftar — or set them manually:
                </Text>
                <Row>
                  <View style={{ flex: 1 }}>
                    <Input label="Suhoor ends" value={suhoor} onChangeText={setSuhoor} placeholder="04:00" keyboardType="numbers-and-punctuation" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Input label="Iftar" value={iftar} onChangeText={setIftar} placeholder="19:00" keyboardType="numbers-and-punctuation" />
                  </View>
                </Row>
                <Row>
                  <Button title="Save times" size="sm" onPress={saveTimes} style={{ flex: 1 }} fullWidth={false} />
                  <Button title="Set up prayers" size="sm" variant="secondary" onPress={() => navigation.navigate('Prayers')} style={{ flex: 1 }} fullWidth={false} />
                </Row>
              </Card>
            )
          ) : (
            <Card style={{ gap: 10 }}>
              <Text variant="caption" color="textMuted">Eating window (fast outside it):</Text>
              <Row>
                <View style={{ flex: 1 }}>
                  <Input label="Eating starts" value={eatStart} onChangeText={setEatStart} placeholder="12:00" keyboardType="numbers-and-punctuation" />
                </View>
                <View style={{ flex: 1 }}>
                  <Input label="Eating ends" value={eatEnd} onChangeText={setEatEnd} placeholder="20:00" keyboardType="numbers-and-punctuation" />
                </View>
              </Row>
              <Button title="Save window" size="sm" onPress={saveTimes} fullWidth={false} />
            </Card>
          )}

          {/* Streak */}
          {stats && (
            <>
              <SectionHeader title="Your fasts" />
              <Row>
                <StatTile icon="core.streak" label="Streak" value={`${stats.streak}`} sub="days" accent={theme.colors.warning} />
                <StatTile icon="core.calendar" label="Last 30 days" value={`${stats.fastedLast30}`} sub="fasted" accent={theme.colors.accent} />
              </Row>
              <Button
                title={stats.loggedToday ? 'Today logged ✓' : 'I completed today\'s fast'}
                icon="core.check"
                color={theme.colors.warning}
                disabled={stats.loggedToday}
                onPress={() => {
                  logFastCompleted();
                  reload();
                }}
              />
            </>
          )}

          {/* Training guidance */}
          <SectionHeader title="Training while fasting" />
          <Card style={{ gap: 8 }}>
            {FASTING_TRAINING_TIPS.map((tip, i) => (
              <Row key={i} gap={8} style={{ alignItems: 'flex-start' }}>
                <Icon icon="core.info" size={14} color={theme.colors.accent} />
                <Text variant="caption" color="textMuted" style={{ flex: 1 }}>{tip}</Text>
              </Row>
            ))}
          </Card>

          <Button title="Turn off fasting mode" variant="ghost" color={theme.colors.textMuted} onPress={disable} />
        </>
      )}
    </Screen>
  );
}
