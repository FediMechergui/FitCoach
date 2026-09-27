import React from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Path, Circle, G } from 'react-native-svg';
import { Text } from '@/components/ui/Text';
import { DIVISION_LABEL, type Division, type RankTier } from '@/lib/ranks';

/**
 * The rank crest: a khatim — the eight-pointed star of two turned squares that
 * runs through Tunisian tilework from Kairouan to Sidi Bou Said — in the
 * tier's colour, with the division numeral at its centre.
 *
 * Drawn with declarative react-native-svg (the path the wheel and the charts
 * use), so it is sharp at any size and ships over the air.
 */

/** Two squares, one turned 45 degrees, as a single 16-point star path around (c, c). */
function khatim(c: number, outer: number, inner: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 16; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i * 22.5 - 90) * (Math.PI / 180);
    pts.push(`${(c + r * Math.cos(a)).toFixed(2)} ${(c + r * Math.sin(a)).toFixed(2)}`);
  }
  return `M ${pts.join(' L ')} Z`;
}

interface Props {
  tier: RankTier;
  division?: Division;
  size?: number;
  /** dim the crest — a rank read from an old peak, or not placed yet */
  muted?: boolean;
  /** the division numeral in the centre */
  showDivision?: boolean;
}

export function RankCrest({ tier, division, size = 72, muted, showDivision = true }: Props) {
  const c = 50;
  const id = `crest-${tier.key}`;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', opacity: muted ? 0.5 : 1 }}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={tier.color} />
            <Stop offset="1" stopColor={tier.shade} />
          </LinearGradient>
        </Defs>
        <G>
          {/* the star, a darker twin behind it for depth */}
          <Path d={khatim(c, 48, 38)} fill={tier.shade} opacity={0.55} />
          <Path d={khatim(c, 45, 35.5)} fill={`url(#${id})`} />
          {/* the inner star, cut in light */}
          <Path d={khatim(c, 31, 24.5)} fill="none" stroke="#FFFFFF" strokeOpacity={0.55} strokeWidth={1.4} />
          <Circle cx={c} cy={c} r={19} fill={tier.shade} opacity={0.5} />
          <Circle cx={c} cy={c} r={19} fill="none" stroke="#FFFFFF" strokeOpacity={0.35} strokeWidth={1} />
        </G>
      </Svg>
      {showDivision && division ? (
        <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
          <Text
            variant="numeralM"
            style={{ color: '#FFFFFF', fontSize: Math.max(11, size * 0.22), lineHeight: Math.max(14, size * 0.28) }}
          >
            {DIVISION_LABEL[division]}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
