import React, { useMemo } from 'react';
import { View } from 'react-native';
import Body, { type ExtendedBodyPart, type Slug } from 'react-native-body-highlighter';
import { useTheme } from '@/theme/ThemeProvider';
import { withAlpha } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Row } from '@/components/ui/misc';
import { MUSCLE_LABELS, SUB_MUSCLE_LABELS } from '@/data/exercises';
import { useUserStore } from '@/stores/userStore';

/**
 * The anatomy figure — a real muscle-by-muscle model, not a sketch.
 *
 * 3.1.0 shipped a hand-drawn silhouette; this replaces it with the MIT-licensed
 * react-native-body-highlighter model: male and female bodies, front and back,
 * every muscle its own vector path. The exercise vocabulary (muscle groups and
 * the pinned sub-muscle) is mapped onto the model's parts — the primary muscle
 * fills solid, the other groups it works fill soft, and the pinned target is
 * ringed. The sex on the profile picks the body. Fully offline, themed, sharp.
 */

type Side = 'front' | 'back' | 'both';
interface Part {
  slug: Slug;
  side: Side;
}

/** muscle group (and the loose aliases exercises use) → model parts */
const GROUP_TO_PARTS: Record<string, Part[]> = {
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
  core: [
    { slug: 'abs', side: 'front' },
    { slug: 'obliques', side: 'front' },
  ],
  quads: [{ slug: 'quadriceps', side: 'front' }],
  hamstrings: [{ slug: 'hamstring', side: 'back' }],
  glutes: [{ slug: 'gluteal', side: 'back' }],
  calves: [{ slug: 'calves', side: 'both' }],
  neck: [{ slug: 'neck', side: 'both' }],
  // aliases that appear in muscleGroups arrays
  legs: [
    { slug: 'quadriceps', side: 'front' },
    { slug: 'hamstring', side: 'back' },
    { slug: 'gluteal', side: 'back' },
    { slug: 'calves', side: 'both' },
  ],
  arms: [
    { slug: 'biceps', side: 'front' },
    { slug: 'triceps', side: 'both' },
    { slug: 'forearm', side: 'both' },
  ],
  abs: [{ slug: 'abs', side: 'front' }],
  lats: [{ slug: 'upper-back', side: 'back' }],
  traps: [{ slug: 'trapezius', side: 'back' }],
  upper_back: [{ slug: 'upper-back', side: 'back' }],
  lower_back: [{ slug: 'lower-back', side: 'back' }],
  hips: [{ slug: 'gluteal', side: 'back' }, { slug: 'adductors', side: 'both' }],
  adductors: [{ slug: 'adductors', side: 'both' }],
  obliques: [{ slug: 'obliques', side: 'front' }],
  full_body: [
    { slug: 'chest', side: 'front' },
    { slug: 'upper-back', side: 'back' },
    { slug: 'deltoids', side: 'both' },
    { slug: 'quadriceps', side: 'front' },
    { slug: 'hamstring', side: 'back' },
    { slug: 'gluteal', side: 'back' },
    { slug: 'abs', side: 'front' },
  ],
};

/** every sub-muscle in the vocabulary → the model part it lives on */
const SUB_TO_PART: Record<string, Part> = {
  lats: { slug: 'upper-back', side: 'back' },
  traps: { slug: 'trapezius', side: 'back' },
  mid_back: { slug: 'upper-back', side: 'back' },
  lower_back: { slug: 'lower-back', side: 'back' },
  front_delt: { slug: 'deltoids', side: 'front' },
  side_delt: { slug: 'deltoids', side: 'both' },
  rear_delt: { slug: 'deltoids', side: 'back' },
  upper_abs: { slug: 'abs', side: 'front' },
  lower_abs: { slug: 'abs', side: 'front' },
  obliques: { slug: 'obliques', side: 'front' },
  upper_chest: { slug: 'chest', side: 'front' },
  mid_chest: { slug: 'chest', side: 'front' },
  lower_chest: { slug: 'chest', side: 'front' },
  triceps_long: { slug: 'triceps', side: 'both' },
  triceps_lateral: { slug: 'triceps', side: 'both' },
  biceps_long: { slug: 'biceps', side: 'front' },
  biceps_short: { slug: 'biceps', side: 'front' },
  brachialis: { slug: 'biceps', side: 'front' },
  brachioradialis: { slug: 'forearm', side: 'both' },
  wrist_flexors: { slug: 'forearm', side: 'front' },
  wrist_extensors: { slug: 'forearm', side: 'back' },
  grip: { slug: 'forearm', side: 'both' },
  rectus_femoris: { slug: 'quadriceps', side: 'front' },
  vastus: { slug: 'quadriceps', side: 'front' },
  glute_max: { slug: 'gluteal', side: 'back' },
  glute_med: { slug: 'gluteal', side: 'back' },
  gastrocnemius: { slug: 'calves', side: 'back' },
  soleus: { slug: 'calves', side: 'back' },
  adductors: { slug: 'adductors', side: 'both' },
  neck_flexors: { slug: 'neck', side: 'front' },
  neck_extensors: { slug: 'neck', side: 'back' },
  neck_lateral: { slug: 'neck', side: 'both' },
};

const on = (part: Part, side: 'front' | 'back') => part.side === 'both' || part.side === side;

interface Props {
  primary: string | null | undefined;
  groups?: string[];
  subMuscle?: string | null;
  /** highlight colour (defaults to the brand primary) */
  color?: string;
  /** ring colour for the pinned sub-muscle (defaults to the caution token) */
  ringColor?: string;
  /** figure height in dp — both views share it */
  height?: number;
  legend?: boolean;
}

export function MuscleFigure({ primary, groups = [], subMuscle, color, ringColor, height = 190, legend = true }: Props) {
  const theme = useTheme();
  const sex = useUserStore((s) => s.user?.sex ?? 'male');
  const fill = color ?? theme.colors.primary;
  const soft = withAlpha(fill, 0.55);
  const ring = ringColor ?? theme.colors.warning;
  const pinned = subMuscle ? SUB_TO_PART[subMuscle] : undefined;

  // Build the part list once per exercise: primary solid (1), the rest soft (2),
  // the pinned target solid and ringed on the side it lives on.
  const { front, back, bodied } = useMemo(() => {
    const strong = new Map<string, Part>();
    const light = new Map<string, Part>();
    for (const p of GROUP_TO_PARTS[primary ?? ''] ?? []) strong.set(`${p.slug}:${p.side}`, p);
    for (const g of groups) {
      if (g === primary) continue;
      for (const p of GROUP_TO_PARTS[g] ?? []) if (!strong.has(`${p.slug}:${p.side}`)) light.set(`${p.slug}:${p.side}`, p);
    }
    const build = (side: 'front' | 'back'): ExtendedBodyPart[] => {
      const out = new Map<Slug, ExtendedBodyPart>();
      for (const p of light.values()) if (on(p, side)) out.set(p.slug, { slug: p.slug, intensity: 2 });
      for (const p of strong.values()) if (on(p, side)) out.set(p.slug, { slug: p.slug, intensity: 1 });
      if (pinned && on(pinned, side)) {
        out.set(pinned.slug, { slug: pinned.slug, intensity: 1, styles: { stroke: ring, strokeWidth: 6 } });
      }
      return Array.from(out.values());
    };
    const front = build('front');
    const back = build('back');
    return { front, back, bodied: front.length + back.length > 0 };
  }, [primary, groups, pinned, ring]);

  if (!bodied) {
    return legend ? (
      <Text variant="caption" color="textFaint">
        Whole-body or non-muscular work — no single region to light up.
      </Text>
    ) : null;
  }

  const scale = height / 400;
  const gender: 'male' | 'female' = sex === 'female' ? 'female' : 'male';
  const bodyProps = {
    gender,
    scale,
    colors: [fill, soft] as const,
    border: theme.colors.border,
    defaultFill: theme.colors.surface3,
    defaultStroke: theme.colors.surface,
    defaultStrokeWidth: 1.5,
  };

  return (
    <View style={{ gap: 8 }}>
      <Row gap={4} style={{ justifyContent: 'center', alignItems: 'flex-start' }}>
        <View style={{ alignItems: 'center', gap: 2 }}>
          <Body {...bodyProps} side="front" data={front} />
          <Text variant="caption" color="textFaint" style={{ fontSize: 10 }}>
            Front
          </Text>
        </View>
        <View style={{ alignItems: 'center', gap: 2 }}>
          <Body {...bodyProps} side="back" data={back} />
          <Text variant="caption" color="textFaint" style={{ fontSize: 10 }}>
            Back
          </Text>
        </View>
      </Row>
      {legend && (
        <View style={{ gap: 2 }}>
          {primary && MUSCLE_LABELS[primary] ? (
            <Row gap={6} style={{ alignItems: 'center' }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: fill }} />
              <Text variant="caption" color="textMuted">
                {MUSCLE_LABELS[primary]}
              </Text>
            </Row>
          ) : null}
          {groups.filter((g) => g !== primary && MUSCLE_LABELS[g]).length > 0 ? (
            <Row gap={6} style={{ alignItems: 'center' }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: soft }} />
              <Text variant="caption" color="textMuted">
                also {groups.filter((g) => g !== primary && MUSCLE_LABELS[g]).map((g) => MUSCLE_LABELS[g]).join(', ')}
              </Text>
            </Row>
          ) : null}
          {subMuscle && SUB_MUSCLE_LABELS[subMuscle] ? (
            <Row gap={6} style={{ alignItems: 'center' }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, borderWidth: 2, borderColor: ring }} />
              <Text variant="caption" color="textMuted">
                target: {SUB_MUSCLE_LABELS[subMuscle]}
              </Text>
            </Row>
          ) : null}
        </View>
      )}
    </View>
  );
}
