import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Row } from '@/components/ui/misc';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useUserStore } from '@/stores/userStore';
import { EXPERIENCE_LEVELS, LEVEL_BLURBS, LEVEL_LABELS, levelOrDefault, prescriptionLine, type ExperienceLevel } from '@/lib/level';

/**
 * Beginner / Intermediate / Pro — read from the profile, changeable right here
 * (and saved back to the profile), because the answer changes what a split or
 * method pre-loads, the sets × reps shown, and the rest between sets.
 */
export function LevelPicker({ compact = false, color }: { compact?: boolean; color?: string }) {
  const theme = useTheme();
  const stored = useUserStore((s) => s.user?.experienceLevel);
  const updateProfile = useUserStore((s) => s.updateProfile);
  const level = levelOrDefault(stored);
  const tint = color ?? theme.colors.primary;

  const body = (
    <View style={{ gap: 8 }}>
      <Row gap={8} style={{ alignItems: 'center' }}>
        <Icon icon="core.target" size={16} color={tint} />
        <Text variant="label" color="textMuted">Your level</Text>
      </Row>
      <SegmentedControl
        options={EXPERIENCE_LEVELS.map((l) => ({ value: l, label: LEVEL_LABELS[l] }))}
        value={level}
        onChange={(v) => updateProfile({ experienceLevel: v as ExperienceLevel })}
      />
      {!compact && (
        <Text variant="caption" color="textMuted">{LEVEL_BLURBS[level]}</Text>
      )}
      <Text variant="caption" color="textFaint">{prescriptionLine(level)}</Text>
    </View>
  );
  return compact ? body : <Card style={{ gap: 8 }}>{body}</Card>;
}

/** The level to use right now — the hook form for screens that shape their lists by it. */
export function useExperienceLevel(): ExperienceLevel {
  return levelOrDefault(useUserStore((s) => s.user?.experienceLevel));
}
