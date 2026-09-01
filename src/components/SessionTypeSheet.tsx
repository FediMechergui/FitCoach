import React, { useState } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { Row } from '@/components/ui/misc';
import type { RootStackParamList } from '@/navigation/types';
import { SESSION_TYPE_META, MOOD_EMOJI, MOOD_LABELS, type SessionTypeMeta } from '@/constants/sessionTypes';
import { useSessionStore } from '@/stores/sessionStore';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * Choosing a session type is a moment, not a destination.
 *
 * v2 pushed a full modal screen for a decision that takes three seconds; the
 * sheet keeps you where you already are, and dismissing it costs nothing. The
 * mind-body mood check-in rides along exactly as before, and Start lands you
 * in the live session directly — there is no picker to go "back" to.
 */
export function SessionTypeSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
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
    setSelected(null);
    setMood(null);
    onClose();
    navigation.navigate('ActiveSession', { sessionId: id });
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={{ gap: theme.spacing.md }}>
        <Text variant="eyebrow" color="textMuted">
          Start
        </Text>
        <Text variant="h2">Pick a session type</Text>
        <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
            {SESSION_TYPE_META.map((m) => {
              const active = selected?.type === m.type;
              return (
                <Pressable key={m.type} onPress={() => setSelected(m)} style={{ width: '47%', flexGrow: 1 }}>
                  <Card
                    accent={m.color}
                    style={{
                      gap: 6,
                      borderColor: active ? m.color : theme.colors.border,
                      backgroundColor: active ? theme.alpha.tint14(m.color) : theme.colors.card,
                    }}
                  >
                    <Icon icon={m.icon} size={24} color={m.color} />
                    <Text variant="h3">{m.label}</Text>
                    <Text variant="caption" color="textMuted" numberOfLines={2}>
                      {m.blurb}
                    </Text>
                  </Card>
                </Pressable>
              );
            })}
          </View>

          {isMindBody && (
            <Card style={{ marginTop: theme.spacing.sm }}>
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
        </ScrollView>

        <Button
          title={selected ? `Start ${selected.label}` : 'Select a type'}
          icon="core.start"
          disabled={!selected}
          onPress={start}
          color={selected?.color}
        />
      </View>
    </Sheet>
  );
}
