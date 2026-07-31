import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Row, Divider } from '@/components/ui/misc';
import { RPE_SCALE } from '@/lib/effort';

/**
 * What RPE actually means, shown in every session.
 *
 * The number is not "how hard did that feel out of 10" — it's how many reps you
 * had left. Someone meeting it cold will reasonably guess the first, log an 8
 * for a set that was genuinely a 6, and every effort-based figure downstream
 * inherits that mistake. So the scale is stated rather than assumed, sitting
 * collapsed in each session and one tap from the full breakdown.
 */
export function RpeGuide() {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <Card style={{ gap: open ? 10 : 0 }}>
      <Pressable onPress={() => setOpen((v) => !v)} hitSlop={6}>
        <Row gap={8} style={{ alignItems: 'center' }}>
          <Icon icon="core.info" size={16} color={theme.colors.textMuted} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">What is RPE?</Text>
            <Text variant="caption" color="textMuted">
              How many reps you had left — not how hard it felt. 10 = none left.
            </Text>
          </View>
          <Icon icon={open ? 'core.chevronUp' : 'core.chevronDown'} size={16} color={theme.colors.textFaint} />
        </Row>
      </Pressable>

      {open && (
        <>
          <Divider />
          <View style={{ gap: 6 }}>
            {RPE_SCALE.map((s) => (
              <Row key={s.rpe} gap={10} style={{ alignItems: 'center' }}>
                <View
                  style={{
                    width: 34,
                    paddingVertical: 2,
                    borderRadius: theme.radius.sm,
                    alignItems: 'center',
                    backgroundColor: s.productive ? theme.colors.success + '22' : theme.colors.surface,
                  }}
                >
                  <Text variant="caption" color={s.productive ? 'success' : 'textFaint'}>
                    {s.rpe === 5 ? '≤5' : s.rpe}
                  </Text>
                </View>
                <Text variant="caption" color="textMuted" style={{ flex: 1 }}>
                  {s.meaning}
                </Text>
              </Row>
            ))}
          </View>
          <Text variant="caption" color="textFaint">
            Roughly 7–10 is where growth happens — that's 0 to 3 reps left. Below that a set costs
            you time without buying much. If you genuinely went to the limit, tick "to failure"
            instead of guessing a number.
          </Text>
        </>
      )}
    </Card>
  );
}
