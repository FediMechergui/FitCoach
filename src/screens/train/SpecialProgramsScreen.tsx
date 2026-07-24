import React from 'react';
import { View, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Chip } from '@/components/ui/Chip';
import { Row, SectionHeader, Badge } from '@/components/ui/misc';
import type { RootStackParamList } from '@/navigation/types';
import { LEVEL_LABEL } from '@/data/programs';
import {
  SPECIAL_PROGRAMS,
  SPECIAL_CATEGORY_META,
  specialWeeklyMinutes,
  type SpecialCategory,
} from '@/data/specialPrograms';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const LEVEL_COLOR: Record<string, string> = {
  beginner: '#3FBF7F',
  intermediate: '#E8A33D',
  advanced: '#E5533D',
};

const CATEGORY_ORDER: SpecialCategory[] = ['military', 'historical', 'lifestyle'];

export function SpecialProgramsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();

  return (
    <Screen>
      <Row gap={12} style={{ alignItems: 'center' }}>
        <Icon icon="mindbody.special" size={28} color={theme.colors.accent} />
        <View style={{ flex: 1 }}>
          <Text variant="h1">Special Programmes</Text>
          <Text variant="caption" color="textMuted">
            Train like a soldier, a monk, a legionary — each with its own week and its own diet.
          </Text>
        </View>
      </Row>

      <Card accent={theme.colors.textFaint} style={{ gap: 4 }}>
        <Row gap={8} style={{ alignItems: 'flex-start' }}>
          <Icon icon="core.info" size={16} color={theme.colors.textFaint} />
          <Text variant="caption" color="textMuted" style={{ flex: 1 }}>
            Every programme is inspired by and adapted from its source for a normal person with
            limited kit — never the dangerous parts. Each says what's real and what's adapted.
          </Text>
        </Row>
      </Card>

      {CATEGORY_ORDER.map((cat) => {
        const meta = SPECIAL_CATEGORY_META[cat];
        const programs = SPECIAL_PROGRAMS.filter((p) => p.category === cat);
        return (
          <View key={cat} style={{ gap: theme.spacing.sm }}>
            <SectionHeader title={meta.label} />
            <Text variant="caption" color="textFaint" style={{ marginTop: -6 }}>
              {meta.blurb}
            </Text>
            {programs.map((p) => (
              <Pressable
                key={p.key}
                onPress={() => navigation.navigate('SpecialProgramDetail', { programKey: p.key })}
              >
                <Card accent={p.accent} style={{ gap: 8 }}>
                  <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <Row gap={12} style={{ alignItems: 'center', flex: 1 }}>
                      <View
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 14,
                          backgroundColor: p.accent + '22',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon icon={p.icon} size={24} color={p.accent} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text variant="h3" numberOfLines={1}>{p.name}</Text>
                        <Text variant="caption" color="textMuted" numberOfLines={2}>{p.tagline}</Text>
                      </View>
                    </Row>
                    <Icon icon="core.forward" size={18} color={theme.colors.textFaint} />
                  </Row>
                  <Row gap={6} style={{ flexWrap: 'wrap' }}>
                    <Badge label={LEVEL_LABEL[p.level]} color={LEVEL_COLOR[p.level]} />
                    <Chip label={`${p.daysPerWeek}×/week`} color={p.accent} small />
                    <Chip label={`~${Math.round(specialWeeklyMinutes(p) / 60)} h/week`} color={p.accent} small />
                    <Chip label="+ diet" color={theme.colors.calories} small />
                  </Row>
                </Card>
              </Pressable>
            ))}
          </View>
        );
      })}

      <Text variant="caption" color="textFaint" center>
        {SPECIAL_PROGRAMS.length} programmes · pick one to read its story, its week and how they ate.
      </Text>
    </Screen>
  );
}
