import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { PageHero } from '@/components/ui/PageHero';
import { Row } from '@/components/ui/misc';
import { toast } from '@/components/ui/Toast';
import { useUserStore } from '@/stores/userStore';
import {
  FOCUS_META,
  FOCUS_ORDER,
  GOAL_FROM_PHASE,
  PHASE_FROM_GOAL,
  PHASE_META,
  PHASE_ORDER,
  focusPhaseNote,
  sanitizeFocus,
  type Phase,
  type TrainingFocus,
} from '@/lib/trainingFocus';

/**
 * Bulk or cut, and what the lifting is for. The phase IS the calorie goal —
 * choosing Bulk sets the surplus, Cut the deficit — and the focus shapes the
 * tip on every exercise in a session.
 */
export function TrainingFocusScreen() {
  const theme = useTheme();
  const user = useUserStore((s) => s.user);
  const updateProfile = useUserStore((s) => s.updateProfile);
  const phase: Phase = PHASE_FROM_GOAL[user?.goal ?? 'maintain'];
  const focus: TrainingFocus = sanitizeFocus(user?.trainingFocus);
  const note = focusPhaseNote(focus, phase);

  const option = (key: string, label: string, blurb: string, active: boolean, onPress: () => void, extra?: string) => (
    <Pressable key={key} onPress={onPress}>
      <Card accent={active ? theme.colors.primary : undefined} style={{ gap: 4, borderColor: active ? theme.colors.primary : theme.colors.border }}>
        <Row gap={8} style={{ alignItems: 'center' }}>
          <Icon icon={active ? 'core.checkFilled' : 'core.checkEmpty'} size={18} color={active ? theme.colors.primary : theme.colors.textFaint} />
          <Text variant="h3" style={{ flex: 1 }}>
            {label}
          </Text>
          {extra ? (
            <Text variant="caption" color="textFaint">
              {extra}
            </Text>
          ) : null}
        </Row>
        <Text variant="caption" color="textMuted">
          {blurb}
        </Text>
      </Card>
    </Pressable>
  );

  return (
    <Screen>
      <PageHero icon="stats.muscleMap" color={theme.colors.primary} eyebrow="Training" title="Phase & focus" subtitle="Bulk or cut, and what your lifting is for. Every exercise in a session gets a tip from these and your last numbers." />

      <View style={{ gap: 4 }}>
        <Text variant="eyebrow" color="textMuted">
          Phase
        </Text>
        <Text variant="caption" color="textFaint">
          This is your calorie goal: Bulk sets a surplus, Cut a deficit, and the daily targets change with it.
        </Text>
      </View>
      {PHASE_ORDER.map((p) =>
        option(p, PHASE_META[p].label, PHASE_META[p].blurb, phase === p, () => {
          if (p === phase) return;
          updateProfile({ goal: GOAL_FROM_PHASE[p] });
          toast({ message: `Phase: ${PHASE_META[p].label} — your calorie targets moved with it` });
        })
      )}

      <View style={{ gap: 4, marginTop: theme.spacing.md }}>
        <Text variant="eyebrow" color="textMuted">
          Focus
        </Text>
        <Text variant="caption" color="textFaint">
          What the sets are for. It does not change the calories — only how the weights are prescribed.
        </Text>
      </View>
      {FOCUS_ORDER.map((f) =>
        option(
          f,
          FOCUS_META[f].label,
          FOCUS_META[f].blurb,
          focus === f,
          () => {
            if (f === focus) return;
            updateProfile({ trainingFocus: f });
            toast({ message: `Focus: ${FOCUS_META[f].label}` });
          },
          `${FOCUS_META[f].reps[0]}–${FOCUS_META[f].reps[1]} reps`
        )
      )}

      {note ? (
        <Card accent={theme.colors.warning} style={{ gap: 4 }}>
          <Row gap={8} style={{ alignItems: 'flex-start' }}>
            <Icon icon="core.info" size={16} color={theme.colors.warning} />
            <Text variant="caption" color="textMuted" style={{ flex: 1 }}>
              {note}
            </Text>
          </Row>
        </Card>
      ) : null}
    </Screen>
  );
}
