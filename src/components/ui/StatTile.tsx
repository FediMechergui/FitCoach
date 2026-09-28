import React from 'react';
import { View } from 'react-native';
import { Card } from './Card';
import { Text } from './Text';
import { Icon } from './Icon';
import { useTheme } from '@/theme/ThemeProvider';

interface StatTileProps {
  icon?: string;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
  flex?: number;
}

/**
 * A number with its name. Three of these share a row on a phone, which leaves
 * each about seventy points of room — so the tile is built for that width:
 *
 *  - the icon sits on its own line, and the label gets the whole width under
 *    it (beside the icon, "CALORIES" was cut to "CALORIE" and ran out of the
 *    card);
 *  - the label may take two lines and is tracked tighter than a page eyebrow;
 *  - the value is ONE line, and shrinks to fit rather than breaking a number
 *    from its unit ("68.9k / g", "26:4 / 0 / km").
 */
export function StatTile({ icon, label, value, sub, accent, flex = 1 }: StatTileProps) {
  const theme = useTheme();
  // A pace arrives as "26:40 /km". The rate goes under the number, where it
  // has room, instead of fighting it for the line.
  const rate = value.match(/^(.*\S)\s+\/(km|mi)$/);
  const shown = rate ? rate[1] : value;
  const under = sub ?? (rate ? `per ${rate[2]}` : undefined);
  return (
    <Card style={{ flex, minWidth: 0, padding: theme.spacing.md, gap: 4 }} accent={accent}>
      {icon ? (
        <View style={{ height: 20, justifyContent: 'center' }}>
          <Icon artistic="glow" icon={icon} size={16} color={accent ?? theme.colors.textMuted} />
        </View>
      ) : null}
      <Text variant="eyebrow" color="textMuted" numberOfLines={2} style={{ letterSpacing: 0.8 }}>
        {label}
      </Text>
      <Text variant="numeralM" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} style={{ fontSize: 22, lineHeight: 26 }}>
        {shown}
      </Text>
      {under ? (
        <Text variant="caption" color="textFaint" numberOfLines={2}>
          {under}
        </Text>
      ) : null}
    </Card>
  );
}
