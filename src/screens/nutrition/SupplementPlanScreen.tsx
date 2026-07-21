import React, { useCallback, useMemo, useState } from 'react';
import { View, Pressable, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Row, SectionHeader, Divider, Badge } from '@/components/ui/misc';
import { useSupplementsStore } from '@/stores/supplementsStore';
import {
  SUPPLEMENT_GOALS,
  buildIntakePlan,
  type SupplementGoal,
  type SafetyNote,
} from '@/lib/supplementPlan';
import { EVIDENCE_COLOR, EVIDENCE_LABEL } from '@/data/supplements';
import { isSmokingEnabled, avgCigarettesPerDay } from '@/repositories/smokingRepo';
import { avgCaffeineSince } from '@/repositories/nutritionRepo';
import { listConditions } from '@/repositories/conditionsRepo';
import { daysAgoISO } from '@/lib/date';

export function SupplementPlanScreen() {
  const theme = useTheme();
  const stack = useSupplementsStore((s) => s.stack);
  const addToStack = useSupplementsStore((s) => s.addToStack);
  const load = useSupplementsStore((s) => s.load);
  const [goals, setGoals] = useState<SupplementGoal[]>(['general_wellbeing']);
  const [ctx, setCtx] = useState<{ smokes: boolean; caffeineMgPerDay?: number; conditions: string[] }>({
    smokes: false,
    conditions: [],
  });

  useFocusEffect(
    useCallback(() => {
      load();
      try {
        setCtx({
          smokes: isSmokingEnabled() || avgCigarettesPerDay(7) > 0,
          caffeineMgPerDay: avgCaffeineSince(daysAgoISO(6)) ?? undefined,
          conditions: listConditions().map((c) => c.conditionKey),
        });
      } catch {
        /* context is best-effort — the plan still works without it */
      }
    }, [load])
  );

  const plan = useMemo(() => buildIntakePlan(goals, ctx), [goals, ctx]);
  const inStack = new Set(stack.map((s) => s.key));

  const toggleGoal = (g: SupplementGoal) =>
    setGoals((cur) => (cur.includes(g) ? cur.filter((x) => x !== g) : [...cur, g]));

  const addAll = () => {
    const items = plan.slots.flatMap((s) => s.items).filter((i) => !inStack.has(i.key));
    if (items.length === 0) {
      Alert.alert('Already in your stack', 'Every supplement in this plan is already saved.');
      return;
    }
    Alert.alert(
      `Add ${items.length} to your stack?`,
      'They will appear on the Supplements screen for one-tap daily logging. You can remove any of them later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: () => {
            for (const i of items) addToStack(i.key, i.dose);
          },
        },
      ]
    );
  };

  return (
    <Screen>
      <Row gap={12} style={{ alignItems: 'center' }}>
        <Icon icon="supp.pill" size={26} color={theme.colors.accent} />
        <Text variant="h1" style={{ flex: 1 }}>Supplement plan</Text>
      </Row>
      <Text variant="body" color="textMuted">
        Pick what you're actually trying to achieve. FitCoach builds a timed plan from the
        catalogue, rates each item honestly, and flags the dose caps and interactions that matter.
      </Text>

      {/* Goals */}
      <SectionHeader title="Your goals" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {SUPPLEMENT_GOALS.map((g) => {
          const on = goals.includes(g.key);
          return (
            <Pressable key={g.key} onPress={() => toggleGoal(g.key)} style={{ width: '48%', flexGrow: 1 }}>
              <Card
                accent={on ? theme.colors.accent : undefined}
                style={{
                  gap: 4,
                  backgroundColor: on ? theme.colors.accent + '18' : theme.colors.card,
                  borderColor: on ? theme.colors.accent : theme.colors.border,
                }}
              >
                <Row gap={8} style={{ alignItems: 'center' }}>
                  <Icon icon={g.icon} size={18} color={on ? theme.colors.accent : theme.colors.textMuted} />
                  <Text variant="bodyStrong" style={{ flex: 1 }}>{g.label}</Text>
                  {on && <Icon icon="core.check" size={15} color={theme.colors.accent} />}
                </Row>
                <Text variant="caption" color="textFaint">{g.blurb}</Text>
              </Card>
            </Pressable>
          );
        })}
      </View>

      {goals.length === 0 ? (
        <Card style={{ borderStyle: 'dashed' }}>
          <Text variant="body" color="textFaint" center>Pick at least one goal to build a plan.</Text>
        </Card>
      ) : (
        <>
          {/* Safety first — warnings before the plan */}
          {plan.notes.filter((n) => n.severity === 'warning').map((n, i) => (
            <NoteCard key={`w${i}`} note={n} />
          ))}

          {/* Daily schedule */}
          <SectionHeader title="Your daily schedule" />
          {plan.slots.map((slot) => (
            <View key={slot.slot} style={{ gap: theme.spacing.sm }}>
              <Row gap={8} style={{ alignItems: 'center', paddingTop: 4 }}>
                <Icon icon="core.timer" size={15} color={theme.colors.accent} />
                <Text variant="h3">{slot.label}</Text>
                <Text variant="caption" color="textFaint">· {slot.when}</Text>
              </Row>
              <Card style={{ gap: 10 }}>
                {slot.items.map((item, idx) => (
                  <View key={item.key}>
                    {idx > 0 ? <Divider /> : null}
                    <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1 }}>
                        <Row gap={6} style={{ alignItems: 'center', flexWrap: 'wrap' }}>
                          <Text variant="bodyStrong">{item.label}</Text>
                          {item.core ? (
                            <Badge label="Core" color={theme.colors.success} />
                          ) : (
                            <Badge label="Optional" color={theme.colors.textFaint} />
                          )}
                          {item.evidenceLevel && (
                            <Badge label={EVIDENCE_LABEL[item.evidenceLevel]} color={EVIDENCE_COLOR[item.evidenceLevel]} />
                          )}
                        </Row>
                        <Text variant="caption" color={theme.colors.accent} style={{ marginTop: 2 }}>{item.dose}</Text>
                        <Text variant="caption" color="textMuted" style={{ marginTop: 2 }}>{item.why}</Text>
                      </View>
                      {inStack.has(item.key) ? (
                        <Icon icon="core.check" size={18} color={theme.colors.success} />
                      ) : (
                        <Pressable onPress={() => addToStack(item.key, item.dose)} hitSlop={8}>
                          <Icon icon="core.add" size={20} color={theme.colors.primary} />
                        </Pressable>
                      )}
                    </Row>
                  </View>
                ))}
              </Card>
            </View>
          ))}

          <Button title="Add this plan to my stack" icon="core.add" onPress={addAll} color={theme.colors.accent} />

          {/* Remaining notes */}
          <SectionHeader title="Safety & context" />
          {plan.notes.filter((n) => n.severity !== 'warning').map((n, i) => (
            <NoteCard key={`n${i}`} note={n} />
          ))}
        </>
      )}
    </Screen>
  );
}

function NoteCard({ note }: { note: SafetyNote }) {
  const theme = useTheme();
  const color =
    note.severity === 'warning' ? theme.colors.danger : note.severity === 'caution' ? theme.colors.warning : theme.colors.textFaint;
  const icon = note.severity === 'info' ? 'core.info' : 'health.medical';
  return (
    <Card accent={color}>
      <Row gap={10} style={{ alignItems: 'flex-start' }}>
        <Icon icon={icon} size={18} color={color} />
        <Text variant="caption" color="textMuted" style={{ flex: 1 }}>{note.text}</Text>
      </Row>
    </Card>
  );
}
