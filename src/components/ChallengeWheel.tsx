import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Path,
  Circle,
  G,
  Line,
} from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { nextWheelStopDeg, wheelRotationDeg } from '@/lib/challengeWheel';
import { DIFFICULTY_COLOR, type ChallengeDef } from '@/data/challenges';

/**
 * The spin wheel.
 *
 * Drawn with declarative react-native-svg paths and spun with Animated API.
 * Remodeled with an artistic sculpted jewel arrow pointer, engraved
 * metallic perimeter ring with studs, and a minted concentric center hub.
 */

/** Sculpted jewel arrow pointer at 12 o'clock */
function WheelPointerSvg({ color }: { color: string }) {
  return (
    <Svg width={32} height={34} viewBox="0 0 32 34">
      <Defs>
        <LinearGradient id="ptr-edge-l" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.9} />
          <Stop offset="100%" stopColor="#D4AF37" stopOpacity={0.8} />
        </LinearGradient>
        <LinearGradient id="ptr-edge-r" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor="#997A15" stopOpacity={0.9} />
          <Stop offset="100%" stopColor="#554005" stopOpacity={0.95} />
        </LinearGradient>
        <RadialGradient id="ptr-gem" cx="45%" cy="40%" r="55%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.9} />
          <Stop offset="35%" stopColor={color} stopOpacity={0.95} />
          <Stop offset="100%" stopColor="#0B3026" stopOpacity={1} />
        </RadialGradient>
      </Defs>

      <G>
        {/* Drop shadow */}
        <Path d="M 16 32 L 6 8 L 26 8 Z" fill="#000000" opacity={0.35} />

        {/* Chiseled Arrow Left Flange (highlighted) */}
        <Path d="M 16 30 L 7 7 L 16 9 Z" fill="url(#ptr-edge-l)" />

        {/* Chiseled Arrow Right Flange (shaded) */}
        <Path d="M 16 30 L 16 9 L 25 7 Z" fill="url(#ptr-edge-r)" />

        {/* Center needle rib */}
        <Line x1="16" y1="7" x2="16" y2="29" stroke="#FFFFFF" strokeOpacity={0.6} strokeWidth={1} />

        {/* Top Mount Bezel */}
        <Circle cx="16" cy="7" r="6" fill="#1A1C1E" stroke="#D4AF37" strokeWidth={1.5} />

        {/* Embedded Jewel Gem */}
        <Circle cx="16" cy="7" r="4.2" fill="url(#ptr-gem)" />
        <Circle cx="15" cy="5.8" r="1.2" fill="#FFFFFF" opacity={0.85} />
      </G>
    </Svg>
  );
}

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
      <View style={{ width: size, height: size + 20, alignItems: 'center' }}>
        {/* Artistic Jewel Pointer, fixed at 12 o'clock */}
        <View style={{ position: 'absolute', top: -4, zIndex: 10 }}>
          <WheelPointerSvg color={theme.colors.primary} />
        </View>

        <Animated.View style={{ marginTop: 14, transform: [{ rotate }] }}>
          <Svg width={size} height={size}>
            <Defs>
              <RadialGradient id="hub-grad" cx="50%" cy="40%" r="50%">
                <Stop offset="0%" stopColor={theme.colors.surface3} />
                <Stop offset="70%" stopColor={theme.colors.surface} />
                <Stop offset="100%" stopColor={theme.colors.bg} />
              </RadialGradient>
              <LinearGradient id="rim-bevel" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.4} />
                <Stop offset="50%" stopColor="#888888" stopOpacity={0.2} />
                <Stop offset="100%" stopColor="#000000" stopOpacity={0.5} />
              </LinearGradient>
            </Defs>

            <G>
              {/* Outer chassis base */}
              <Circle cx={r} cy={r} r={r - 1} fill={theme.colors.surfaceAlt} />

              {/* Wedges */}
              {segments.map((c, i) => (
                <Path
                  key={c.key}
                  d={wedgePath(r, r, r - 3, i * per, (i + 1) * per)}
                  fill={DIFFICULTY_COLOR[c.difficulty]}
                  opacity={i % 2 === 0 ? 0.88 : 0.68}
                  stroke={theme.colors.bg}
                  strokeWidth={2}
                />
              ))}

              {/* Outer decorative rim with rivets */}
              <Circle
                cx={r}
                cy={r}
                r={r - 3}
                fill="none"
                stroke="url(#rim-bevel)"
                strokeWidth={3}
              />
              <Circle
                cx={r}
                cy={r}
                r={r - 5}
                fill="none"
                stroke="#FFFFFF"
                strokeOpacity={0.2}
                strokeWidth={1}
                strokeDasharray="2, 6"
              />

              {/* Sculpted Center Hub */}
              <Circle
                cx={r}
                cy={r}
                r={r * 0.3}
                fill="url(#hub-grad)"
                stroke={theme.colors.border}
                strokeWidth={2.5}
              />
              <Circle
                cx={r}
                cy={r}
                r={r * 0.23}
                fill="none"
                stroke={theme.colors.primary}
                strokeOpacity={0.4}
                strokeWidth={1.2}
                strokeDasharray="3, 3"
              />
              <Circle
                cx={r}
                cy={r}
                r={r * 0.12}
                fill={theme.colors.primary}
                opacity={0.8}
              />
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

