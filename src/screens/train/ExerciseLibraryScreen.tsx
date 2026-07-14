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
import { type SessionType } from '@/db/schema';
import { listExercises, createCustomExercise, type ExerciseView } from '@/repositories/exerciseRepo';
import { useSessionStore } from '@/stores/sessionStore';
import { SESSION_TYPE_META } from '@/constants/sessionTypes';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type LibRoute = RouteProp<RootStackParamList, 'ExerciseLibrary'>;

const FILTERS: Array<{ value: SessionType | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  ...SESSION_TYPE_META.map((m) => ({ value: m.type, label: m.label })),
];

export function ExerciseLibraryScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<LibRoute>();
  const pick = route.params?.pick ?? false;
  const addExercise = useSessionStore((s) => s.addExercise);
  const activeType = useSessionStore((s) => s.sessionType);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<SessionType | 'all'>(
    pick && activeType ? activeType : 'all'
  );
  const [showCreate, setShowCreate] = useState(false);
  const [refresh, setRefresh] = useState(0);

  const items = useMemo(
    () =>
      listExercises({
        sessionType: filter === 'all' ? undefined : filter,
        search,
      }),
    [filter, search, refresh]
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

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <View style={{ padding: theme.spacing.lg, gap: theme.spacing.md }}>
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder="Search exercises & activities"
        />
        <SegmentedControl
          scrollable
          options={FILTERS}
          value={filter}
          onChange={(v) => setFilter(v)}
        />
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={{ padding: theme.spacing.lg, paddingTop: 0, gap: theme.spacing.sm, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
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
                      {item.muscleGroups.length ? item.muscleGroups.join(', ') : item.category}
                    </Text>
                  </View>
                </Row>
                <Icon icon={pick ? 'core.add' : 'core.forward'} size={20} color={theme.colors.textFaint} />
              </Row>
            </Card>
          </Pressable>
        )}
      />

      <View style={{ position: 'absolute', bottom: 24, left: 16, right: 16 }}>
        {showCreate ? (
          <CreateExerciseCard
            defaultType={filter === 'all' ? activeType ?? 'strength' : filter}
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
