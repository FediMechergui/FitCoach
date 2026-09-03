import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Chip } from '@/components/ui/Chip';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Row, SectionHeader, Badge } from '@/components/ui/misc';
import { PageHero } from '@/components/ui/PageHero';
import type { RootStackParamList } from '@/navigation/types';
import { LEVEL_LABEL } from '@/data/programs';
import {
  SPECIAL_PROGRAMS,
  SPECIAL_CATEGORY_META,
  SPECIAL_CATEGORY_ORDER,
  specialWeeklyMinutes,
  type SpecialCategory,
  type SpecialProgram,
} from '@/data/specialPrograms';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const LEVEL_COLOR: Record<string, string> = {
  beginner: '#3FBF7F',
  intermediate: '#E8A33D',
  advanced: '#E5533D',
};

/** the category names, short enough to ride a filter rail */
const SHORT_LABEL: Record<SpecialCategory, string> = {
  military: 'Military',
  historical: 'Warriors',
  superhero: 'Legends',
  lifestyle: 'Everyday',
  counters: 'Counters',
  athlete: 'Elite sport',
};

/**
 * Special programmes — browse by world, not by scrolling.
 *
 * v2 listed every programme under six headings on one long page. 3.0 puts a
 * filter rail at the top (all, or one world at a time), gives each programme
 * a card that says at a glance what it costs — level, days, hours, a diet —
 * and keeps the honesty line as a footer instead of a card in the way.
 */
export function SpecialProgramsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const [cat, setCat] = useState<SpecialCategory | 'all'>('all');

  const cats: SpecialCategory[] = cat === 'all' ? [...SPECIAL_CATEGORY_ORDER] : [cat];

  return (
    <Screen>
      <PageHero
        icon="mindbody.special"
        color={theme.colors.accent}
        eyebrow="Browse"
        title="Special programmes"
        subtitle="Train like a soldier, a monk, a legionary — each with its own week and its own diet."
      />

      <SegmentedControl
        scrollable
        options={[
          { value: 'all', label: `All · ${SPECIAL_PROGRAMS.length}` },
          ...SPECIAL_CATEGORY_ORDER.map((c) => ({
            value: c,
            label: SHORT_LABEL[c],
            icon: SPECIAL_CATEGORY_META[c].icon,
          })),
        ]}
        value={cat}
        onChange={setCat}
        accent={theme.colors.accent}
      />

      {cats.map((c) => {
        const meta = SPECIAL_CATEGORY_META[c];
        const programs = SPECIAL_PROGRAMS.filter((p) => p.category === c);
        return (
          <View key={c} style={{ gap: theme.spacing.sm }}>
            <SectionHeader title={meta.label} />
            <Text variant="caption" color="textFaint" style={{ marginTop: -6 }}>
              {meta.blurb}
            </Text>
            {programs.map((p) => (
              <ProgramCard key={p.key} program={p} onPress={() => navigation.navigate('SpecialProgramDetail', { programKey: p.key })} />
            ))}
          </View>
        );
      })}

      <Text variant="caption" color="textFaint" center>
        Every programme is inspired by and adapted from its source for a normal person with limited
        kit — never the dangerous parts. Each says what is real and what is adapted.
      </Text>
    </Screen>
  );
}

function ProgramCard({ program: p, onPress }: { program: SpecialProgram; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Card accent={p.accent} style={{ gap: 10 }} onPress={onPress}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Row gap={12} style={{ alignItems: 'center', flex: 1 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: theme.radius.md,
              backgroundColor: theme.alpha.tint14(p.accent),
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon icon={p.icon} size={24} color={p.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="h3" numberOfLines={1}>
              {p.name}
            </Text>
            <Text variant="caption" color="textMuted" numberOfLines={2}>
              {p.tagline}
            </Text>
          </View>
        </Row>
        <Icon icon="core.forward" size={18} color={theme.colors.textFaint} />
      </Row>
      <Row gap={6} style={{ flexWrap: 'wrap' }}>
        <Badge label={LEVEL_LABEL[p.level]} color={LEVEL_COLOR[p.level]} />
        <Chip label={`${p.daysPerWeek}×/week`} color={p.accent} small />
        <Chip label={`~${Math.round(specialWeeklyMinutes(p) / 60)} h/week`} color={p.accent} small />
        <Chip label={`${p.blockWeeks} weeks`} color={p.accent} small />
        <Chip label="+ diet" color={theme.colors.calories} small />
      </Row>
    </Card>
  );
}
