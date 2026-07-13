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

const LIBS: Record<IconLib, React.ComponentType<{ name: any; size?: number; color?: string }>> = {
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
