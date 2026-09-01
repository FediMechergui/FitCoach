import React, { useCallback, useState } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { SectionHeader, Row, EmptyState } from '@/components/ui/misc';
import type { RootStackParamList } from '@/navigation/types';
import { SESSION_TYPE_META } from '@/constants/sessionTypes';
import { sessionTypeIcon } from '@/constants/icon-map';
import { useSessionStore } from '@/stores/sessionStore';
import { listSessions, sessionExercisePeek, type SessionExercisePeek } from '@/repositories/sessionRepo';
import { ExercisePeek } from '@/components/ExercisePeek';
import { OUTDOOR_ACTIVITIES } from '@/lib/outdoorActivities';
import { deleteRoutine, saveRoutine, listRoutines, type RoutineView } from '@/repositories/routinesRepo';
import type { Session } from '@/db/schema';
import { formatDurationLong } from '@/lib/format';
import { fromISODate, toISODate } from '@/lib/date';
import { ReadinessStrip } from '@/components/ReadinessStrip';
import { mealsFromEntries, type MealForDigestion } from '@/lib/digestion';
import { foodEntriesForDay } from '@/repositories/nutritionRepo';
import { recentSmokeEvents, isSmokingEnabled } from '@/repositories/smokingRepo';
import { activePostSession } from '@/repositories/postSessionRepo';
import type { SmokeEvent } from '@/lib/smokeClock';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * Train 3.0 — seven ways to start a session, finally presented as a spine:
 *
 *   START   — the live-session resume or the primary CTA, the split, a past
 *             log, the readiness verdict (asked at HARD intensity, because
 *             that's the question here), and every ground activity as one rail.
 *   BROWSE  — the catalogue world: the daily challenge, the special
 *             programmes, and the nine categories (each opens its methods).
 *   HISTORY — saved routines (delete forgives now) and recent sessions.
 *
 * Nothing was removed — everything was placed.
 */
export function TrainScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const resume = useSessionStore((s) => s.resume);
  const activeId = useSessionStore((s) => s.activeId);
  const begin = useSessionStore((s) => s.begin);
  const [recent, setRecent] = useState<Session[]>([]);
  const [routines, setRoutines] = useState<RoutineView[]>([]);
  // Looking at what is in a routine or a past session should not require
  // starting anything — these hold whichever one is expanded in place.
  const [openRoutine, setOpenRoutine] = useState<number | null>(null);
  const [openSession, setOpenSession] = useState<number | null>(null);
  const [sessionPeek, setSessionPeek] = useState<SessionExercisePeek[]>([]);
  const [digestMeals, setDigestMeals] = useState<MealForDigestion[]>([]);
  const [smokes, setSmokes] = useState<SmokeEvent[]>([]);
  const [smokingOn, setSmokingOn] = useState(false);
  const [after, setAfter] = useState<ReturnType<typeof activePostSession>>(null);

  useFocusEffect(
    useCallback(() => {
      resume();
      setRecent(listSessions({ limit: 8 }));
      setRoutines(listRoutines());
      // Re-read on focus so a meal logged a minute ago shows up before you start.
      setDigestMeals(mealsFromEntries(foodEntriesForDay(toISODate())));
      // …and a cigarette a minute ago, which is the other thing that should stop you.
      setSmokes(recentSmokeEvents());
      setSmokingOn(isSmokingEnabled());
      setAfter(activePostSession());
    }, [resume])
  );

  const startRoutine = (r: RoutineView) => {
    begin('strength', { label: r.name, prefillExerciseIds: r.exerciseIds });
    const id = useSessionStore.getState().activeId!;
    navigation.navigate('ActiveSession', { sessionId: id });
  };

  /**
   * Delete with forgiveness — the routine goes optimistically and the toast
   * holds the door open for six seconds. Undo recreates it from the same name
   * and exercise list; logged sessions were never touched either way.
   */
  const removeRoutine = (r: RoutineView) => {
    const { name, exerciseIds } = r;
    deleteRoutine(r.id);
    setRoutines(listRoutines());
    toast({
      message: `Deleted “${name}”`,
      actionLabel: 'Undo',
      onAction: () => {
        saveRoutine(name, exerciseIds);
        setRoutines(listRoutines());
      },
    });
  };

  // Tapping a category opens its methods/splits/routines rather than blindly
  // starting a blank session — the "pick how you're training" step.
  const openCategory = (type: (typeof SESSION_TYPE_META)[number]) => {
    navigation.navigate('MethodPicker', { sessionType: type.type });
  };

  return (
    <Screen>
      <View>
        <Text variant="eyebrow" color="textMuted">
          Start
        </Text>
        <Text variant="display">Train</Text>
      </View>

      {activeId ? (
        <Card accent={theme.colors.accent} raised>
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Row gap={10} style={{ alignItems: 'center', flex: 1 }}>
              <Icon icon="core.timer" color={theme.colors.accent} />
              <View>
                <Text variant="bodyStrong">Session in progress</Text>
                <Text variant="caption" color="textMuted">
                  Tap to resume your check-in
                </Text>
              </View>
            </Row>
            <Button
              title="Resume"
              size="sm"
              fullWidth={false}
              onPress={() => navigation.navigate('ActiveSession', { sessionId: activeId })}
            />
          </Row>
        </Card>
      ) : (
        <Button
          title="Start a Session"
          icon="core.start"
          size="lg"
          onPress={() => navigation.navigate('SessionTypePicker')}
        />
      )}

      <Button
        title="Train a Split (Push / Pull / Legs…)"
        icon="stats.muscleMap"
        variant="secondary"
        onPress={() => navigation.navigate('SplitPicker')}
      />

      <Button
        title="Log a past session"
        icon="core.calendar"
        variant="ghost"
        onPress={() => navigation.navigate('LogSession')}
      />

      {/* The verdict, asked at hard intensity — the question Train exists to
          answer. The full physiology (intensity control included) is in the
          sheet, and "clear" shows instead of hiding. */}
      <ReadinessStrip
        meals={digestMeals}
        smokes={smokes}
        smokingEnabled={smokingOn}
        after={after}
        weatherLine={null}
        intensity="hard"
      />

      {/* Every ground activity, one rail — walks first, then the rest. */}
      <View style={{ gap: 6 }}>
        <Text variant="eyebrow" color="textMuted">
          Track outdoors
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
          {OUTDOOR_ACTIVITIES.map((a) => (
            <Card
              key={a.key}
              accent={theme.colors.outdoor}
              onPress={() => navigation.navigate('Walk', { activity: a.key })}
              style={{ paddingVertical: 10, paddingHorizontal: 14, minWidth: 104 }}
            >
              <Icon icon={a.icon} size={20} color={theme.colors.outdoor} />
              <Text variant="bodyStrong" style={{ marginTop: 6 }}>{a.label}</Text>
            </Card>
          ))}
        </ScrollView>
      </View>

      {/* ── Browse ─────────────────────────────────────────────────────────── */}
      <SectionHeader title="Browse" />

      {/* Spin once a day for a challenge you didn't choose */}
      <Card accent={theme.colors.warning} style={{ gap: 6 }} onPress={() => navigation.navigate('DailyChallenge')}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Row gap={12} style={{ alignItems: 'center', flex: 1 }}>
            <Icon icon="core.target" size={24} color={theme.colors.warning} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">Daily Challenge</Text>
              <Text variant="caption" color="textMuted" numberOfLines={1}>
                Spin the wheel — one a day, tracked automatically
              </Text>
            </View>
          </Row>
          <Icon icon="core.forward" size={18} color={theme.colors.textFaint} />
        </Row>
      </Card>

      {/* Themed military / historical / lifestyle programmes */}
      <Card accent={theme.colors.accent} style={{ gap: 6 }} onPress={() => navigation.navigate('SpecialPrograms')}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Row gap={12} style={{ alignItems: 'center', flex: 1 }}>
            <Icon icon="mindbody.special" size={24} color={theme.colors.accent} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">Special Programmes</Text>
              <Text variant="caption" color="textMuted" numberOfLines={1}>
                Military, Shaolin, Roman, Spartan, Dagestan… + their diets
              </Text>
            </View>
          </Row>
          <Icon icon="core.forward" size={18} color={theme.colors.textFaint} />
        </Row>
      </Card>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md }}>
        {SESSION_TYPE_META.map((m) => (
          <Card
            key={m.type}
            accent={m.color}
            onPress={() => openCategory(m)}
            style={{ gap: 8, width: '47%', flexGrow: 1 }}
          >
            <Icon icon={m.icon} size={26} color={m.color} />
            <Text variant="h3">{m.label}</Text>
            <Text variant="caption" color="textMuted">
              {m.blurb}
            </Text>
            <Text variant="caption" color="textFaint">
              Browse {m.label.toLowerCase()} →
            </Text>
          </Card>
        ))}
      </View>

      {/* ── History ────────────────────────────────────────────────────────── */}
      {routines.length > 0 && (
        <>
          <SectionHeader title="My Routines" />
          {routines.map((r) => {
            const open = openRoutine === r.id;
            return (
              <Card key={r.id} accent={theme.colors.primary} style={{ gap: open ? 10 : 0 }}>
                <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Pressable style={{ flex: 1 }} onPress={() => setOpenRoutine(open ? null : r.id)}>
                    <Row gap={12} style={{ alignItems: 'center', flex: 1 }}>
                      <Icon icon="core.custom" size={20} color={theme.colors.primary} />
                      <View style={{ flex: 1 }}>
                        <Text variant="bodyStrong" numberOfLines={1}>{r.name}</Text>
                        <Text variant="caption" color="textMuted" numberOfLines={1}>
                          {r.exercises.length} exercises · {open ? 'tap to collapse' : 'tap to see them'}
                        </Text>
                      </View>
                    </Row>
                  </Pressable>
                  <Pressable onPress={() => setOpenRoutine(open ? null : r.id)} hitSlop={8} style={{ paddingHorizontal: 6 }}>
                    <Icon icon={open ? 'core.chevronUp' : 'core.list'} size={18} color={theme.colors.primary} />
                  </Pressable>
                  <Pressable onPress={() => removeRoutine(r)} hitSlop={8} style={{ paddingHorizontal: 6 }}>
                    <Icon icon="core.delete" size={18} color={theme.colors.textFaint} />
                  </Pressable>
                  <Pressable onPress={() => startRoutine(r)} hitSlop={8} style={{ paddingLeft: 2 }}>
                    <Icon icon="core.start" size={22} color={theme.colors.primary} />
                  </Pressable>
                </Row>
                {open && (
                  <>
                    <ExercisePeek exercises={r.exercises} accent={theme.colors.primary} />
                    <Button title={`Start ${r.name}`} icon="core.start" size="sm" onPress={() => startRoutine(r)} />
                  </>
                )}
              </Card>
            );
          })}
        </>
      )}

      <SectionHeader
        title="Recent Sessions"
        action={recent.length ? 'All' : undefined}
        onAction={() => navigation.navigate('SessionHistory')}
      />
      {recent.length === 0 ? (
        <EmptyState
          icon="core.calendar"
          title="No sessions yet"
          message="Start your first session to build your history and stats."
        />
      ) : (
        recent.map((s) => {
          const open = openSession === s.id;
          const accent = SESSION_TYPE_META.find((m) => m.type === s.sessionType)?.color ?? theme.colors.primary;
          return (
            <Card key={s.id} style={{ gap: open ? 10 : 0 }}>
              <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Pressable style={{ flex: 1 }} onPress={() => navigation.navigate('SessionDetail', { sessionId: s.id })}>
                  <Row gap={12} style={{ alignItems: 'center', flex: 1 }}>
                    <Icon icon={sessionTypeIcon(s.sessionType)} size={22} color={accent} />
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyStrong" numberOfLines={1}>
                        {s.label ?? labelFor(s.sessionType)}
                      </Text>
                      <Text variant="caption" color="textMuted">
                        {friendlyDate(s.startTime)} · {formatDurationLong(s.durationS ?? 0)}
                        {s.totalVolume ? ` · ${Math.round(s.totalVolume).toLocaleString()} kg` : ''}
                        {s.distanceM ? ` · ${(s.distanceM / 1000).toFixed(2)} km` : ''}
                      </Text>
                    </View>
                  </Row>
                </Pressable>
                <Pressable
                  onPress={() => {
                    if (open) { setOpenSession(null); return; }
                    setSessionPeek(sessionExercisePeek(s.id));
                    setOpenSession(s.id);
                  }}
                  hitSlop={8}
                  style={{ paddingHorizontal: 6 }}
                >
                  <Icon icon={open ? 'core.chevronUp' : 'core.list'} size={18} color={theme.colors.primary} />
                </Pressable>
                <Icon icon="core.forward" size={18} color={theme.colors.textFaint} />
              </Row>
              {open && (
                <ExercisePeek
                  exercises={sessionPeek}
                  accent={theme.colors.primary}
                  emptyLabel="No exercises were logged in this session."
                />
              )}
            </Card>
          );
        })
      )}
    </Screen>
  );
}

function labelFor(type: string): string {
  return SESSION_TYPE_META.find((m) => m.type === type)?.label ?? 'Session';
}

function friendlyDate(ts: number): string {
  const d = new Date(ts);
  const today = toISODate(new Date());
  const iso = toISODate(d);
  if (iso === today) return 'Today';
  const yest = toISODate(new Date(Date.now() - 86_400_000));
  if (iso === yest) return 'Yesterday';
  return fromISODate(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
