import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { nextWheelStopDeg, wheelRotationDeg } from '@/lib/challengeWheel';
import { DIFFICULTY_COLOR, type ChallengeDef } from '@/data/challenges';

/**
 * The spin wheel.
 *
 * Drawn with declarative react-native-svg paths (the same approach the charts
 * use — it's only `SvgXml` on the badge art that misbehaves natively) and spun
 * with the built-in Animated API, so nothing new had to be added to the build
 * and the whole thing ships over the air.
 *
 * The landing position is decided before the animation starts: the screen
 * commits the spin and tells the wheel which wedge won, and the spin is a long
 * ease onto the CENTRE of that wedge. The wheel reveals the day's challenge;
 * it does not choose it. Its angle only ever grows, so a second spin of the
 * day keeps turning the same way from where it rests instead of snapping back.
 */

export interface WheelAction {
  label: string;
  /** the allowance or the price, under the label */
  sub?: string;
  disabled?: boolean;
  /** why it is disabled, said out loud */
  hint?: string;
}

interface Props {
  segments: ChallengeDef[];
  winningIndex: number;
  size?: number;
  /** true once the day has a challenge — the wheel rests on it when not turning */
  settled: boolean;
  /** the spin button; null when the wheel may not turn (a completed challenge is banked) */
  action: WheelAction | null;
  /** commit the spin and return the wedge to land on — or null, and nothing moves */
  onSpin: () => number | null;
  onSpinEnd: () => void;
}

/** SVG path for one wedge of a circle, starting at 12 o'clock and going clockwise. */
function wedgePath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const toXY = (deg: number) => {
    // -90 so 0° is straight up, matching where the pointer sits.
    const rad = ((deg - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  };
  const [x1, y1] = toXY(startDeg);
  const [x2, y2] = toXY(endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
}

export function ChallengeWheel({ segments, winningIndex, size = 260, settled, action, onSpin, onSpinEnd }: Props) {
  const theme = useTheme();
  const spin = useRef(new Animated.Value(0)).current;
  /** where the wheel is, in degrees — a native-driven Animated.Value has no sync read */
  const angle = useRef(0);
  const spinning = useRef(false);

  const n = segments.length;
  const per = n > 0 ? 360 / n : 360;
  const r = size / 2;

  // A settled day shows the result immediately, no animation — the wheel is a
  // record of what you were given, not a thing to re-watch. Never while it is
  // turning: the screen re-reads when the spin ends, not before.
  useEffect(() => {
    if (!settled || spinning.current) return;
    const rest = wheelRotationDeg(winningIndex, n, 0);
    spin.setValue(rest);
    angle.current = rest;
  }, [settled, winningIndex, n, spin]);

  const startSpin = () => {
    if (spinning.current || n === 0 || !action || action.disabled) return;
    const target = onSpin();
    if (target == null || target < 0 || target >= n) return;
    spinning.current = true;
    const to = nextWheelStopDeg(angle.current, target, n);
    Animated.timing(spin, {
      toValue: to,
      duration: theme.motion.wheel,
      // Decelerate hard at the end so it looks like friction, not a stop.
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      angle.current = to;
      spinning.current = false;
      onSpinEnd();
    });
  };

  const rotate = spin.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] });
  // The glyphs ride the wheel but never tilt with it: a settled wheel rests at
  // a multiple of 45°, which used to turn every '+' into an '×'.
  const counterRotate = spin.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '-360deg'] });

  if (n === 0) return null;

  return (
    <View style={{ alignItems: 'center', gap: 12 }}>
      <View style={{ width: size, height: size + 16, alignItems: 'center' }}>
        {/* Pointer, fixed at the top */}
        <View style={{ position: 'absolute', top: 0, zIndex: 2 }}>
          <Icon icon="core.chevronDown" size={26} color={theme.colors.text} />
        </View>

        <Animated.View style={{ marginTop: 14, transform: [{ rotate }] }}>
          <Svg width={size} height={size}>
            <G>
              {segments.map((c, i) => (
                <Path
                  key={c.key}
                  d={wedgePath(r, r, r - 2, i * per, (i + 1) * per)}
                  fill={DIFFICULTY_COLOR[c.difficulty]}
                  opacity={i % 2 === 0 ? 0.85 : 0.6}
                  stroke={theme.colors.bg}
                  strokeWidth={2}
                />
              ))}
              <Circle cx={r} cy={r} r={r * 0.3} fill={theme.colors.surface} stroke={theme.colors.border} strokeWidth={2} />
            </G>
          </Svg>

          {/* Icons sit above the SVG, travel with the wedge, and stay upright. */}
          {segments.map((c, i) => {
            const mid = ((i + 0.5) * per - 90) * (Math.PI / 180);
            const rad = r * 0.66;
            return (
              <Animated.View
                key={c.key}
                style={{
                  position: 'absolute',
                  left: r + rad * Math.cos(mid) - 12,
                  top: r + rad * Math.sin(mid) - 12,
                  width: 24,
                  height: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: [{ rotate: counterRotate }],
                }}
              >
                <Icon icon={c.icon} size={18} color="#fff" />
              </Animated.View>
            );
          })}
        </Animated.View>
      </View>

      {action && (
        <View style={{ alignItems: 'center', gap: 6 }}>
          <Button
            title={action.label}
            icon="core.target"
            onPress={startSpin}
            disabled={action.disabled}
            hint={action.disabled ? action.hint : undefined}
            fullWidth={false}
            style={{ paddingHorizontal: 28 }}
          />
          {action.sub ? (
            <Text variant="caption" color="textMuted">
              {action.sub}
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
}
