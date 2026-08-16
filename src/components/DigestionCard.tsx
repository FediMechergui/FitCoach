import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Row } from '@/components/ui/misc';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import {
  currentDigestion,
  digestionStatus,
  formatWait,
  INTENSITY_LABEL,
  type MealForDigestion,
  type TrainingIntensity,
} from '@/lib/digestion';

/**
 * "Can I train yet?" — the meal still in the way, and when it clears.
 *
 * Re-renders on a one-minute tick so the countdown moves without a manual
 * refresh. Intensity is a control because the honest answer depends on it: a
 * heavy lunch that rules out sprints is fine for a walk.
 */
export function DigestionCard({
  meals,
  defaultIntensity = 'moderate',
  compact = false,
}: {
  meals: MealForDigestion[];
  defaultIntensity?: TrainingIntensity;
  compact?: boolean;
}) {
  const theme = useTheme();
  const [intensity, setIntensity] = useState<TrainingIntensity>(defaultIntensity);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const status = useMemo(() => currentDigestion(meals, intensity, now), [meals, intensity, now]);

  if (!meals.length) return null;

  const clear = !status;
  const color = clear ? theme.colors.success : status.progress > 0.66 ? theme.colors.warning : theme.colors.calories;

  return (
    <Card accent={color} style={{ gap: 10 }}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Row gap={10} style={{ alignItems: 'center', flex: 1 }}>
          <Icon icon={clear ? 'core.check' : 'digest.clock'} size={22} color={color} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">
              {clear ? 'Clear to train' : `Wait ${formatWait(status.remainingMin)}`}
            </Text>
            <Text variant="caption" color="textMuted">
              {clear
                ? `Nothing still digesting — good to go for ${INTENSITY_LABEL[intensity]}.`
                : status.readyFor
                  ? `Ready now for ${INTENSITY_LABEL[status.readyFor]}; ${INTENSITY_LABEL[intensity]} at ${clock(status.readyAt)}.`
                  : `Your last meal is ${Math.round(status.progress * 100)}% through — ${INTENSITY_LABEL[intensity]} at ${clock(status.readyAt)}.`}
            </Text>
          </View>
        </Row>
      </Row>

      {!clear && <ProgressBar progress={status.progress} color={color} />}

      {!compact && (
        <>
          <SegmentedControl
            options={[
              { value: 'light', label: 'Light' },
              { value: 'moderate', label: 'Normal' },
              { value: 'hard', label: 'Hard' },
            ]}
            value={intensity}
            onChange={(v) => setIntensity(v as TrainingIntensity)}
          />
          <Text variant="caption" color="textFaint">
            An estimate from meal size, fat, protein and fibre against standard stomach-emptying
            times — bigger and fattier meals sit longer, and hard training needs an emptier stomach
            than a walk. Your own tolerance is the final word.
          </Text>
        </>
      )}
    </Card>
  );
}

/** Per-meal line: how long this particular meal needs. */
export function MealDigestionLine({ meal }: { meal: MealForDigestion }) {
  const theme = useTheme();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);
  const s = digestionStatus(meal, 'moderate', now);
  const hard = digestionStatus(meal, 'hard', now);
  return (
    <Row gap={6} style={{ alignItems: 'center' }}>
      <Icon icon="digest.stomach" size={13} color={s.ready ? theme.colors.success : theme.colors.textFaint} />
      <Text variant="caption" color={s.ready ? 'success' : 'textFaint'}>
        {s.ready
          ? hard.ready
            ? 'Digested — clear for anything'
            : `Fine for a normal session · hard training at ${clock(hard.readyAt)}`
          : `Normal session at ${clock(s.readyAt)} · hard at ${clock(hard.readyAt)}`}
      </Text>
    </Row>
  );
}

const clock = (ms: number): string => {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};
