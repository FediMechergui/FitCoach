import React, { useCallback, useState } from 'react';
import { View, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Row, SectionHeader, Divider, Badge } from '@/components/ui/misc';
import { useHormonesStore } from '@/stores/hormonesStore';
import {
  HORMONE_CATALOGUE,
  HORMONE_CATEGORY_LABEL,
  HORMONE_STATUS_LABEL,
  type HormoneCategory,
  type HormoneDef,
} from '@/lib/hormones';
import type { HormoneStatus } from '@/db/schema';

const STATUS_ORDER: HormoneStatus[] = ['low', 'high', 'monitoring'];

export function HormonesScreen() {
  const theme = useTheme();
  const { flags, load, set, remove } = useHormonesStore();
  const [expanded, setExpanded] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const statusColor: Record<HormoneStatus, string> = {
    low: theme.colors.warning,
    high: theme.colors.danger,
    monitoring: theme.colors.info,
  };

  const flagByKey = new Map(flags.map((f) => [f.hormoneKey, f]));

  const byCategory = HORMONE_CATALOGUE.reduce<Record<string, HormoneDef[]>>((acc, h) => {
    (acc[h.category] ??= []).push(h);
    return acc;
  }, {});

  const categoryIcon = (cat: HormoneCategory): string => `hormone.${cat}`;

  return (
    <Screen>
      <Row gap={12} style={{ alignItems: 'center' }}>
        <Icon icon="hormone.gland" size={28} color={theme.colors.accent} />
        <Text variant="h1" style={{ flex: 1 }}>Hormones</Text>
      </Row>
      <Text variant="body" color="textMuted">
        The endocrine signals that shape your training, recovery, appetite and mood — what raises
        or lowers each, and the signs of running low or high. Flag any you're low/high in or
        monitoring so your reports stay relevant.
      </Text>
      <Card accent={theme.colors.warning}>
        <Row gap={10} style={{ alignItems: 'flex-start' }}>
          <Icon icon="core.info" size={18} color={theme.colors.warning} />
          <Text variant="caption" color="textMuted" style={{ flex: 1 }}>
            Educational only — FitCoach can't measure your hormones. This is not a diagnosis. For
            symptoms or before acting on any of this, get lab work and speak to a clinician.
          </Text>
        </Row>
      </Card>

      {flags.length > 0 && (
        <>
          <SectionHeader title={`Your flags (${flags.length})`} />
          {flags.map((f) => {
            const def = HORMONE_CATALOGUE.find((h) => h.key === f.hormoneKey);
            return (
              <Card key={f.id} accent={statusColor[f.status]}>
                <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyStrong">{f.label}</Text>
                    <Text variant="caption" color="textMuted">{HORMONE_STATUS_LABEL[f.status]}</Text>
                  </View>
                  <Badge label={HORMONE_STATUS_LABEL[f.status]} color={statusColor[f.status]} />
                  <Pressable onPress={() => remove(f.hormoneKey)} hitSlop={8} style={{ paddingLeft: 10 }}>
                    <Icon icon="core.close" size={18} color={theme.colors.textFaint} />
                  </Pressable>
                </Row>
                {def && (
                  <Text variant="caption" color="textMuted" style={{ marginTop: 6 }}>
                    Lever: {def.lever}
                  </Text>
                )}
              </Card>
            );
          })}
        </>
      )}

      {(Object.keys(byCategory) as HormoneCategory[]).map((cat) => (
        <View key={cat} style={{ gap: theme.spacing.sm }}>
          <SectionHeader title={HORMONE_CATEGORY_LABEL[cat]} />
          {byCategory[cat].map((h) => {
            const flag = flagByKey.get(h.key);
            const open = expanded === h.key;
            const accent = flag ? statusColor[flag.status] : theme.colors.border;
            return (
              <Card key={h.key} accent={flag ? accent : undefined} style={{ gap: 10 }}>
                <Pressable onPress={() => setExpanded(open ? null : h.key)}>
                  <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <Row gap={10} style={{ alignItems: 'center', flex: 1 }}>
                      <Icon icon={categoryIcon(h.category)} size={20} color={theme.colors.accent} />
                      <Text variant="h3" style={{ flex: 1 }}>{h.label}</Text>
                    </Row>
                    {flag && <Badge label={HORMONE_STATUS_LABEL[flag.status]} color={accent} />}
                    <Icon icon={open ? 'core.back' : 'core.forward'} size={16} color={theme.colors.textFaint} />
                  </Row>
                </Pressable>
                <Text variant="caption" color="textMuted">{h.role}</Text>

                {open && (
                  <View style={{ gap: 10 }}>
                    <Divider />
                    <SignalBlock icon="hormone.up" color={theme.colors.success} title="Raised / supported by" items={h.raisedBy} />
                    <SignalBlock icon="hormone.down" color={theme.colors.warning} title="Lowered / disrupted by" items={h.loweredBy} />
                    <SignalBlock icon="core.info" color={theme.colors.warning} title="Signs it may be low" items={h.lowSigns} />
                    <SignalBlock icon="core.info" color={theme.colors.danger} title="Signs it may be high" items={h.highSigns} />
                    <Card style={{ backgroundColor: theme.colors.surfaceAlt, gap: 4 }}>
                      <Text variant="label" color={theme.colors.accent}>Best lever</Text>
                      <Text variant="caption" color="textMuted">{h.lever}</Text>
                    </Card>

                    {/* Flag controls */}
                    <Text variant="label" color="textMuted">Flag this hormone</Text>
                    <Row gap={6}>
                      {STATUS_ORDER.map((s) => {
                        const on = flag?.status === s;
                        return (
                          <Pressable key={s} onPress={() => set(h.key, s)} style={{ flex: 1 }}>
                            <View
                              style={{
                                paddingVertical: 8,
                                borderRadius: theme.radius.md,
                                alignItems: 'center',
                                backgroundColor: on ? statusColor[s] : theme.colors.surfaceAlt,
                                borderWidth: 1,
                                borderColor: on ? statusColor[s] : theme.colors.border,
                              }}
                            >
                              <Text variant="caption" color={on ? '#fff' : theme.colors.textMuted}>
                                {HORMONE_STATUS_LABEL[s]}
                              </Text>
                            </View>
                          </Pressable>
                        );
                      })}
                    </Row>
                    {flag && (
                      <Pressable onPress={() => remove(h.key)} hitSlop={6} style={{ alignSelf: 'center' }}>
                        <Text variant="caption" color="textFaint">Clear flag</Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </Card>
            );
          })}
        </View>
      ))}

      <Text variant="caption" color="textFaint" center>
        Sleep, training, nutrition and stress management move nearly all of these at once — the
        fundamentals FitCoach already tracks are your biggest hormonal levers.
      </Text>
    </Screen>
  );
}

function SignalBlock({ icon, color, title, items }: { icon: string; color: string; title: string; items: string[] }) {
  const theme = useTheme();
  if (items.length === 0) return null;
  return (
    <View style={{ gap: 4 }}>
      <Row gap={6} style={{ alignItems: 'center' }}>
        <Icon icon={icon} size={14} color={color} />
        <Text variant="label" color={color}>{title}</Text>
      </Row>
      {items.map((it, i) => (
        <Text key={i} variant="caption" color="textMuted" style={{ paddingLeft: 20 }}>• {it}</Text>
      ))}
    </View>
  );
}
