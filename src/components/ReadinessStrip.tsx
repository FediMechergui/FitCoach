import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Sheet } from '@/components/ui/Sheet';
import { Row } from '@/components/ui/misc';
import { DigestionCard } from '@/components/DigestionCard';
import { PostSessionCard } from '@/components/PostSessionCard';
import { WeatherCard } from '@/components/WeatherCard';
import { currentDigestion, formatWait, type MealForDigestion, type TrainingIntensity } from '@/lib/digestion';
import { currentSmoke, type SmokeEvent } from '@/lib/smokeClock';
import type { activePostSession } from '@/repositories/postSessionRepo';

/**
 * The readiness band — Home shows the verdict, the sheet shows the physiology.
 *
 * v2 stacked three full cards (weather, digestion, post-session margins) and
 * hid them entirely when they had nothing to warn about — which meant the app
 * went silent at exactly the moment reassurance mattered. This strip always
 * renders: "Clear to train" is a state worth saying out loud. Everything the
 * three cards knew — the intensity control, the margin explanations, manual
 * weather entry — still exists, one tap down, unchanged.
 */
export function ReadinessStrip({
  meals,
  smokes,
  smokingEnabled,
  after,
  weatherLine,
  intensity = 'moderate',
}: {
  meals: MealForDigestion[];
  smokes: SmokeEvent[];
  smokingEnabled: boolean;
  after: ReturnType<typeof activePostSession>;
  /** one compact line about the day's heat, from weatherAdjustedWaterGoal */
  weatherLine: string | null;
  /** the intensity the verdict answers for — Train asks about hard sessions */
  intensity?: TrainingIntensity;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const verdict = useMemo(() => {
    const digestion = currentDigestion(meals, intensity);
    const smoke = smokingEnabled ? currentSmoke(smokes, intensity) : null;
    const dWait = digestion?.remainingMin ?? 0;
    const sWait = smoke?.remainingMin ?? 0;
    const wait = Math.max(dWait, sWait);
    if (wait <= 0) {
      return {
        clear: true,
        title: 'Clear to train',
        line: 'Nothing in the way — stomach settled' + (smokingEnabled ? ', smoke clock clear' : '') + '.',
      };
    }
    const governor = sWait >= dWait ? 'smoke clock' : 'stomach';
    const readyAt = new Date(Date.now() + wait * 60_000);
    const hh = `${readyAt.getHours()}:${String(readyAt.getMinutes()).padStart(2, '0')}`;
    return {
      clear: false,
      title: `Wait ${formatWait(wait)}`,
      line: `The ${governor} governs — ${intensity === 'hard' ? 'sprints or heavy lifting' : 'a normal session'} at ${hh}; fine now for a walk or mobility.`,
    };
  }, [meals, smokes, smokingEnabled, intensity]);

  const tint = verdict.clear ? theme.colors.primary : theme.colors.warning;

  return (
    <>
      <Card accent={tint} onPress={() => setOpen(true)}>
        <Row gap={12} style={{ alignItems: 'center' }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: theme.radius.md,
              backgroundColor: theme.alpha.tint14(tint),
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon icon={verdict.clear ? 'core.check' : 'digest.clock'} size={20} color={tint} />
          </View>
          <View style={{ flex: 1, gap: 1 }}>
            <Row gap={8} style={{ alignItems: 'baseline' }}>
              <Text variant="h3" style={verdict.clear ? { color: tint } : undefined}>
                {verdict.title}
              </Text>
              {after ? (
                <Text variant="caption" color="textFaint">
                  · post-session margins running
                </Text>
              ) : null}
            </Row>
            <Text variant="caption" color="textMuted" numberOfLines={2}>
              {verdict.line}
            </Text>
            {weatherLine ? (
              <Text variant="caption" color="textFaint" numberOfLines={1}>
                {weatherLine}
              </Text>
            ) : null}
          </View>
          <Icon icon="core.forward" size={16} color={theme.colors.textFaint} />
        </Row>
      </Card>

      <Sheet visible={open} onClose={() => setOpen(false)}>
        {/* The Sheet owns the scrolling — no inner ScrollView. */}
        <View style={{ gap: theme.spacing.md }}>
          <Text variant="eyebrow" color="textMuted">
            Readiness
          </Text>
          <DigestionCard meals={meals} smokes={smokes} smokingEnabled={smokingEnabled} defaultIntensity={intensity} />
          {after ? (
            <PostSessionCard
              endedAt={after.endedAt}
              strain={after.strain}
              margins={after.margins}
              title="After today's session"
            />
          ) : null}
          <WeatherCard />
        </View>
      </Sheet>
    </>
  );
}
