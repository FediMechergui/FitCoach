import React, { useCallback, useState } from 'react';
import { View, Pressable } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Row, SectionHeader, Divider, Badge } from '@/components/ui/misc';
import { useSupplementsStore } from '@/stores/supplementsStore';
import { supplementStreak, unitsTakenToday } from '@/repositories/supplementsRepo';
import type { SupplementStack } from '@/db/schema';
import {
  EVIDENCE_COLOR,
  EVIDENCE_LABEL,
  SUPPLEMENTS,
  findSupplement,
  type SupplementDef,
} from '@/data/supplements';

export function SupplementsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { stack, today, load, log, removeLog, addToStack, removeFromStack, setUnitsPerServing } =
    useSupplementsStore();
  const [expanded, setExpanded] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const stackKeys = new Set(stack.map((s) => s.key));
  const loggedKeys = new Set(today.map((t) => t.key));
  const micronutrients = SUPPLEMENTS.filter((s) => s.category === 'micronutrient');
  const ergogenics = SUPPLEMENTS.filter((s) => s.category === 'ergogenic');

  return (
    <Screen>
      <Row gap={12} style={{ alignItems: 'center' }}>
        <Icon icon="supp.pill" size={28} color={theme.colors.accent} />
        <Text variant="h1">Supplements</Text>
      </Row>
      <Text variant="body" color="textMuted">
        Track pills and powders. Vitamin/mineral supplements count toward your Micronutrients
        totals; performance supplements are tracked for dose and consistency with honest
        evidence. None of this changes your calories or macros.
      </Text>

      {/* Goal-based plan builder */}
      <Pressable onPress={() => navigation.navigate('SupplementPlan')}>
        <Card accent={theme.colors.accent}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Row gap={10} style={{ alignItems: 'center', flex: 1 }}>
              <Icon icon="stats.coachTip" size={20} color={theme.colors.accent} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">Build a plan for my goals</Text>
                <Text variant="caption" color="textMuted">
                  Performance, sleep, cutting down smoking… get a timed plan with safe doses
                </Text>
              </View>
            </Row>
            <Icon icon="core.forward" size={18} color={theme.colors.textFaint} />
          </Row>
        </Card>
      </Pressable>

      {/* Your stack — one-tap logging */}
      {stack.length > 0 && (
        <>
          <SectionHeader title="My stack" />
          {stack.map((s) => {
            const def = findSupplement(s.key);
            if (!def) return null;
            const done = loggedKeys.has(s.key);
            const streak = supplementStreak(s.key);
            return (
              <StackCard
                key={s.key}
                row={s}
                def={def}
                done={done}
                streak={streak}
                takenUnits={unitsTakenToday(s.key)}
                onTake={(units) => log(s.key, s.dose ?? undefined, units)}
                onSetUnits={(n) => setUnitsPerServing(s.key, n)}
              />
            );
          })}
        </>
      )}

      {/* Today's log */}
      {today.length > 0 && (
        <Card style={{ gap: 6 }}>
          <Text variant="label" color="textMuted">Taken today</Text>
          {today.map((t, i) => (
            <View key={t.id}>
              {i > 0 ? <Divider /> : null}
              <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Text variant="caption" color="textMuted">
                  {t.label}
                  {t.unitsTaken ? ` · ${t.unitsTaken} pill${t.unitsTaken === 1 ? '' : 's'}` : t.dose ? ` · ${t.dose}` : ''}
                </Text>
                <Pressable onPress={() => removeLog(t.id)} hitSlop={8}>
                  <Icon icon="core.close" size={14} color={theme.colors.textFaint} />
                </Pressable>
              </Row>
            </View>
          ))}
        </Card>
      )}

      {/* Catalogue */}
      <SectionHeader title="Vitamins & minerals" />
      {micronutrients.map((def) => (
        <SupplementCard
          key={def.key}
          def={def}
          inStack={stackKeys.has(def.key)}
          expanded={expanded === def.key}
          onToggle={() => setExpanded(expanded === def.key ? null : def.key)}
          onLog={() => log(def.key)}
          onStack={() => (stackKeys.has(def.key) ? removeFromStack(def.key) : addToStack(def.key))}
        />
      ))}

      <SectionHeader title="Performance & wellness" />
      {ergogenics.map((def) => (
        <SupplementCard
          key={def.key}
          def={def}
          inStack={stackKeys.has(def.key)}
          expanded={expanded === def.key}
          onToggle={() => setExpanded(expanded === def.key ? null : def.key)}
          onLog={() => log(def.key)}
          onStack={() => (stackKeys.has(def.key) ? removeFromStack(def.key) : addToStack(def.key))}
        />
      ))}

      <Text variant="caption" color="textFaint" center>
        Evidence ratings reflect the research, not marketing. "Limited/mixed" doesn't mean
        useless — it means be realistic. Check with a clinician if you take medication.
      </Text>
    </Screen>
  );
}

function SupplementCard({
  def,
  inStack,
  expanded,
  onToggle,
  onLog,
  onStack,
}: {
  def: SupplementDef;
  inStack: boolean;
  expanded: boolean;
  onToggle: () => void;
  onLog: () => void;
  onStack: () => void;
}) {
  const theme = useTheme();
  return (
    <Card style={{ gap: 8 }}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Row gap={10} style={{ alignItems: 'center', flex: 1 }}>
          <Icon icon={def.icon} size={22} color={def.category === 'micronutrient' ? theme.colors.primary : theme.colors.accent} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">{def.label}</Text>
            <Text variant="caption" color="textMuted">{def.defaultDose}{def.timing ? ` · ${def.timing}` : ''}</Text>
          </View>
        </Row>
        {def.evidenceLevel && (
          <Badge label={EVIDENCE_LABEL[def.evidenceLevel]} color={EVIDENCE_COLOR[def.evidenceLevel]} />
        )}
      </Row>

      {def.evidence && (
        <Pressable onPress={onToggle}>
          <Text variant="caption" color={expanded ? 'textMuted' : 'primary'}>
            {expanded ? def.evidence : 'What does the evidence say?'}
          </Text>
        </Pressable>
      )}

      <Row>
        <Button title="Log now" size="sm" icon="core.add" onPress={onLog} style={{ flex: 2 }} fullWidth={false} />
        <Button
          title={inStack ? 'In stack ✓' : 'Add to stack'}
          size="sm"
          variant="secondary"
          onPress={onStack}
          style={{ flex: 1 }}
          fullWidth={false}
        />
      </Row>
    </Card>
  );
}

/**
 * One supplement in the stack, with its pill count.
 *
 * Two numbers matter and they are different: how many pills make YOUR portion
 * (brands differ — spiruline is 500 mg tablets from one maker and 1 g capsules
 * from another), and how many you actually swallowed today. "Take" logs a full
 * portion; the +1 logs a single pill, which is the honest record when you took
 * two of your usual six.
 */
function StackCard({
  row,
  def,
  done,
  streak,
  takenUnits,
  onTake,
  onSetUnits,
}: {
  row: SupplementStack;
  def: SupplementDef;
  done: boolean;
  streak: number;
  takenUnits: number;
  onTake: (units?: number) => void;
  onSetUnits: (n: number | null) => void;
}) {
  const theme = useTheme();
  const perServing = row.unitsPerServing ?? def.unitsPerServing ?? null;
  const unit = def.unitLabel ?? 'pill';
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(perServing ? String(perServing) : '');

  const save = () => {
    const n = parseInt(draft, 10);
    onSetUnits(Number.isFinite(n) && n > 0 ? n : null);
    setEditing(false);
  };

  return (
    <Card accent={done ? theme.colors.success : theme.colors.accent} style={{ gap: 8 }}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Row gap={10} style={{ alignItems: 'center', flex: 1 }}>
          <Icon
            icon={def.icon}
            size={22}
            color={def.category === 'micronutrient' ? theme.colors.primary : theme.colors.accent}
          />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">{def.label}</Text>
            <Text variant="caption" color="textMuted">
              {row.dose ?? def.defaultDose}
              {streak > 0 ? ` · ${streak}-day streak` : ''}
            </Text>
          </View>
        </Row>
        {done ? (
          <Badge label="Logged ✓" color={theme.colors.success} />
        ) : (
          <Button title="Take" size="sm" onPress={() => onTake()} fullWidth={false} />
        )}
      </Row>

      <Divider />

      {editing ? (
        <Row gap={8} style={{ alignItems: 'flex-end' }}>
          <View style={{ flex: 1 }}>
            <Input
              label={`${unit[0].toUpperCase()}${unit.slice(1)}s per portion`}
              value={draft}
              onChangeText={setDraft}
              keyboardType="numeric"
              placeholder="e.g. 6"
            />
          </View>
          <Button title="Save" size="sm" onPress={save} fullWidth={false} />
        </Row>
      ) : (
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Pressable
            onPress={() => {
              setDraft(perServing ? String(perServing) : '');
              setEditing(true);
            }}
            hitSlop={6}
            style={{ flex: 1 }}
          >
            <Text variant="caption" color="primary">
              {perServing
                ? `${perServing} ${unit}${perServing === 1 ? '' : 's'} per portion — tap to change`
                : `Set how many ${unit}s are in one portion`}
            </Text>
          </Pressable>
          {/* One pill at a time, for when you don't take the whole portion. */}
          <Button title={`+1 ${unit}`} size="sm" variant="secondary" onPress={() => onTake(1)} fullWidth={false} />
        </Row>
      )}

      {takenUnits > 0 && (
        <Text variant="caption" color="textFaint">
          {takenUnits} {unit}
          {takenUnits === 1 ? '' : 's'} today
          {perServing ? ` · ${(takenUnits / perServing).toFixed(takenUnits % perServing === 0 ? 0 : 1)} of a portion` : ''}
        </Text>
      )}
    </Card>
  );
}
