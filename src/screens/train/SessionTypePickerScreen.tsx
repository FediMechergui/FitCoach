import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Row } from '@/components/ui/misc';
import type { RootStackParamList } from '@/navigation/types';
import { SESSION_TYPE_META, MOOD_EMOJI, MOOD_LABELS, type SessionTypeMeta } from '@/constants/sessionTypes';
import { useSessionStore } from '@/stores/sessionStore';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function SessionTypePickerScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const begin = useSessionStore((s) => s.begin);
  const [selected, setSelected] = useState<SessionTypeMeta | null>(null);
  const [mood, setMood] = useState<number | null>(null);

  const isMindBody = selected?.flow === 'mindbody';

  const start = () => {
    if (!selected) return;
    begin(selected.type, { moodBefore: isMindBody ? mood ?? undefined : undefined });
    const id = useSessionStore.getState().activeId!;
    navigation.replace('ActiveSession', { sessionId: id });
  };

  return (
    <Screen>
      <Text variant="h2">Pick a session type</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md }}>
        {SESSION_TYPE_META.map((m) => {
          const active = selected?.type === m.type;
          return (
            <Pressable key={m.type} onPress={() => setSelected(m)} style={{ width: '47%', flexGrow: 1 }}>
              <Card
                accent={m.color}
                style={{
                  gap: 8,
                  borderColor: active ? m.color : theme.colors.border,
                  backgroundColor: active ? m.color + '18' : theme.colors.card,
                }}
              >
                <Icon icon={m.icon} size={26} color={m.color} />
                <Text variant="h3">{m.label}</Text>
                <Text variant="caption" color="textMuted">
                  {m.blurb}
                </Text>
              </Card>
            </Pressable>
          );
        })}
      </View>

      {isMindBody && (
        <Card>
          <Text variant="h3" style={{ marginBottom: 8 }}>
            How do you feel? (before)
          </Text>
          <Row style={{ justifyContent: 'space-between' }}>
            {MOOD_EMOJI.map((emoji, i) => (
              <Pressable key={i} onPress={() => setMood(i + 1)} style={{ alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 30, opacity: mood === i + 1 ? 1 : 0.45 }}>{emoji}</Text>
                <Text variant="caption" color={mood === i + 1 ? 'text' : 'textFaint'}>
                  {MOOD_LABELS[i]}
                </Text>
              </Pressable>
            ))}
          </Row>
        </Card>
      )}

      <Button
        title={selected ? `Start ${selected.label}` : 'Select a type'}
        icon="core.start"
        disabled={!selected}
        onPress={start}
        color={selected?.color}
      />
    </Screen>
  );
}
