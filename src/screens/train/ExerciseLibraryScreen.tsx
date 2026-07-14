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
import { listExercises, createCustomExercise, type ExerciseView } from '@/repositories/exerciseRepo';
import { useSessionStore } from '@/stores/sessionStore';
import { SESSION_TYPE_META } from '@/constants/sessionTypes';
import { MUSCLE_GROUPS, MUSCLE_LABELS, EQUIPMENT_LABELS } from '@/data/exercises';

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
  const addExercise = useSessionStore((s) => s.addExercise);
  const activeType = useSessionStore((s) => s.sessionType);

  const [search, setSearch] = useState('');
  const [type, setType] = useState<SessionType | 'all'>(pick && activeType ? activeType : 'all');
  const [muscle, setMuscle] = useState<string>('all');
  const [equip, setEquip] = useState<EquipmentType | 'all'>('all');
  const [showCreate, setShowCreate] = useState(false);
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
        addExercise(ex.id);
        navigation.goBack();
      } else {
        navigation.navigate('ExerciseStats', { exerciseId: ex.id, name: ex.name });
      }
    },
    [pick, addExercise, navigation]
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
        renderItem={({ item }) => (
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
                        item.primaryMuscle ? MUSCLE_LABELS[item.primaryMuscle] ?? item.primaryMuscle : null,
                        item.equipmentType ? EQUIPMENT_LABELS[item.equipmentType] : null,
                      ]
                        .filter(Boolean)
                        .join(' · ') || item.category}
                    </Text>
                  </View>
                </Row>
                {/* In pick mode, still let the user open the how-to guide. */}
                {pick && (
                  <Pressable onPress={() => openDetail(item)} hitSlop={10} style={{ paddingHorizontal: 6 }}>
                    <Icon icon="core.info" size={20} color={theme.colors.textFaint} />
                  </Pressable>
                )}
                <Icon icon={pick ? 'core.add' : 'core.forward'} size={20} color={theme.colors.primary} />
              </Row>
            </Card>
          </Pressable>
        )}
      />

      <View style={{ position: 'absolute', bottom: 24, left: 16, right: 16 }}>
        {showCreate ? (
          <CreateExerciseCard
            defaultType={type === 'all' ? activeType ?? 'strength' : type}
            onCreated={(ex) => {
              setShowCreate(false);
              setRefresh((r) => r + 1);
              onSelect(ex);
            }}
            onCancel={() => setShowCreate(false)}
          />
        ) : (
          <Button title="Create Custom Exercise" icon="core.custom" onPress={() => setShowCreate(true)} />
        )}
      </View>
    </SafeAreaView>
  );
}

function CreateExerciseCard({
  defaultType,
  onCreated,
  onCancel,
}: {
  defaultType: SessionType;
  onCreated: (ex: ExerciseView) => void;
  onCancel: () => void;
}) {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [type, setType] = useState<SessionType>(defaultType);

  const create = () => {
    if (!name.trim()) return;
    const meta = SESSION_TYPE_META.find((m) => m.type === type);
    const ex = createCustomExercise({
      name: name.trim(),
      sessionType: type,
      trackingType: type === 'strength' || type === 'calisthenics' ? 'reps_weight' : 'duration',
      iconKey: meta?.icon ?? 'core.custom',
    });
    onCreated(ex);
  };

  return (
    <Card style={{ gap: theme.spacing.md }}>
      <Text variant="h3">New custom exercise</Text>
      <Input label="Name" value={name} onChangeText={setName} placeholder="e.g. Sled Push" />
      <SegmentedControl
        scrollable
        options={SESSION_TYPE_META.map((m) => ({ value: m.type, label: m.label }))}
        value={type}
        onChange={setType}
      />
      <Row>
        <Button title="Cancel" variant="secondary" onPress={onCancel} style={{ flex: 1 }} fullWidth={false} />
        <Button title="Create" onPress={create} style={{ flex: 2 }} fullWidth={false} disabled={!name.trim()} />
      </Row>
    </Card>
  );
}
