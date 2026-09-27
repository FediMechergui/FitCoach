import React from 'react';
import { View } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Rect,
  Circle,
  Path,
  G,
  Line,
} from 'react-native-svg';
import { Icon } from '@/components/ui/Icon';
import { SESSION_TYPE_COLORS } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Coherent, artistic self-contained exercise imagery.
 *
 * Each exercise gets a consistent, dynamically tinted athletic hero:
 * session-type–tinted dual-gradient mesh, energetic motion slashes,
 * a central ambient glyph glow, and a subtle glassmorphic perimeter highlight.
 */
export function ExerciseHero({
  iconKey,
  sessionType,
  size = 'thumb',
}: {
  iconKey: string;
  sessionType: string;
  size?: 'thumb' | 'banner';
}) {
  const theme = useTheme();
  const color = SESSION_TYPE_COLORS[sessionType] ?? theme.colors.primary;
  const dims = size === 'banner' ? { w: 0, h: 154, r: 16, icon: 56 } : { w: 52, h: 52, r: 14, icon: 26 };
  const uid = React.useId().replace(/:/g, '');
  const gid = `g-${sessionType}-${iconKey.replace(/\W/g, '')}-${uid}`;
  const glowId = `glow-${gid}`;

  const isBanner = size === 'banner';
  return (
    <View
      style={{
        width: isBanner ? '100%' : dims.w,
        height: dims.h,
        borderRadius: dims.r,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.alpha.tint14(color),
      }}
    >
      <Svg width="100%" height="100%" style={{ position: 'absolute' }}>
        <Defs>
          {/* Main athletic gradient: vivid tint descending into deep tone */}
          <LinearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={color} stopOpacity={0.95} />
            <Stop offset="45%" stopColor={color} stopOpacity={0.7} />
            <Stop offset="100%" stopColor="#0B1319" stopOpacity={0.98} />
          </LinearGradient>

          {/* Central ambient light pool behind the glyph */}
          <RadialGradient id={glowId} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.3} />
            <Stop offset="50%" stopColor={color} stopOpacity={0.2} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>

        {/* Base filled mesh */}
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${gid})`} />

        <G>
          {/* Central ambient glow aura */}
          <Circle cx="50%" cy="50%" r={dims.h * 0.45} fill={`url(#${glowId})`} />

          {/* Dynamic 45-degree athletic speed lines */}
          <Line
            x1="-10%"
            y1="30%"
            x2="50%"
            y2="130%"
            stroke="#FFFFFF"
            strokeOpacity={0.07}
            strokeWidth={isBanner ? 2.5 : 1.5}
          />
          <Line
            x1="10%"
            y1="-20%"
            x2="85%"
            y2="120%"
            stroke="#FFFFFF"
            strokeOpacity={0.09}
            strokeWidth={isBanner ? 4 : 2}
          />
          <Line
            x1="35%"
            y1="-30%"
            x2="110%"
            y2="110%"
            stroke="#FFFFFF"
            strokeOpacity={0.06}
            strokeWidth={isBanner ? 3 : 1.5}
          />

          {/* Subtle curved light arc in top corner */}
          <Path
            d={isBanner ? "M 0 0 Q 140 10 220 80" : "M 0 0 Q 30 5 45 40"}
            stroke="#FFFFFF"
            strokeOpacity={0.12}
            strokeWidth={1}
            fill="none"
          />

          {/* Ambient accent spheres */}
          <Circle cx="88%" cy="15%" r={dims.h * 0.35} fill="#FFFFFF" opacity={0.06} />
          <Circle cx="8%" cy="92%" r={dims.h * 0.4} fill="#FFFFFF" opacity={0.04} />

          {/* Inner perimeter glass highlight */}
          <Rect
            x="0.5"
            y="0.5"
            width="99%"
            height="99%"
            rx={dims.r - 0.5}
            fill="none"
            stroke="#FFFFFF"
            strokeOpacity={0.18}
            strokeWidth={1}
          />
        </G>
      </Svg>
      <View
        style={{
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.4,
          shadowRadius: 3,
        }}
      >
        <Icon icon={iconKey} size={dims.icon} color="#ffffff" />
      </View>
    </View>
  );
}

