import React, { useCallback, useMemo, useState } from 'react';
import { View, Pressable } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { toast } from '@/components/ui/Toast';
import { Row, SectionHeader, Badge, Divider } from '@/components/ui/misc';
import { PageHero } from '@/components/ui/PageHero';
import type { RootStackParamList } from '@/navigation/types';
import { metaFor } from '@/constants/sessionTypes';
import { LEVEL_LABEL, type ProgramLevel } from '@/data/programs';
import {
  READY_GROUP_META,
  READY_GROUP_ORDER,
  READY_SESSIONS,
  readyStyleTag,
  readyTargetFor,
  type ReadyGroup,
  type ReadySession,
} from '@/data/readySessions';
import { MUSCLE_LABELS, SUB_MUSCLE_LABELS } from '@/data/exercises';
import { exercisesBySlugs } from '@/repositories/exerciseRepo';
import { saveRoutine } from '@/repositories/routinesRepo';
import { readyHistory, type ReadyDone } from '@/repositories/readyRepo';
import { useSessionStore } from '@/stores/sessionStore';
import { fromISODate, toISODate } from '@/lib/date';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type LevelFilter = ProgramLevel | 'any';

const LEVEL_COLOR: Record<ProgramLevel, string> = {
  beginner: '#3FBF7F',
  intermediate: '#E8A33D',
  advanced: '#E5533D',
};

/**
 * Ready sessions — one session, already written.
 *
 * A rail of groups at the top, a level filter under it, and a card per session
 * that opens in place: what it is for, what you need, the prescription, and the
 * running order with what each exercise is there to train. Start is one tap
 * from there, and so is keeping it among your own routines.
 */
export function ReadySessionsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const begin = useSessionStore((s) => s.begin);
  const activeId = useSessionStore((s) => s.activeId);
  const [group, setGroup] = useState<ReadyGroup>('pushups');
  const [level, setLevel] = useState<LevelFilter>('any');
  const [open, setOpen] = useState<string | null>(null);
  const [done, setDone] = useState<Record<string, ReadyDone>>({});

  useFocusEffect(
    useCallback(() => {
      setDone(readyHistory());
    }, [])
  );

  const meta = READY_GROUP_META[group];
  const inGroup = useMemo(() => READY_SESSIONS.filter((s) => s.group === group), [group]);
  const shown = level === 'any' ? inGroup : inGroup.filter((s) => s.level === level);

  const start = (s: ReadySession) => {
    if (activeId) {
      toast({ message: 'A session is already in progress. Finish or discard it first.' });
      return;
    }
    begin(s.sessionType, {
      label: sessionLabel(s),
      style: readyStyleTag(s),
      prefillSlugs: s.exercises,
    });
    const id = useSessionStore.getState().activeId!;
    navigation.replace('ActiveSession', { sessionId: id });
  };

  const keep = (s: ReadySession) => {
    const ids = exercisesBySlugs(s.exercises).map((e) => e.id);
    saveRoutine(sessionLabel(s), ids);
    toast({ message: `Saved “${sessionLabel(s)}” to My Routines` });
  };

  return (
    <Screen>
      <PageHero
        icon="core.start"
        color={theme.colors.primary}
        eyebrow="Browse"
        title="Ready sessions"
        subtitle={`${READY_SESSIONS.length} sessions already written. Pick one, read it, start it.`}
      />

      <SegmentedControl
        scrollable
        options={READY_GROUP_ORDER.map((g) => ({
          value: g,
          label: READY_GROUP_META[g].short,
          icon: READY_GROUP_META[g].icon,
        }))}
        value={group}
        onChange={(g) => {
          setGroup(g);
          setOpen(null);
        }}
        accent={theme.colors.primary}
      />

      <View style={{ gap: 4 }}>
        <SectionHeader title={meta.label} />
        <Text variant="caption" color="textMuted" style={{ marginTop: -6 }}>
          {meta.blurb}
        </Text>
      </View>

      <Row gap={8} style={{ flexWrap: 'wrap' }}>
        <Chip label={`Any level · ${inGroup.length}`} active={level === 'any'} color={theme.colors.primary} small onPress={() => setLevel('any')} />
        {(['beginner', 'intermediate', 'advanced'] as ProgramLevel[]).map((l) => {
          const n = inGroup.filter((s) => s.level === l).length;
          if (n === 0) return null;
          return (
            <Chip
              key={l}
              label={`${LEVEL_LABEL[l]} · ${n}`}
              active={level === l}
              color={LEVEL_COLOR[l]}
              small
              onPress={() => setLevel(level === l ? 'any' : l)}
            />
          );
        })}
      </Row>

      {shown.length === 0 ? (
        <Text variant="caption" color="textFaint">
          Nothing at that level in this group. Choose another level, or Any level.
        </Text>
      ) : null}

      {shown.map((s) => (
        <SessionCard
          key={s.key}
          session={s}
          open={open === s.key}
          done={done[s.key]}
          onToggle={() => setOpen(open === s.key ? null : s.key)}
          onStart={() => start(s)}
          onKeep={() => keep(s)}
        />
      ))}

      <Text variant="caption" color="textFaint" center>
        Sessions are pre-loaded, never locked: add, remove or swap anything once inside. “Best three”
        is a considered choice, not the only right one.
      </Text>
    </Screen>
  );
}

/** the name a started or saved session carries: the group says what "Chest" alone cannot */
function sessionLabel(s: ReadySession): string {
  if (s.group === 'best-gym') return `${s.name} · best three`;
  if (s.group === 'best-home') return `${s.name} · best three, no kit`;
  return s.name;
}

function friendlyDate(ts: number): string {
  const iso = toISODate(new Date(ts));
  if (iso === toISODate(new Date())) return 'today';
  if (iso === toISODate(new Date(Date.now() - 86_400_000))) return 'yesterday';
  return fromISODate(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function SessionCard({
  session: s,
  open,
  done,
  onToggle,
  onStart,
  onKeep,
}: {
  session: ReadySession;
  open: boolean;
  done?: ReadyDone;
  onToggle: () => void;
  onStart: () => void;
  onKeep: () => void;
}) {
  const theme = useTheme();
  const type = metaFor(s.sessionType);
  // Only the open card reads the library: a hundred cards would be a hundred lookups.
  const preview = open ? exercisesBySlugs(s.exercises) : [];

  return (
    <Card accent={open ? type.color : undefined} style={{ gap: 10 }}>
      <Pressable onPress={onToggle}>
        <Row gap={12} style={{ alignItems: 'center' }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: theme.radius.md,
              backgroundColor: theme.alpha.tint14(type.color),
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon icon={type.icon} size={22} color={type.color} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text variant="h3" numberOfLines={2}>
              {s.name}
            </Text>
            <Text variant="caption" color="textMuted" numberOfLines={open ? undefined : 2}>
              {s.why}
            </Text>
          </View>
          <Icon icon={open ? 'core.chevronUp' : 'core.list'} size={18} color={theme.colors.textFaint} />
        </Row>
      </Pressable>

      <Row gap={6} style={{ flexWrap: 'wrap' }}>
        <Badge label={LEVEL_LABEL[s.level]} color={LEVEL_COLOR[s.level]} />
        <Chip label={`~${s.minutes} min`} color={type.color} small />
        <Chip label={`${s.exercises.length} exercises`} color={type.color} small />
        {done ? (
          <Chip
            label={`Done ${done.count === 1 ? 'once' : `${done.count} times`} · ${friendlyDate(done.lastAt)}`}
            color={theme.colors.success}
            small
          />
        ) : null}
      </Row>

      {open && (
        <View style={{ gap: 10 }}>
          <Divider />
          <View>
            <Text variant="label" color={type.color}>
              You need
            </Text>
            <Text variant="caption" color="textMuted">
              {s.kit}
            </Text>
          </View>
          <View>
            <Text variant="label" color={type.color}>
              Prescription
            </Text>
            <Text variant="caption" color="textMuted">
              {s.prescription}
            </Text>
          </View>
          {s.note ? (
            <Row gap={8} style={{ alignItems: 'flex-start' }}>
              <Icon icon="core.info" size={16} color={theme.colors.warning} />
              <Text variant="caption" color="textMuted" style={{ flex: 1 }}>
                {s.note}
              </Text>
            </Row>
          ) : null}

          <Divider />
          {preview.map((ex, i) => {
            const slugIndex = s.exercises.indexOf(ex.slug ?? '');
            const target = slugIndex >= 0 ? readyTargetFor(s, slugIndex) : null;
            const muscle = ex.subMuscle
              ? SUB_MUSCLE_LABELS[ex.subMuscle] ?? ex.subMuscle
              : ex.primaryMuscle
                ? MUSCLE_LABELS[ex.primaryMuscle] ?? ex.primaryMuscle
                : null;
            return (
              <Row key={ex.id} gap={8} style={{ alignItems: 'flex-start' }}>
                <Text variant="caption" color="textFaint" style={{ width: 20, marginTop: 2, fontVariant: ['tabular-nums'] }}>
                  {i + 1}.
                </Text>
                <Icon icon={ex.iconKey ?? 'core.custom'} size={16} color={type.color} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text variant="body" numberOfLines={2}>
                    {ex.name}
                  </Text>
                  {target || muscle ? (
                    <Text variant="caption" color={target ? type.color : 'textFaint'} numberOfLines={1}>
                      {target ?? muscle}
                    </Text>
                  ) : null}
                </View>
              </Row>
            );
          })}
          {preview.length < s.exercises.length && (
            <Text variant="caption" color="textFaint">
              {s.exercises.length - preview.length} of these are not in your library yet. They arrive with
              the next library update; the rest of the session starts as written.
            </Text>
          )}

          <Button title={`Start ${s.name}`} icon="core.start" color={type.color} onPress={onStart} />
          <Button title="Keep in My Routines" icon="core.custom" variant="ghost" size="sm" onPress={onKeep} />
        </View>
      )}
    </Card>
  );
}
