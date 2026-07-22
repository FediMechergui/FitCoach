import React, { useCallback, useState } from 'react';
import { View, Pressable } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Row, SectionHeader, Badge, Divider } from '@/components/ui/misc';
import type { RootStackParamList } from '@/navigation/types';
import { metaFor } from '@/constants/sessionTypes';
import { methodsFor, EFFORT_LABEL, type TrainingMethod } from '@/data/trainingMethods';
import { SPLITS } from '@/data/splits';
import { listRoutines, type RoutineView } from '@/repositories/routinesRepo';
import { useSessionStore } from '@/stores/sessionStore';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type MethodRoute = RouteProp<RootStackParamList, 'MethodPicker'>;

export function MethodPickerScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<MethodRoute>();
  const sessionType = route.params.sessionType;
  const meta = metaFor(sessionType);
  const begin = useSessionStore((s) => s.begin);

  const [routines, setRoutines] = useState<RoutineView[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setRoutines(listRoutines());
    }, [])
  );

  const methods = methodsFor(sessionType);
  const isLifting = meta.flow === 'lifting';

  const startMethod = (m: TrainingMethod) => {
    // `style` tags the session with the method so progress can be compared
    // like-for-like later (5×5 vs 5×5, HIIT vs HIIT).
    begin(sessionType, { label: m.label, style: m.key, prefillSlugs: m.prefillSlugs });
    const id = useSessionStore.getState().activeId!;
    navigation.replace('ActiveSession', { sessionId: id });
  };

  const startRoutine = (r: RoutineView) => {
    begin(sessionType, { label: r.name, prefillExerciseIds: r.exerciseIds });
    const id = useSessionStore.getState().activeId!;
    navigation.replace('ActiveSession', { sessionId: id });
  };

  const startFree = () => {
    begin(sessionType);
    const id = useSessionStore.getState().activeId!;
    navigation.replace('ActiveSession', { sessionId: id });
  };

  return (
    <Screen>
      <Row gap={12} style={{ alignItems: 'center' }}>
        <Icon icon={meta.icon} size={26} color={meta.color} />
        <View style={{ flex: 1 }}>
          <Text variant="h1">{meta.label}</Text>
          <Text variant="caption" color="textMuted">{meta.blurb}</Text>
        </View>
      </Row>

      {/* Splits — lifting only */}
      {isLifting && (
        <>
          <SectionHeader title="Training splits" />
          <Pressable onPress={() => navigation.navigate('SplitPicker')}>
            <Card accent={meta.color}>
              <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Row gap={10} style={{ alignItems: 'center', flex: 1 }}>
                  <Icon icon="stats.muscleMap" size={20} color={meta.color} />
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyStrong">Pick a split</Text>
                    <Text variant="caption" color="textMuted">
                      {SPLITS.map((s) => s.name).slice(0, 4).join(' · ')}…
                    </Text>
                  </View>
                </Row>
                <Icon icon="core.forward" size={18} color={theme.colors.textFaint} />
              </Row>
            </Card>
          </Pressable>
        </>
      )}

      {/* Saved routines */}
      {routines.length > 0 && (
        <>
          <SectionHeader title="My routines" />
          {routines.map((r) => (
            <Pressable key={r.id} onPress={() => startRoutine(r)}>
              <Card accent={theme.colors.primary}>
                <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Row gap={10} style={{ alignItems: 'center', flex: 1 }}>
                    <Icon icon="core.custom" size={18} color={theme.colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyStrong" numberOfLines={1}>{r.name}</Text>
                      <Text variant="caption" color="textMuted" numberOfLines={1}>
                        {r.exercises.length} exercises
                      </Text>
                    </View>
                  </Row>
                  <Icon icon="core.start" size={20} color={theme.colors.primary} />
                </Row>
              </Card>
            </Pressable>
          ))}
        </>
      )}

      {/* Methods for this category */}
      {methods.length > 0 && (
        <>
          <SectionHeader title="Methods" />
          <Text variant="caption" color="textFaint">
            Each method is a real protocol with its own way of measuring progress. Tap one to read
            it; start it to tag the session so you can compare like-for-like over time.
          </Text>
          {methods.map((m) => {
            const open = expanded === m.key;
            return (
              <Card key={m.key} accent={open ? meta.color : undefined} style={{ gap: 8 }}>
                <Pressable onPress={() => setExpanded(open ? null : m.key)}>
                  <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <Row gap={10} style={{ alignItems: 'center', flex: 1 }}>
                      <Icon icon={m.icon} size={20} color={meta.color} />
                      <View style={{ flex: 1 }}>
                        <Text variant="bodyStrong">{m.label}</Text>
                        <Text variant="caption" color="textMuted">{m.blurb}</Text>
                      </View>
                    </Row>
                    <Badge label={`~${m.typicalMinutes}m`} color={theme.colors.textFaint} />
                  </Row>
                </Pressable>

                {open && (
                  <View style={{ gap: 8 }}>
                    <Divider />
                    <View>
                      <Text variant="label" color={theme.colors.accent}>How it runs</Text>
                      <Text variant="caption" color="textMuted">{m.structure}</Text>
                    </View>
                    <View>
                      <Text variant="label" color={theme.colors.accent}>
                        Progress measured by · {EFFORT_LABEL[m.progressBy]}
                      </Text>
                      <Text variant="caption" color="textMuted">{m.progressNote}</Text>
                    </View>
                    <Button title={`Start ${m.label}`} icon="core.start" size="sm" color={meta.color} onPress={() => startMethod(m)} />
                  </View>
                )}
              </Card>
            );
          })}
        </>
      )}

      <Button title="Free session (no method)" icon="core.start" variant="secondary" onPress={startFree} />
      <Text variant="caption" color="textFaint" center>
        Tagging a session with its method is what makes progress comparable — five-by-five against
        five-by-five, HIIT against HIIT — instead of one undifferentiated pile of workouts.
      </Text>
    </Screen>
  );
}
