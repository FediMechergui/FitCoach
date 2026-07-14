import React from 'react';
import { View } from 'react-native';
import Svg, {
  Circle,
  Line,
  Rect,
  Path,
  G,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import type { MovementPattern } from '@/db/schema';
import { SESSION_TYPE_COLORS } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Beginner-facing exercise illustration: a simple figure showing the movement
 * pattern, so someone who has never trained can see roughly what the exercise
 * looks like. Drawn as SVG (no copyrighted photos, works fully offline, scales
 * to any size). Equipment (bar / dumbbells) is drawn in where relevant.
 */

interface Props {
  pattern: MovementPattern | null;
  sessionType?: string;
  size?: number;
  /** show a soft tinted background card behind the figure */
  framed?: boolean;
}

export function ExerciseIllustration({ pattern, sessionType = 'strength', size = 150, framed = true }: Props) {
  const theme = useTheme();
  const accent = SESSION_TYPE_COLORS[sessionType] ?? theme.colors.primary;
  const body = theme.colors.text;
  const gear = accent;

  return (
    <View
      style={{
        width: framed ? '100%' : size,
        height: size,
        borderRadius: 16,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: framed ? theme.colors.surfaceAlt : 'transparent',
      }}
    >
      <Svg width="100%" height="100%" viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="illo-bg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={accent} stopOpacity={0.12} />
            <Stop offset="1" stopColor={accent} stopOpacity={0.02} />
          </LinearGradient>
        </Defs>
        {framed && <Rect x="0" y="0" width="100" height="100" fill="url(#illo-bg)" />}
        <Figure pattern={pattern} body={body} gear={gear} />
      </Svg>
    </View>
  );
}

const SW = 2.6; // stroke width for limbs
const HEAD_R = 5;

function Figure({
  pattern,
  body,
  gear,
}: {
  pattern: MovementPattern | null;
  body: string;
  gear: string;
}) {
  const L = (x1: number, y1: number, x2: number, y2: number, color = body, w = SW) => (
    <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={w} strokeLinecap="round" />
  );
  const Head = (cx: number, cy: number) => <Circle cx={cx} cy={cy} r={HEAD_R} fill={body} />;
  /** a barbell: bar line + two plates */
  const Bar = (x1: number, y1: number, x2: number, y2: number) => (
    <G>
      <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={gear} strokeWidth={2.4} strokeLinecap="round" />
      <Circle cx={x1} cy={y1} r={3.6} fill={gear} />
      <Circle cx={x2} cy={y2} r={3.6} fill={gear} />
    </G>
  );
  const Bell = (cx: number, cy: number) => <Rect x={cx - 3} y={cy - 2.4} width={6} height={4.8} rx={1.4} fill={gear} />;
  const Ground = () => <Line x1="8" y1="88" x2="92" y2="88" stroke={gear} strokeWidth={1.6} strokeOpacity={0.5} />;

  switch (pattern) {
    // Lying press (bench press, push-up family)
    case 'horizontal_push':
      return (
        <G>
          {/* bench */}
          <Rect x="22" y="62" width="56" height="5" rx="2" fill={gear} opacity={0.45} />
          <Line x1="30" y1="67" x2="30" y2="80" stroke={gear} strokeWidth={2} opacity={0.45} />
          <Line x1="70" y1="67" x2="70" y2="80" stroke={gear} strokeWidth={2} opacity={0.45} />
          <Ground />
          {/* torso lying */}
          {Head(30, 55)}
          {L(36, 58, 64, 58)}
          {/* legs off the bench */}
          {L(64, 58, 74, 70)}
          {L(74, 70, 76, 82)}
          {/* arms pressing up */}
          {L(42, 57, 44, 42)}
          {L(58, 57, 56, 42)}
          {Bar(34, 42, 66, 42)}
        </G>
      );

    // Standing overhead press
    case 'vertical_push':
      return (
        <G>
          <Ground />
          {Head(50, 34)}
          {L(50, 40, 50, 62)}
          {/* arms up */}
          {L(50, 44, 40, 30)}
          {L(50, 44, 60, 30)}
          {Bar(32, 26, 68, 26)}
          {/* legs */}
          {L(50, 62, 42, 88)}
          {L(50, 62, 58, 88)}
        </G>
      );

    // Bent-over row
    case 'horizontal_pull':
      return (
        <G>
          <Ground />
          {Head(28, 40)}
          {/* torso hinged forward */}
          {L(33, 43, 62, 52)}
          {/* legs */}
          {L(62, 52, 62, 88)}
          {L(62, 52, 72, 88)}
          {/* arm pulling up to torso */}
          {L(42, 46, 44, 62)}
          {Bar(28, 64, 60, 64)}
        </G>
      );

    // Pull-up / pulldown
    case 'vertical_pull':
      return (
        <G>
          {/* bar */}
          <Line x1="20" y1="16" x2="80" y2="16" stroke={gear} strokeWidth={3} strokeLinecap="round" />
          {/* arms up to bar */}
          {L(50, 40, 38, 18)}
          {L(50, 40, 62, 18)}
          {Head(50, 34)}
          {L(50, 40, 50, 64)}
          {/* legs bent back */}
          {L(50, 64, 42, 80)}
          {L(42, 80, 48, 88)}
          {L(50, 64, 58, 80)}
          {L(58, 80, 64, 88)}
        </G>
      );

    // Squat (bar on back)
    case 'squat':
      return (
        <G>
          <Ground />
          {Head(46, 30)}
          {/* torso leaning slightly */}
          {L(48, 36, 54, 56)}
          {/* bar on back */}
          {Bar(34, 40, 66, 40)}
          {L(48, 40, 40, 40)}
          {L(48, 40, 60, 40)}
          {/* thigh back, knee forward = squat position */}
          {L(54, 56, 40, 64)}
          {L(40, 64, 44, 88)}
          {L(54, 56, 62, 66)}
          {L(62, 66, 60, 88)}
        </G>
      );

    // Hip hinge / deadlift / RDL
    case 'hinge':
      return (
        <G>
          <Ground />
          {Head(30, 34)}
          {/* torso hinged, hips pushed back */}
          {L(35, 38, 60, 50)}
          {/* hips back */}
          {L(60, 50, 68, 58)}
          {/* legs nearly straight */}
          {L(68, 58, 62, 88)}
          {/* arms hanging straight down holding bar */}
          {L(44, 44, 44, 66)}
          {Bar(28, 68, 60, 68)}
        </G>
      );

    case 'lunge':
      return (
        <G>
          <Ground />
          {Head(50, 28)}
          {L(50, 34, 50, 56)}
          {/* front leg 90° */}
          {L(50, 56, 34, 64)}
          {L(34, 64, 34, 88)}
          {/* back leg, knee down */}
          {L(50, 56, 66, 70)}
          {L(66, 70, 74, 88)}
          {/* dumbbells at sides */}
          {L(46, 40, 44, 56)}
          {L(54, 40, 56, 56)}
          {Bell(44, 58)}
          {Bell(56, 58)}
        </G>
      );

    case 'curl':
      return (
        <G>
          <Ground />
          {Head(50, 28)}
          {L(50, 34, 50, 62)}
          {/* upper arm down, forearm curled up */}
          {L(46, 40, 44, 52)}
          {L(44, 52, 52, 42)}
          {L(54, 40, 56, 52)}
          {L(56, 52, 48, 42)}
          {Bar(38, 40, 62, 40)}
          {L(50, 62, 44, 88)}
          {L(50, 62, 56, 88)}
        </G>
      );

    case 'triceps_extension':
      return (
        <G>
          <Ground />
          {Head(50, 32)}
          {L(50, 38, 50, 64)}
          {/* upper arms up, forearms bent behind head */}
          {L(46, 42, 44, 26)}
          {L(54, 42, 56, 26)}
          {L(44, 26, 56, 20)}
          {L(56, 26, 44, 20)}
          {Bell(50, 18)}
          {L(50, 64, 44, 88)}
          {L(50, 64, 56, 88)}
        </G>
      );

    case 'lateral_raise':
      return (
        <G>
          <Ground />
          {Head(50, 30)}
          {L(50, 36, 50, 62)}
          {/* arms straight out to sides at shoulder height */}
          {L(50, 42, 28, 40)}
          {L(50, 42, 72, 40)}
          {Bell(24, 40)}
          {Bell(76, 40)}
          {L(50, 62, 44, 88)}
          {L(50, 62, 56, 88)}
        </G>
      );

    case 'calf_raise':
      return (
        <G>
          {/* step */}
          <Rect x="30" y="82" width="40" height="6" rx="1.5" fill={gear} opacity={0.45} />
          {Head(50, 26)}
          {L(50, 32, 50, 60)}
          {L(46, 36, 42, 58)}
          {L(54, 36, 58, 58)}
          {Bell(42, 60)}
          {Bell(58, 60)}
          {/* legs, up on toes */}
          {L(50, 60, 46, 82)}
          {L(50, 60, 54, 82)}
          {/* heels raised indicator */}
          <Path d="M44 82 l-4 -6" stroke={gear} strokeWidth={2} strokeLinecap="round" />
          <Path d="M56 82 l4 -6" stroke={gear} strokeWidth={2} strokeLinecap="round" />
        </G>
      );

    // Plank / core
    case 'core':
      return (
        <G>
          <Ground />
          {Head(24, 56)}
          {/* straight body line */}
          {L(30, 58, 76, 72)}
          {/* forearm down */}
          {L(32, 58, 30, 76)}
          {L(30, 76, 42, 78)}
          {/* legs to toes */}
          {L(76, 72, 84, 84)}
        </G>
      );

    case 'carry':
      return (
        <G>
          <Ground />
          {Head(50, 26)}
          {L(50, 32, 50, 62)}
          {L(46, 36, 42, 60)}
          {L(54, 36, 58, 60)}
          {Bell(42, 64)}
          {Bell(58, 64)}
          {/* walking legs */}
          {L(50, 62, 42, 88)}
          {L(50, 62, 60, 84)}
        </G>
      );

    case 'rotation':
      return (
        <G>
          <Ground />
          {Head(50, 28)}
          {L(50, 34, 50, 62)}
          {/* arms extended to one side */}
          {L(50, 42, 74, 34)}
          {L(50, 42, 70, 44)}
          {Bell(78, 32)}
          {/* rotation arc */}
          <Path d="M30 46 a24 24 0 0 1 18 -16" stroke={gear} strokeWidth={1.8} fill="none" strokeDasharray="3 3" />
          {L(50, 62, 44, 88)}
          {L(50, 62, 58, 88)}
        </G>
      );

    case 'cardio':
      return (
        <G>
          <Ground />
          {Head(54, 24)}
          {/* leaning running torso */}
          {L(52, 30, 46, 54)}
          {/* arms pumping */}
          {L(50, 36, 62, 40)}
          {L(50, 36, 36, 34)}
          {/* running legs */}
          {L(46, 54, 60, 66)}
          {L(60, 66, 66, 82)}
          {L(46, 54, 34, 70)}
          {L(34, 70, 40, 84)}
          {/* motion lines */}
          <Path d="M18 40 h10 M14 50 h12 M18 60 h8" stroke={gear} strokeWidth={1.6} strokeLinecap="round" opacity={0.6} />
        </G>
      );

    case 'mobility':
      return (
        <G>
          <Ground />
          {/* seated forward fold / yoga */}
          {Head(38, 44)}
          {L(43, 47, 60, 60)}
          {/* legs straight out */}
          {L(60, 60, 84, 62)}
          {/* arms reaching to feet */}
          {L(44, 50, 78, 58)}
          {/* breath arc */}
          <Path d="M28 30 a10 8 0 0 1 16 0" stroke={gear} strokeWidth={1.6} fill="none" strokeDasharray="3 3" />
        </G>
      );

    default:
      return (
        <G>
          <Ground />
          {Head(50, 30)}
          {L(50, 36, 50, 62)}
          {L(50, 44, 38, 52)}
          {L(50, 44, 62, 52)}
          {L(50, 62, 42, 88)}
          {L(50, 62, 58, 88)}
        </G>
      );
  }
}
