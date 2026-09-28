import React from 'react';
import { View } from 'react-native';
import { Svg, RadialGradient, Defs, Stop, Circle } from 'react-native-svg';
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
  /** Applies an artistic aesthetic treatment to the icon. */
  artistic?: 'minted' | 'glow' | 'glass';
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

export function Icon({ icon, def, size = 22, color, artistic }: IconProps) {
  const theme = useTheme();
  const resolved = def ?? resolveIcon(icon ?? 'core.custom');
  const Comp = LIBS[resolved.lib];
  const finalColor = color ?? theme.colors.text;

  if (artistic === 'glow') {
    const pad = size * 0.75;
    const totalSize = size + pad * 2;
    return (
      // The box is the size of the ICON. The glow is drawn around it and spills
      // past the box, so dressing an icon never moves what sits beside it.
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', overflow: 'visible' }}>
        <View pointerEvents="none" style={{ position: 'absolute', left: -pad, top: -pad, width: totalSize, height: totalSize }}>
          <Svg width={totalSize} height={totalSize} viewBox={`0 0 ${totalSize} ${totalSize}`}>
            <Defs>
              <RadialGradient id="icon_glow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={finalColor} stopOpacity={0.35} />
                <Stop offset="50%" stopColor={finalColor} stopOpacity={0.1} />
                <Stop offset="100%" stopColor={finalColor} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={totalSize / 2} cy={totalSize / 2} r={totalSize / 2} fill="url(#icon_glow)" />
          </Svg>
        </View>
        <Comp name={resolved.name} size={size} color={finalColor} />
      </View>
    );
  }

  if (artistic === 'minted') {
    const pad = size * 0.6;
    const totalSize = size + pad * 2;
    return (
      <View style={{ 
        width: totalSize, 
        height: totalSize, 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: theme.alpha.tint14(finalColor),
        borderRadius: totalSize / 2,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderTopColor: theme.alpha.tint22('#FFFFFF'),
        borderBottomColor: theme.alpha.tint14('#000000'),
        shadowColor: finalColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      }}>
        <View style={{ position: 'absolute', overflow: 'hidden', borderRadius: totalSize / 2, width: totalSize, height: totalSize }}>
          <Svg width={totalSize} height={totalSize} viewBox={`0 0 ${totalSize} ${totalSize}`}>
            <Defs>
              <RadialGradient id="minted_glow" cx="30%" cy="30%" r="70%">
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.25} />
                <Stop offset="100%" stopColor={finalColor} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={totalSize / 2} cy={totalSize / 2} r={totalSize / 2} fill="url(#minted_glow)" />
          </Svg>
        </View>
        <Comp name={resolved.name} size={size} color={finalColor} />
      </View>
    );
  }
  
  if (artistic === 'glass') {
    const pad = size * 0.5;
    const totalSize = size + pad * 2;
    return (
      <View style={{ 
        width: totalSize, 
        height: totalSize, 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: theme.dark ? 'rgba(20, 26, 38, 0.55)' : theme.alpha.tint08(finalColor),
        borderRadius: theme.radius.sm,
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderTopColor: theme.alpha.tint14('#FFFFFF'),
        borderLeftColor: theme.alpha.tint14('#FFFFFF'),
      }}>
        <Comp name={resolved.name} size={size} color={finalColor} />
      </View>
    );
  }

  return <Comp name={resolved.name} size={size} color={finalColor} />;
}
