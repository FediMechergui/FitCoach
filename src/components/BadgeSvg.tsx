import React from 'react';
import { View } from 'react-native';

/**
 * Achievement badge renderer.
 *
 * NOTE: this deliberately does NOT use react-native-svg. Rendering the 100 badge
 * SVGs (via SvgXml *or* declarative Path) was natively crashing the Achievements
 * screen to a white screen — a native crash that no JS error boundary can catch.
 * Every badge is a coloured disc with an icon path, so we render a pure-RN
 * "medallion" using the badge's own palette (parsed from the SVG string): the
 * pale disc fill, the ring/stroke colour, and the icon colour as a centre dot.
 * This keeps each badge visually distinct and can never crash.
 */

function attr(tag: string | undefined, name: string): string | undefined {
  if (!tag) return undefined;
  const m = tag.match(new RegExp(`${name}="([^"]*)"`));
  return m ? m[1] : undefined;
}

interface Palette {
  fill: string; // pale disc background
  stroke: string; // ring colour
  accent: string; // icon colour (first path fill)
}

function parsePalette(svg: string): Palette {
  try {
    const circleTag = svg.match(/<circle\b[^>]*>/i)?.[0];
    const firstPath = svg.match(/<path\b[^>]*>/i)?.[0];
    return {
      fill: attr(circleTag, 'fill') ?? '#Eceff1',
      stroke: attr(circleTag, 'stroke') ?? '#B0BEC5',
      accent: attr(firstPath, 'fill') ?? '#607D8B',
    };
  } catch {
    return { fill: '#ECEFF1', stroke: '#B0BEC5', accent: '#607D8B' };
  }
}

export function BadgeSvg({ svg, size = 48 }: { svg: string; size?: number }) {
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
