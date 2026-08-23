import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Row, Divider } from '@/components/ui/misc';
import { MUSCLE_LABELS, SUB_MUSCLE_LABELS } from '@/data/exercises';

export interface PeekExercise {
  id?: number;
  name: string;
  iconKey?: string | null;
  primaryMuscle?: string | null;
  subMuscle?: string | null;
  equipmentType?: string | null;
  /** for a finished session: what was actually done */
  detail?: string | null;
}

/**
 * The exercises in a routine, a saved session or a template — just to read.
 *
 * Tapping a routine used to be the only way to find out what was in it, and
 * that started a session you then had to discard. This is the look without the
 * commitment: numbered running order, what each one hits, and how it was
 * logged when the list comes from a finished session.
 */
export function ExercisePeek({
  exercises,
  accent,
  emptyLabel = 'No exercises in this one yet.',
}: {
  exercises: PeekExercise[];
  accent?: string;
  emptyLabel?: string;
}) {
  const theme = useTheme();
  const tint = accent ?? theme.colors.primary;

  if (exercises.length === 0) {
    return (
      <Text variant="caption" color="textFaint">
        {emptyLabel}
      </Text>
    );
  }

  return (
    <View style={{ gap: 8 }}>
      <Divider />
      {exercises.map((ex, i) => {
        const muscle = ex.subMuscle
          ? SUB_MUSCLE_LABELS[ex.subMuscle] ?? ex.subMuscle
          : ex.primaryMuscle
            ? MUSCLE_LABELS[ex.primaryMuscle] ?? ex.primaryMuscle
            : null;
        const sub = [muscle, ex.equipmentType].filter(Boolean).join(' · ');
        return (
          <Row key={ex.id ?? `${ex.name}-${i}`} gap={8} style={{ alignItems: 'flex-start' }}>
            <Text variant="caption" color="textFaint" style={{ width: 18, marginTop: 2, fontVariant: ['tabular-nums'] }}>
              {i + 1}.
            </Text>
            <Icon icon={ex.iconKey ?? 'core.custom'} size={16} color={tint} />
            <View style={{ flex: 1 }}>
              <Text variant="body" numberOfLines={1}>
                {ex.name}
              </Text>
              {(sub || ex.detail) && (
                <Text variant="caption" color="textFaint" numberOfLines={1}>
                  {ex.detail ? ex.detail : sub}
                </Text>
              )}
            </View>
          </Row>
        );
      })}
    </View>
  );
}
