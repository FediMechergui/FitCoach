import React, { useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Row, SectionHeader } from '@/components/ui/misc';
import { useConditionsStore } from '@/stores/conditionsStore';
import {
  CONDITION_CATALOGUE,
  CONDITION_CATEGORY_LABEL,
  type ConditionCategory,
} from '@/lib/conditions';

export function ConditionsScreen() {
  const theme = useTheme();
  const { conditions, load, add, remove } = useConditionsStore();

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const activeKeys = new Set(conditions.map((c) => c.conditionKey));

  const byCategory = CONDITION_CATALOGUE.reduce<Record<string, typeof CONDITION_CATALOGUE>>((acc, c) => {
    (acc[c.category] ??= []).push(c);
    return acc;
  }, {});

  return (
    <Screen>
      <Row gap={12} style={{ alignItems: 'center' }}>
        <Icon icon="health.medical" size={28} color={theme.colors.danger} />
        <Text variant="h1" style={{ flex: 1 }}>Health conditions</Text>
      </Row>
      <Text variant="body" color="textMuted">
        Tell FitCoach about any chronic conditions so your coach tips and exported reports
        include the right considerations. This is not medical advice — always follow your
        clinician.
      </Text>

      {activeKeys.size > 0 && (
        <>
          <SectionHeader title={`Your conditions (${activeKeys.size})`} />
          {conditions.map((c) => {
            const def = CONDITION_CATALOGUE.find((d) => d.key === c.conditionKey);
            return (
              <Card key={c.id} accent={theme.colors.danger}>
                <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyStrong">{c.label}</Text>
                    {def ? (
                      <Text variant="caption" color="textMuted" style={{ marginTop: 2 }}>
                        {def.consideration}
                      </Text>
                    ) : null}
                  </View>
                  <Pressable onPress={() => remove(c.conditionKey)} hitSlop={8}>
                    <Icon icon="core.close" size={18} color={theme.colors.textFaint} />
                  </Pressable>
                </Row>
              </Card>
            );
          })}
        </>
      )}

      {(Object.keys(byCategory) as ConditionCategory[]).map((cat) => (
        <View key={cat} style={{ gap: theme.spacing.sm }}>
          <SectionHeader title={CONDITION_CATEGORY_LABEL[cat]} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {byCategory[cat].map((c) => {
              const on = activeKeys.has(c.key);
              return (
                <Pressable key={c.key} onPress={() => (on ? remove(c.key) : add(c.key))}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingVertical: 9,
                      paddingHorizontal: 12,
                      borderRadius: theme.radius.pill,
                      backgroundColor: on ? theme.colors.danger : theme.colors.surfaceAlt,
                      borderWidth: 1,
                      borderColor: on ? theme.colors.danger : theme.colors.border,
                    }}
                  >
                    <Icon icon={on ? 'core.check' : 'core.add'} size={14} color={on ? '#fff' : theme.colors.textMuted} />
                    <Text variant="caption" color={on ? '#fff' : theme.colors.textMuted}>{c.label}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </Screen>
  );
}
