import React, { useCallback, useMemo, useState } from 'react';
import { View, Pressable } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { Row, Divider } from '@/components/ui/misc';
import { toast } from '@/components/ui/Toast';
import { findPlaceKind } from '@/data/placeKinds';
import { attachSession, listPlaces, placeOfSession } from '@/repositories/placesRepo';
import type { Place, SessionType } from '@/db/schema';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * Where a session happened. One line on the session's page; tapping it opens
 * the user's places, the ones that suit this kind of session first.
 */
export function SessionPlaceCard({ sessionId, sessionType }: { sessionId: number; sessionType: SessionType }) {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const [place, setPlace] = useState<Place | undefined>(undefined);
  const [all, setAll] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);

  const reload = useCallback(() => {
    try {
      setPlace(placeOfSession(sessionId));
      setAll(listPlaces());
    } catch {
      setPlace(undefined);
      setAll([]);
    }
  }, [sessionId]);

  useFocusEffect(reload);

  const ordered = useMemo(() => {
    const fits = (p: Place) => (findPlaceKind(p.kind).fits.includes(sessionType) ? 0 : 1);
    return [...all].sort((a, b) => Number(b.isHome) - Number(a.isHome) || fits(a) - fits(b));
  }, [all, sessionType]);

  const choose = (p: Place | null) => {
    const before = place;
    attachSession(sessionId, p ? p.id : null);
    setOpen(false);
    reload();
    toast({
      message: p ? `This session happened at ${p.name}` : 'Place removed from this session',
      actionLabel: 'Undo',
      onAction: () => {
        attachSession(sessionId, before ? before.id : null);
        reload();
      },
    });
  };

  const k = place ? findPlaceKind(place.kind) : null;

  return (
    <>
      <Card onPress={() => setOpen(true)}>
        <Row gap={12} style={{ alignItems: 'center' }}>
          <Icon icon={k ? k.icon : 'cardio.gps'} size={20} color={k ? k.color : theme.colors.textFaint} />
          <View style={{ flex: 1 }}>
            <Text variant="eyebrow" color="textMuted">
              Where
            </Text>
            <Text variant="body" color={place ? 'text' : 'textMuted'} numberOfLines={1}>
              {place ? place.name : 'Say where this happened'}
            </Text>
          </View>
          <Icon icon="core.forward" size={16} color={theme.colors.textFaint} />
        </Row>
      </Card>

      <Sheet
        visible={open}
        onClose={() => setOpen(false)}
        footer={
          <Button
            title="Mark a new place"
            icon="core.add"
            variant="secondary"
            onPress={() => {
              setOpen(false);
              navigation.navigate('PlaceEdit');
            }}
          />
        }
      >
        <View style={{ gap: 4 }}>
          <Text variant="h3">Where did this happen?</Text>
          <Text variant="caption" color="textMuted">
            {ordered.length ? 'Your places, the ones that suit this kind of session first.' : 'You have not marked a place yet.'}
          </Text>
          {ordered.map((p, i) => {
            const pk = findPlaceKind(p.kind);
            const chosen = place?.id === p.id;
            return (
              <View key={p.id}>
                {i > 0 ? <Divider /> : null}
                <Pressable onPress={() => choose(p)} accessibilityRole="button">
                  <Row gap={12} style={{ alignItems: 'center', paddingVertical: 10 }}>
                    <Icon icon={pk.icon} size={20} color={pk.color} />
                    <View style={{ flex: 1 }}>
                      <Text variant="body" numberOfLines={1}>
                        {p.name}
                      </Text>
                      <Text variant="caption" color="textFaint" numberOfLines={1}>
                        {pk.label}
                        {p.isHome ? ' · home base' : ''}
                      </Text>
                    </View>
                    {chosen ? <Icon icon="core.check" size={18} color={theme.colors.success} /> : null}
                  </Row>
                </Pressable>
              </View>
            );
          })}
          {place ? <Button title="Remove the place from this session" variant="ghost" size="sm" onPress={() => choose(null)} /> : null}
        </View>
      </Sheet>
    </>
  );
}
