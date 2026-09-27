import React from 'react';
import { View } from 'react-native';
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
import { Text } from '@/components/ui/Text';
import { DIVISION_LABEL, type Division, type RankTier } from '@/lib/ranks';

/**
 * The rank crest: a khatim — the eight-pointed star of two turned squares that
 * runs through Tunisian tilework from Kairouan to Sidi Bou Said — in the
 * tier's colour, with the division numeral at its centre.
 *
 * Remodeled with minted 3D relief, chiseled radial facets, concentric
 * guilloché accents, and a jewel-dome center medallion.
 * Drawn with declarative react-native-svg, sharp at any size and 100% offline.
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
  const gradId = `crest-body-${tier.key}`;
  const radialId = `crest-radial-${tier.key}`;
  const rimId = `crest-rim-${tier.key}`;

  // Facet lines from center to each star point for a chiseled 3D minted look
  const facetTips = React.useMemo(() => {
    return Array.from({ length: 16 }, (_, i) => {
      const isTip = i % 2 === 0;
      const r = isTip ? 45 : 35.5;
      const a = (i * 22.5 - 90) * (Math.PI / 180);
      return {
        x2: (c + r * Math.cos(a)).toFixed(2),
        y2: (c + r * Math.sin(a)).toFixed(2),
        isTip,
      };
    });
  }, [c]);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', opacity: muted ? 0.5 : 1 }}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          {/* Main tier body gradient (rich light to deep shade) */}
          <LinearGradient id={gradId} x1="0.1" y1="0" x2="0.9" y2="1">
            <Stop offset="0%" stopColor={tier.color} stopOpacity={1} />
            <Stop offset="55%" stopColor={tier.color} stopOpacity={0.9} />
            <Stop offset="100%" stopColor={tier.shade} stopOpacity={1} />
          </LinearGradient>

          {/* Center medallion radial light dome */}
          <RadialGradient id={radialId} cx="50%" cy="38%" r="55%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.4} />
            <Stop offset="30%" stopColor={tier.color} stopOpacity={0.8} />
            <Stop offset="100%" stopColor={tier.shade} stopOpacity={0.95} />
          </RadialGradient>

          {/* Polished metallic rim gradient */}
          <LinearGradient id={rimId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.8} />
            <Stop offset="50%" stopColor={tier.color} stopOpacity={0.4} />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0.2} />
          </LinearGradient>
        </Defs>

        <G>
          {/* 1. Deep 3D drop-shadow silhouette */}
          <Path d={khatim(c, 49, 39)} fill="#000000" opacity={0.45} />

          {/* 2. Outer stepped base layer in dark tier shade */}
          <Path d={khatim(c, 47.5, 37.5)} fill={tier.shade} opacity={0.85} />

          {/* 3. Primary Khatim star body in radiant tier gradient */}
          <Path d={khatim(c, 45, 35.5)} fill={`url(#${gradId})`} />

          {/* 4. Chiseled relief facet lines from hub (r=19) to star vertices */}
          {facetTips.map((f, i) => (
            <Line
              key={i}
              x1={c}
              y1={c}
              x2={f.x2}
              y2={f.y2}
              stroke={f.isTip ? '#FFFFFF' : '#000000'}
              strokeOpacity={f.isTip ? 0.38 : 0.28}
              strokeWidth={0.9}
            />
          ))}

          {/* 5. Concentric inner sacred star cut with light */}
          <Path
            d={khatim(c, 31, 24.5)}
            fill="none"
            stroke={`url(#${rimId})`}
            strokeWidth={1.3}
          />

          {/* 6. Delicate guilloché pinstripe ring */}
          <Circle
            cx={c}
            cy={c}
            r={23}
            fill="none"
            stroke="#FFFFFF"
            strokeOpacity={0.25}
            strokeWidth={0.8}
            strokeDasharray="1.5, 2.5"
          />

          {/* 7. Center medallion disc: convex jewel dome with radial gradient */}
          <Circle cx={c} cy={c} r={19.5} fill={tier.shade} opacity={0.7} />
          <Circle cx={c} cy={c} r={19} fill={`url(#${radialId})`} />

          {/* 8. Inner metallic bevel ring */}
          <Circle
            cx={c}
            cy={c}
            r={19}
            fill="none"
            stroke={`url(#${rimId})`}
            strokeWidth={1.4}
          />

          {/* 9. Cardinal micro-gem accents at the cardinal directions */}
          <Circle cx={c} cy={c - 27} r={1.2} fill="#FFFFFF" opacity={0.7} />
          <Circle cx={c} cy={c + 27} r={1.2} fill="#FFFFFF" opacity={0.7} />
          <Circle cx={c - 27} cy={c} r={1.2} fill="#FFFFFF" opacity={0.7} />
          <Circle cx={c + 27} cy={c} r={1.2} fill="#FFFFFF" opacity={0.7} />
        </G>
      </Svg>
      {showDivision && division ? (
        <View
          style={{
            position: 'absolute',
            alignItems: 'center',
            justifyContent: 'center',
            // Subtle shadow for clean numeral legibility
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.6,
            shadowRadius: 2,
          }}
        >
          <Text
            variant="numeralM"
            style={{
              color: '#FFFFFF',
              fontSize: Math.max(11, size * 0.23),
              lineHeight: Math.max(14, size * 0.28),
              fontWeight: '800',
              textShadowColor: 'rgba(0, 0, 0, 0.65)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 3,
            }}
          >
            {DIVISION_LABEL[division]}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

