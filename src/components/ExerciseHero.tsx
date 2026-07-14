import React from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect, Circle } from 'react-native-svg';
import { Icon } from '@/components/ui/Icon';
import { SESSION_TYPE_COLORS } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Coherent, self-contained exercise imagery. Rather than shipping (copyrighted)
 * photos, each exercise gets a consistent generated hero: a session-type–tinted
 * gradient with the exercise's semantic glyph, so it's instantly recognizable.
 * Drop-in real photos/GIFs can replace this later without touching call sites.
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
  const dims = size === 'banner' ? { w: 0, h: 150, r: 16, icon: 56 } : { w: 52, h: 52, r: 12, icon: 26 };
  const gid = `g-${sessionType}-${iconKey.replace(/\W/g, '')}`;

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
      }}
    >
      <Svg width="100%" height="100%" style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity={0.9} />
            <Stop offset="1" stopColor={color} stopOpacity={0.35} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${gid})`} />
        {/* subtle geometric accents for a coherent "card" look */}
        <Circle cx="12%" cy="120%" r={dims.h * 0.7} fill="#ffffff" opacity={0.06} />
        <Circle cx="95%" cy="-10%" r={dims.h * 0.5} fill="#ffffff" opacity={0.08} />
      </Svg>
      <Icon icon={iconKey} size={dims.icon} color="#ffffff" />
    </View>
  );
}
