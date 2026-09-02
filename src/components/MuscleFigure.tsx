import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from '@/components/ui/Text';
import { Row } from '@/components/ui/misc';
import { MUSCLE_LABELS, SUB_MUSCLE_LABELS } from '@/data/exercises';

/**
 * The anatomy figure — what an exercise actually touches, drawn on a body.
 *
 * Two stylised views (front and back) with ~35 muscle regions. The primary
 * muscle fills solid, the other groups the exercise works fill at half
 * strength, and the pinned sub-muscle (lats, rear delt, gastrocnemius…) is
 * ringed so the finer target reads at a glance. Pure SVG: offline, themed,
 * scales to any width, no photographs.
 */

type RegionId =
  | 'neck_front' | 'neck_back'
  | 'upper_chest' | 'mid_chest' | 'lower_chest'
  | 'front_delt' | 'side_delt' | 'rear_delt'
  | 'biceps' | 'triceps' | 'forearms_front' | 'forearms_back'
  | 'upper_abs' | 'lower_abs' | 'obliques'
  | 'traps' | 'lats' | 'mid_back' | 'lower_back'
  | 'glute_max' | 'glute_med' | 'hamstrings'
  | 'rectus_femoris' | 'vastus' | 'adductors'
  | 'gastrocnemius' | 'soleus';

/** muscle group (primaryMuscle / muscleGroups vocabulary) → regions */
const GROUP_REGIONS: Record<string, RegionId[]> = {
  chest: ['upper_chest', 'mid_chest', 'lower_chest'],
  back: ['lats', 'traps', 'mid_back', 'lower_back'],
  shoulders: ['front_delt', 'side_delt', 'rear_delt'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  forearms: ['forearms_front', 'forearms_back'],
  core: ['upper_abs', 'lower_abs', 'obliques'],
  abs: ['upper_abs', 'lower_abs', 'obliques'],
  quads: ['rectus_femoris', 'vastus'],
  hamstrings: ['hamstrings'],
  glutes: ['glute_max', 'glute_med'],
  calves: ['gastrocnemius', 'soleus'],
  neck: ['neck_front', 'neck_back'],
  arms: ['biceps', 'triceps', 'forearms_front', 'forearms_back'],
  legs: ['rectus_femoris', 'vastus', 'hamstrings', 'glute_max', 'gastrocnemius', 'soleus'],
  upper_body: ['upper_chest', 'mid_chest', 'lower_chest', 'lats', 'traps', 'front_delt', 'side_delt', 'rear_delt', 'biceps', 'triceps'],
  lower_body: ['rectus_femoris', 'vastus', 'hamstrings', 'glute_max', 'glute_med', 'gastrocnemius', 'soleus'],
  full_body: ['upper_chest', 'mid_chest', 'lats', 'traps', 'front_delt', 'rear_delt', 'upper_abs', 'lower_abs', 'lower_back', 'rectus_femoris', 'vastus', 'hamstrings', 'glute_max', 'gastrocnemius'],
  hips: ['glute_max', 'glute_med', 'adductors'],
  hip_flexors: ['rectus_femoris', 'lower_abs'],
  lower_back: ['lower_back'],
  lats: ['lats'],
  traps: ['traps'],
  obliques: ['obliques'],
  adductors: ['adductors'],
};

/** sub-muscle vocabulary (SUB_MUSCLE_LABELS keys) → region */
const SUB_REGION: Record<string, RegionId> = {
  lats: 'lats', traps: 'traps', mid_back: 'mid_back', lower_back: 'lower_back',
  front_delt: 'front_delt', side_delt: 'side_delt', rear_delt: 'rear_delt',
  upper_abs: 'upper_abs', lower_abs: 'lower_abs', obliques: 'obliques',
  upper_chest: 'upper_chest', mid_chest: 'mid_chest', lower_chest: 'lower_chest',
  triceps_long: 'triceps', triceps_lateral: 'triceps',
  biceps_long: 'biceps', biceps_short: 'biceps', brachialis: 'biceps', brachioradialis: 'forearms_front',
  wrist_flexors: 'forearms_front', wrist_extensors: 'forearms_back', grip: 'forearms_front',
  rectus_femoris: 'rectus_femoris', vastus: 'vastus', glute_max: 'glute_max', glute_med: 'glute_med',
  gastrocnemius: 'gastrocnemius', soleus: 'soleus', adductors: 'adductors',
  neck_flexors: 'neck_front', neck_extensors: 'neck_back', neck_lateral: 'neck_back',
};

type Emphasis = 'primary' | 'secondary' | 'none';

interface Props {
  primary?: string | null;
  groups?: string[];
  subMuscle?: string | null;
  /** highlight colour (defaults to the brand primary) */
  color?: string;
  /** the ring colour for the pinned sub-muscle (defaults to the accent) */
  ringColor?: string;
  /** height of the figure block; width follows the container */
  height?: number;
  /** show the legend line under the figures */
  legend?: boolean;
}

export function MuscleFigure({ primary, groups = [], subMuscle, color, ringColor, height = 190, legend = true }: Props) {
  const theme = useTheme();
  const hi = color ?? theme.colors.primary;
  const ring = ringColor ?? theme.colors.accent;
  const base = theme.colors.text;

  const emphasis = new Map<RegionId, Emphasis>();
  for (const g of groups) for (const r of GROUP_REGIONS[g] ?? []) emphasis.set(r, 'secondary');
  if (primary) for (const r of GROUP_REGIONS[primary] ?? []) emphasis.set(r, 'primary');
  const pinned = subMuscle ? SUB_REGION[subMuscle] : undefined;
  if (pinned && !emphasis.has(pinned)) emphasis.set(pinned, 'primary');

  const fillFor = (r: RegionId) => {
    const e = emphasis.get(r) ?? 'none';
    return e === 'primary'
      ? { fill: hi, fillOpacity: 0.92 }
      : e === 'secondary'
        ? { fill: hi, fillOpacity: 0.42 }
        : { fill: base, fillOpacity: 0.09 };
  };
  const ringFor = (r: RegionId) =>
    pinned === r ? { stroke: ring, strokeWidth: 2.2, strokeOpacity: 1 } : { stroke: base, strokeWidth: 0.6, strokeOpacity: 0.18 };
  const region = (r: RegionId) => ({ ...fillFor(r), ...ringFor(r) });

  const touched = [...emphasis.entries()].filter(([, e]) => e !== 'none').length;

  return (
    <View style={{ gap: 6 }}>
      <Row gap={8} style={{ height, alignItems: 'stretch' }}>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Svg width="100%" height="100%" viewBox="0 0 100 250" preserveAspectRatio="xMidYMid meet">
            <Silhouette base={base} />
            {/* front */}
            <Rect x={43} y={35} width={14} height={12} rx={4} {...region('neck_front')} />
            <Ellipse cx={30} cy={57} rx={9} ry={8} {...region('front_delt')} />
            <Ellipse cx={70} cy={57} rx={9} ry={8} {...region('front_delt')} />
            <Ellipse cx={22.5} cy={61} rx={4.5} ry={9} {...region('side_delt')} />
            <Ellipse cx={77.5} cy={61} rx={4.5} ry={9} {...region('side_delt')} />
            <Path d="M37 51 L49 52 L49 60 L38 60 Z" {...region('upper_chest')} />
            <Path d="M63 51 L51 52 L51 60 L62 60 Z" {...region('upper_chest')} />
            <Path d="M38 61 L49 61 L49 70 L39 70 Z" {...region('mid_chest')} />
            <Path d="M62 61 L51 61 L51 70 L61 70 Z" {...region('mid_chest')} />
            <Path d="M39 71 L49 71 L49 76 Q44 80 39 74 Z" {...region('lower_chest')} />
            <Path d="M61 71 L51 71 L51 76 Q56 80 61 74 Z" {...region('lower_chest')} />
            <Ellipse cx={24.5} cy={84} rx={6} ry={16} {...region('biceps')} />
            <Ellipse cx={75.5} cy={84} rx={6} ry={16} {...region('biceps')} />
            <Ellipse cx={18.5} cy={122} rx={5} ry={17} {...region('forearms_front')} />
            <Ellipse cx={81.5} cy={122} rx={5} ry={17} {...region('forearms_front')} />
            <Rect x={43} y={81} width={6.5} height={17} rx={2} {...region('upper_abs')} />
            <Rect x={50.5} y={81} width={6.5} height={17} rx={2} {...region('upper_abs')} />
            <Rect x={43} y={99} width={6.5} height={17} rx={2} {...region('lower_abs')} />
            <Rect x={50.5} y={99} width={6.5} height={17} rx={2} {...region('lower_abs')} />
            <Path d="M34 82 L41 82 L41 116 L32 110 Z" {...region('obliques')} />
            <Path d="M66 82 L59 82 L59 116 L68 110 Z" {...region('obliques')} />
            <Ellipse cx={45.5} cy={131} rx={4} ry={10} {...region('adductors')} />
            <Ellipse cx={54.5} cy={131} rx={4} ry={10} {...region('adductors')} />
            <Ellipse cx={33} cy={153} rx={4.5} ry={25} {...region('vastus')} />
            <Ellipse cx={46.5} cy={155} rx={3.5} ry={21} {...region('vastus')} />
            <Ellipse cx={53.5} cy={155} rx={3.5} ry={21} {...region('vastus')} />
            <Ellipse cx={67} cy={153} rx={4.5} ry={25} {...region('vastus')} />
            <Ellipse cx={40} cy={151} rx={5} ry={27} {...region('rectus_femoris')} />
            <Ellipse cx={60} cy={151} rx={5} ry={27} {...region('rectus_femoris')} />
          </Svg>
          <Text variant="eyebrow" color="textFaint" style={{ fontSize: 9, letterSpacing: 1.6 }}>
            Front
          </Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Svg width="100%" height="100%" viewBox="0 0 100 250" preserveAspectRatio="xMidYMid meet">
            <Silhouette base={base} />
            {/* back */}
            <Rect x={43} y={35} width={14} height={12} rx={4} {...region('neck_back')} />
            <Path d="M50 44 L71 55 L60 66 L50 62 L40 66 L29 55 Z" {...region('traps')} />
            <Ellipse cx={29} cy={58} rx={9} ry={8} {...region('rear_delt')} />
            <Ellipse cx={71} cy={58} rx={9} ry={8} {...region('rear_delt')} />
            <Path d="M44 68 L56 68 L54 86 L46 86 Z" {...region('mid_back')} />
            <Path d="M33 63 L45 68 L46 104 L33 96 L28 78 Z" {...region('lats')} />
            <Path d="M67 63 L55 68 L54 104 L67 96 L72 78 Z" {...region('lats')} />
            <Rect x={44.5} y={88} width={4.5} height={30} rx={2} {...region('lower_back')} />
            <Rect x={51} y={88} width={4.5} height={30} rx={2} {...region('lower_back')} />
            <Ellipse cx={24.5} cy={84} rx={6} ry={16} {...region('triceps')} />
            <Ellipse cx={75.5} cy={84} rx={6} ry={16} {...region('triceps')} />
            <Ellipse cx={18.5} cy={122} rx={5} ry={17} {...region('forearms_back')} />
            <Ellipse cx={81.5} cy={122} rx={5} ry={17} {...region('forearms_back')} />
            <Ellipse cx={33.5} cy={121} rx={5} ry={6.5} {...region('glute_med')} />
            <Ellipse cx={66.5} cy={121} rx={5} ry={6.5} {...region('glute_med')} />
            <Ellipse cx={41} cy={130} rx={9.5} ry={11} {...region('glute_max')} />
            <Ellipse cx={59} cy={130} rx={9.5} ry={11} {...region('glute_max')} />
            <Ellipse cx={40} cy={160} rx={8} ry={23} {...region('hamstrings')} />
            <Ellipse cx={60} cy={160} rx={8} ry={23} {...region('hamstrings')} />
            <Ellipse cx={41} cy={201} rx={6} ry={13} {...region('gastrocnemius')} />
            <Ellipse cx={59} cy={201} rx={6} ry={13} {...region('gastrocnemius')} />
            <Ellipse cx={41} cy={223} rx={4.5} ry={9} {...region('soleus')} />
            <Ellipse cx={59} cy={223} rx={4.5} ry={9} {...region('soleus')} />
          </Svg>
          <Text variant="eyebrow" color="textFaint" style={{ fontSize: 9, letterSpacing: 1.6 }}>
            Back
          </Text>
        </View>
      </Row>
      {legend && (
        <Row gap={12} style={{ flexWrap: 'wrap', alignItems: 'center' }}>
          {primary && MUSCLE_LABELS[primary] ? (
            <LegendDot color={hi} opacity={0.92} label={MUSCLE_LABELS[primary]} />
          ) : null}
          {groups.filter((g) => g !== primary && GROUP_REGIONS[g]).length > 0 ? (
            <LegendDot color={hi} opacity={0.42} label="Also works" />
          ) : null}
          {subMuscle && SUB_MUSCLE_LABELS[subMuscle] ? (
            <LegendDot color="transparent" ring={ring} label={`Target: ${SUB_MUSCLE_LABELS[subMuscle]}`} />
          ) : null}
          {touched === 0 ? (
            <Text variant="caption" color="textFaint">
              Whole-body or non-muscular work — nothing to single out.
            </Text>
          ) : null}
        </Row>
      )}
    </View>
  );
}

/** The body itself, in ink at low opacity — the muscles sit on top. */
function Silhouette({ base }: { base: string }) {
  const limb = { stroke: base, strokeOpacity: 0.09, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <G>
      <Circle cx={50} cy={22} r={12.5} fill={base} fillOpacity={0.09} />
      <Rect x={44} y={33} width={12} height={12} fill={base} fillOpacity={0.09} />
      {/* torso */}
      <Path d="M30 48 L70 48 L75 64 L70 120 L30 120 L25 64 Z" fill={base} fillOpacity={0.09} />
      {/* arms */}
      <Path d="M27 56 L21 100 L17 142" strokeWidth={13} {...limb} />
      <Path d="M73 56 L79 100 L83 142" strokeWidth={13} {...limb} />
      <Circle cx={16.5} cy={148} r={5} fill={base} fillOpacity={0.09} />
      <Circle cx={83.5} cy={148} r={5} fill={base} fillOpacity={0.09} />
      {/* legs */}
      <Path d="M39 120 L38 184 L40 236" strokeWidth={19} {...limb} />
      <Path d="M61 120 L62 184 L60 236" strokeWidth={19} {...limb} />
      <Line x1={33} y1={241} x2={46} y2={241} stroke={base} strokeOpacity={0.14} strokeWidth={6} strokeLinecap="round" />
      <Line x1={54} y1={241} x2={67} y2={241} stroke={base} strokeOpacity={0.14} strokeWidth={6} strokeLinecap="round" />
    </G>
  );
}

function LegendDot({ color, opacity = 1, ring, label }: { color: string; opacity?: number; ring?: string; label: string }) {
  return (
    <Row gap={6} style={{ alignItems: 'center' }}>
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: color,
          opacity: ring ? 1 : opacity,
          borderWidth: ring ? 2 : 0,
          borderColor: ring,
        }}
      />
      <Text variant="caption" color="textMuted">
        {label}
      </Text>
    </Row>
  );
}
