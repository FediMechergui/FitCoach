import React, { useMemo } from 'react';
import { View } from 'react-native';
import Body, { type ExtendedBodyPart, type Slug } from 'react-native-body-highlighter';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from '@/components/ui/Text';
import { Row } from '@/components/ui/misc';
import { useUserStore } from '@/stores/userStore';
import { placeScore, RANK_TIERS } from '@/lib/ranks';

/**
 * The body, shaded by rank: every muscle group wears the colour of the tier
 * its best ranked lift has reached. A grey muscle is not a weak one — it is
 * one no ranked lift has spoken for yet.
 */

const PARTS: Record<string, Array<{ slug: Slug; side: 'front' | 'back' | 'both' }>> = {
  chest: [{ slug: 'chest', side: 'front' }],
  back: [
    { slug: 'upper-back', side: 'back' },
    { slug: 'trapezius', side: 'back' },
    { slug: 'lower-back', side: 'back' },
  ],
  shoulders: [{ slug: 'deltoids', side: 'both' }],
  biceps: [{ slug: 'biceps', side: 'front' }],
  triceps: [{ slug: 'triceps', side: 'both' }],
  forearms: [{ slug: 'forearm', side: 'both' }],
  quads: [{ slug: 'quadriceps', side: 'front' }],
  hamstrings: [{ slug: 'hamstring', side: 'back' }],
  glutes: [{ slug: 'gluteal', side: 'back' }],
};

export function RankBodygraph({ muscles, height = 210 }: { muscles: Record<string, number>; height?: number }) {
  const theme = useTheme();
  const sex = useUserStore((s) => s.user?.sex ?? 'male');
  const gender: 'male' | 'female' = sex === 'female' ? 'female' : 'male';

  const { front, back, tiersShown } = useMemo(() => {
    const build = (side: 'front' | 'back'): ExtendedBodyPart[] => {
      const out: ExtendedBodyPart[] = [];
      for (const [muscle, score] of Object.entries(muscles)) {
        const color = placeScore(score).tier.color;
        for (const p of PARTS[muscle] ?? []) {
          if (p.side === 'both' || p.side === side) out.push({ slug: p.slug, intensity: 1, color });
        }
      }
      return out;
    };
    const shown = new Set(Object.values(muscles).map((s) => placeScore(s).tierIndex));
    return { front: build('front'), back: build('back'), tiersShown: [...shown].sort((a, b) => a - b) };
  }, [muscles]);

  const bodyProps = {
    gender,
    scale: height / 400,
    border: theme.colors.border,
    defaultFill: theme.colors.surface3,
    defaultStroke: theme.colors.surface,
    defaultStrokeWidth: 1.5,
  };

  return (
    <View style={{ gap: 10 }}>
      <Row gap={4} style={{ justifyContent: 'center', alignItems: 'flex-start' }}>
        <Body {...bodyProps} side="front" data={front} />
        <Body {...bodyProps} side="back" data={back} />
      </Row>
      <Row gap={10} style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
        {tiersShown.map((i) => (
          <Row key={i} gap={5} style={{ alignItems: 'center' }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: RANK_TIERS[i].color }} />
            <Text variant="caption" color="textMuted">
              {RANK_TIERS[i].name}
            </Text>
          </Row>
        ))}
        <Row gap={5} style={{ alignItems: 'center' }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: theme.colors.surface3,
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          />
          <Text variant="caption" color="textFaint">
            not ranked yet
          </Text>
        </Row>
      </Row>
    </View>
  );
}
