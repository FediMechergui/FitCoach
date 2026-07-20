import React from 'react';
import { View, Image } from 'react-native';
import { BADGE_IMAGES } from '@/data/badgeImages';

/**
 * Achievement badge renderer.
 *
 * Shows the real badge art as a pre-rendered PNG (base64, from
 * scripts/render-badges.js) via a plain <Image>. This deliberately avoids
 * react-native-svg — rendering the badge SVGs through it (SvgXml or declarative
 * Path) crashed the Achievements screen NATIVELY (a white screen no JS error
 * boundary can catch). If an image is somehow missing, we fall back to a pure-RN
 * "medallion" built from the badge's own palette, so it can never crash.
 */

function attr(tag: string | undefined, name: string): string | undefined {
  if (!tag) return undefined;
  const m = tag.match(new RegExp(`${name}="([^"]*)"`));
  return m ? m[1] : undefined;
}

function parsePalette(svg: string): { fill: string; stroke: string; accent: string } {
  try {
    const circleTag = svg.match(/<circle\b[^>]*>/i)?.[0];
    const firstPath = svg.match(/<path\b[^>]*>/i)?.[0];
    return {
      fill: attr(circleTag, 'fill') ?? '#ECEFF1',
      stroke: attr(circleTag, 'stroke') ?? '#B0BEC5',
      accent: attr(firstPath, 'fill') ?? '#607D8B',
    };
  } catch {
    return { fill: '#ECEFF1', stroke: '#B0BEC5', accent: '#607D8B' };
  }
}

function Medallion({ svg, size }: { svg: string; size: number }) {
  const pal = React.useMemo(() => parsePalette(svg), [svg]);
  const dot = Math.round(size * 0.42);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: pal.fill,
        borderWidth: 2.5,
        borderColor: pal.stroke,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View style={{ width: dot, height: dot, borderRadius: dot / 2, backgroundColor: pal.accent }} />
    </View>
  );
}

export function BadgeSvg({ id, svg, size = 48 }: { id?: number; svg: string; size?: number }) {
  const uri = id != null ? BADGE_IMAGES[id] : undefined;
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size }} resizeMode="contain" />;
  }
  return <Medallion svg={svg} size={size} />;
}
