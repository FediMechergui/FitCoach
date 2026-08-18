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
import { smokeStatus, type SmokeEvent } from '@/lib/smokeClock';

const clock = (ms: number): string => {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/**
 * One meter: a title, its own status at the right, its own bar, one line of
 * detail. The stomach and the smoke are two different clocks with two
 * different fixes, so they read as two meters — never merged into one bar.
 */
function Meter({
  icon,
  title,
  status,
  progress,
  color,
  detail,
  compact,
}: {
  icon: string;
  title: string;
  status: string;
  progress: number;
  color: string;
  detail: string;
  compact: boolean;
}) {
  return (
    <View style={{ gap: 4 }}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Row gap={6} style={{ alignItems: 'center', flex: 1 }}>
          <Icon icon={icon} size={14} color={color} />
          <Text variant="label">{title}</Text>
        </Row>
        <Text variant="caption" color={color} style={{ fontWeight: '700' }}>{status}</Text>
      </Row>
      <ProgressBar progress={progress} color={color} height={compact ? 4 : 6} />
      <Text variant="caption" color="textFaint" numberOfLines={compact ? 1 : 3}>{detail}</Text>
    </View>
  );
}

/**
 * "Can I train yet?" — two meters, side by side in one card.
 *
 * STOMACH: every meal still digesting, stacked into one load that drains at a
 * rate set by its mix — so a snack an hour after lunch pushes the time out
 * rather than starting a fresh short timer. SMOKE: the acute nicotine window
 * after the last use of anything, plus the carbon-monoxide load from what was
 * burned, which also stacks. Each meter has its own countdown and its own
 * bar; the headline is whichever is later, and says which.
 *
 * Re-renders on a one-minute tick so the countdowns move without a manual
 * refresh. Intensity is a control because the honest answer depends on it: a
 * heavy lunch that rules out sprints is fine for a walk.
 */
export function DigestionCard({
  meals,
  smokes = [],
  smokingEnabled = false,
  defaultIntensity = 'moderate',
  compact = false,
}: {
  meals: MealForDigestion[];
  smokes?: SmokeEvent[];
  /** show the smoke meter even when nothing was smoked (module on) */
  smokingEnabled?: boolean;
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
  // The smoke meter wants the status even when it is clear (to say "clear since").
  const smokeAny = useMemo(() => smokeStatus(smokes, intensity, now), [smokes, intensity, now]);

  if (!meals.length && !smokes.length) return null;

  const clear = r.ready;
  const headColor = clear ? theme.colors.success : r.progress > 0.66 ? theme.colors.warning : r.governor === 'smoke' ? theme.colors.danger : theme.colors.calories;
  const headIcon = clear ? 'core.check' : r.governor === 'smoke' ? 'smoking.cigarette' : 'digest.clock';

  // ── Stomach meter ──
  const s = r.stomach;
  const stomachColor = s ? (s.progress > 0.66 ? theme.colors.warning : theme.colors.calories) : theme.colors.success;
  const stomachStatus = s ? `wait ${formatWait(s.remainingMin)} · ${clock(s.readyAt)}` : 'clear';
  const stomachDetail = s
    ? `~${s.loadKcal} kcal still digesting${s.mealCount > 1 ? ` across ${s.mealCount} meals (${s.eatenKcal} kcal eaten)` : ''}${s.readyFor ? ` — fine now for ${INTENSITY_LABEL[s.readyFor]}` : ''}.`
    : meals.length
      ? 'Nothing from today\'s meals is still in the way.'
      : 'Nothing logged today.';

  // ── Smoke meter ──
  const k = r.smoke;
  const smokeColor = k ? (k.progress > 0.66 ? theme.colors.warning : theme.colors.danger) : theme.colors.success;
  const smokeStatusText = k ? `wait ${formatWait(k.remainingMin)} · ${clock(k.readyAt)}` : 'clear';
  const smokeDetail = k
    ? `${k.lastCombusted ? `${k.recentCount} smoked in the last day` : 'nicotine (not smoked)'}, ${
        k.limitedBy === 'co'
          ? `carbon monoxide still on board (~${k.coLoad.toFixed(1)} cigarettes' worth)`
          : 'heart rate and vessels still in the acute nicotine window'
      }${k.readyFor ? ` — fine now for ${INTENSITY_LABEL[k.readyFor]}` : ''}.`
    : smokeAny
      ? `Last one ${formatWait(smokeAny.elapsedMin)} ago — out of the way${smokeAny.coLoad > 0.3 ? ` (CO ~${smokeAny.coLoad.toFixed(1)} cigarettes' worth, fading)` : ''}.`
      : 'Nothing smoked in the last day.';
  const showSmoke = smokingEnabled || smokes.length > 0;

  return (
    <Card accent={headColor} style={{ gap: 10 }}>
      <Row gap={10} style={{ alignItems: 'center' }}>
        <Icon icon={headIcon} size={22} color={headColor} />
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">
            {clear ? 'Clear to train' : `Wait ${formatWait(r.remainingMin)}`}
          </Text>
          <Text variant="caption" color="textMuted">
            {clear
              ? `Nothing in the way — good to go for ${INTENSITY_LABEL[intensity]}.`
              : `${r.governor === 'smoke' ? 'The smoke clock' : 'The stomach clock'} governs — ${INTENSITY_LABEL[intensity]} at ${clock(r.readyAt)}${
                  r.readyFor ? `; fine now for ${INTENSITY_LABEL[r.readyFor]}` : ''
                }.`}
          </Text>
        </View>
      </Row>

      <View style={{ gap: compact ? 8 : 12 }}>
        <Meter icon="digest.stomach" title="Stomach" status={stomachStatus} progress={s ? s.progress : 1} color={stomachColor} detail={stomachDetail} compact={compact} />
        {showSmoke && (
          <Meter icon="smoking.cigarette" title="Smoke" status={smokeStatusText} progress={k ? k.progress : 1} color={smokeColor} detail={smokeDetail} compact={compact} />
        )}
      </View>

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
