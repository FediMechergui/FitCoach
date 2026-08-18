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
  digestionStatus,
  formatWait,
  INTENSITY_LABEL,
  type MealForDigestion,
  type TrainingIntensity,
} from '@/lib/digestion';
import { trainReadiness } from '@/lib/readiness';
import type { SmokeEvent } from '@/lib/smokeClock';

/**
 * "Can I train yet?" — everything still in the way, and when it clears.
 *
 * Two clocks feed it. The STOMACH: every meal still digesting, stacked into
 * one load that drains at a rate set by its mix — so a snack an hour after
 * lunch pushes the time out rather than starting a fresh short timer. The
 * SMOKE: the acute nicotine window after the last use of anything, plus the
 * carbon-monoxide load from what was burned, which also stacks. Whichever is
 * later governs, and the card says which.
 *
 * Re-renders on a one-minute tick so the countdown moves without a manual
 * refresh. Intensity is a control because the honest answer depends on it: a
 * heavy lunch that rules out sprints is fine for a walk.
 */
export function DigestionCard({
  meals,
  smokes = [],
  defaultIntensity = 'moderate',
  compact = false,
}: {
  meals: MealForDigestion[];
  smokes?: SmokeEvent[];
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

  const r = useMemo(() => trainReadiness({ meals, smokes }, intensity, now), [meals, smokes, intensity, now]);

  if (!meals.length && !smokes.length) return null;

  const clear = r.ready;
  const color = clear ? theme.colors.success : r.progress > 0.66 ? theme.colors.warning : r.governor === 'smoke' ? theme.colors.danger : theme.colors.calories;
  const headIcon = clear ? 'core.check' : r.governor === 'smoke' ? 'smoking.cigarette' : 'digest.clock';

  return (
    <Card accent={color} style={{ gap: 10 }}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Row gap={10} style={{ alignItems: 'center', flex: 1 }}>
          <Icon icon={headIcon} size={22} color={color} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">
              {clear ? 'Clear to train' : `Wait ${formatWait(r.remainingMin)}`}
            </Text>
            <Text variant="caption" color="textMuted">
              {clear
                ? `Nothing in the way — good to go for ${INTENSITY_LABEL[intensity]}.`
                : r.readyFor
                  ? `Fine now for ${INTENSITY_LABEL[r.readyFor]}; ${INTENSITY_LABEL[intensity]} at ${clock(r.readyAt)}.`
                  : `${INTENSITY_LABEL[intensity]} at ${clock(r.readyAt)}.`}
            </Text>
          </View>
        </Row>
      </Row>

      {!clear && <ProgressBar progress={r.progress} color={color} />}

      {/* One line per clock that is still running, the governing one first. */}
      {!clear && (
        <View style={{ gap: 4 }}>
          {[r.governor === 'smoke' ? 'smoke' : 'stomach', r.governor === 'smoke' ? 'stomach' : 'smoke'].map((k) => {
            if (k === 'stomach' && r.stomach) {
              const s = r.stomach;
              return (
                <Row key="stomach" gap={6} style={{ alignItems: 'center' }}>
                  <Icon icon="digest.stomach" size={13} color={theme.colors.textMuted} />
                  <Text variant="caption" color="textMuted" style={{ flex: 1 }}>
                    Stomach: ~{s.loadKcal} kcal still digesting
                    {s.mealCount > 1 ? ` across ${s.mealCount} meals (${s.eatenKcal} kcal eaten)` : ''} — {formatWait(s.remainingMin)}
                    {r.governor === 'stomach' ? '' : ` (${INTENSITY_LABEL[intensity]} at ${clock(s.readyAt)})`}.
                  </Text>
                </Row>
              );
            }
            if (k === 'smoke' && r.smoke) {
              const k2 = r.smoke;
              const what = k2.lastCombusted
                ? `${k2.recentCount} smoked in the last day`
                : 'nicotine (not smoked)';
              const why = k2.limitedBy === 'co'
                ? `carbon monoxide still on board (~${k2.coLoad.toFixed(1)} cigarettes' worth)`
                : `heart rate and vessels still in the acute nicotine window`;
              return (
                <Row key="smoke" gap={6} style={{ alignItems: 'center' }}>
                  <Icon icon="smoking.cigarette" size={13} color={theme.colors.textMuted} />
                  <Text variant="caption" color="textMuted" style={{ flex: 1 }}>
                    Smoke: {what}, {why} — {formatWait(k2.remainingMin)}.
                  </Text>
                </Row>
              );
            }
            return null;
          })}
        </View>
      )}

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
            The stomach clock stacks everything still digesting and drains it at a rate set by the
            mix — carbs fastest, then protein, fat and fibre slowest — so a snack on top of lunch
            waits for both. The smoke clock counts the acute nicotine window after anything, plus
            carbon monoxide from what was burned, which stacks too. Estimates from standard
            figures; your own tolerance is the final word.
          </Text>
        </>
      )}
    </Card>
  );
}

/** Per-meal line: how long this particular meal needs, eaten alone. */
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
