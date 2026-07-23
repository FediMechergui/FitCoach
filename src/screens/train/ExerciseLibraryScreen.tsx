import React, { useCallback, useMemo, useState } from 'react';
import { View, Pressable, FlatList } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Row, EmptyState } from '@/components/ui/misc';
import { ExerciseHero } from '@/components/ExerciseHero';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RootStackParamList } from '@/navigation/types';
import { type EquipmentType, type SessionType } from '@/db/schema';
import {
  listExercises,
  createCustomExercise,
  updateCustomExercise,
  type ExerciseView,
} from '@/repositories/exerciseRepo';
import { addExerciseToSession, getSession } from '@/repositories/sessionRepo';
import { useSessionStore } from '@/stores/sessionStore';
import { useUserStore } from '@/stores/userStore';
import { caloriesForReference } from '@/lib/exerciseCalories';
import { SESSION_TYPE_MET } from '@/lib/met';
import { SESSION_TYPE_META } from '@/constants/sessionTypes';
import { Chip } from '@/components/ui/Chip';
import { MUSCLE_GROUPS, MUSCLE_LABELS, EQUIPMENT_LABELS, SUB_MUSCLE_LABELS } from '@/data/exercises';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type LibRoute = RouteProp<RootStackParamList, 'ExerciseLibrary'>;

const TYPE_FILTERS: Array<{ value: SessionType | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  ...SESSION_TYPE_META.map((m) => ({ value: m.type, label: m.label })),
];

const MUSCLE_FILTERS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All muscles' },
  ...MUSCLE_GROUPS.map((m) => ({ value: m, label: MUSCLE_LABELS[m] ?? m })),
];

const EQUIP_FILTERS: Array<{ value: EquipmentType | 'all'; label: string }> = [
  { value: 'all', label: 'All gear' },
  { value: 'barbell', label: EQUIPMENT_LABELS.barbell },
  { value: 'dumbbell', label: EQUIPMENT_LABELS.dumbbell },
  { value: 'machine', label: EQUIPMENT_LABELS.machine },
  { value: 'cable', label: EQUIPMENT_LABELS.cable },
  { value: 'bodyweight', label: EQUIPMENT_LABELS.bodyweight },
];

export function ExerciseLibraryScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<LibRoute>();
  const pick = route.params?.pick ?? false;
  const targetSessionId = route.params?.sessionId;
  const addExercise = useSessionStore((s) => s.addExercise);
  const activeType = useSessionStore((s) => s.sessionType);
  const bodyKg = useUserStore((s) => s.currentWeightKg) ?? 75;
  // When targeting a specific (e.g. finished) session, default the filter to its type.
  const targetType = targetSessionId ? getSession(targetSessionId)?.sessionType : undefined;

  const [search, setSearch] = useState('');
  const [type, setType] = useState<SessionType | 'all'>(targetType ?? (pick && activeType ? activeType : 'all'));
  const [muscle, setMuscle] = useState<string>('all');
  const [equip, setEquip] = useState<EquipmentType | 'all'>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<ExerciseView | null>(null);
  const [refresh, setRefresh] = useState(0);

  const items = useMemo(
    () =>
      listExercises({
        sessionType: type === 'all' ? undefined : type,
        muscle: muscle === 'all' ? undefined : muscle,
        equipmentType: equip === 'all' ? undefined : equip,
        search,
      }),
    [type, muscle, equip, search, refresh]
  );

  const onSelect = useCallback(
    (ex: ExerciseView) => {
      if (pick) {
        // Target a specific session (e.g. a finished/logged one) directly, else
        // the live session via the store.
        if (targetSessionId) addExerciseToSession(targetSessionId, ex.id);
        else addExercise(ex.id);
        navigation.goBack();
      } else {
        navigation.navigate('ExerciseStats', { exerciseId: ex.id, name: ex.name });
      }
    },
    [pick, targetSessionId, addExercise, navigation]
  );

  const openDetail = useCallback(
    (ex: ExerciseView) => navigation.navigate('ExerciseStats', { exerciseId: ex.id, name: ex.name }),
    [navigation]
  );

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <View style={{ padding: theme.spacing.lg, gap: theme.spacing.sm }}>
        <Input value={search} onChangeText={setSearch} placeholder="Search exercises & activities" />
        <SegmentedControl scrollable options={TYPE_FILTERS} value={type} onChange={setType} />
        <SegmentedControl scrollable options={MUSCLE_FILTERS} value={muscle} onChange={setMuscle} accent={theme.colors.accent} />
        <SegmentedControl scrollable options={EQUIP_FILTERS} value={equip} onChange={setEquip} accent={theme.colors.warning} />
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={{ padding: theme.spacing.lg, paddingTop: 0, gap: theme.spacing.sm, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <Text variant="caption" color="textFaint" style={{ marginBottom: 6 }}>
            {items.length} exercise{items.length === 1 ? '' : 's'}
          </Text>
        }
        ListEmptyComponent={
          <EmptyState
            icon="nutrition.search"
            title="No matches"
            message="Try a different filter, or create a custom exercise."
          />
        }
        renderItem={({ item }) => {
          const met = item.metValue && item.metValue > 0 ? item.metValue : SESSION_TYPE_MET[item.sessionType] ?? 4;
          const kcalPer10 = caloriesForReference(met, bodyKg, 10);
          return (
          <Pressable onPress={() => onSelect(item)}>
            <Card>
              <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Row gap={12} style={{ alignItems: 'center', flex: 1 }}>
                  <ExerciseHero iconKey={item.iconKey} sessionType={item.sessionType} />
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyStrong" numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text variant="caption" color="textMuted" numberOfLines={1}>
                      {[
                        item.subMuscle
                          ? SUB_MUSCLE_LABELS[item.subMuscle] ?? item.subMuscle
                          : item.primaryMuscle
                            ? MUSCLE_LABELS[item.primaryMuscle] ?? item.primaryMuscle
                            : null,
                        item.equipmentType ? EQUIPMENT_LABELS[item.equipmentType] : null,
                      ]
                        .filter(Boolean)
                        .join(' · ') || item.category}
                    </Text>
                    <Text variant="caption" color={theme.colors.calories} numberOfLines={1} style={{ marginTop: 1 }}>
                      ≈ {kcalPer10} kcal / 10 min · {Math.round(kcalPer10 / 10)} kcal/min
                    </Text>
                  </View>
                </Row>
                {/* In pick mode, still let the user open the how-to guide. */}
                {pick && (
                  <Pressable onPress={() => openDetail(item)} hitSlop={10} style={{ paddingHorizontal: 6 }}>
                    <Icon icon="core.info" size={20} color={theme.colors.textFaint} />
                  </Pressable>
                )}
                {/* Custom exercises are editable. */}
                {item.isCustom && (
                  <Pressable onPress={() => setEditing(item)} hitSlop={10} style={{ paddingHorizontal: 6 }}>
                    <Icon icon="core.edit" size={18} color={theme.colors.accent} />
                  </Pressable>
                )}
                <Icon icon={pick ? 'core.add' : 'core.forward'} size={20} color={theme.colors.primary} />
              </Row>
            </Card>
          </Pressable>
          );
        }}
      />

      <View style={{ position: 'absolute', bottom: 24, left: 16, right: 16 }}>
        {showCreate || editing ? (
          <ExerciseFormCard
            defaultType={type === 'all' ? activeType ?? 'strength' : type}
            existing={editing}
            onDone={(ex) => {
              const wasEditing = !!editing;
              setShowCreate(false);
              setEditing(null);
              setRefresh((r) => r + 1);
              if (ex && !wasEditing) {
                if (pick) {
                  // In a session: add the new exercise straight away.
                  onSelect(ex);
                } else {
                  // Browsing: keep the user on the list and reveal the saved
                  // exercise so it's obvious it persisted.
                  setType(ex.sessionType);
                  setSearch('');
                }
              }
            }}
          />
        ) : (
          <Button title="Create Custom Exercise" icon="core.custom" onPress={() => setShowCreate(true)} />
        )}
      </View>
    </SafeAreaView>
  );
}

/**
 * Create or edit a custom exercise with the full category choices (session
 * type, muscle group, individual sub-muscle, equipment) so it files into the
 * same structure as the built-in library — per the v2 custom-exercise template.
 */
function ExerciseFormCard({
  defaultType,
  existing,
  onDone,
}: {
  defaultType: SessionType;
  existing: ExerciseView | null;
  onDone: (ex: ExerciseView | null) => void;
}) {
  const theme = useTheme();
  const [name, setName] = useState(existing?.name ?? '');
  const [type, setType] = useState<SessionType>(existing?.sessionType ?? defaultType);
  const [muscle, setMuscle] = useState<string | null>(existing?.primaryMuscle ?? null);
  const [sub, setSub] = useState<string | null>(existing?.subMuscle ?? null);
  const [equip, setEquip] = useState<EquipmentType | null>(
    (existing?.equipmentType as EquipmentType | null) ?? null
  );

  const isLifting = type === 'strength' || type === 'calisthenics';

  const save = () => {
    if (!name.trim()) return;
    const meta = SESSION_TYPE_META.find((m) => m.type === type);
    if (existing) {
      updateCustomExercise(existing.id, {
        name: name.trim(),
        sessionType: type,
        primaryMuscle: muscle,
        subMuscle: sub,
        equipmentType: equip,
        muscleGroups: muscle ? [muscle] : [],
        trackingType: isLifting ? 'reps_weight' : 'duration',
        iconKey: meta?.icon ?? 'core.custom',
      });
      onDone(null);
    } else {
      const ex = createCustomExercise({
        name: name.trim(),
        sessionType: type,
        primaryMuscle: muscle ?? undefined,
        subMuscle: sub ?? undefined,
        equipmentType: equip ?? undefined,
        muscleGroups: muscle ? [muscle] : [],
        trackingType: isLifting ? 'reps_weight' : 'duration',
        iconKey: meta?.icon ?? 'core.custom',
      });
      onDone(ex);
    }
  };

  return (
    <Card style={{ gap: theme.spacing.sm, maxHeight: 460 }}>
      <Text variant="h3">{existing ? `Edit “${existing.name}”` : 'New custom exercise'}</Text>
      <Input label="Name" value={name} onChangeText={setName} placeholder="e.g. Sled Push" />
      <SegmentedControl
        scrollable
        options={SESSION_TYPE_META.map((m) => ({ value: m.type, label: m.label }))}
        value={type}
        onChange={setType}
      />
      {isLifting && (
        <>
          <Text variant="caption" color="textMuted">Muscle group</Text>
          <Row gap={6} style={{ flexWrap: 'wrap' }}>
            {MUSCLE_GROUPS.map((m) => (
              <Chip
                key={m}
                label={MUSCLE_LABELS[m] ?? m}
                active={muscle === m}
                small
                onPress={() => {
                  setMuscle(muscle === m ? null : m);
                  setSub(null);
                }}
              />
            ))}
          </Row>
          {(muscle === 'back' || muscle === 'shoulders' || muscle === 'core') && (
            <>
              <Text variant="caption" color="textMuted">Individual muscle</Text>
              <Row gap={6} style={{ flexWrap: 'wrap' }}>
                {Object.keys(SUB_MUSCLE_LABELS)
                  .filter((k) =>
                    muscle === 'back'
                      ? ['lats', 'traps', 'mid_back', 'lower_back'].includes(k)
                      : muscle === 'shoulders'
                        ? ['front_delt', 'side_delt', 'rear_delt'].includes(k)
                        : ['upper_abs', 'lower_abs', 'obliques'].includes(k)
                  )
                  .map((k) => (
                    <Chip
                      key={k}
                      label={SUB_MUSCLE_LABELS[k]}
                      active={sub === k}
                      small
                      color={theme.colors.accent}
                      onPress={() => setSub(sub === k ? null : k)}
                    />
                  ))}
              </Row>
            </>
          )}
          <Text variant="caption" color="textMuted">Equipment</Text>
          <Row gap={6} style={{ flexWrap: 'wrap' }}>
            {(['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'other'] as EquipmentType[]).map((eq) => (
              <Chip
                key={eq}
                label={EQUIPMENT_LABELS[eq] ?? eq}
                active={equip === eq}
                small
                color={theme.colors.warning}
                onPress={() => setEquip(equip === eq ? null : eq)}
              />
            ))}
          </Row>
        </>
      )}
      <Row>
        <Button title="Cancel" variant="secondary" onPress={() => onDone(null)} style={{ flex: 1 }} fullWidth={false} />
        <Button
          title={existing ? 'Save changes' : 'Create'}
          onPress={save}
          style={{ flex: 2 }}
          fullWidth={false}
          disabled={!name.trim()}
        />
      </Row>
    </Card>
  );
}
