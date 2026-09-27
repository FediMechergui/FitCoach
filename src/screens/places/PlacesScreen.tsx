import React, { useCallback, useMemo, useState } from 'react';
import { View, Linking } from 'react-native';
import * as Location from 'expo-location';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { PageHero } from '@/components/ui/PageHero';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Row, Badge } from '@/components/ui/misc';
import { EmptyState } from '@/components/ui/misc3';
import { toast } from '@/components/ui/Toast';
import { PlacesMap } from '@/components/PlacesMap';
import { PLACE_KINDS, findPlaceKind } from '@/data/placeKinds';
import { findGovernorate } from '@/data/governorates';
import { formatDistance, geoUrl, sortByDistance } from '@/lib/places';
import type { LatLng } from '@/lib/geo';
import { listPlaces, placeStats, type PlaceStats } from '@/repositories/placesRepo';
import type { Place } from '@/db/schema';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type View_ = 'list' | 'map';

/**
 * Your places: the gyms, pitches, parks, dojos, walls and clubs you train in,
 * marked by you and kept on your phone.
 */
export function PlacesScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const [items, setItems] = useState<Place[]>([]);
  const [stats, setStats] = useState<Map<number, PlaceStats>>(new Map());
  const [me, setMe] = useState<LatLng | null>(null);
  const [view, setView] = useState<View_>('list');
  const [kind, setKind] = useState<string>('all');
  const [failed, setFailed] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      try {
        setItems(listPlaces());
        setStats(placeStats());
        setFailed(false);
      } catch (e) {
        console.warn('[places] failed to read:', e);
        setFailed(true);
      }
      // Distance is a courtesy: it uses a position the phone already has, and
      // only if location was already allowed. Opening this page never asks.
      (async () => {
        try {
          const perm = await Location.getForegroundPermissionsAsync();
          if (!perm.granted) return;
          const last = await Location.getLastKnownPositionAsync({ maxAge: 30 * 60_000 });
          if (alive && last) setMe([last.coords.latitude, last.coords.longitude]);
        } catch {
          // no position: the list is simply in the order it was saved
        }
      })();
      return () => {
        alive = false;
      };
    }, [])
  );

  const kindsUsed = useMemo(() => PLACE_KINDS.filter((k) => items.some((p) => p.kind === k.key)), [items]);
  const filtered = useMemo(() => sortByDistance(items.filter((p) => kind === 'all' || p.kind === kind), me), [items, kind, me]);

  const hero = (
    <PageHero
      icon="cardio.gps"
      color={theme.colors.primary}
      eyebrow="Blayesek"
      title="Your places"
      subtitle="Where you train, marked by you. Kept on this phone and nowhere else."
    />
  );

  if (failed)
    return (
      <Screen>
        {hero}
        <EmptyState icon="core.warning" title="Your places could not be read" message="Nothing is lost. Come back to this page and it will try again." />
      </Screen>
    );

  if (items.length === 0)
    return (
      <Screen>
        {hero}
        <EmptyState
          icon="cardio.gps"
          title="Mark your first place"
          message="Your gym, the pitch you play on, the bars in the park, the dojo, the wall, the riding club. Stand there and mark it, or type it in. Sessions can then say where they happened."
          action={<Button title="Mark a place" icon="core.add" fullWidth={false} onPress={() => navigation.navigate('PlaceEdit')} />}
        />
        <Card style={{ gap: 8 }}>
          <Text variant="eyebrow" color="textMuted">
            What can be marked
          </Text>
          <Row gap={8} style={{ flexWrap: 'wrap' }}>
            {PLACE_KINDS.filter((k) => k.key !== 'other').map((k) => (
              <Row key={k.key} gap={5} style={{ alignItems: 'center' }}>
                <Icon icon={k.icon} size={14} color={k.color} />
                <Text variant="caption" color="textMuted">
                  {k.label}
                </Text>
              </Row>
            ))}
          </Row>
        </Card>
      </Screen>
    );

  return (
    <Screen>
      {hero}

      <Row gap={10}>
        <View style={{ flex: 1 }}>
          <SegmentedControl
            value={view}
            onChange={(v) => setView(v as View_)}
            options={[
              { value: 'list', label: `List · ${items.length}` },
              { value: 'map', label: 'Map' },
            ]}
          />
        </View>
        <Button title="Mark" icon="core.add" size="sm" fullWidth={false} onPress={() => navigation.navigate('PlaceEdit')} />
      </Row>

      {kindsUsed.length > 1 && (
        <SegmentedControl
          scrollable
          value={kind}
          onChange={setKind}
          options={[{ value: 'all', label: 'All' }, ...kindsUsed.map((k) => ({ value: k.key as string, label: k.label }))]}
        />
      )}

      {view === 'map' && <PlacesMap places={filtered} me={me} />}

      {filtered.map((p) => {
        const k = findPlaceKind(p.kind);
        const st = stats.get(p.id);
        const gov = findGovernorate(p.governorate);
        const where = [p.city, gov?.name].filter(Boolean).join(', ');
        return (
          <Card key={p.id} onPress={() => navigation.navigate('PlaceEdit', { placeId: p.id })} style={{ gap: 8 }}>
            <Row gap={12} style={{ alignItems: 'center' }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: theme.radius.md,
                  backgroundColor: theme.alpha.tint14(k.color),
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon icon={k.icon} size={22} color={k.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Row gap={6} style={{ alignItems: 'center' }}>
                  <Text variant="h3" numberOfLines={1} style={{ flexShrink: 1 }}>
                    {p.name}
                  </Text>
                  {p.isHome ? <Badge label="Home base" color={theme.colors.primary} /> : null}
                </Row>
                <Text variant="caption" color="textMuted" numberOfLines={1}>
                  {k.local}
                  {where ? ` · ${where}` : ''}
                </Text>
              </View>
              {p.km != null ? (
                <Text variant="label" color="textMuted" style={{ fontVariant: ['tabular-nums'] }}>
                  {formatDistance(p.km)}
                </Text>
              ) : null}
            </Row>
            <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Text variant="caption" color="textFaint">
                {st ? `${st.visits} session${st.visits === 1 ? '' : 's'} here` : 'No session here yet'}
                {p.rating ? ` · ${'★'.repeat(p.rating)}` : ''}
                {p.access ? ` · ${p.access === 'free' ? 'free' : p.access === 'paid' ? 'pay per visit' : 'members'}` : ''}
              </Text>
              {p.latitude != null && p.longitude != null ? (
                <Button
                  title="Directions"
                  size="sm"
                  variant="ghost"
                  fullWidth={false}
                  onPress={() => {
                    Linking.openURL(geoUrl(p.latitude as number, p.longitude as number, p.name)).catch(() =>
                      toast({ message: 'No map app on this phone could open it' })
                    );
                  }}
                />
              ) : (
                <Text variant="caption" color="textFaint">
                  no coordinates
                </Text>
              )}
            </Row>
          </Card>
        );
      })}

      <Text variant="caption" color="textFaint" center>
        Places are private. Sharing them with other people needs an account, and this app does not have one yet.
      </Text>
    </Screen>
  );
}
