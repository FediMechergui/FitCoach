import React, { useMemo } from 'react';
import { Image, Linking, Pressable, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { Row, Divider } from '@/components/ui/misc';
import { ExerciseIllustration } from '@/components/ExerciseIllustration';
import { MuscleFigure } from '@/components/MuscleFigure';
import { getExercise, type ExerciseView } from '@/repositories/exerciseRepo';
import { EXERCISE_VIDEOS } from '@/data/exerciseVideos';
import { MUSCLE_LABELS, EQUIPMENT_LABELS, SUB_MUSCLE_LABELS, WARMUPS_BY_MUSCLE } from '@/data/exercises';
import { formatVideoLength, youtubeSearchUrl, youtubeThumb, youtubeWatchUrl } from '@/lib/youtube';

/**
 * "How it's done" — one block, two homes.
 *
 * The library's exercise page shows it in full (video, both figures, cues);
 * the live session shows the same thing in a sheet from a small icon on the
 * exercise card, so a lifter can check the form mid-set without leaving the
 * set. The video opens in YouTube — the app is offline-first and carries no
 * player — and the session's timers are timestamps, so nothing is disturbed.
 */

/** Resolve the video for an exercise: the row's own id (customs, or seeded
    built-ins) first, then the generated catalogue map as a fallback. */
export function videoFor(exercise: ExerciseView) {
  const id = exercise.videoId ?? (exercise.slug ? EXERCISE_VIDEOS[exercise.slug]?.id : undefined) ?? null;
  const meta = exercise.slug ? EXERCISE_VIDEOS[exercise.slug] : undefined;
  return id ? { id, title: meta && meta.id === id ? meta.title : null, channel: meta && meta.id === id ? meta.channel : null, lengthS: meta && meta.id === id ? meta.lengthS : undefined } : null;
}

export function ExerciseVideoCard({ exercise }: { exercise: ExerciseView }) {
  const theme = useTheme();
  const video = videoFor(exercise);
  const open = () => {
    void Linking.openURL(video ? youtubeWatchUrl(video.id) : youtubeSearchUrl(exercise.name));
  };
  const length = video ? formatVideoLength(video.lengthS) : null;

  return (
    <Card accent={theme.colors.danger} onPress={open}>
      <Row gap={12} style={{ alignItems: 'center' }}>
        <View
          style={{
            width: 112,
            height: 63,
            borderRadius: theme.radius.md,
            overflow: 'hidden',
            backgroundColor: theme.colors.surfaceAlt,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {video ? (
            <Image source={{ uri: youtubeThumb(video.id) }} style={{ position: 'absolute', width: 112, height: 63 }} resizeMode="cover" />
          ) : null}
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              backgroundColor: 'rgba(0,0,0,0.55)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon icon="core.play" size={20} color="#fff" />
          </View>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong" numberOfLines={2}>
            {video?.title ?? (video ? 'Watch how it is done' : 'Find a tutorial on YouTube')}
          </Text>
          <Text variant="caption" color="textMuted" numberOfLines={1}>
            {video
              ? [video.channel, length].filter(Boolean).join(' · ') || 'YouTube'
              : `Searches YouTube for “${exercise.name}”`}
          </Text>
          <Text variant="caption" color="textFaint" style={{ fontSize: 11 }}>
            Opens in YouTube — needs a connection. Your session keeps running.
          </Text>
        </View>
        <Icon icon="core.video" size={20} color={theme.colors.danger} />
      </Row>
    </Card>
  );
}

function TargetChips({ exercise }: { exercise: ExerciseView }) {
  const theme = useTheme();
  return (
    <Row gap={6} style={{ flexWrap: 'wrap' }}>
      {exercise.primaryMuscle && (
        <Chip label={MUSCLE_LABELS[exercise.primaryMuscle] ?? exercise.primaryMuscle} icon="stats.muscleMap" color={theme.colors.primary} small />
      )}
      {exercise.subMuscle && (
        <Chip label={SUB_MUSCLE_LABELS[exercise.subMuscle] ?? exercise.subMuscle} color={theme.colors.accent} small />
      )}
      {exercise.equipmentType && (
        <Chip label={EQUIPMENT_LABELS[exercise.equipmentType] ?? exercise.equipmentType} icon={exercise.iconKey} color={theme.colors.warning} small />
      )}
      {exercise.muscleGroups
        .filter((m) => m !== exercise.primaryMuscle)
        .slice(0, 3)
        .map((m) => (
          <Chip key={m} label={MUSCLE_LABELS[m] ?? m} color={theme.colors.textMuted} small />
        ))}
    </Row>
  );
}

export function CueList({ steps, color }: { steps: string[]; color: string }) {
  const theme = useTheme();
  if (steps.length === 0) return null;
  return (
    <Card style={{ gap: 10 }} accent={color}>
      <Row gap={8} style={{ alignItems: 'center' }}>
        <Icon icon="core.howto" size={18} color={color} />
        <Text variant="h3">How to do it</Text>
      </Row>
      {steps.map((step, i) => (
        <View key={i}>
          {i > 0 ? <Divider /> : null}
          <Row gap={10} style={{ alignItems: 'flex-start' }}>
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: theme.alpha.tint22(color),
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text variant="caption" style={{ fontSize: 10, color }}>
                {i + 1}
              </Text>
            </View>
            <Text variant="body" color="textMuted" style={{ flex: 1 }}>
              {step}
            </Text>
          </Row>
        </View>
      ))}
    </Card>
  );
}

/** The full block — video, movement + anatomy side by side, targets, warm-up, cues. */
export function ExerciseHowToBlock({ exercise }: { exercise: ExerciseView }) {
  const theme = useTheme();
  return (
    <>
      <ExerciseVideoCard exercise={exercise} />

      {/* Two pictures, two questions: what the movement looks like, and what it works. */}
      <Row gap={theme.spacing.sm} style={{ alignItems: 'stretch' }}>
        <View style={{ flex: 1 }}>
          <ExerciseIllustration pattern={exercise.pattern} sessionType={exercise.sessionType} size={200} />
        </View>
        <View style={{ flex: 1, borderRadius: 16, backgroundColor: theme.colors.surfaceAlt, padding: 8 }}>
          <MuscleFigure
            primary={exercise.primaryMuscle}
            groups={exercise.muscleGroups}
            subMuscle={exercise.subMuscle}
            height={176}
            legend={false}
          />
        </View>
      </Row>
      <MuscleFigureLegendOnly exercise={exercise} />

      <TargetChips exercise={exercise} />

      {exercise.description ? (
        <Text variant="body" color="textMuted">
          {exercise.description}
        </Text>
      ) : null}

      {exercise.primaryMuscle && WARMUPS_BY_MUSCLE[exercise.primaryMuscle] && (
        <Card accent={theme.colors.warning} style={{ gap: 4 }}>
          <Row gap={8} style={{ alignItems: 'center' }}>
            <Icon icon="core.timer" size={16} color={theme.colors.warning} />
            <Text variant="bodyStrong">Warm-up first (mandatory)</Text>
          </Row>
          <Text variant="caption" color="textMuted">
            {WARMUPS_BY_MUSCLE[exercise.primaryMuscle]}
          </Text>
        </Card>
      )}

      <CueList steps={exercise.instructions} color={theme.colors.accent} />
    </>
  );
}

/** The figure's legend, rendered by itself so the two pictures can share one line. */
function MuscleFigureLegendOnly({ exercise }: { exercise: ExerciseView }) {
  const theme = useTheme();
  const primaryLabel = exercise.primaryMuscle ? MUSCLE_LABELS[exercise.primaryMuscle] : null;
  const subLabel = exercise.subMuscle ? SUB_MUSCLE_LABELS[exercise.subMuscle] : null;
  const others = exercise.muscleGroups.filter((m) => m !== exercise.primaryMuscle && MUSCLE_LABELS[m]);
  if (!primaryLabel && others.length === 0) return null;
  return (
    <Row gap={12} style={{ flexWrap: 'wrap', alignItems: 'center' }}>
      {primaryLabel ? <Legend color={theme.colors.primary} opacity={0.92} label={primaryLabel} /> : null}
      {others.length > 0 ? <Legend color={theme.colors.primary} opacity={0.42} label="Also works" /> : null}
      {subLabel ? <Legend color="transparent" ring={theme.colors.accent} label={`Target: ${subLabel}`} /> : null}
    </Row>
  );
}

function Legend({ color, opacity = 1, ring, label }: { color: string; opacity?: number; ring?: string; label: string }) {
  return (
    <Row gap={6} style={{ alignItems: 'center' }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color, opacity: ring ? 1 : opacity, borderWidth: ring ? 2 : 0, borderColor: ring }} />
      <Text variant="caption" color="textMuted">
        {label}
      </Text>
    </Row>
  );
}

/**
 * The in-session version: same content in a sheet, opened from a small icon
 * on the exercise card. Modal over the session, never a navigation away from it.
 */
export function ExerciseHowToSheet({ exerciseId, visible, onClose }: { exerciseId: number; visible: boolean; onClose: () => void }) {
  const theme = useTheme();
  const exercise = useMemo(() => (visible ? getExercise(exerciseId) : undefined), [exerciseId, visible]);

  return (
    <Sheet visible={visible} onClose={onClose} footer={<Button title="Back to the set" icon="core.check" onPress={onClose} />}>
      {exercise ? (
        <View style={{ gap: theme.spacing.md }}>
          <Text variant="eyebrow" color="textMuted">
            How it's done
          </Text>
          <Text variant="h2">{exercise.name}</Text>
          <ExerciseVideoCard exercise={exercise} />
          <View style={{ borderRadius: 16, backgroundColor: theme.colors.surfaceAlt, padding: 10 }}>
            <MuscleFigure primary={exercise.primaryMuscle} groups={exercise.muscleGroups} subMuscle={exercise.subMuscle} height={200} />
          </View>
          <TargetChips exercise={exercise} />
          {exercise.description ? (
            <Text variant="body" color="textMuted">
              {exercise.description}
            </Text>
          ) : null}
          <CueList steps={exercise.instructions} color={theme.colors.accent} />
        </View>
      ) : null}
    </Sheet>
  );
}
