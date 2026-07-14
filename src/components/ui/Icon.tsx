import React from 'react';
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
  Feather,
} from '@expo/vector-icons';
import { resolveIcon, type IconDef, type IconLib } from '@/constants/icon-map';
import { useTheme } from '@/theme/ThemeProvider';

interface IconProps {
  /** Semantic key like 'strength.barbell', OR pass `def` directly. */
  icon?: string;
  def?: IconDef;
  size?: number;
  color?: string;
}

// Loosely typed: each @expo/vector-icons set has its own glyph-name union and a
// color type of `string | OpaqueColorValue`. We resolve names dynamically, so
// we intentionally erase those unions here.
const LIBS: Record<IconLib, React.ComponentType<any>> = {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
  Feather,
};

export function Icon({ icon, def, size = 22, color }: IconProps) {
  const theme = useTheme();
  const resolved = def ?? resolveIcon(icon ?? 'core.custom');
  const Comp = LIBS[resolved.lib];
  return <Comp name={resolved.name} size={size} color={color ?? theme.colors.text} />;
}
