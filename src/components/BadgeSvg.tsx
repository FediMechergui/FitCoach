import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

/**
 * Renders an achievement badge from its inline SVG string using react-native-svg's
 * declarative primitives (the same Svg/Circle/Path the charts use) instead of
 * `SvgXml`. `SvgXml`'s runtime XML parser was blanking the Achievements screen on
 * device; every badge is a uniform `<circle>` + one/two `<path>` on a 0 0 64 64
 * viewBox, so we parse those few attributes ourselves. Any parse hiccup falls
 * back to an empty box rather than crashing the screen.
 */

function attr(tag: string, name: string): string | undefined {
  const m = tag.match(new RegExp(`${name}="([^"]*)"`));
  return m ? m[1] : undefined;
}

interface ParsedBadge {
  circle?: { cx: string; cy: string; r: string; fill: string; stroke?: string; strokeWidth?: string };
  paths: Array<{ d: string; fill: string }>;
}

function parseBadge(svg: string): ParsedBadge | null {
  try {
    const circleTag = svg.match(/<circle\b[^>]*>/i)?.[0];
    const circle = circleTag
      ? {
          cx: attr(circleTag, 'cx') ?? '32',
          cy: attr(circleTag, 'cy') ?? '32',
          r: attr(circleTag, 'r') ?? '30',
          fill: attr(circleTag, 'fill') ?? 'none',
          stroke: attr(circleTag, 'stroke'),
          strokeWidth: attr(circleTag, 'stroke-width'),
        }
      : undefined;
    const paths = [...svg.matchAll(/<path\b[^>]*>/gi)]
      .map((mt) => ({ d: attr(mt[0], 'd') ?? '', fill: attr(mt[0], 'fill') ?? '#888' }))
      .filter((p) => p.d);
    if (!circle && paths.length === 0) return null;
    return { circle, paths };
  } catch {
    return null;
  }
}

function BadgeSvgInner({ svg, size = 48 }: { svg: string; size?: number }) {
  const parsed = React.useMemo(() => parseBadge(svg), [svg]);
  if (!parsed) return <Medallion size={size} color={undefined} />;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {parsed.circle && (
        <Circle
          cx={parsed.circle.cx}
          cy={parsed.circle.cy}
          r={parsed.circle.r}
          fill={parsed.circle.fill}
          stroke={parsed.circle.stroke}
          strokeWidth={parsed.circle.strokeWidth}
        />
      )}
      {parsed.paths.map((p, i) => (
        <Path key={i} d={p.d} fill={p.fill} />
      ))}
    </Svg>
  );
}

/** Plain, dependency-free fallback: a coloured circle (no react-native-svg). */
function Medallion({ size, color }: { size: number; color?: string }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: (color ?? '#FFB74D') + '33',
        borderWidth: 2,
        borderColor: color ?? '#FFB74D',
      }}
    />
  );
}

/**
 * Error boundary so a single badge that trips react-native-svg's JS layer falls
 * back to a plain medallion instead of blanking the whole Achievements screen.
 */
export class BadgeSvg extends React.Component<{ svg: string; size?: number }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    const size = this.props.size ?? 48;
    if (this.state.failed) return <Medallion size={size} color={undefined} />;
    try {
      return <BadgeSvgInner svg={this.props.svg} size={size} />;
    } catch {
      return <Medallion size={size} color={undefined} />;
    }
  }
}
